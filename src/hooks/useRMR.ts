import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RMRMeeting {
  id: string;
  user_id: string;
  date: string;
  month: number;
  year: number;
  status: 'scheduled' | 'completed' | 'pending';
  monthly_goal: number;
  previous_month_revenue: number;
  motivational_theme?: string;
  strategies?: string[];
  notes?: string;
  highlighted_employee_id?: string;
  highlighted_employee_name?: string;
  highlight_reason?: string;
  selected_video_id?: string;
  selected_video_url?: string;
  selected_video_title?: string;
  created_at: string;
  updated_at: string;
  // Slides tracking
  slides_generated_at?: string;
  slides_version?: number;
  // Gamma integration
  gamma_generation_id?: string;
  gamma_url?: string;
  gamma_pptx_url?: string;
}

export interface CreateRMRInput {
  date: string;
  month: number;
  year: number;
  monthly_goal: number;
  previous_month_revenue: number;
  motivational_theme?: string;
  strategies?: string[];
  notes?: string;
  highlighted_employee_id?: string;
  highlighted_employee_name?: string;
  highlight_reason?: string;
  status?: 'scheduled' | 'completed' | 'pending';
  selected_video_id?: string;
  selected_video_url?: string;
  selected_video_title?: string;
}

export const useRMR = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all RMR meetings
  const { data: meetings = [], isLoading, error } = useQuery({
    queryKey: ['rmr-meetings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('rmr_meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as RMRMeeting[];
    },
    enabled: !!user?.id,
  });

  // Create RMR meeting
  const createMutation = useMutation({
    mutationFn: async (input: CreateRMRInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('rmr_meetings')
        .insert({
          ...input,
          user_id: user.id,
          strategies: input.strategies || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmr-meetings'] });
      toast.success('RMR criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar RMR: ' + error.message);
    },
  });

  // Update RMR meeting
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<RMRMeeting> & { id: string }) => {
      const { data, error } = await supabase
        .from('rmr_meetings')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmr-meetings'] });
      toast.success('RMR atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar RMR: ' + error.message);
    },
  });

  // Delete RMR meeting
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rmr_meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmr-meetings'] });
      toast.success('RMR excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir RMR: ' + error.message);
    },
  });

  // Get next RMR (first business day of next month - skips weekends)
  const getNextRMRDate = () => {
    const now = new Date();
    let firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const dayOfWeek = firstDay.getDay();
    if (dayOfWeek === 6) { // Sábado -> Segunda
      firstDay.setDate(firstDay.getDate() + 2);
    } else if (dayOfWeek === 0) { // Domingo -> Segunda
      firstDay.setDate(firstDay.getDate() + 1);
    }
    
    return firstDay;
  };

  // Get RMR for a specific month
  const getRMRByMonth = (month: number, year: number) => {
    return meetings.find(m => m.month === month && m.year === year);
  };

  // Get latest completed RMR
  const getLatestCompletedRMR = () => {
    return meetings.find(m => m.status === 'completed');
  };

  return {
    meetings,
    isLoading,
    error,
    createRMR: createMutation.mutate,
    updateRMR: updateMutation.mutate,
    deleteRMR: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getNextRMRDate,
    getRMRByMonth,
    getLatestCompletedRMR,
  };
};
