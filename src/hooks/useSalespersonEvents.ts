import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SalespersonEventType = 
  | 'hired' 
  | 'terminated' 
  | 'promoted' 
  | 'goal_changed' 
  | 'leave_started' 
  | 'leave_ended' 
  | 'status_changed';

export interface SalespersonEvent {
  id: string;
  salesperson_id: string;
  user_id: string;
  event_type: SalespersonEventType;
  event_date: string;
  title: string;
  description: string | null;
  details: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export function useSalespersonEvents(salespersonId?: string) {
  const { user } = useAuth();

  // Fetch events for a specific salesperson
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['salesperson-events', salespersonId],
    queryFn: async () => {
      if (!user?.id || !salespersonId) return [];
      
      const { data, error } = await supabase
        .from('salesperson_events')
        .select('*')
        .eq('salesperson_id', salespersonId)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SalespersonEvent[];
    },
    enabled: !!user?.id && !!salespersonId,
  });

  // Get icon for event type
  const getEventIcon = (eventType: SalespersonEventType): string => {
    const iconMap: Record<SalespersonEventType, string> = {
      hired: '🎉',
      terminated: '👋',
      promoted: '⭐',
      goal_changed: '🎯',
      leave_started: '🏖️',
      leave_ended: '🔙',
      status_changed: '🔄',
    };
    return iconMap[eventType] || '📝';
  };

  // Get color for event type
  const getEventColor = (eventType: SalespersonEventType): string => {
    const colorMap: Record<SalespersonEventType, string> = {
      hired: 'text-green-600',
      terminated: 'text-red-600',
      promoted: 'text-yellow-600',
      goal_changed: 'text-blue-600',
      leave_started: 'text-orange-600',
      leave_ended: 'text-teal-600',
      status_changed: 'text-purple-600',
    };
    return colorMap[eventType] || 'text-muted-foreground';
  };

  // Format event date
  const formatEventDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return {
    events,
    isLoading,
    error,
    getEventIcon,
    getEventColor,
    formatEventDate,
  };
}

// Hook for fetching all events (for reports/timeline views)
export function useAllSalespersonEvents() {
  const { user } = useAuth();

  const { data: allEvents = [], isLoading, error } = useQuery({
    queryKey: ['all-salesperson-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('salesperson_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as SalespersonEvent[];
    },
    enabled: !!user?.id,
  });

  return {
    allEvents,
    isLoading,
    error,
  };
}
