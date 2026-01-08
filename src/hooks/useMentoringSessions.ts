import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MentoringSession {
  id: string;
  consultant_id: string;
  student_id: string;
  student_email?: string;
  student_company?: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meeting_link?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionData {
  student_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
  meeting_link?: string;
}

export interface UpdateSessionData {
  title?: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  status?: MentoringSession['status'];
  meeting_link?: string;
  notes?: string;
}

interface UseMentoringSessionsReturn {
  sessions: MentoringSession[];
  isLoading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  createSession: (data: CreateSessionData) => Promise<MentoringSession | null>;
  updateSession: (id: string, data: UpdateSessionData) => Promise<boolean>;
  cancelSession: (id: string) => Promise<boolean>;
  completeSession: (id: string, notes?: string) => Promise<boolean>;
  getUpcomingSessions: (limit?: number) => MentoringSession[];
  getSessionsByStudent: (studentId: string) => MentoringSession[];
}

export function useMentoringSessions(): UseMentoringSessionsReturn {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('consultant_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Enrich with student info
      const enrichedSessions: MentoringSession[] = await Promise.all(
        (data || []).map(async (session) => {
          // Try to get student info from invites/profiles
          const { data: invite } = await supabase
            .from('invites')
            .select('email')
            .eq('registered_uid', session.student_id)
            .maybeSingle();

          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name')
            .eq('id', session.student_id)
            .maybeSingle();

          return {
            ...session,
            student_email: invite?.email,
            student_company: profile?.company_name,
          } as MentoringSession;
        })
      );

      setSessions(enrichedSessions);
    } catch (err: any) {
      console.error('Error fetching mentoring sessions:', err);
      setError(err.message || 'Erro ao carregar sessões');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async (data: CreateSessionData): Promise<MentoringSession | null> => {
    if (!user?.id) return null;

    try {
      const { data: newSession, error: createError } = await supabase
        .from('mentoring_sessions')
        .insert({
          consultant_id: user.id,
          student_id: data.student_id,
          title: data.title,
          description: data.description,
          scheduled_at: data.scheduled_at,
          duration_minutes: data.duration_minutes || 60,
          meeting_link: data.meeting_link,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchSessions();
      return newSession as MentoringSession;
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.message || 'Erro ao criar sessão');
      return null;
    }
  }, [user?.id, fetchSessions]);

  const updateSession = useCallback(async (id: string, data: UpdateSessionData): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('mentoring_sessions')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchSessions();
      return true;
    } catch (err: any) {
      console.error('Error updating session:', err);
      setError(err.message || 'Erro ao atualizar sessão');
      return false;
    }
  }, [fetchSessions]);

  const cancelSession = useCallback(async (id: string): Promise<boolean> => {
    return updateSession(id, { status: 'cancelled' });
  }, [updateSession]);

  const completeSession = useCallback(async (id: string, notes?: string): Promise<boolean> => {
    return updateSession(id, { status: 'completed', notes });
  }, [updateSession]);

  const getUpcomingSessions = useCallback((limit?: number): MentoringSession[] => {
    const now = new Date();
    const upcoming = sessions
      .filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    
    return limit ? upcoming.slice(0, limit) : upcoming;
  }, [sessions]);

  const getSessionsByStudent = useCallback((studentId: string): MentoringSession[] => {
    return sessions.filter(s => s.student_id === studentId);
  }, [sessions]);

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    cancelSession,
    completeSession,
    getUpcomingSessions,
    getSessionsByStudent,
  };
}
