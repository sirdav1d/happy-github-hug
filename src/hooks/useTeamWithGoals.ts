import { useMemo } from 'react';
import { useSalespeople, Salesperson as DBSalesperson } from './useSalespeople';
import { useGoalCalculation, CalculatedGoal } from './useGoalCalculation';
import { Salesperson as LegacySalesperson } from '@/types';

// Unified salesperson type that combines DB data with calculated goals
export interface TeamMemberWithGoal {
  // From DB
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  tenureMonths: number;
  
  // Calculated goals
  monthlyGoal: number;
  weeklyGoal: number;
  dailyGoal: number;
  ruleApplied: string;
  isRampUp: boolean;
  rampUpPercent?: number;
  
  // Legacy compatibility
  totalRevenue: number;
  weeks: { week: number; revenue: number; goal: number }[];
  active: boolean;
  isPlaceholder: boolean;
  totalSalesCount: number;
  totalAttendances?: number;
}

interface UseTeamWithGoalsParams {
  month: number;
  year: number;
  weeksInMonth?: number;
  teamMonthlyGoal?: number;
  legacyTeam?: LegacySalesperson[]; // Fallback to legacy data
  useLegacyFallback?: boolean;
}

export function useTeamWithGoals(params: UseTeamWithGoalsParams) {
  const {
    month,
    year,
    weeksInMonth = 4,
    teamMonthlyGoal = 0,
    legacyTeam = [],
    useLegacyFallback = true,
  } = params;

  const { activeSalespeople, salespeople, getTenure, isLoading } = useSalespeople();
  const { calculateTeamGoals } = useGoalCalculation();

  // Calculate goals for DB-based team
  const calculatedGoals = useMemo(() => {
    if (activeSalespeople.length === 0) return [];
    
    return calculateTeamGoals({
      month,
      year,
      weeksInMonth,
      teamMonthlyGoal: teamMonthlyGoal > 0 ? teamMonthlyGoal : undefined,
    });
  }, [activeSalespeople, calculateTeamGoals, month, year, weeksInMonth, teamMonthlyGoal]);

  // Map to unified team structure
  const team = useMemo((): TeamMemberWithGoal[] => {
    // Prefer DB salespeople if available
    if (activeSalespeople.length > 0) {
      return activeSalespeople.map(salesperson => {
        const goal = calculatedGoals.find(g => g.salespersonId === salesperson.id);
        const tenure = getTenure(salesperson);
        
        return {
          id: salesperson.id,
          name: salesperson.name,
          email: salesperson.email,
          phone: salesperson.phone,
          avatar: salesperson.avatar_url || '',
          hireDate: salesperson.hire_date,
          status: salesperson.status,
          tenureMonths: tenure,
          monthlyGoal: goal?.monthlyGoal || 0,
          weeklyGoal: goal?.weeklyGoal || 0,
          dailyGoal: goal?.dailyGoal || 0,
          ruleApplied: goal?.ruleApplied || 'Distribuição igual',
          isRampUp: goal?.isRampUp || false,
          rampUpPercent: goal?.rampUpPercent,
          totalRevenue: 0, // Will be filled by sales data
          weeks: [],
          active: salesperson.status === 'active',
          isPlaceholder: false,
          totalSalesCount: 0,
          totalAttendances: 0,
        };
      });
    }

    // Fallback to legacy team if allowed
    if (useLegacyFallback && legacyTeam.length > 0) {
      return legacyTeam
        .filter(t => t.active && !t.isPlaceholder)
        .map(legacy => ({
          id: legacy.id,
          name: legacy.name,
          email: null,
          phone: null,
          avatar: legacy.avatar || '',
          hireDate: new Date().toISOString().split('T')[0],
          status: 'active' as const,
          tenureMonths: 12, // Assume experienced
          monthlyGoal: legacy.monthlyGoal || teamMonthlyGoal / legacyTeam.length,
          weeklyGoal: (legacy.monthlyGoal || teamMonthlyGoal / legacyTeam.length) / weeksInMonth,
          dailyGoal: (legacy.monthlyGoal || teamMonthlyGoal / legacyTeam.length) / weeksInMonth / 5,
          ruleApplied: 'Dados legados',
          isRampUp: false,
          totalRevenue: legacy.totalRevenue || 0,
          weeks: legacy.weeks || [],
          active: true,
          isPlaceholder: false,
          totalSalesCount: legacy.totalSalesCount || 0,
          totalAttendances: legacy.totalAttendances,
        }));
    }

    return [];
  }, [
    activeSalespeople,
    calculatedGoals,
    getTenure,
    legacyTeam,
    useLegacyFallback,
    teamMonthlyGoal,
    weeksInMonth,
  ]);

  // Summary stats
  const summary = useMemo(() => {
    const activeCount = team.filter(t => t.active).length;
    const totalMonthlyGoal = team.reduce((sum, t) => sum + t.monthlyGoal, 0);
    const rampUpCount = team.filter(t => t.isRampUp).length;

    return {
      activeCount,
      totalMonthlyGoal,
      totalWeeklyGoal: team.reduce((sum, t) => sum + t.weeklyGoal, 0),
      averageGoal: activeCount > 0 ? totalMonthlyGoal / activeCount : 0,
      rampUpCount,
      isUsingLegacy: activeSalespeople.length === 0 && legacyTeam.length > 0,
      needsMigration: activeSalespeople.length === 0 && legacyTeam.length > 0,
    };
  }, [team, activeSalespeople, legacyTeam]);

  return {
    team,
    summary,
    isLoading,
    rawSalespeople: salespeople,
    activeSalespeople,
    calculatedGoals,
  };
}
