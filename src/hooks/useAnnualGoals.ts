import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AnnualGoal {
  id: string;
  user_id: string;
  year: number;
  annual_goal: number;
  monthly_distribution: Record<string, number> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnualGoalInput {
  year: number;
  annual_goal: number;
  monthly_distribution?: Record<string, number>;
  notes?: string;
}

export interface UpdateAnnualGoalInput {
  id: string;
  annual_goal?: number;
  monthly_distribution?: Record<string, number>;
  notes?: string;
}

export function useAnnualGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all annual goals
  const { data: annualGoals = [], isLoading, error } = useQuery({
    queryKey: ['annual-goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('annual_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data as AnnualGoal[];
    },
    enabled: !!user?.id,
  });

  // Get goal for specific year
  const getGoalForYear = (year: number): AnnualGoal | undefined => {
    return annualGoals.find(g => g.year === year);
  };

  // Get monthly goal from annual goal
  const getMonthlyGoal = (year: number, month: string): number => {
    const goal = getGoalForYear(year);
    if (!goal) return 0;
    
    // Check for custom monthly distribution
    if (goal.monthly_distribution && goal.monthly_distribution[month]) {
      return goal.monthly_distribution[month];
    }
    
    // Default: divide equally by 12
    return goal.annual_goal / 12;
  };

  // Create annual goal
  const createMutation = useMutation({
    mutationFn: async (input: CreateAnnualGoalInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('annual_goals')
        .insert({
          user_id: user.id,
          year: input.year,
          annual_goal: input.annual_goal,
          monthly_distribution: input.monthly_distribution || null,
          notes: input.notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annual-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Meta anual criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating annual goal:', error);
      if (error.message.includes('duplicate')) {
        toast.error('Já existe uma meta para este ano');
      } else {
        toast.error('Erro ao criar meta anual');
      }
    },
  });

  // Update annual goal
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateAnnualGoalInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('annual_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annual-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Meta anual atualizada!');
    },
    onError: (error) => {
      console.error('Error updating annual goal:', error);
      toast.error('Erro ao atualizar meta anual');
    },
  });

  // Delete annual goal
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('annual_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annual-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Meta anual removida!');
    },
    onError: (error) => {
      console.error('Error deleting annual goal:', error);
      toast.error('Erro ao remover meta anual');
    },
  });

  // Upsert - create or update
  const upsertMutation = useMutation({
    mutationFn: async (input: CreateAnnualGoalInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('annual_goals')
        .upsert({
          user_id: user.id,
          year: input.year,
          annual_goal: input.annual_goal,
          monthly_distribution: input.monthly_distribution || null,
          notes: input.notes || null,
        }, {
          onConflict: 'user_id,year',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annual-goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Meta anual salva!');
    },
    onError: (error) => {
      console.error('Error upserting annual goal:', error);
      toast.error('Erro ao salvar meta anual');
    },
  });

  return {
    annualGoals,
    isLoading,
    error,
    getGoalForYear,
    getMonthlyGoal,
    createAnnualGoal: createMutation.mutateAsync,
    updateAnnualGoal: updateMutation.mutateAsync,
    deleteAnnualGoal: deleteMutation.mutateAsync,
    upsertAnnualGoal: upsertMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSaving: upsertMutation.isPending,
  };
}
