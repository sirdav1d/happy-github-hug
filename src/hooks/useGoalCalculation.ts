import { useMemo, useCallback } from 'react';
import { useSalespeople, Salesperson } from './useSalespeople';
import { useHistoricalSales } from './useHistoricalSales';

export interface CalculatedGoal {
  salespersonId: string;
  salespersonName: string;
  monthlyGoal: number;
  weeklyGoal: number;
  dailyGoal: number;
  ruleApplied: string;
  isRampUp: boolean;
  rampUpPercent?: number;
  tenureMonths: number;
}

interface GoalCalculationParams {
  month: number;
  year: number;
  weeksInMonth?: number;
  workingDaysPerWeek?: number;
  teamMonthlyGoal?: number; // Optional override, otherwise calculated from historical +15%
}

// Ramp-up configuration for new hires
const RAMP_UP_CONFIG = {
  month1Percent: 50,  // First month: 50% of goal
  month2Percent: 75,  // Second month: 75% of goal
  month3Percent: 100, // Third month onwards: 100%
};

// Growth percentage over previous year
const GROWTH_PERCENTAGE = 15;

export function useGoalCalculation() {
  const { salespeople, activeSalespeople, getTenure } = useSalespeople();
  const { getPreviousYearMonthlyRevenue, isLoading: historicalLoading } = useHistoricalSales();

  // Get month name in Portuguese
  const getMonthName = useCallback((month: number): string => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || '';
  }, []);

  // Calculate ramp-up multiplier for new hires based on tenure
  const calculateRampUpMultiplier = useCallback((
    tenureMonths: number
  ): { multiplier: number; isRampUp: boolean; percent: number } => {
    if (tenureMonths >= 3) {
      return { multiplier: 1, isRampUp: false, percent: 100 };
    }

    if (tenureMonths < 1) {
      return { 
        multiplier: RAMP_UP_CONFIG.month1Percent / 100, 
        isRampUp: true, 
        percent: RAMP_UP_CONFIG.month1Percent 
      };
    }

    if (tenureMonths < 2) {
      return { 
        multiplier: RAMP_UP_CONFIG.month2Percent / 100, 
        isRampUp: true, 
        percent: RAMP_UP_CONFIG.month2Percent 
      };
    }

    // 2-3 months
    return { 
      multiplier: RAMP_UP_CONFIG.month3Percent / 100, 
      isRampUp: true, 
      percent: RAMP_UP_CONFIG.month3Percent 
    };
  }, []);

  // Calculate team monthly goal based on historical data +15% ONLY
  // Não usa mais meta anual como fallback - única regra é histórico +15%
  const calculateTeamMonthlyGoal = useCallback((
    month: number,
    year: number
  ): { goal: number; source: 'historical' | 'no_data'; previousYearRevenue: number } => {
    // ÚNICA REGRA: Check previous year's revenue for this month
    const previousYearRevenue = getPreviousYearMonthlyRevenue(year, month);
    
    if (previousYearRevenue > 0) {
      const goal = previousYearRevenue * (1 + GROWTH_PERCENTAGE / 100);
      return { goal, source: 'historical', previousYearRevenue };
    }
    
    // Sem histórico = sem meta automática
    return { goal: 0, source: 'no_data', previousYearRevenue: 0 };
  }, [getPreviousYearMonthlyRevenue]);

  // Calculate goal for a single salesperson
  const calculateSalespersonGoal = useCallback((
    salesperson: Salesperson,
    params: GoalCalculationParams
  ): CalculatedGoal => {
    const {
      month,
      year,
      weeksInMonth = 4,
      workingDaysPerWeek = 5,
      teamMonthlyGoal,
    } = params;

    const tenureMonths = getTenure(salesperson);
    
    // Get the base monthly goal: override or calculated from historical +15%
    const calculatedGoal = calculateTeamMonthlyGoal(month, year);
    const totalMonthlyGoal = teamMonthlyGoal ?? calculatedGoal.goal;
    const activeSalespeopleCount = activeSalespeople.length || 1;
    
    // Base goal per salesperson (equal distribution)
    const baseGoalPerPerson = totalMonthlyGoal / activeSalespeopleCount;

    // If salesperson has a fixed override value, use it
    if (salesperson.goal_override_value && salesperson.goal_override_value > 0) {
      // Apply ramp-up even to override values
      const rampUp = calculateRampUpMultiplier(tenureMonths);
      const monthlyGoal = salesperson.goal_override_value * rampUp.multiplier;
      
      return {
        salespersonId: salesperson.id,
        salespersonName: salesperson.name,
        monthlyGoal,
        weeklyGoal: monthlyGoal / weeksInMonth,
        dailyGoal: monthlyGoal / weeksInMonth / workingDaysPerWeek,
        ruleApplied: rampUp.isRampUp 
          ? `Valor fixo (${rampUp.percent}% ramp-up)` 
          : 'Valor fixo',
        isRampUp: rampUp.isRampUp,
        rampUpPercent: rampUp.isRampUp ? rampUp.percent : undefined,
        tenureMonths,
      };
    }

    // If salesperson has a percentage override
    if (salesperson.goal_override_percent && salesperson.goal_override_percent > 0) {
      const rampUp = calculateRampUpMultiplier(tenureMonths);
      const percentageGoal = baseGoalPerPerson * (salesperson.goal_override_percent / 100);
      const monthlyGoal = percentageGoal * rampUp.multiplier;
      
      return {
        salespersonId: salesperson.id,
        salespersonName: salesperson.name,
        monthlyGoal,
        weeklyGoal: monthlyGoal / weeksInMonth,
        dailyGoal: monthlyGoal / weeksInMonth / workingDaysPerWeek,
        ruleApplied: rampUp.isRampUp 
          ? `${salesperson.goal_override_percent}% da base (${rampUp.percent}% ramp-up)`
          : `${salesperson.goal_override_percent}% da base`,
        isRampUp: rampUp.isRampUp,
        rampUpPercent: rampUp.isRampUp ? rampUp.percent : undefined,
        tenureMonths,
      };
    }

    // Standard distribution: equal share with ramp-up
    const rampUp = calculateRampUpMultiplier(tenureMonths);
    const monthlyGoal = baseGoalPerPerson * rampUp.multiplier;

    return {
      salespersonId: salesperson.id,
      salespersonName: salesperson.name,
      monthlyGoal,
      weeklyGoal: monthlyGoal / weeksInMonth,
      dailyGoal: monthlyGoal / weeksInMonth / workingDaysPerWeek,
      ruleApplied: rampUp.isRampUp 
        ? `Distribuição igual (${rampUp.percent}% ramp-up)` 
        : 'Distribuição igual',
      isRampUp: rampUp.isRampUp,
      rampUpPercent: rampUp.isRampUp ? rampUp.percent : undefined,
      tenureMonths,
    };
  }, [
    getTenure,
    calculateTeamMonthlyGoal,
    activeSalespeople,
    calculateRampUpMultiplier,
  ]);

  // Calculate goals for all active salespeople
  const calculateTeamGoals = useCallback((
    params: GoalCalculationParams
  ): CalculatedGoal[] => {
    return activeSalespeople.map(salesperson =>
      calculateSalespersonGoal(salesperson, params)
    );
  }, [activeSalespeople, calculateSalespersonGoal]);

  // Get summary of team goals
  const getTeamGoalSummary = useCallback((
    params: GoalCalculationParams
  ) => {
    const goals = calculateTeamGoals(params);
    const totalMonthlyGoal = goals.reduce((sum, g) => sum + g.monthlyGoal, 0);
    const totalWeeklyGoal = goals.reduce((sum, g) => sum + g.weeklyGoal, 0);
    const rampUpCount = goals.filter(g => g.isRampUp).length;

    return {
      goals,
      totalMonthlyGoal,
      totalWeeklyGoal,
      totalDailyGoal: goals.reduce((sum, g) => sum + g.dailyGoal, 0),
      activeSalespeopleCount: activeSalespeople.length,
      rampUpCount,
      averageGoal: totalMonthlyGoal / (activeSalespeople.length || 1),
    };
  }, [calculateTeamGoals, activeSalespeople]);

  return {
    calculateSalespersonGoal,
    calculateTeamGoals,
    getTeamGoalSummary,
    calculateTeamMonthlyGoal,
    activeSalespeople,
    salespeople,
    isLoading: historicalLoading,
    GROWTH_PERCENTAGE,
  };
}
