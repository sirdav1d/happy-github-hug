import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type GoalRuleType = 'percentage' | 'fixed' | 'manual';
export type GoalBaseReference = 'previous_year_same_month' | 'previous_month' | 'team_average' | 'manual';
export type NewHireStrategy = 'team_average' | 'fixed_rampup' | 'manual' | 'no_goal';

export interface GoalRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  rule_type: GoalRuleType;
  base_reference: GoalBaseReference;
  percentage_value: number;
  fixed_value: number | null;
  is_default: boolean;
  new_hire_strategy: NewHireStrategy;
  rampup_months: number | null;
  rampup_start_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalRuleInput {
  name: string;
  description?: string;
  rule_type?: GoalRuleType;
  base_reference?: GoalBaseReference;
  percentage_value?: number;
  fixed_value?: number;
  is_default?: boolean;
  new_hire_strategy?: NewHireStrategy;
  rampup_months?: number;
  rampup_start_percent?: number;
}

export interface UpdateGoalRuleInput {
  id: string;
  name?: string;
  description?: string;
  rule_type?: GoalRuleType;
  base_reference?: GoalBaseReference;
  percentage_value?: number;
  fixed_value?: number;
  is_default?: boolean;
  new_hire_strategy?: NewHireStrategy;
  rampup_months?: number;
  rampup_start_percent?: number;
}

export function useGoalRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all goal rules
  const { data: goalRules = [], isLoading, error } = useQuery({
    queryKey: ['goal-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('goal_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data as GoalRule[];
    },
    enabled: !!user?.id,
  });

  // Get default rule
  const defaultRule = goalRules.find(r => r.is_default);

  // Create goal rule
  const createMutation = useMutation({
    mutationFn: async (input: CreateGoalRuleInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('goal_rules')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-rules'] });
      toast.success('Regra de meta criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating goal rule:', error);
      toast.error('Erro ao criar regra de meta');
    },
  });

  // Update goal rule
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateGoalRuleInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('goal_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-rules'] });
      toast.success('Regra de meta atualizada!');
    },
    onError: (error) => {
      console.error('Error updating goal rule:', error);
      toast.error('Erro ao atualizar regra de meta');
    },
  });

  // Delete goal rule
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goal_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-rules'] });
      toast.success('Regra de meta removida!');
    },
    onError: (error) => {
      console.error('Error deleting goal rule:', error);
      toast.error('Erro ao remover regra de meta');
    },
  });

  // Set as default
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('goal_rules')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-rules'] });
      toast.success('Regra definida como padrão!');
    },
    onError: (error) => {
      console.error('Error setting default rule:', error);
      toast.error('Erro ao definir regra padrão');
    },
  });

  // Create default rule if none exists
  const ensureDefaultRule = async () => {
    if (goalRules.length === 0 && user?.id) {
      await createMutation.mutateAsync({
        name: 'Padrão +15%',
        description: 'Meta baseada no mesmo mês do ano anterior + 15%',
        rule_type: 'percentage',
        base_reference: 'previous_year_same_month',
        percentage_value: 15,
        is_default: true,
        new_hire_strategy: 'team_average',
        rampup_months: 3,
        rampup_start_percent: 50,
      });
    }
  };

  // Get rule by ID
  const getRuleById = (id: string) => {
    return goalRules.find(r => r.id === id);
  };

  // Format rule description
  const formatRuleDescription = (rule: GoalRule): string => {
    if (rule.rule_type === 'fixed') {
      return `Valor fixo: R$ ${rule.fixed_value?.toLocaleString('pt-BR')}`;
    }
    
    const baseMap: Record<GoalBaseReference, string> = {
      previous_year_same_month: 'mesmo mês do ano anterior',
      previous_month: 'mês anterior',
      team_average: 'média da equipe',
      manual: 'definição manual',
    };
    
    return `${baseMap[rule.base_reference]} + ${rule.percentage_value}%`;
  };

  return {
    goalRules,
    defaultRule,
    isLoading,
    error,
    createGoalRule: createMutation.mutateAsync,
    updateGoalRule: updateMutation.mutateAsync,
    deleteGoalRule: deleteMutation.mutateAsync,
    setDefaultRule: setDefaultMutation.mutateAsync,
    ensureDefaultRule,
    getRuleById,
    formatRuleDescription,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
