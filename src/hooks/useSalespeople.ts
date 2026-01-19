import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type SalespersonStatus = 'active' | 'inactive' | 'on_leave';
export type TerminationReason = 'dismissal' | 'resignation' | 'retirement' | 'contract_end' | 'other';

export interface Salesperson {
  id: string;
  user_id: string;
  legacy_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  hire_date: string;
  termination_date: string | null;
  termination_reason: TerminationReason | null;
  termination_notes: string | null;
  status: SalespersonStatus;
  goal_rule_id: string | null;
  goal_override_value: number | null;
  goal_override_percent: number | null;
  channel_preference: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSalespersonInput {
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  hire_date: string;
  status?: SalespersonStatus;
  goal_rule_id?: string;
  goal_override_value?: number;
  goal_override_percent?: number;
  channel_preference?: string;
  legacy_id?: string;
}

export interface UpdateSalespersonInput {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  hire_date?: string;
  termination_date?: string | null;
  termination_reason?: TerminationReason | null;
  termination_notes?: string | null;
  status?: SalespersonStatus;
  goal_rule_id?: string | null;
  goal_override_value?: number | null;
  goal_override_percent?: number | null;
  channel_preference?: string;
}

export interface TerminateSalespersonInput {
  id: string;
  termination_date: string;
  termination_reason: TerminationReason;
  termination_notes?: string;
}

export function useSalespeople() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all salespeople
  const { data: salespeople = [], isLoading, error } = useQuery({
    queryKey: ['salespeople', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('salespeople')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data as Salesperson[];
    },
    enabled: !!user?.id,
  });

  // Get active salespeople only
  const activeSalespeople = salespeople.filter(s => s.status === 'active');

  // Get inactive/terminated salespeople
  const inactiveSalespeople = salespeople.filter(s => s.status !== 'active');

  // Create salesperson
  const createMutation = useMutation({
    mutationFn: async (input: CreateSalespersonInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('salespeople')
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
      queryClient.invalidateQueries({ queryKey: ['salespeople'] });
      toast.success('Vendedor cadastrado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating salesperson:', error);
      toast.error('Erro ao cadastrar vendedor');
    },
  });

  // Update salesperson
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateSalespersonInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('salespeople')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople'] });
      toast.success('Vendedor atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating salesperson:', error);
      toast.error('Erro ao atualizar vendedor');
    },
  });

  // Terminate salesperson
  const terminateMutation = useMutation({
    mutationFn: async (input: TerminateSalespersonInput) => {
      const { id, termination_date, termination_reason, termination_notes } = input;
      
      const { data, error } = await supabase
        .from('salespeople')
        .update({
          termination_date,
          termination_reason,
          termination_notes,
          status: 'inactive' as SalespersonStatus,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople'] });
      toast.success('Desligamento registrado com sucesso');
    },
    onError: (error) => {
      console.error('Error terminating salesperson:', error);
      toast.error('Erro ao registrar desligamento');
    },
  });

  // Reactivate salesperson
  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('salespeople')
        .update({
          termination_date: null,
          termination_reason: null,
          termination_notes: null,
          status: 'active' as SalespersonStatus,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople'] });
      toast.success('Vendedor reativado com sucesso!');
    },
    onError: (error) => {
      console.error('Error reactivating salesperson:', error);
      toast.error('Erro ao reativar vendedor');
    },
  });

  // Delete salesperson
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('salespeople')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople'] });
      toast.success('Vendedor removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting salesperson:', error);
      toast.error('Erro ao remover vendedor');
    },
  });

  // Get salesperson by ID
  const getSalespersonById = (id: string) => {
    return salespeople.find(s => s.id === id);
  };

  // Get salesperson by legacy ID (for migration compatibility)
  const getSalespersonByLegacyId = (legacyId: string) => {
    return salespeople.find(s => s.legacy_id === legacyId);
  };

  // Calculate tenure in months
  const getTenure = (salesperson: Salesperson): number => {
    const start = new Date(salesperson.hire_date);
    const end = salesperson.termination_date 
      ? new Date(salesperson.termination_date) 
      : new Date();
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 
      + (end.getMonth() - start.getMonth());
    
    return Math.max(0, months);
  };

  return {
    salespeople,
    activeSalespeople,
    inactiveSalespeople,
    isLoading,
    error,
    createSalesperson: createMutation.mutateAsync,
    updateSalesperson: updateMutation.mutateAsync,
    terminateSalesperson: terminateMutation.mutateAsync,
    reactivateSalesperson: reactivateMutation.mutateAsync,
    deleteSalesperson: deleteMutation.mutateAsync,
    getSalespersonById,
    getSalespersonByLegacyId,
    getTenure,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isTerminating: terminateMutation.isPending,
  };
}
