import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardData } from '@/types';

export interface AIInsight {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  metric?: string;
  priority: number;
  category: 'performance' | 'growth' | 'efficiency' | 'team' | 'opportunity';
  actionable?: string;
}

interface DashboardMetrics {
  annualGoal: number;
  annualRealized: number;
  lastYearGrowth: number;
  currentMonthRevenue: number;
  currentMonthGoal: number;
  runRateProjection: number;
  averageTicket: number;
  totalSalesCount: number;
  currentMonthName: string;
  gapToGoal: number;
  daysRemaining: number;
  selectedYear: number;
  conversionRate: number;
  ltv: number;
  cac: number;
  teamSize: number;
  teamAvgPerformance: number;
  topPerformerName?: string;
  topPerformerPercentage?: number;
  monthsAboveGoal: number;
  bestMonthName?: string;
  bestMonthRevenue?: number;
}

interface UseIrisInsightsReturn {
  insights: AIInsight[];
  isLoading: boolean;
  error: string | null;
  fetchInsights: (data: DashboardData, selectedYear: number) => Promise<void>;
  lastUpdated: Date | null;
}

const CACHE_KEY = 'iris_insights_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedData {
  insights: AIInsight[];
  timestamp: number;
  metricsHash: string;
}

const hashMetrics = (metrics: DashboardMetrics): string => {
  return JSON.stringify({
    annualRealized: Math.round(metrics.annualRealized),
    currentMonthRevenue: Math.round(metrics.currentMonthRevenue),
    selectedYear: metrics.selectedYear,
    currentMonthName: metrics.currentMonthName,
    teamAvgPerformance: Math.round(metrics.teamAvgPerformance),
  });
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const useIrisInsights = (): UseIrisInsightsReturn => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInsights = useCallback(async (data: DashboardData, selectedYear: number) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentMonthData = data.currentYearData.find(m => Number(m.month) === currentMonth + 1) || 
      { revenue: 0, goal: 0, month: currentMonth + 1, year: selectedYear };
    
    // Calculate team metrics
    const activeTeam = data.team.filter(m => m.active && !m.isPlaceholder);
    const teamAvgPerformance = activeTeam.length > 0
      ? activeTeam.reduce((sum, m) => {
          const perf = m.monthlyGoal > 0 ? (m.totalRevenue / m.monthlyGoal) * 100 : 0;
          return sum + perf;
        }, 0) / activeTeam.length
      : 0;

    const topPerformer = activeTeam.reduce((best, m) => {
      const perf = m.monthlyGoal > 0 ? (m.totalRevenue / m.monthlyGoal) * 100 : 0;
      const bestPerf = best?.monthlyGoal ? (best.totalRevenue / best.monthlyGoal) * 100 : 0;
      return perf > bestPerf ? m : best;
    }, activeTeam[0]);

    // Calculate months above goal
    const monthsAboveGoal = data.currentYearData.filter(m => m.goal > 0 && m.revenue >= m.goal).length;

    // Find best month
    const bestMonth = data.currentYearData.reduce((best, m) => 
      m.revenue > (best?.revenue || 0) ? m : best, data.currentYearData[0]);

    // Calculate days remaining in month
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(0, lastDay - now.getDate());
    const workingDaysRemaining = Math.ceil(daysRemaining * 0.7);

    // Calculate run rate
    const daysPassed = now.getDate();
    const runRateProjection = daysPassed > 0 
      ? (currentMonthData.revenue / daysPassed) * lastDay
      : 0;

    // Build metrics object
    const metrics: DashboardMetrics = {
      annualGoal: data.kpis.annualGoal,
      annualRealized: data.kpis.annualRealized,
      lastYearGrowth: data.kpis.lastYearGrowth,
      currentMonthRevenue: currentMonthData.revenue,
      currentMonthGoal: currentMonthData.goal,
      runRateProjection,
      averageTicket: data.kpis.averageTicket,
      totalSalesCount: data.kpis.totalSalesCount,
      currentMonthName: MONTH_NAMES[currentMonth],
      gapToGoal: Math.max(0, currentMonthData.goal - currentMonthData.revenue),
      daysRemaining: workingDaysRemaining,
      selectedYear,
      conversionRate: data.kpis.conversionRate,
      ltv: data.kpis.ltv,
      cac: data.kpis.cac,
      teamSize: activeTeam.length,
      teamAvgPerformance,
      topPerformerName: topPerformer?.name,
      topPerformerPercentage: topPerformer?.monthlyGoal 
        ? (topPerformer.totalRevenue / topPerformer.monthlyGoal) * 100 
        : undefined,
      monthsAboveGoal,
      bestMonthName: bestMonth?.month ? MONTH_NAMES[Number(bestMonth.month) - 1] : undefined,
      bestMonthRevenue: bestMonth?.revenue,
    };

    const metricsHash = hashMetrics(metrics);

    // Check cache
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const cached: CachedData = JSON.parse(cachedData);
        const isValid = Date.now() - cached.timestamp < CACHE_DURATION;
        const isSameData = cached.metricsHash === metricsHash;
        
        if (isValid && isSameData && cached.insights.length > 0) {
          console.log('[useIrisInsights] Using cached insights');
          setInsights(cached.insights);
          setLastUpdated(new Date(cached.timestamp));
          return;
        }
      }
    } catch (e) {
      console.warn('[useIrisInsights] Cache read error:', e);
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: funcError } = await supabase.functions.invoke('iris-insights', {
        body: { metrics },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (response.error && !response.insights) {
        throw new Error(response.error);
      }

      const newInsights = response.insights || [];
      setInsights(newInsights);
      setLastUpdated(new Date());

      // Cache the insights
      try {
        const cacheData: CachedData = {
          insights: newInsights,
          timestamp: Date.now(),
          metricsHash,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (e) {
        console.warn('[useIrisInsights] Cache write error:', e);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao gerar insights';
      console.error('[useIrisInsights] Error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { insights, isLoading, error, fetchInsights, lastUpdated };
};

export default useIrisInsights;
