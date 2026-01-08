import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentDashboardData {
  id: string;
  email: string;
  companyName?: string;
  segment?: string;
  status: 'pending' | 'registered' | 'demo';
  registeredUserId?: string;
  dashboardData?: {
    annualGoal: number;
    annualRealized: number;
    teamSize: number;
    lastUploadDate?: string;
    currentMonthRevenue: number;
    currentMonthGoal: number;
  };
  alerts: {
    type: 'success' | 'warning' | 'danger';
    message: string;
  }[];
  isDemo?: boolean;
}

export interface AgencyMetrics {
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  totalRevenue: number;
  averageProgress: number;
  studentsAtRisk: number;
  studentsOnTrack: number;
}

interface UseAgencyDashboardReturn {
  students: StudentDashboardData[];
  metrics: AgencyMetrics;
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export default function useAgencyDashboard(): UseAgencyDashboardReturn {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentDashboardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch invites and demo students in parallel
      const [invitesResult, demoStudentsResult] = await Promise.all([
        supabase
          .from('invites')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('demo_students')
          .select('*')
          .eq('consultant_id', user.id)
          .order('company_name', { ascending: true })
      ]);

      if (invitesResult.error) throw invitesResult.error;

      const invites = invitesResult.data || [];
      const demoStudents = demoStudentsResult.data || [];

      // Process real invites
      const realStudentsData: StudentDashboardData[] = await Promise.all(
        invites.map(async (invite) => {
          const studentData: StudentDashboardData = {
            id: invite.id,
            email: invite.email,
            status: invite.status as 'pending' | 'registered',
            registeredUserId: invite.registered_uid || undefined,
            alerts: [],
            isDemo: false,
          };

          if (invite.status === 'registered' && invite.registered_uid) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('company_name, segment')
              .eq('id', invite.registered_uid)
              .maybeSingle();

            if (profile) {
              studentData.companyName = profile.company_name || undefined;
              studentData.segment = profile.segment || undefined;
            }

            // Fetch dashboard data
            const { data: dashboard } = await supabase
              .from('dashboard_data')
              .select('kpis, team, last_upload_date, current_year_data')
              .eq('user_id', invite.registered_uid)
              .maybeSingle();

            if (dashboard) {
              const kpis = dashboard.kpis as any;
              const team = dashboard.team as any[];
              const currentYearData = dashboard.current_year_data as any[];

              // Get current month data
              const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
              const currentMonthName = monthNames[new Date().getMonth()];
              const currentMonthData = currentYearData?.find(d => d.month === currentMonthName);

              studentData.dashboardData = {
                annualGoal: kpis?.annualGoal || 0,
                annualRealized: kpis?.annualRealized || 0,
                teamSize: team?.length || 0,
                lastUploadDate: dashboard.last_upload_date || undefined,
                currentMonthRevenue: currentMonthData?.revenue || 0,
                currentMonthGoal: currentMonthData?.goal || 0,
              };

              // Calculate alerts
              const annualProgress = studentData.dashboardData.annualGoal > 0
                ? (studentData.dashboardData.annualRealized / studentData.dashboardData.annualGoal) * 100
                : 0;

              const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
              const expectedProgress = (dayOfYear / 365) * 100;

              if (annualProgress >= 100) {
                studentData.alerts.push({
                  type: 'success',
                  message: 'Meta anual atingida! 🎉',
                });
              } else if (annualProgress < expectedProgress - 20) {
                studentData.alerts.push({
                  type: 'danger',
                  message: `${(expectedProgress - annualProgress).toFixed(0)}% abaixo do esperado`,
                });
              } else if (annualProgress < expectedProgress - 10) {
                studentData.alerts.push({
                  type: 'warning',
                  message: 'Ligeiramente abaixo da meta',
                });
              }

              // Check last upload
              if (dashboard.last_upload_date) {
                const lastUpload = new Date(dashboard.last_upload_date);
                const daysSinceUpload = Math.floor((Date.now() - lastUpload.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysSinceUpload > 14) {
                  studentData.alerts.push({
                    type: 'warning',
                    message: `${daysSinceUpload} dias sem upload`,
                  });
                }
              }
            }
          }

          return studentData;
        })
      );

      // Process demo students
      const demoStudentsData: StudentDashboardData[] = demoStudents.map((demo: any) => {
        const alerts = demo.alerts as any[] || [];
        const monthlyData = demo.monthly_data as any[] || [];
        const currentMonth = new Date().getMonth() + 1;
        const currentMonthData = monthlyData.find((m: any) => m.month === currentMonth);

        return {
          id: demo.id,
          email: demo.email,
          companyName: demo.company_name,
          segment: demo.segment,
          status: 'demo' as const,
          registeredUserId: demo.id,
          dashboardData: {
            annualGoal: demo.annual_goal || 0,
            annualRealized: demo.annual_realized || 0,
            teamSize: demo.team_size || 0,
            lastUploadDate: demo.last_upload_date,
            currentMonthRevenue: currentMonthData?.revenue || 0,
            currentMonthGoal: currentMonthData?.goal || 0,
          },
          alerts: alerts.map((a: any) => ({
            type: a.type as 'success' | 'warning' | 'danger',
            message: a.message,
          })),
          isDemo: true,
        };
      });

      // Combine real and demo students
      setStudents([...realStudentsData, ...demoStudentsData]);
    } catch (err: any) {
      console.error('Error fetching agency dashboard:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate aggregated metrics
  const metrics: AgencyMetrics = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'registered' || s.status === 'demo').length,
    pendingStudents: students.filter(s => s.status === 'pending').length,
    totalRevenue: students.reduce((sum, s) => sum + (s.dashboardData?.annualRealized || 0), 0),
    averageProgress: (() => {
      const withGoals = students.filter(s => s.dashboardData?.annualGoal);
      if (withGoals.length === 0) return 0;
      const totalProgress = withGoals.reduce((sum, s) => {
        const progress = s.dashboardData!.annualGoal > 0
          ? (s.dashboardData!.annualRealized / s.dashboardData!.annualGoal) * 100
          : 0;
        return sum + progress;
      }, 0);
      return totalProgress / withGoals.length;
    })(),
    studentsAtRisk: students.filter(s => 
      s.alerts.some(a => a.type === 'danger')
    ).length,
    studentsOnTrack: students.filter(s => 
      (s.status === 'registered' || s.status === 'demo') && 
      !s.alerts.some(a => a.type === 'danger' || a.type === 'warning')
    ).length,
  };

  return {
    students,
    metrics,
    isLoading,
    error,
    fetchData,
  };
}
