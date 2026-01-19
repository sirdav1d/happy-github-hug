import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RMRPreparationStatus {
  id: string;
  rmr_id: string | null;
  user_id: string;
  preparation_deadline: string;
  is_prepared: boolean;
  last_reminder_sent_at: string | null;
  generated_script_markdown: string | null;
  generated_script_pdf_url: string | null;
  slides_presentation_url: string | null;
  ai_generated_highlights: HighlightCandidate[] | null;
  ai_suggested_theme: string | null;
  ai_suggested_strategies: string[] | null;
  created_at: string;
  updated_at: string;
  // Script version control fields
  script_month?: number | null;
  script_year?: number | null;
  script_generated_at?: string | null;
}

export interface HighlightCandidate {
  employee_id?: string;
  employee_name: string;
  score: number;
  reason: string;
  metrics?: {
    revenue: number;
    goal: number;
    achievement: number;
    growth: number;
  };
}

export interface RMRInsights {
  highlight_candidates: HighlightCandidate[];
  suggested_theme: string;
  theme_context: string;
  suggested_strategies: string[];
  suggested_goal: number;
  goal_reasoning: string;
}

interface TeamMember {
  id: string;
  name: string;
  totalRevenue: number;
  monthlyGoal: number;
}

export const useRMRPreparation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Calculate next RMR deadline (7 days before 1st business day of next month)
  const calculateDeadline = useCallback(() => {
    const now = new Date();
    let firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Adjust for weekends
    const dayOfWeek = firstDay.getDay();
    if (dayOfWeek === 6) firstDay.setDate(firstDay.getDate() + 2);
    else if (dayOfWeek === 0) firstDay.setDate(firstDay.getDate() + 1);
    
    // Subtract 7 days for preparation deadline
    const deadline = new Date(firstDay);
    deadline.setDate(deadline.getDate() - 7);
    
    return deadline;
  }, []);

  // Get days remaining until deadline
  const getDaysRemaining = useCallback((deadline: Date | string) => {
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Get deadline status color
  const getDeadlineStatus = useCallback((daysRemaining: number) => {
    if (daysRemaining < 0) return { color: 'destructive', label: 'Atrasado', urgent: true };
    if (daysRemaining <= 1) return { color: 'destructive', label: 'Urgente', urgent: true };
    if (daysRemaining <= 3) return { color: 'warning', label: 'Atenção', urgent: true };
    if (daysRemaining <= 5) return { color: 'warning', label: 'Em breve', urgent: false };
    return { color: 'success', label: 'No prazo', urgent: false };
  }, []);

  // Fetch current preparation status
  const { data: preparationStatus, isLoading } = useQuery({
    queryKey: ['rmr-preparation-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('rmr_preparation_status')
        .select('*')
        .eq('user_id', user.id)
        .order('preparation_deadline', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      return {
        ...data,
        ai_generated_highlights: data.ai_generated_highlights as unknown as HighlightCandidate[] | null
      } as RMRPreparationStatus;
    },
    enabled: !!user?.id,
  });

  // Create or update preparation status
  const upsertPreparationMutation = useMutation({
    mutationFn: async (updateData: Partial<RMRPreparationStatus>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const deadline = calculateDeadline();
      const { ai_generated_highlights, ...restData } = updateData;

      // Convert highlights to JSON-compatible format
      const highlightsJson = ai_generated_highlights 
        ? JSON.parse(JSON.stringify(ai_generated_highlights)) 
        : null;

      if (preparationStatus?.id) {
        const { error } = await supabase
          .from('rmr_preparation_status')
          .update({
            ...restData,
            ...(highlightsJson !== undefined && { ai_generated_highlights: highlightsJson }),
            updated_at: new Date().toISOString()
          })
          .eq('id', preparationStatus.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rmr_preparation_status')
          .insert({
            user_id: user.id,
            preparation_deadline: deadline.toISOString(),
            ...restData,
            ...(highlightsJson !== undefined && { ai_generated_highlights: highlightsJson })
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmr-preparation-status'] });
    },
    onError: (error) => {
      console.error('Error updating preparation status:', error);
      toast.error('Erro ao atualizar status de preparação');
    }
  });

  // Generate AI insights
  const generateInsights = useCallback(async (
    team: TeamMember[],
    previousMonthRevenue?: number,
    previousMonthGoal?: number,
    previousRMR?: { theme?: string; strategies?: string[]; highlightedEmployeeName?: string }
  ): Promise<RMRInsights | null> => {
    if (!user?.id || team.length === 0) return null;

    setIsGeneratingInsights(true);
    
    try {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const teamData = team.map(member => ({
        id: member.id,
        name: member.name,
        revenue: member.totalRevenue,
        goal: member.monthlyGoal,
        growth: 0 // Could be calculated from historical data
      }));

      const response = await supabase.functions.invoke('generate-rmr-insights', {
        body: {
          team: teamData,
          previousRMR,
          previousMonthRevenue,
          previousMonthGoal,
          monthContext: {
            month: nextMonth.getMonth() + 1,
            year: nextMonth.getFullYear()
          }
        }
      });

      if (response.error) throw response.error;

      const insights = response.data as RMRInsights;

      // Save insights to preparation status
      await upsertPreparationMutation.mutateAsync({
        ai_generated_highlights: insights.highlight_candidates,
        ai_suggested_theme: insights.suggested_theme,
        ai_suggested_strategies: insights.suggested_strategies
      });

      toast.success('Insights gerados com sucesso!');
      return insights;

    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Erro ao gerar insights');
      return null;
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [user?.id, upsertPreparationMutation]);

  // Mark as prepared
  const markAsPrepared = useCallback(async () => {
    await upsertPreparationMutation.mutateAsync({ is_prepared: true });
    toast.success('RMR marcada como preparada!');
  }, [upsertPreparationMutation]);

  // Computed values
  const deadline = useMemo(() => calculateDeadline(), [calculateDeadline]);
  const daysRemaining = useMemo(() => getDaysRemaining(deadline), [deadline, getDaysRemaining]);
  const deadlineStatus = useMemo(() => getDeadlineStatus(daysRemaining), [daysRemaining, getDeadlineStatus]);

  return {
    preparationStatus,
    isLoading,
    isGeneratingInsights,
    deadline,
    daysRemaining,
    deadlineStatus,
    calculateDeadline,
    getDaysRemaining,
    getDeadlineStatus,
    generateInsights,
    markAsPrepared,
    updatePreparation: upsertPreparationMutation.mutate,
    isUpdating: upsertPreparationMutation.isPending
  };
};
