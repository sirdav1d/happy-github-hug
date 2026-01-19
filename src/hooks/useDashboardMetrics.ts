import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MonthlyData } from '@/types';
import { useHistoricalSales } from './useHistoricalSales';

interface Sale {
  id: string;
  amount: number;
  sale_date: string;
  salesperson_id: string | null;
  salesperson_name: string | null;
  sales_count: number | null;
  attendances: number | null;
}

interface DashboardMetrics {
  currentYearData: MonthlyData[];
  annualGoal: number;
  annualRealized: number;
  totalSalesCount: number;
  totalAttendances: number;
  averageTicket: number;
  conversionRate: number;
  hasRealData: boolean;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Growth percentage over previous year
const GROWTH_PERCENTAGE = 15;

export function useDashboardMetrics(year: number) {
  const { user } = useAuth();
  const { getMonthlyRevenue, isLoading: historicalLoading } = useHistoricalSales();

  // Fetch sales for the specified year
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['dashboard-metrics-sales', user?.id, year],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      const { data, error } = await supabase
        .from('sales')
        .select('id, amount, sale_date, salesperson_id, salesperson_name, sales_count, attendances')
        .eq('user_id', user.id)
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);
      
      if (error) throw error;
      return (data || []) as Sale[];
    },
    enabled: !!user?.id,
  });

  // Calculate metrics from sales data
  const metrics = useMemo((): DashboardMetrics => {
    const sales = salesData || [];
    
    // Check if we have real sales data
    const hasRealData = sales.length > 0;

    // Group sales by month
    const salesByMonth: Record<number, { revenue: number; salesCount: number; attendances: number }> = {};
    
    for (let i = 1; i <= 12; i++) {
      salesByMonth[i] = { revenue: 0, salesCount: 0, attendances: 0 };
    }

    let totalSalesCount = 0;
    let totalAttendances = 0;
    let annualRealized = 0;

    sales.forEach((sale) => {
      const saleDate = new Date(sale.sale_date);
      const month = saleDate.getMonth() + 1; // 1-12
      
      const amount = Number(sale.amount) || 0;
      const salesCount = Number(sale.sales_count) || 1;
      const attendances = Number(sale.attendances) || 0;

      salesByMonth[month].revenue += amount;
      salesByMonth[month].salesCount += salesCount;
      salesByMonth[month].attendances += attendances;

      annualRealized += amount;
      totalSalesCount += salesCount;
      totalAttendances += attendances;
    });

    // Build currentYearData array with historical-based goals ONLY
    const currentYearData: MonthlyData[] = MONTH_NAMES.map((monthName, index) => {
      const monthNumber = index + 1;
      const monthData = salesByMonth[monthNumber];
      
      // ÚNICA REGRA: Previous year same month +15%
      // Se não houver histórico, meta = 0
      const previousYearRevenue = getMonthlyRevenue(year - 1, monthNumber);
      const monthlyGoal = previousYearRevenue > 0 
        ? previousYearRevenue * (1 + GROWTH_PERCENTAGE / 100) 
        : 0;

      return {
        month: monthName,
        year: year,
        revenue: monthData.revenue,
        goal: monthlyGoal,
        // Incluir informação sobre origem da meta para exibição
        goalSource: previousYearRevenue > 0 ? 'historical' : 'no_data',
        previousYearRevenue,
      } as MonthlyData & { goalSource: string; previousYearRevenue: number };
    });

    // Calculate annual goal as sum of monthly goals (projeção)
    const annualGoal = currentYearData.reduce((sum, m) => sum + m.goal, 0);

    // Calculate KPIs
    const averageTicket = totalSalesCount > 0 ? annualRealized / totalSalesCount : 0;
    const conversionRate = totalAttendances > 0 ? (totalSalesCount / totalAttendances) * 100 : 0;

    return {
      currentYearData,
      annualGoal,
      annualRealized,
      totalSalesCount,
      totalAttendances,
      averageTicket,
      conversionRate,
      hasRealData,
    };
  }, [salesData, year, getMonthlyRevenue]);

  return {
    ...metrics,
    isLoading: salesLoading || historicalLoading,
  };
}
