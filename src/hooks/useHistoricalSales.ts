import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

interface MonthlyRevenue {
  year: number;
  month: number;
  revenue: number;
}

interface DashboardHistoricalData {
  month: string;
  year: number;
  revenue: number;
}

// Map month names to numbers
const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
  'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
};

export function useHistoricalSales() {
  const { user } = useAuth();

  // Fetch all sales from the sales table
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['historical-sales', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('sales')
        .select('amount, sale_date')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

// Fetch historical data imported from spreadsheet (dashboard_data.historical_data + current_year_data)
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-historical', user?.id],
    queryFn: async () => {
      if (!user?.id) return { historical: [], currentYear: [] };
      
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('historical_data, current_year_data')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return {
        historical: (data?.historical_data as unknown as DashboardHistoricalData[]) || [],
        currentYear: (data?.current_year_data as unknown as DashboardHistoricalData[]) || [],
      };
    },
    enabled: !!user?.id,
  });

// Combine both sources: spreadsheet data + sales table (sales table has priority)
  const monthlyRevenues = useMemo((): MonthlyRevenue[] => {
    const combined: Record<string, number> = {};

    // 1. First, add data from imported spreadsheet (dashboard_data.historical_data)
    if (dashboardData?.historical && Array.isArray(dashboardData.historical)) {
      dashboardData.historical.forEach((item) => {
        const monthNumber = MONTH_NAME_TO_NUMBER[item.month];
        if (monthNumber && item.year) {
          const key = `${item.year}-${monthNumber}`;
          combined[key] = Number(item.revenue) || 0;
        }
      });
    }

    // 2. Add data from current year (dashboard_data.current_year_data)
    // Take only the first record for each month to avoid duplicates
    if (dashboardData?.currentYear && Array.isArray(dashboardData.currentYear)) {
      const seenMonths = new Set<string>();
      dashboardData.currentYear.forEach((item) => {
        const monthNumber = MONTH_NAME_TO_NUMBER[item.month];
        if (monthNumber && item.year) {
          const key = `${item.year}-${monthNumber}`;
          // Use only the first value (which is the actual revenue)
          if (!seenMonths.has(key)) {
            combined[key] = Number(item.revenue) || 0;
            seenMonths.add(key);
          }
        }
      });
    }

    // 3. Then, add/overwrite with data from sales table (priority - more recent/accurate)
    if (salesData) {
      salesData.forEach((sale) => {
        const date = new Date(sale.sale_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        const key = `${year}-${month}`;
        
        // Sum to existing value (accumulate sales for the same month)
        combined[key] = (combined[key] || 0) + Number(sale.amount);
      });
    }

    return Object.entries(combined).map(([key, revenue]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, revenue };
    });
  }, [salesData, dashboardData]);

  // Get revenue for a specific month/year
  const getMonthlyRevenue = (year: number, month: number): number => {
    const found = monthlyRevenues.find(
      (r) => r.year === year && r.month === month
    );
    return found?.revenue || 0;
  };

  // Get previous year's revenue for a specific month
  const getPreviousYearMonthlyRevenue = (currentYear: number, month: number): number => {
    return getMonthlyRevenue(currentYear - 1, month);
  };

  // Check if we have historical data for a specific year
  const hasHistoricalData = (year: number): boolean => {
    return monthlyRevenues.some((r) => r.year === year);
  };

  // Get all months with data for a specific year
  const getYearData = (year: number): MonthlyRevenue[] => {
    return monthlyRevenues.filter((r) => r.year === year);
  };

  return {
    monthlyRevenues,
    getMonthlyRevenue,
    getPreviousYearMonthlyRevenue,
    hasHistoricalData,
    getYearData,
    isLoading: salesLoading || dashboardLoading,
  };
}
