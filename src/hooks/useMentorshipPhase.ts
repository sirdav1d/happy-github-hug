import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MentorshipPhase {
  id: string;
  user_id: string;
  consultant_id: string | null;
  current_phase: 1 | 2;
  phase_started_at: string;
  phase_updated_at: string;
  created_at: string;
  behavioral_module_enabled: boolean;
}

// Features unlocked at each phase
export const PHASE_FEATURES = {
  1: {
    name: 'Básico + Assistido',
    features: [
      'rmr_manual_wizard',
      'rmr_history',
      'rmr_highlight_suggestions_readonly', // Can see but not select
      'rmr_theme_suggestions_readonly', // Can see but not select
      'rmr_video_suggestions_readonly', // Can see but not select
      'rmr_preparation_checklist',
      'rmr_deadline_notifications',
      'pgv_basic',
      'fivi_basic'
    ],
    lockedFeatures: [
      'rmr_highlight_selection',
      'rmr_theme_selection',
      'rmr_video_selection',
      'rmr_script_generation',
      'rmr_pdf_download',
      'rmr_detailed_insights',
      'rmr_slides_generation',
      'rmr_evolution_reports'
    ]
  },
  2: {
    name: 'Automatizado + Premium',
    features: [
      // All Phase 1 features
      'rmr_manual_wizard',
      'rmr_history',
      'rmr_preparation_checklist',
      'rmr_deadline_notifications',
      'pgv_basic',
      'fivi_basic',
      // Plus Phase 2 exclusive features
      'rmr_highlight_selection',
      'rmr_theme_selection',
      'rmr_video_selection',
      'rmr_highlight_suggestions_readonly',
      'rmr_theme_suggestions_readonly',
      'rmr_video_suggestions_readonly',
      'rmr_script_generation',
      'rmr_pdf_download',
      'rmr_detailed_insights',
      'rmr_slides_generation',
      'rmr_evolution_reports'
    ],
    lockedFeatures: []
  }
} as const;

export const useMentorshipPhase = () => {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  
  // Consultants automatically have Phase 2 access for demonstration purposes
  const isConsultant = userProfile?.role === 'consultant';

  // Fetch user's mentorship phase
  const { data: phase, isLoading } = useQuery({
    queryKey: ['mentorship-phase', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('mentorship_phases')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no phase exists, default to phase 1 (not persisted)
      if (!data) {
        return {
          user_id: user.id,
          current_phase: 1 as const,
          phase_started_at: new Date().toISOString(),
          phase_updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          behavioral_module_enabled: false
        } as MentorshipPhase;
      }

      return data as MentorshipPhase;
    },
    enabled: !!user?.id,
    // Important: phase is permission-critical; always refetch on mount to avoid stale caches
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // For consultants: fetch all students' phases
  const { data: studentPhases = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['student-phases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('mentorship_phases')
        .select('*')
        .eq('consultant_id', user.id);

      if (error) throw error;
      return data as MentorshipPhase[];
    },
    enabled: !!user?.id,
  });

  // Create phase for new user
  const createPhaseMutation = useMutation({
    mutationFn: async (data: { user_id: string; consultant_id?: string; initial_phase?: 1 | 2 }) => {
      const { error } = await supabase
        .from('mentorship_phases')
        .insert({
          user_id: data.user_id,
          consultant_id: data.consultant_id || null,
          current_phase: data.initial_phase || 1
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-phase'] });
      queryClient.invalidateQueries({ queryKey: ['student-phases'] });
    }
  });

  // Promote user to phase 2 (consultant only)
  const promoteToPhase2Mutation = useMutation({
    mutationFn: async (userId: string) => {
      // Check if record exists
      const { data: existing } = await supabase
        .from('mentorship_phases')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('mentorship_phases')
          .update({
            current_phase: 2,
            phase_updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mentorship_phases')
          .insert({
            user_id: userId,
            consultant_id: user?.id,
            current_phase: 2
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-phase'] });
      queryClient.invalidateQueries({ queryKey: ['student-phases'] });
      toast.success('Aluno promovido para Fase 2!');
    },
    onError: (error) => {
      console.error('Error promoting to phase 2:', error);
      toast.error('Erro ao promover aluno');
    }
  });

  // Toggle behavioral module access for a student
  const toggleBehavioralModuleMutation = useMutation({
    mutationFn: async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      // Check if record exists
      const { data: existing } = await supabase
        .from('mentorship_phases')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('mentorship_phases')
          .update({
            behavioral_module_enabled: enabled,
            phase_updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mentorship_phases')
          .insert({
            user_id: userId,
            consultant_id: user?.id,
            current_phase: 1,
            behavioral_module_enabled: enabled
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-phase'] });
      queryClient.invalidateQueries({ queryKey: ['student-phases'] });
      toast.success(enabled ? 'Acesso ao módulo comportamental liberado!' : 'Acesso ao módulo comportamental removido');
    },
    onError: (error) => {
      console.error('Error toggling behavioral module:', error);
      toast.error('Erro ao alterar acesso ao módulo');
    }
  });

  // Check if a feature is unlocked
  const isFeatureUnlocked = (featureName: string): boolean => {
    // Consultants have access to all features
    if (isConsultant) return true;
    
    const currentPhase = phase?.current_phase || 1;
    const phaseConfig = PHASE_FEATURES[currentPhase];
    return phaseConfig.features.includes(featureName as any);
  };

  // Check if user can access a phase
  const canAccessPhase = (phaseNumber: 1 | 2): boolean => {
    const currentPhase = phase?.current_phase || 1;
    return currentPhase >= phaseNumber;
  };

  // Get feature info (for displaying locked state)
  const getFeatureInfo = (featureName: string) => {
    const currentPhase = phase?.current_phase || 1;
    const isUnlocked = isFeatureUnlocked(featureName);
    
    if (isUnlocked) {
      return { isUnlocked: true, requiredPhase: null, message: null };
    }

    // Find which phase unlocks this feature
    const phase2Features = PHASE_FEATURES[2].features;
    if (phase2Features.includes(featureName as any)) {
      return {
        isUnlocked: false,
        requiredPhase: 2,
        message: 'Disponível na Fase 2 (Automatizado + Premium)'
      };
    }

    return { isUnlocked: false, requiredPhase: null, message: 'Recurso não disponível' };
  };

  // Get locked features for current phase
  const getLockedFeatures = () => {
    const currentPhase = phase?.current_phase || 1;
    return PHASE_FEATURES[currentPhase].lockedFeatures;
  };

  // Get student phase by user ID (for consultants)
  const getStudentPhase = (userId: string): MentorshipPhase | undefined => {
    return studentPhases.find(p => p.user_id === userId);
  };

  // Check if a specific user has behavioral module access
  const hasBehavioralAccess = (userId?: string): boolean => {
    // Consultants always have access
    if (isConsultant) return true;
    
    // Check own access
    if (!userId || userId === user?.id) {
      return phase?.behavioral_module_enabled ?? false;
    }
    
    // Check student access (for consultants viewing student data)
    const studentPhase = getStudentPhase(userId);
    return studentPhase?.behavioral_module_enabled ?? false;
  };

  // For consultants, always return phase 2 access
  const effectivePhase = isConsultant ? 2 : (phase?.current_phase || 1);
  
  return {
    phase,
    currentPhase: effectivePhase as 1 | 2,
    phaseName: PHASE_FEATURES[effectivePhase as 1 | 2].name,
    isLoading,
    studentPhases,
    isLoadingStudents,
    isFeatureUnlocked,
    canAccessPhase,
    getFeatureInfo,
    getLockedFeatures,
    getStudentPhase,
    hasBehavioralAccess,
    createPhase: createPhaseMutation.mutate,
    promoteToPhase2: promoteToPhase2Mutation.mutate,
    isPromoting: promoteToPhase2Mutation.isPending,
    toggleBehavioralModule: toggleBehavioralModuleMutation.mutate,
    isTogglingBehavioral: toggleBehavioralModuleMutation.isPending
  };
};
