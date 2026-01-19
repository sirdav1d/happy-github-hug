import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAsStudent } from '@/contexts/ViewAsStudentContext';
import { toast } from 'sonner';
import type { 
  BehavioralProfile, 
  BehavioralModuleConfig,
  DISCScores, 
  ValuesScores,
  AttributeScores,
  DISCResponse,
  ValuesResponse,
} from '@/types/behavioral';

// Database module config type (snake_case)
interface DBModuleConfig {
  id: string;
  user_id: string;
  is_enabled: boolean;
  show_in_team_view: boolean;
  show_in_fivi: boolean;
  show_in_rmr: boolean;
  allow_self_assessment: boolean;
  created_at: string;
  updated_at: string;
}

export function useBehavioralProfiles() {
  const { user } = useAuth();
  const { viewAsStudent } = useViewAsStudent();
  const queryClient = useQueryClient();
  
  const effectiveUserId = viewAsStudent?.id || user?.id;

  // Buscar configuração do módulo
  const { data: moduleConfig, isLoading: configLoading } = useQuery({
    queryKey: ['behavioral-module-config', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      
      const { data, error } = await supabase
        .from('behavioral_module_config')
        .select('*')
        .eq('user_id', effectiveUserId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveUserId,
  });

  // Buscar todos os perfis comportamentais
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['behavioral-profiles', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase
        .from('behavioral_profiles')
        .select('*')
        .eq('user_id', effectiveUserId);
      
      if (error) throw error;
      
      return (data || []).map(transformProfile);
    },
    enabled: !!effectiveUserId && moduleConfig?.is_enabled,
  });

  // Ativar/desativar módulo
  const toggleModuleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data: existing } = await supabase
        .from('behavioral_module_config')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('behavioral_module_config')
          .update({ is_enabled: enabled })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('behavioral_module_config')
          .insert({ user_id: user.id, is_enabled: enabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-module-config'] });
      toast.success('Configuração atualizada');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configuração');
      console.error(error);
    },
  });

  // Atualizar configuração do módulo
  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<DBModuleConfig>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('behavioral_module_config')
        .update(config)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-module-config'] });
    },
  });

  // Criar perfil a partir do questionário DISC
  const createProfileFromDISCMutation = useMutation({
    mutationFn: async ({ 
      salespersonId, 
      responses 
    }: { 
      salespersonId: string; 
      responses: DISCResponse[] 
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Calcular scores DISC
      const scores = calculateDISCScores(responses);
      
      // Criar perfil
      const { data: profile, error: profileError } = await supabase
        .from('behavioral_profiles')
        .insert({
          user_id: user.id,
          salesperson_id: salespersonId,
          disc_d_natural: scores.d,
          disc_i_natural: scores.i,
          disc_s_natural: scores.s,
          disc_c_natural: scores.c,
          source: 'questionnaire',
          confidence_score: 60, // Confiança inicial do questionário
        })
        .select()
        .single();
      
      if (profileError) throw profileError;
      
      // Salvar respostas individuais
      const responsesToInsert = responses.map(r => ({
        profile_id: profile.id,
        user_id: user.id,
        questionnaire_type: 'disc',
        question_id: r.blockId,
        response_value: { most: r.most, least: r.least },
      }));
      
      const { error: responsesError } = await supabase
        .from('behavioral_questionnaire_responses')
        .insert(responsesToInsert);
      
      if (responsesError) console.error('Erro ao salvar respostas:', responsesError);
      
      return transformProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-profiles'] });
      toast.success('Perfil DISC criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar perfil');
      console.error(error);
    },
  });

  // Adicionar valores ao perfil existente
  const addValuesToProfileMutation = useMutation({
    mutationFn: async ({ 
      profileId, 
      responses 
    }: { 
      profileId: string; 
      responses: ValuesResponse[] 
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Calcular scores Values
      const scores = calculateValuesScores(responses);
      
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('behavioral_profiles')
        .update({
          value_aesthetic: scores.aesthetic,
          value_economic: scores.economic,
          value_individualist: scores.individualist,
          value_political: scores.political,
          value_altruistic: scores.altruistic,
          value_regulatory: scores.regulatory,
          value_theoretical: scores.theoretical,
          confidence_score: 75, // Aumenta confiança com Values
        })
        .eq('id', profileId);
      
      if (profileError) throw profileError;
      
      // Salvar respostas
      const responsesToInsert = responses.map(r => ({
        profile_id: profileId,
        user_id: user.id,
        questionnaire_type: 'values',
        question_id: r.questionId,
        response_value: { ranking: r.ranking },
      }));
      
      const { error: responsesError } = await supabase
        .from('behavioral_questionnaire_responses')
        .insert(responsesToInsert);
      
      if (responsesError) console.error('Erro ao salvar respostas:', responsesError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-profiles'] });
      toast.success('Motivadores adicionados ao perfil!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar motivadores');
      console.error(error);
    },
  });

  // Atualizar perfil manualmente
  const updateProfileMutation = useMutation({
    mutationFn: async ({ 
      profileId, 
      data 
    }: { 
      profileId: string; 
      data: Partial<BehavioralProfile> 
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const updateData: Record<string, unknown> = {};
      
      if (data.discNatural) {
        updateData.disc_d_natural = data.discNatural.d;
        updateData.disc_i_natural = data.discNatural.i;
        updateData.disc_s_natural = data.discNatural.s;
        updateData.disc_c_natural = data.discNatural.c;
      }
      
      if (data.discAdapted) {
        updateData.disc_d_adapted = data.discAdapted.d;
        updateData.disc_i_adapted = data.discAdapted.i;
        updateData.disc_s_adapted = data.discAdapted.s;
        updateData.disc_c_adapted = data.discAdapted.c;
      }
      
      if (data.values) {
        updateData.value_aesthetic = data.values.aesthetic;
        updateData.value_economic = data.values.economic;
        updateData.value_individualist = data.values.individualist;
        updateData.value_political = data.values.political;
        updateData.value_altruistic = data.values.altruistic;
        updateData.value_regulatory = data.values.regulatory;
        updateData.value_theoretical = data.values.theoretical;
      }
      
      if (data.source) updateData.source = data.source;
      if (data.confidenceScore !== undefined) updateData.confidence_score = data.confidenceScore;
      if (data.aiSummary) updateData.ai_summary = data.aiSummary;
      if (data.strengths) updateData.strengths = data.strengths;
      if (data.developmentAreas) updateData.development_areas = data.developmentAreas;
      
      const { error } = await supabase
        .from('behavioral_profiles')
        .update(updateData)
        .eq('id', profileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-profiles'] });
      toast.success('Perfil atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar perfil');
      console.error(error);
    },
  });

  // Criar perfil manualmente ou via Innermetrix/Conversa
  const createManualProfileMutation = useMutation({
    mutationFn: async ({ 
      salespersonId, 
      discScores,
      valuesScores,
      attributeScores,
      source,
      aiSummary
    }: { 
      salespersonId: string; 
      discScores: DISCScores;
      valuesScores?: ValuesScores;
      attributeScores?: AttributeScores;
      source: 'manual' | 'innermetrix' | 'conversation';
      aiSummary?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase.from('behavioral_profiles').insert({
        user_id: user.id,
        salesperson_id: salespersonId,
        disc_d_natural: discScores.d,
        disc_i_natural: discScores.i,
        disc_s_natural: discScores.s,
        disc_c_natural: discScores.c,
        value_aesthetic: valuesScores?.aesthetic,
        value_economic: valuesScores?.economic,
        value_individualist: valuesScores?.individualist,
        value_political: valuesScores?.political,
        value_altruistic: valuesScores?.altruistic,
        value_regulatory: valuesScores?.regulatory,
        value_theoretical: valuesScores?.theoretical,
        attr_empathy: attributeScores?.empathy,
        attr_practical_thinking: attributeScores?.practicalThinking,
        attr_systems_judgment: attributeScores?.systemsJudgment,
        attr_self_esteem: attributeScores?.selfEsteem,
        attr_role_awareness: attributeScores?.roleAwareness,
        attr_self_direction: attributeScores?.selfDirection,
        source: source === 'innermetrix' ? 'innermetrix_pdf' : source,
        confidence_score: source === 'innermetrix' ? 95 : source === 'conversation' ? 80 : 70,
        ai_summary: aiSummary,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-profiles'] });
      toast.success('Perfil criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar perfil');
      console.error(error);
    },
  });

  // Deletar perfil
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('behavioral_profiles')
        .delete()
        .eq('id', profileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-profiles'] });
      toast.success('Perfil removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover perfil');
      console.error(error);
    },
  });

  // Helpers
  const getProfileBySalesperson = (salespersonId: string) => {
    return profiles?.find(p => p.salespersonId === salespersonId) || null;
  };

  return {
    moduleConfig,
    profiles: profiles || [],
    isLoading: configLoading || profilesLoading,
    isModuleEnabled: moduleConfig?.is_enabled ?? false,
    
    // Mutations
    toggleModule: toggleModuleMutation.mutate,
    updateConfig: updateConfigMutation.mutate,
    createProfileFromDISC: createProfileFromDISCMutation.mutate,
    addValuesToProfile: addValuesToProfileMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    deleteProfile: deleteProfileMutation.mutate,
    createManualProfile: createManualProfileMutation.mutate,
    
    // Loading states
    isToggling: toggleModuleMutation.isPending,
    isCreating: createProfileFromDISCMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    isCreatingManual: createManualProfileMutation.isPending,
    isDeleting: deleteProfileMutation.isPending,
    
    // Helpers
    getProfileBySalesperson,
  };
}

// Funções auxiliares
function transformProfile(data: Record<string, unknown>): BehavioralProfile {
  return {
    id: data.id as string,
    salespersonId: data.salesperson_id as string | null,
    userId: data.user_id as string,
    discNatural: data.disc_d_natural != null ? {
      d: data.disc_d_natural as number,
      i: data.disc_i_natural as number,
      s: data.disc_s_natural as number,
      c: data.disc_c_natural as number,
    } : null,
    discAdapted: data.disc_d_adapted != null ? {
      d: data.disc_d_adapted as number,
      i: data.disc_i_adapted as number,
      s: data.disc_s_adapted as number,
      c: data.disc_c_adapted as number,
    } : null,
    values: data.value_aesthetic != null ? {
      aesthetic: data.value_aesthetic as number,
      economic: data.value_economic as number,
      individualist: data.value_individualist as number,
      political: data.value_political as number,
      altruistic: data.value_altruistic as number,
      regulatory: data.value_regulatory as number,
      theoretical: data.value_theoretical as number,
    } : null,
    attributes: data.attr_empathy != null ? {
      empathy: data.attr_empathy as number,
      practicalThinking: data.attr_practical_thinking as number,
      systemsJudgment: data.attr_systems_judgment as number,
      selfEsteem: data.attr_self_esteem as number,
      roleAwareness: data.attr_role_awareness as number,
      selfDirection: data.attr_self_direction as number,
    } : null,
    source: data.source as BehavioralProfile['source'],
    confidenceScore: data.confidence_score as number,
    aiSummary: data.ai_summary as string | null,
    strengths: (data.strengths as string[]) || [],
    developmentAreas: (data.development_areas as string[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function calculateDISCScores(responses: DISCResponse[]): DISCScores {
  const scores = { d: 50, i: 50, s: 50, c: 50 };
  
  responses.forEach(response => {
    // MOST escolhido = +4 pontos (normalizado para 0-100)
    scores[response.most] += 4;
    // LEAST escolhido = -2 pontos
    scores[response.least] -= 2;
  });
  
  // Normalizar para 0-100
  const normalize = (score: number) => Math.max(0, Math.min(100, score));
  
  return {
    d: normalize(scores.d),
    i: normalize(scores.i),
    s: normalize(scores.s),
    c: normalize(scores.c),
  };
}

function calculateValuesScores(responses: ValuesResponse[]): ValuesScores {
  const scores: ValuesScores = {
    aesthetic: 50,
    economic: 50,
    individualist: 50,
    political: 50,
    altruistic: 50,
    regulatory: 50,
    theoretical: 50,
  };
  
  responses.forEach(response => {
    // Pontuação baseada na posição no ranking
    // 1º lugar: +12, 2º: +6, 3º: -3, 4º: -9
    const points = [12, 6, -3, -9];
    response.ranking.forEach((value, index) => {
      if (points[index] !== undefined) {
        scores[value] += points[index];
      }
    });
  });
  
  // Normalizar para 0-100
  const normalize = (score: number) => Math.max(0, Math.min(100, score));
  
  return {
    aesthetic: normalize(scores.aesthetic),
    economic: normalize(scores.economic),
    individualist: normalize(scores.individualist),
    political: normalize(scores.political),
    altruistic: normalize(scores.altruistic),
    regulatory: normalize(scores.regulatory),
    theoretical: normalize(scores.theoretical),
  };
}
