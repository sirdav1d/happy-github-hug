import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useViewAsStudent } from "@/contexts/ViewAsStudentContext";
import { toast } from "sonner";
export interface SentimentIndicator {
  type: string;
  evidence: string;
  weight: number;
}

export interface SentimentAnalysis {
  overall: 'confiante' | 'neutro' | 'inseguro' | 'frustrado' | 'entusiasmado';
  score: number;
  indicators: SentimentIndicator[];
  evolutionVsPrevious?: 'melhora' | 'estável' | 'declínio';
}

export interface KeyPoints {
  conquistas: string[];
  desafios: string[];
  oportunidades: string[];
  acoes_sugeridas: string[];
}

export interface AIAnalysis {
  transcription: string;
  summary: string;
  sentiment: SentimentAnalysis;
  commitments: string[];
  concerns: string[];
  confidenceScore: number;
  keyPoints: KeyPoints;
}

export interface FIVISession {
  id: string;
  user_id: string;
  salesperson_id: string;
  salesperson_name: string;
  date: string;
  week_number: number;
  actions_executed?: string;
  improvement_ideas?: string;
  failed_actions?: string;
  support_needed?: string;
  weekly_commitment: number;
  weekly_goal: number;
  weekly_realized: number;
  previous_commitment?: number;
  previous_realized?: number;
  notes?: string;
  recording_url?: string;
  meeting_notes?: string;
  audio_file_path?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  ai_transcription?: string | null;
  ai_summary?: string | null;
  ai_sentiment_analysis?: any;
  ai_commitments?: string[] | null;
  ai_concerns?: string[] | null;
  ai_confidence_score?: number | null;
  ai_key_points?: any;
  ai_processed_at?: string | null;
}

export interface CreateFIVIInput {
  salesperson_id: string;
  salesperson_name: string;
  date?: string;
  week_number: number;
  actions_executed?: string;
  improvement_ideas?: string;
  failed_actions?: string;
  support_needed?: string;
  weekly_commitment: number;
  weekly_goal: number;
  weekly_realized: number;
  previous_commitment?: number;
  previous_realized?: number;
  notes?: string;
  recording_url?: string;
  meeting_notes?: string;
  audio_file_path?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  ai_transcription?: string;
  ai_summary?: string;
  ai_sentiment_analysis?: any;
  ai_commitments?: string[];
  ai_concerns?: string[];
  ai_confidence_score?: number;
  ai_key_points?: any;
  ai_processed_at?: string;
}

export const useFIVI = () => {
  const { user } = useAuth();
  const { viewAsStudent, isViewingAsStudent } = useViewAsStudent();
  const queryClient = useQueryClient();
  
  // Use the student's ID when viewing as student, otherwise use the logged-in user's ID
  const effectiveUserId = isViewingAsStudent ? viewAsStudent?.id : user?.id;

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['fivi-sessions', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase
        .from('fivi_sessions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as unknown as FIVISession[];
    },
    enabled: !!effectiveUserId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateFIVIInput) => {
      if (!effectiveUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('fivi_sessions')
        .insert({
          ...input,
          user_id: effectiveUserId,
          status: input.status || 'completed',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fivi-sessions'] });
      toast.success('FIVI registrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar FIVI: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<FIVISession> & { id: string }) => {
      const { data, error } = await supabase
        .from('fivi_sessions')
        .update(input as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fivi-sessions'] });
      toast.success('FIVI atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar FIVI: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fivi_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fivi-sessions'] });
      toast.success('FIVI excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir FIVI: ' + error.message);
    },
  });

  const removeRecordingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fivi_sessions')
        .update({ recording_url: null })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fivi-sessions'] });
      toast.success('Link da gravação removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover gravação: ' + error.message);
    },
  });

  const deleteAudioFile = async (filePath: string): Promise<boolean> => {
    const { error } = await supabase.storage
      .from('fivi-recordings')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting audio:', error);
      return false;
    }
    return true;
  };

  const removeAudioMutation = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      await deleteAudioFile(filePath);
      const { error } = await supabase
        .from('fivi_sessions')
        .update({ audio_file_path: null })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fivi-sessions'] });
      toast.success('Áudio removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover áudio: ' + error.message);
    },
  });

  const getSessionsBySalesperson = (salespersonId: string) => {
    return sessions.filter(s => s.salesperson_id === salespersonId);
  };

  const getLatestSession = (salespersonId: string) => {
    return getSessionsBySalesperson(salespersonId)[0];
  };

  const getSessionsByWeek = (weekNumber: number) => {
    return sessions.filter(s => s.week_number === weekNumber);
  };

  const getCommitmentRate = () => {
    const completedSessions = sessions.filter(s => 
      s.status === 'completed' && 
      s.previous_commitment !== undefined && 
      s.previous_realized !== undefined
    );
    
    if (completedSessions.length === 0) return 0;

    const fulfilled = completedSessions.filter(s => 
      (s.previous_realized || 0) >= (s.previous_commitment || 0)
    ).length;

    return (fulfilled / completedSessions.length) * 100;
  };

  const getPendingFIVIs = (teamIds: string[], currentWeek: number) => {
    const completedThisWeek = sessions
      .filter(s => s.week_number === currentWeek && s.status === 'completed')
      .map(s => s.salesperson_id);

    return teamIds.filter(id => !completedThisWeek.includes(id));
  };

  const uploadAudio = async (file: File | Blob): Promise<string | null> => {
    if (!effectiveUserId) return null;

    const ext = file instanceof File ? file.name.split('.').pop() : 'webm';
    const fileName = `${effectiveUserId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('fivi-recordings')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      toast.error('Erro ao fazer upload do áudio: ' + error.message);
      return null;
    }
    return fileName;
  };

  const getSignedAudioUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('fivi-recordings')
      .createSignedUrl(filePath, 3600);

    if (error) return null;
    return data?.signedUrl || null;
  };

  const analyzeAudio = async (
    audioFilePath: string,
    salespersonId: string,
    context: { salesperson_name: string; weekly_goal: number; weekly_realized: number }
  ): Promise<AIAnalysis | null> => {
    const previousSessions = sessions
      .filter(s => s.salesperson_id === salespersonId)
      .slice(0, 5)
      .map(s => ({
        week_number: s.week_number,
        ai_summary: s.ai_summary,
        ai_confidence_score: s.ai_confidence_score,
        weekly_commitment: s.weekly_commitment,
        weekly_realized: s.weekly_realized,
      }));

    const { data, error } = await supabase.functions.invoke('analyze-fivi-audio', {
      body: { audioFilePath, salespersonId, context: { ...context, previous_sessions: previousSessions } },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data?.analysis || null;
  };

  return {
    sessions,
    isLoading,
    error,
    createFIVI: createMutation.mutate,
    createFIVIAsync: createMutation.mutateAsync,
    updateFIVI: updateMutation.mutate,
    deleteFIVI: deleteMutation.mutate,
    removeRecording: removeRecordingMutation.mutate,
    removeAudioFromSession: removeAudioMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemovingRecording: removeRecordingMutation.isPending,
    isRemovingAudio: removeAudioMutation.isPending,
    getSessionsBySalesperson,
    getLatestSession,
    getSessionsByWeek,
    getCommitmentRate,
    getPendingFIVIs,
    uploadAudio,
    getSignedAudioUrl,
    deleteAudioFile,
    analyzeAudio,
  };
};
