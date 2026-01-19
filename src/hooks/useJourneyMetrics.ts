import { useMemo } from 'react';
import { DashboardData } from '@/types';
import { JourneyMetrics, MonthlyMilestone, Achievement, ACHIEVEMENTS_CONFIG } from '@/types/mentorship';

interface UseJourneyMetricsProps {
  data: DashboardData;
  selectedMonth: number;
  selectedYear: number;
  salesByMonth?: { month: number; year: number; revenue: number }[];
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const parseDateOnly = (dateStr: string): Date => {
  // Evita bug de fuso: "YYYY-MM-DD" é interpretado como UTC e pode voltar 1 dia.
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const useJourneyMetrics = ({ data, selectedMonth, selectedYear, salesByMonth }: UseJourneyMetricsProps): JourneyMetrics | null => {
  return useMemo(() => {
    if (!data.mentorshipStartDate) return null;

    const startDate = parseDateOnly(data.mentorshipStartDate);
    const startMonth = startDate.getMonth(); // 0-indexed
    const startYear = startDate.getFullYear();
    const durationMonths = 6; // Padrão

    // Usar data real do sistema para calcular mês atual da jornada
    const now = new Date();
    const actualCurrentYear = now.getFullYear();
    const actualCurrentMonth = now.getMonth(); // 0-indexed

    // Calcular posição atual na jornada baseado na data real
    const monthsElapsed = (actualCurrentYear - startYear) * 12 + (actualCurrentMonth - startMonth) + 1;
    const currentJourneyMonth = Math.max(1, Math.min(monthsElapsed, durationMonths));
    const remainingMonths = Math.max(0, durationMonths - monthsElapsed);
    const journeyPercent = Math.min(100, (Math.min(monthsElapsed, durationMonths) / durationMonths) * 100);
    const isComplete = monthsElapsed > durationMonths;

    // Função para buscar dados consolidados de múltiplas fontes
    // REGRA: usa o MAIOR valor entre planilha e lançamentos (dado mais completo do mês)
    const getRevenueForMonth = (calendarMonthIndex: number, calendarYear: number): { 
      revenue: number; 
      goal: number; 
      source: 'planilha' | 'lançamentos' | 'nenhum';
      spreadsheetRevenue: number;
      salesRevenue: number;
    } => {
      const monthName = MONTH_NAMES[calendarMonthIndex];
      
      // Buscar dados da planilha (currentYearData ou historicalData)
      let spreadsheetRevenue = 0;
      let spreadsheetGoal = 0;
      
      const currentYearMatch = data.currentYearData.find(
        d => d.month === monthName && d.year === calendarYear
      );
      if (currentYearMatch) {
        spreadsheetRevenue = currentYearMatch.revenue || 0;
        spreadsheetGoal = currentYearMatch.goal || 0;
      } else {
        const historicalMatch = data.historicalData.find(
          d => d.month === monthName && d.year === calendarYear
        );
        if (historicalMatch) {
          spreadsheetRevenue = historicalMatch.revenue || 0;
          spreadsheetGoal = historicalMatch.goal || 0;
        }
      }

      // Buscar dados de lançamentos (sales)
      let salesRevenue = 0;
      if (salesByMonth) {
        const salesData = salesByMonth.find(
          s => s.month === calendarMonthIndex + 1 && s.year === calendarYear
        );
        if (salesData) {
          salesRevenue = salesData.revenue || 0;
        }
      }

      // Determinar origem
      const hasSpreadsheet = spreadsheetRevenue > 0;
      const hasSales = salesRevenue > 0;

      if (!hasSpreadsheet && !hasSales) {
        return { revenue: 0, goal: spreadsheetGoal, source: 'nenhum', spreadsheetRevenue: 0, salesRevenue: 0 };
      }

      // Usar o MAIOR valor (dado mais completo do mês)
      if (spreadsheetRevenue >= salesRevenue) {
        return { revenue: spreadsheetRevenue, goal: spreadsheetGoal, source: 'planilha', spreadsheetRevenue, salesRevenue };
      } else {
        return { revenue: salesRevenue, goal: spreadsheetGoal, source: 'lançamentos', spreadsheetRevenue, salesRevenue };
      }
    };

    // Construir milestones para cada mês da jornada
    const milestones: MonthlyMilestone[] = [];
    let monthsWithGoalMet = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let previousRevenue = 0;
    let firstMonthRevenue = 0;
    let biggestLeap: JourneyMetrics['biggestLeap'] = null;
    let bestMonth: JourneyMetrics['bestMonth'] = null;
    const revenues: number[] = [];

    for (let i = 0; i < durationMonths; i++) {
      const journeyMonthNumber = i + 1;
      const calendarMonthIndex = (startMonth + i) % 12;
      const calendarYear = startYear + Math.floor((startMonth + i) / 12);
      const calendarMonthName = MONTH_NAMES[calendarMonthIndex];

      // CORREÇÃO 3: Buscar dados consolidados com transparência
      const { revenue, goal, source, spreadsheetRevenue, salesRevenue } = getRevenueForMonth(calendarMonthIndex, calendarYear);

      const goalMet = goal > 0 && revenue >= goal;
      const progressPercent = goal > 0 ? (revenue / goal) * 100 : 0;

      // CORREÇÃO 4: Determinar status baseado na data real do sistema
      let status: MonthlyMilestone['status'] = 'upcoming';
      
      // Verificar se este mês da jornada já passou ou é o atual
      const milestoneDate = new Date(calendarYear, calendarMonthIndex, 1);
      const currentMonthDate = new Date(actualCurrentYear, actualCurrentMonth, 1);
      
      if (milestoneDate < currentMonthDate) {
        status = 'completed';
      } else if (milestoneDate.getTime() === currentMonthDate.getTime()) {
        status = isComplete ? 'completed' : 'current';
      }

      // Calcular crescimento
      let growthFromPrevious: number | undefined;
      if (previousRevenue > 0 && revenue > 0 && status !== 'upcoming') {
        growthFromPrevious = ((revenue - previousRevenue) / previousRevenue) * 100;
        
        // Verificar maior salto
        if (!biggestLeap || (growthFromPrevious > biggestLeap.growth)) {
          biggestLeap = {
            fromMonth: MONTH_NAMES[(calendarMonthIndex - 1 + 12) % 12],
            toMonth: calendarMonthName,
            growth: growthFromPrevious,
          };
        }
      }

      // Rastrear métricas apenas para meses já passados ou atual
      if (status === 'completed' || status === 'current') {
        if (goalMet) {
          monthsWithGoalMet++;
          tempStreak++;
          currentStreak = tempStreak;
        } else if (revenue > 0) {
          tempStreak = 0;
        }
        bestStreak = Math.max(bestStreak, tempStreak);

        if (i === 0) firstMonthRevenue = revenue;
        if (revenue > 0) revenues.push(revenue);

        // Melhor mês
        if (!bestMonth || revenue > bestMonth.revenue) {
          bestMonth = {
            month: calendarMonthName,
            revenue,
            growth: growthFromPrevious || 0,
          };
        }
      }

      if (status !== 'upcoming') {
        previousRevenue = revenue;
      }

      milestones.push({
        month: journeyMonthNumber,
        monthName: `Mês ${journeyMonthNumber}`,
        year: calendarYear,
        calendarMonth: calendarMonthName,
        goalMet,
        progressPercent,
        revenue,
        goal,
        status,
        growthFromPrevious,
        source,
        spreadsheetRevenue,
        salesRevenue,
      });
    }

    // Calcular consistência (coeficiente de variação)
    const avgRevenue = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;
    const variance = revenues.length > 1
      ? revenues.reduce((sum, r) => sum + Math.pow(r - avgRevenue, 2), 0) / revenues.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const varianceCoefficient = avgRevenue > 0 ? (stdDev / avgRevenue) * 100 : 0;
    
    // Score de consistência: menor variância = maior score (invertido e normalizado)
    const consistencyScore = Math.max(0, Math.min(100, 100 - varianceCoefficient));

    // Crescimento desde o início
    const latestRevenue = revenues[revenues.length - 1] || 0;
    const growthSinceStart = firstMonthRevenue > 0
      ? ((latestRevenue - firstMonthRevenue) / firstMonthRevenue) * 100
      : 0;

    // Crescimento médio mensal
    const monthlyGrowths = milestones
      .filter(m => m.growthFromPrevious !== undefined && m.status !== 'upcoming')
      .map(m => m.growthFromPrevious!);
    const averageMonthlyGrowth = monthlyGrowths.length > 0
      ? monthlyGrowths.reduce((a, b) => a + b, 0) / monthlyGrowths.length
      : 0;

    // Projeção para o final da jornada
    const completedMonths = milestones.filter(m => m.status === 'completed').length;
    const projectedEndResult = avgRevenue > 0 
      ? avgRevenue * (1 + averageMonthlyGrowth / 100) ** (durationMonths - completedMonths)
      : latestRevenue;
    
    const projectedTotalGrowth = firstMonthRevenue > 0
      ? ((projectedEndResult - firstMonthRevenue) / firstMonthRevenue) * 100
      : 0;

    // Probabilidade de sucesso baseada em performance histórica
    const probabilityOfSuccess = Math.min(100, 
      (monthsWithGoalMet / Math.max(1, completedMonths)) * 100 * 
      (1 + consistencyScore / 200) // Bônus por consistência
    );

    return {
      currentMonth: currentJourneyMonth,
      totalMonths: durationMonths,
      remainingMonths,
      journeyPercent,
      isComplete,
      monthsWithGoalMet,
      consecutiveGoalsMet: currentStreak,
      bestStreak,
      growthSinceStart,
      averageMonthlyGrowth,
      bestMonth,
      biggestLeap: biggestLeap && biggestLeap.growth > 0 ? biggestLeap : null,
      consistencyScore,
      varianceCoefficient,
      projectedEndResult,
      projectedTotalGrowth,
      probabilityOfSuccess,
      milestones,
    };
  }, [data, selectedMonth, selectedYear, salesByMonth]);
};

export const useAchievements = (metrics: JourneyMetrics | null): Achievement[] => {
  return useMemo(() => {
    if (!metrics) return ACHIEVEMENTS_CONFIG.map(a => ({ ...a, isUnlocked: false }));

    return ACHIEVEMENTS_CONFIG.map(achievement => {
      let isUnlocked = false;

      switch (achievement.requirement.type) {
        case 'goals_met':
          isUnlocked = metrics.monthsWithGoalMet >= achievement.requirement.value;
          break;
        case 'streak':
          isUnlocked = metrics.bestStreak >= achievement.requirement.value;
          break;
        case 'growth_percent':
          if (achievement.id === 'growth_25') {
            // Crescimento em um único mês
            isUnlocked = metrics.milestones.some(
              m => m.growthFromPrevious !== undefined && m.growthFromPrevious >= 25
            );
          } else if (achievement.id === 'growth_50') {
            // Crescimento total desde o início
            isUnlocked = metrics.growthSinceStart >= 50;
          }
          break;
        case 'perfect_month':
          isUnlocked = metrics.milestones.some(m => m.progressPercent >= 120);
          break;
        case 'comeback':
          // Verifica se bateu meta depois de não bater
          for (let i = 1; i < metrics.milestones.length; i++) {
            const prev = metrics.milestones[i - 1];
            const curr = metrics.milestones[i];
            if (!prev.goalMet && curr.goalMet && prev.status === 'completed' && curr.status !== 'upcoming') {
              isUnlocked = true;
              break;
            }
          }
          break;
        case 'journey_complete':
          isUnlocked = metrics.isComplete;
          break;
      }

      return {
        ...achievement,
        isUnlocked,
        unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
      };
    });
  }, [metrics]);
};

export default useJourneyMetrics;
