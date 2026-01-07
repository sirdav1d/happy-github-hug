import { useMemo } from 'react';
import { useRMR } from './useRMR';
import { useFIVI } from './useFIVI';
import { useLeads } from './useLeads';
import { DashboardData, Salesperson } from '@/types';

export type NotificationType = 'ritual' | 'lead' | 'goal' | 'info';
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  description: string;
  action?: {
    label: string;
    view: string;
  };
  timestamp: Date;
}

// Helper to get current week number
const getWeekNumber = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

export const useNotifications = (dashboardData?: DashboardData) => {
  const { meetings } = useRMR();
  const { sessions, getPendingFIVIs } = useFIVI();
  const { leads } = useLeads();

  const notifications = useMemo(() => {
    const alerts: Notification[] = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    const dayOfMonth = now.getDate();

    // 1. RMR Pendente - Check if current month RMR is missing (after day 1)
    if (dayOfMonth >= 1) {
      const currentMonthRMR = meetings.find(
        m => m.month === currentMonth && m.year === currentYear
      );
      
      if (!currentMonthRMR) {
        alerts.push({
          id: 'rmr-pending',
          type: 'ritual',
          priority: dayOfMonth > 5 ? 'high' : 'medium',
          title: 'RMR Pendente',
          description: `A Reunião de Metas de ${getMonthName(currentMonth)} ainda não foi realizada.`,
          action: { label: 'Realizar RMR', view: 'rmr' },
          timestamp: now,
        });
      } else if (currentMonthRMR.status !== 'completed') {
        alerts.push({
          id: 'rmr-incomplete',
          type: 'ritual',
          priority: 'medium',
          title: 'RMR Incompleta',
          description: `A RMR de ${getMonthName(currentMonth)} está em andamento. Conclua para definir as metas.`,
          action: { label: 'Continuar RMR', view: 'rmr' },
          timestamp: now,
        });
      }
    }

    // 2. FIV Pendentes - Check for team members without FIVI this week
    if (dashboardData?.team) {
      const activeTeam = dashboardData.team.filter(m => m.active && !m.isPlaceholder);
      const teamIds = activeTeam.map(m => m.id);
      
      const pendingFIVIs = getPendingFIVIs(teamIds, currentWeek);
      
      if (pendingFIVIs.length > 0) {
        const pendingNames = activeTeam
          .filter(m => pendingFIVIs.includes(m.id))
          .map(m => m.name.split(' ')[0])
          .slice(0, 3);
        
        const displayNames = pendingNames.length > 3 
          ? `${pendingNames.join(', ')} e +${pendingFIVIs.length - 3}`
          : pendingNames.join(', ');

        alerts.push({
          id: 'fivi-pending',
          type: 'ritual',
          priority: now.getDay() >= 4 ? 'high' : 'medium', // High priority Thu-Fri
          title: `${pendingFIVIs.length} FIV Pendente${pendingFIVIs.length > 1 ? 's' : ''}`,
          description: `Vendedores sem feedback esta semana: ${displayNames}`,
          action: { label: 'Realizar FIV', view: 'fivi' },
          timestamp: now,
        });
      }
    }

    // 3. Leads Parados (> 7 dias sem atualização)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const stalledLeads = leads.filter(lead => {
      if (['fechado_ganho', 'fechado_perdido'].includes(lead.status)) return false;
      const lastUpdate = new Date(lead.updated_at || lead.created_at || now);
      return lastUpdate < sevenDaysAgo;
    });

    if (stalledLeads.length > 0) {
      const highValueStalled = stalledLeads.filter(l => (l.estimated_value || 0) >= 5000);
      
      alerts.push({
        id: 'leads-stalled',
        type: 'lead',
        priority: highValueStalled.length > 0 ? 'high' : 'medium',
        title: `${stalledLeads.length} Lead${stalledLeads.length > 1 ? 's' : ''} Parado${stalledLeads.length > 1 ? 's' : ''}`,
        description: highValueStalled.length > 0 
          ? `${highValueStalled.length} de alto valor precisam de atenção urgente.`
          : 'Leads sem movimentação há mais de 7 dias.',
        action: { label: 'Ver Pipeline', view: 'pipeline' },
        timestamp: now,
      });
    }

    // 4. Próximos Contatos Agendados (hoje ou atrasados)
    const leadsWithNextContact = leads.filter(lead => {
      if (!lead.next_contact_date) return false;
      if (['fechado_ganho', 'fechado_perdido'].includes(lead.status)) return false;
      const contactDate = new Date(lead.next_contact_date);
      contactDate.setHours(23, 59, 59);
      return contactDate <= now;
    });

    if (leadsWithNextContact.length > 0) {
      const overdue = leadsWithNextContact.filter(l => {
        const contactDate = new Date(l.next_contact_date!);
        contactDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return contactDate < today;
      });

      alerts.push({
        id: 'contacts-due',
        type: 'lead',
        priority: overdue.length > 0 ? 'high' : 'medium',
        title: `${leadsWithNextContact.length} Contato${leadsWithNextContact.length > 1 ? 's' : ''} Pendente${leadsWithNextContact.length > 1 ? 's' : ''}`,
        description: overdue.length > 0 
          ? `${overdue.length} atrasado${overdue.length > 1 ? 's' : ''}, ${leadsWithNextContact.length - overdue.length} para hoje.`
          : 'Contatos agendados para hoje.',
        action: { label: 'Ver Pipeline', view: 'pipeline' },
        timestamp: now,
      });
    }

    // 5. Meta em Risco
    if (dashboardData?.currentYearData && dashboardData?.kpis) {
      const shortMonthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const currentMonthData = dashboardData.currentYearData.find(
        d => d.month === shortMonthNames[now.getMonth()]
      );

      if (currentMonthData && currentMonthData.goal > 0) {
        const progress = (currentMonthData.revenue / currentMonthData.goal) * 100;
        const dayProgress = (dayOfMonth / 30) * 100; // Expected progress based on day
        
        // If actual progress is 20% behind expected progress
        if (progress < dayProgress - 20 && dayOfMonth > 5) {
          const gap = currentMonthData.goal - currentMonthData.revenue;
          const daysLeft = 30 - dayOfMonth;
          const dailyNeeded = gap / Math.max(daysLeft, 1);

          alerts.push({
            id: 'goal-at-risk',
            type: 'goal',
            priority: progress < dayProgress - 30 ? 'high' : 'medium',
            title: 'Meta Mensal em Risco',
            description: `${progress.toFixed(0)}% atingido. Meta diária: R$ ${dailyNeeded.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
            action: { label: 'Ver Dashboard', view: 'dashboard' },
            timestamp: now,
          });
        }
      }
    }

    // 6. Vendedores Abaixo de 70% da Meta
    if (dashboardData?.team) {
      const underperformers = dashboardData.team.filter(m => {
        if (!m.active || m.isPlaceholder) return false;
        if (m.monthlyGoal === 0) return false;
        const progress = (m.totalRevenue / m.monthlyGoal) * 100;
        return progress < 70 && dayOfMonth > 15; // Only alert after mid-month
      });

      if (underperformers.length > 0) {
        const names = underperformers
          .map(m => m.name.split(' ')[0])
          .slice(0, 2)
          .join(', ');

        alerts.push({
          id: 'team-underperforming',
          type: 'goal',
          priority: underperformers.length > 2 ? 'high' : 'medium',
          title: `${underperformers.length} Vendedor${underperformers.length > 1 ? 'es' : ''} Abaixo de 70%`,
          description: `${names}${underperformers.length > 2 ? ` e +${underperformers.length - 2}` : ''} precisam de acompanhamento.`,
          action: { label: 'Ver Equipe', view: 'team' },
          timestamp: now,
        });
      }
    }

    // Sort by priority (high first) then by type
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [meetings, sessions, leads, dashboardData, getPendingFIVIs]);

  const highPriorityCount = useMemo(() => 
    notifications.filter(n => n.priority === 'high').length, 
    [notifications]
  );

  return {
    notifications,
    totalCount: notifications.length,
    highPriorityCount,
  };
};

function getMonthName(month: number): string {
  const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return names[month - 1] || '';
}
