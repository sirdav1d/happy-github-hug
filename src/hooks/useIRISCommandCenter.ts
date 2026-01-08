import { useMemo } from 'react';
import { DashboardData } from '@/types';
import { Lead } from '@/types/leads';

export interface AreaScore {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  mainInsight: string;
}

export interface ProactiveAlert {
  id: string;
  type: 'urgent' | 'warning' | 'opportunity';
  title: string;
  description: string;
  area: 'vendas' | 'pipeline' | 'equipe' | 'eficiencia';
  actionView?: string;
  relatedIds?: string[];
  priority: number;
}

export interface IRISCommandData {
  globalHealthScore: number;
  globalStatus: 'excellent' | 'good' | 'warning' | 'critical';
  areaScores: {
    vendas: AreaScore;
    pipeline: AreaScore;
    equipe: AreaScore;
    eficiencia: AreaScore;
  };
  prioritizedAlerts: ProactiveAlert[];
  isLoading: boolean;
}

const getStatusFromScore = (score: number): 'excellent' | 'good' | 'warning' | 'critical' => {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'warning';
  return 'critical';
};

interface UseIRISCommandCenterProps {
  dashboardData: DashboardData | null;
  leads: Lead[];
  leadsLoading: boolean;
}

export const useIRISCommandCenter = ({
  dashboardData,
  leads,
  leadsLoading,
}: UseIRISCommandCenterProps): IRISCommandData => {
  return useMemo(() => {
    if (!dashboardData) {
      return {
        globalHealthScore: 0,
        globalStatus: 'critical',
        areaScores: {
          vendas: { score: 0, status: 'critical', trend: 'stable', mainInsight: 'Sem dados' },
          pipeline: { score: 0, status: 'critical', trend: 'stable', mainInsight: 'Sem dados' },
          equipe: { score: 0, status: 'critical', trend: 'stable', mainInsight: 'Sem dados' },
          eficiencia: { score: 0, status: 'critical', trend: 'stable', mainInsight: 'Sem dados' },
        },
        prioritizedAlerts: [],
        isLoading: true,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentMonthData = dashboardData.currentYearData.find(m => Number(m.month) === currentMonth);
    
    // === VENDAS SCORE ===
    const monthProgress = currentMonthData && currentMonthData.goal > 0
      ? (currentMonthData.revenue / currentMonthData.goal) * 100
      : 0;
    const annualProgress = dashboardData.kpis.annualGoal > 0
      ? (dashboardData.kpis.annualRealized / dashboardData.kpis.annualGoal) * 100
      : 0;
    const vendasScore = Math.min(100, (monthProgress * 0.6 + annualProgress * 0.4));
    const vendasTrend = dashboardData.kpis.lastYearGrowth > 0 ? 'up' : dashboardData.kpis.lastYearGrowth < 0 ? 'down' : 'stable';
    const vendasInsight = monthProgress >= 100 
      ? `Meta de ${dashboardData.kpis.currentMonthName} batida!` 
      : `${(100 - monthProgress).toFixed(0)}% restante para meta`;

    // === PIPELINE SCORE ===
    const activeLeads = leads.filter(l => !['fechado_ganho', 'fechado_perdido', 'pos_venda'].includes(l.status));
    const stalledLeads = activeLeads.filter(l => {
      const updated = new Date(l.updated_at || l.created_at || now);
      const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate > 7;
    });
    const negotiationLeads = leads.filter(l => l.status === 'negociacao');
    const hotOpportunities = negotiationLeads.filter(l => (l.estimated_value || 0) >= 5000);
    
    const pipelineHealthy = activeLeads.length > 0 ? Math.max(0, 100 - (stalledLeads.length / activeLeads.length) * 100) : 50;
    const pipelineScore = Math.min(100, pipelineHealthy);
    const pipelineTrend = hotOpportunities.length > 2 ? 'up' : stalledLeads.length > 3 ? 'down' : 'stable';
    const pipelineInsight = stalledLeads.length > 0 
      ? `${stalledLeads.length} lead(s) parado(s) há +7 dias`
      : `${activeLeads.length} leads ativos no pipeline`;

    // === EQUIPE SCORE ===
    const activeTeam = dashboardData.team.filter(m => m.active && !m.isPlaceholder);
    const teamPerformances = activeTeam.map(m => m.monthlyGoal > 0 ? (m.totalRevenue / m.monthlyGoal) * 100 : 0);
    const avgTeamPerf = teamPerformances.length > 0 
      ? teamPerformances.reduce((a, b) => a + b, 0) / teamPerformances.length 
      : 0;
    const belowTarget = teamPerformances.filter(p => p < 80).length;
    const topTwo = [...teamPerformances].sort((a, b) => b - a).slice(0, 2);
    const topTwoShare = teamPerformances.length >= 2 
      ? (topTwo.reduce((a, b) => a + b, 0) / Math.max(1, teamPerformances.reduce((a, b) => a + b, 0))) * 100
      : 0;
    
    const equipeScore = Math.min(100, avgTeamPerf);
    const equipeTrend = avgTeamPerf >= 100 ? 'up' : avgTeamPerf < 80 ? 'down' : 'stable';
    const equipeInsight = belowTarget > 0 
      ? `${belowTarget} vendedor(es) abaixo de 80%`
      : `Equipe com média de ${avgTeamPerf.toFixed(0)}%`;

    // === EFICIÊNCIA SCORE ===
    const ltvCacRatio = dashboardData.kpis.cac > 0 ? dashboardData.kpis.ltv / dashboardData.kpis.cac : 0;
    const conversionRate = dashboardData.kpis.conversionRate || 0;
    const ltvCacScore = Math.min(100, ltvCacRatio * 25); // 4x = 100
    const conversionScore = Math.min(100, conversionRate * 2.5); // 40% = 100
    const eficienciaScore = (ltvCacScore * 0.5 + conversionScore * 0.5);
    const eficienciaTrend = ltvCacRatio >= 3 ? 'up' : ltvCacRatio < 2 ? 'down' : 'stable';
    const eficienciaInsight = ltvCacRatio > 0 
      ? `LTV/CAC: ${ltvCacRatio.toFixed(1)}x | Conversão: ${conversionRate}%`
      : 'Configure CAC e LTV para análise';

    // === GLOBAL HEALTH SCORE ===
    const globalHealthScore = Math.round(
      vendasScore * 0.35 + 
      pipelineScore * 0.25 + 
      equipeScore * 0.25 + 
      eficienciaScore * 0.15
    );
    const globalStatus = getStatusFromScore(globalHealthScore);

    // === PROACTIVE ALERTS ===
    const alerts: ProactiveAlert[] = [];

    // Leads parados
    if (stalledLeads.length > 0) {
      const totalValue = stalledLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      alerts.push({
        id: 'stalled-leads',
        type: 'warning',
        title: `${stalledLeads.length} lead(s) parado(s)`,
        description: totalValue > 0 
          ? `R$ ${totalValue.toLocaleString('pt-BR')} em risco de esfriar`
          : 'Sem atualização há mais de 7 dias',
        area: 'pipeline',
        actionView: 'pipeline',
        relatedIds: stalledLeads.map(l => l.id),
        priority: 1,
      });
    }

    // Oportunidades quentes
    if (hotOpportunities.length > 0) {
      const totalValue = hotOpportunities.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      alerts.push({
        id: 'hot-opportunities',
        type: 'opportunity',
        title: `${hotOpportunities.length} oportunidade(s) quente(s)`,
        description: `R$ ${totalValue.toLocaleString('pt-BR')} em negociação avançada`,
        area: 'pipeline',
        actionView: 'pipeline',
        relatedIds: hotOpportunities.map(l => l.id),
        priority: 2,
      });
    }

    // Meta mensal em risco
    if (currentMonthData && monthProgress < 70) {
      const gap = currentMonthData.goal - currentMonthData.revenue;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = Math.max(0, lastDay - now.getDate());
      
      if (daysRemaining <= 10 && gap > 0) {
        alerts.push({
          id: 'monthly-goal-risk',
          type: 'urgent',
          title: 'Meta mensal em risco',
          description: `Faltam R$ ${gap.toLocaleString('pt-BR')} em ${daysRemaining} dias úteis`,
          area: 'vendas',
          actionView: 'dashboard',
          priority: 1,
        });
      }
    }

    // Vendedores precisando de suporte
    const strugglingMembers = activeTeam.filter(m => {
      const perf = m.monthlyGoal > 0 ? (m.totalRevenue / m.monthlyGoal) * 100 : 0;
      return perf < 60;
    });
    if (strugglingMembers.length > 0) {
      alerts.push({
        id: 'struggling-team',
        type: 'warning',
        title: `${strugglingMembers.length} vendedor(es) abaixo de 60%`,
        description: `Agende FIVI para: ${strugglingMembers.slice(0, 2).map(m => m.name.split(' ')[0]).join(', ')}${strugglingMembers.length > 2 ? '...' : ''}`,
        area: 'equipe',
        actionView: 'team',
        priority: 2,
      });
    }

    // Risco de concentração
    if (topTwoShare > 50 && activeTeam.length >= 3) {
      alerts.push({
        id: 'concentration-risk',
        type: 'warning',
        title: 'Alto risco de concentração',
        description: `Top 2 vendedores representam ${topTwoShare.toFixed(0)}% do faturamento`,
        area: 'equipe',
        actionView: 'team',
        priority: 3,
      });
    }

    // Contatos de hoje
    const todayStr = now.toISOString().split('T')[0];
    const todayContacts = leads.filter(l => l.next_contact_date === todayStr);
    if (todayContacts.length > 0) {
      alerts.push({
        id: 'today-contacts',
        type: 'opportunity',
        title: `${todayContacts.length} contato(s) agendado(s) para hoje`,
        description: 'Não esqueça de fazer follow-up',
        area: 'pipeline',
        actionView: 'pipeline',
        relatedIds: todayContacts.map(l => l.id),
        priority: 2,
      });
    }

    // Ordenar por prioridade
    alerts.sort((a, b) => a.priority - b.priority);

    return {
      globalHealthScore,
      globalStatus,
      areaScores: {
        vendas: { score: Math.round(vendasScore), status: getStatusFromScore(vendasScore), trend: vendasTrend, mainInsight: vendasInsight },
        pipeline: { score: Math.round(pipelineScore), status: getStatusFromScore(pipelineScore), trend: pipelineTrend, mainInsight: pipelineInsight },
        equipe: { score: Math.round(equipeScore), status: getStatusFromScore(equipeScore), trend: equipeTrend, mainInsight: equipeInsight },
        eficiencia: { score: Math.round(eficienciaScore), status: getStatusFromScore(eficienciaScore), trend: eficienciaTrend, mainInsight: eficienciaInsight },
      },
      prioritizedAlerts: alerts.slice(0, 6),
      isLoading: leadsLoading,
    };
  }, [dashboardData, leads, leadsLoading]);
};

export default useIRISCommandCenter;
