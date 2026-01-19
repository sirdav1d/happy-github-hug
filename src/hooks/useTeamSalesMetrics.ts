import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeName, namesMatch } from '@/lib/utils';

export interface SalespersonMetrics {
  salespersonId: string;
  salespersonName: string;
  normalizedName: string;
  totalRevenue: number;
  salesCount: number;
  attendances: number;
  averageTicket: number;
  conversionRate: number;
}

export const useTeamSalesMetrics = (month?: number, year?: number) => {
  const { user } = useAuth();

  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['team-sales-metrics', user?.id, month, year],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[useTeamSalesMetrics] No user id');
        return [];
      }
      
      console.log('[useTeamSalesMetrics] Fetching for user:', user.id, 'month:', month, 'year:', year);
      
      let query = supabase
        .from('sales')
        .select('salesperson_id, salesperson_name, amount, sales_count, attendances, sale_date')
        .eq('user_id', user.id);
      
      // Filtrar por período se mês e ano forem fornecidos
      if (month && year) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
        
        console.log('[useTeamSalesMetrics] Date range:', startDate, 'to', endDate);
        query = query.gte('sale_date', startDate).lt('sale_date', endDate);
      }
      
      const { data, error } = await query;
      
      console.log('[useTeamSalesMetrics] Result:', data?.length, 'records, error:', error);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Log error if any
  if (error) {
    console.error('[useTeamSalesMetrics] Query error:', error);
  }

  const metrics = useMemo<SalespersonMetrics[]>(() => {
    if (!salesData || salesData.length === 0) return [];

    // Agrupar vendas por vendedor usando nome normalizado como chave alternativa
    // Isso permite parear vendedores mesmo com IDs diferentes mas nomes iguais
    const grouped = salesData.reduce((acc, sale) => {
      // Usar salesperson_id como chave primária
      const key = sale.salesperson_id;
      const normalized = normalizeName(sale.salesperson_name);
      
      if (!acc[key]) {
        acc[key] = {
          salespersonId: sale.salesperson_id,
          salespersonName: sale.salesperson_name,
          normalizedName: normalized,
          totalRevenue: 0,
          salesCount: 0,
          attendances: 0,
        };
      }
      acc[key].totalRevenue += Number(sale.amount || 0);
      acc[key].salesCount += Number(sale.sales_count || 1);
      acc[key].attendances += Number(sale.attendances || 0);
      return acc;
    }, {} as Record<string, Omit<SalespersonMetrics, 'averageTicket' | 'conversionRate'>>);

    // Calcular métricas derivadas
    return Object.values(grouped).map((sp) => ({
      ...sp,
      averageTicket: sp.salesCount > 0 ? sp.totalRevenue / sp.salesCount : 0,
      conversionRate: sp.attendances > 0 ? (sp.salesCount / sp.attendances) * 100 : 0,
    }));
  }, [salesData]);

  /**
   * Busca métricas para um vendedor usando matching robusto:
   * 1. Match por ID exato
   * 2. Match por nome normalizado
   */
  const getMetricsForSalesperson = (salespersonId: string, salespersonName?: string): SalespersonMetrics | undefined => {
    // 1. Tentar match por ID exato
    const byId = metrics.find((m) => m.salespersonId === salespersonId);
    if (byId) return byId;
    
    // 2. Se temos o nome, tentar match por nome
    if (salespersonName) {
      const byName = metrics.find((m) => namesMatch(m.salespersonName, salespersonName));
      if (byName) return byName;
    }
    
    return undefined;
  };

  return {
    metrics,
    isLoading,
    getMetricsForSalesperson,
  };
};

export default useTeamSalesMetrics;
