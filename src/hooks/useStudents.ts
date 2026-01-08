import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import useSubscriptionPlan from '@/hooks/useSubscriptionPlan';

export interface Student {
  id: string;
  email: string;
  status: 'pending' | 'registered';
  companyName?: string;
  segment?: string;
  registeredAt?: string;
  registeredUid?: string;
  createdAt: string;
  // Dados consolidados do aluno
  dashboardSummary?: {
    annualGoal?: number;
    annualRealized?: number;
    teamSize?: number;
    lastUploadDate?: string;
  };
}

interface UseStudentsReturn {
  students: Student[];
  isLoading: boolean;
  error: string | null;
  inviteStudent: (email: string, consultantName?: string) => Promise<boolean>;
  removeInvite: (inviteId: string) => Promise<boolean>;
  fetchStudents: () => Promise<void>;
  canInviteMore: boolean;
  planLimit: number;
}

export default function useStudents(userId: string | undefined): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentPlan, studentCount, canAddStudent } = useSubscriptionPlan();
  
  const planLimit = currentPlan?.maxStudents || 5;
  const canInviteMore = canAddStudent;

  const fetchStudents = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Buscar convites criados pelo consultor
      const { data: invites, error: invitesError } = await supabase
        .from('invites')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;

      // Para cada convite registrado, buscar dados do profile e dashboard
      const studentsWithData: Student[] = await Promise.all(
        (invites || []).map(async (invite) => {
          let dashboardSummary = undefined;
          let profileData = undefined;

          if (invite.status === 'registered' && invite.registered_uid) {
            // Buscar profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('company_name, segment')
              .eq('id', invite.registered_uid)
              .maybeSingle();

            profileData = profile;

            // Buscar resumo do dashboard
            const { data: dashboard } = await supabase
              .from('dashboard_data')
              .select('kpis, team, last_upload_date')
              .eq('user_id', invite.registered_uid)
              .maybeSingle();

            if (dashboard) {
              const kpis = dashboard.kpis as any;
              const team = dashboard.team as any[];
              dashboardSummary = {
                annualGoal: kpis?.annualGoal,
                annualRealized: kpis?.annualRealized,
                teamSize: team?.length || 0,
                lastUploadDate: dashboard.last_upload_date,
              };
            }
          }

          return {
            id: invite.id,
            email: invite.email,
            status: invite.status as 'pending' | 'registered',
            companyName: profileData?.company_name || undefined,
            segment: profileData?.segment || undefined,
            registeredUid: invite.registered_uid || undefined,
            createdAt: invite.created_at,
            dashboardSummary,
          };
        })
      );

      setStudents(studentsWithData);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Erro ao carregar alunos');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const inviteStudent = useCallback(async (email: string, consultantName?: string): Promise<boolean> => {
    if (!userId) return false;

    // Verificar limite do plano
    if (!canInviteMore) {
      toast({
        title: 'Limite de alunos atingido',
        description: `Seu plano permite até ${planLimit} alunos. Faça upgrade para convidar mais.`,
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verificar se já existe convite para este email
      const { data: existing } = await supabase
        .from('invites')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('created_by', userId)
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Convite já existe',
          description: 'Este email já foi convidado.',
          variant: 'destructive',
        });
        return false;
      }

      // Gerar token de convite
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

      const { data: invite, error: insertError } = await supabase
        .from('invites')
        .insert({
          email: email.toLowerCase(),
          created_by: userId,
          role: 'business_owner',
          status: 'pending',
          invite_token: inviteToken,
          expires_at: expiresAt.toISOString(),
          consultant_name: consultantName || 'Seu Consultor',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Enviar email de convite via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
          body: {
            email: email.toLowerCase(),
            consultantName: consultantName || 'Seu Consultor',
            inviteToken,
          },
        });

        if (emailError) {
          console.error('Error sending invite email:', emailError);
          // Atualizar convite mesmo se email falhar
        } else {
          // Marcar email como enviado
          await supabase
            .from('invites')
            .update({ email_sent: true, email_sent_at: new Date().toISOString() })
            .eq('id', invite.id);
        }
      } catch (emailErr) {
        console.error('Error invoking email function:', emailErr);
      }

      toast({
        title: 'Convite enviado!',
        description: `Convite enviado para ${email}`,
      });

      await fetchStudents();
      return true;
    } catch (err: any) {
      console.error('Error inviting student:', err);
      setError(err.message || 'Erro ao enviar convite');
      toast({
        title: 'Erro ao enviar convite',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast, fetchStudents, canInviteMore, planLimit]);

  const removeInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId)
        .eq('created_by', userId);

      if (deleteError) throw deleteError;

      setStudents(prev => prev.filter(s => s.id !== inviteId));

      toast({
        title: 'Convite removido',
        description: 'O convite foi removido com sucesso.',
      });

      return true;
    } catch (err: any) {
      console.error('Error removing invite:', err);
      setError(err.message || 'Erro ao remover convite');
      toast({
        title: 'Erro ao remover convite',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (userId) {
      fetchStudents();
    }
  }, [userId, fetchStudents]);

  return {
    students,
    isLoading,
    error,
    inviteStudent,
    removeInvite,
    fetchStudents,
    canInviteMore,
    planLimit,
  };
}
