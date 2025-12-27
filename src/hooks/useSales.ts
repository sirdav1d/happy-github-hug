import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleFormData } from '@/types/sales';
import { useToast } from '@/hooks/use-toast';

interface UseSalesReturn {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
  createSale: (data: SaleFormData) => Promise<Sale | null>;
  updateSale: (id: string, data: Partial<SaleFormData>) => Promise<Sale | null>;
  deleteSale: (id: string) => Promise<boolean>;
  fetchSales: (filters?: SalesFilter) => Promise<void>;
}

export interface SalesFilter {
  startDate?: string;
  endDate?: string;
  salespersonId?: string;
  channel?: string;
}

export default function useSales(userId: string | undefined): UseSalesReturn {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSales = useCallback(async (filters?: SalesFilter) => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)
        .order('sale_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('sale_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('sale_date', filters.endDate);
      }
      if (filters?.salespersonId) {
        query = query.eq('salesperson_id', filters.salespersonId);
      }
      if (filters?.channel && (filters.channel === 'online' || filters.channel === 'presencial')) {
        query = query.eq('channel', filters.channel);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setSales((data || []) as Sale[]);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError(err.message || 'Erro ao carregar vendas');
      toast({
        title: 'Erro ao carregar vendas',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const createSale = useCallback(async (data: SaleFormData): Promise<Sale | null> => {
    if (!userId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data: newSale, error: insertError } = await supabase
        .from('sales')
        .insert({
          user_id: userId,
          sale_date: data.sale_date,
          amount: data.amount,
          salesperson_id: data.salesperson_id,
          salesperson_name: data.salesperson_name,
          channel: data.channel,
          client_id: data.client_id || null,
          client_name: data.client_name || null,
          is_new_client: data.is_new_client,
          acquisition_cost: data.acquisition_cost || 0,
          lead_source: data.lead_source || null,
          product_service: data.product_service || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const typedSale = newSale as Sale;
      setSales(prev => [typedSale, ...prev]);
      
      toast({
        title: 'Venda registrada!',
        description: `R$ ${data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por ${data.salesperson_name}`,
      });

      return typedSale;
    } catch (err: any) {
      console.error('Error creating sale:', err);
      setError(err.message || 'Erro ao registrar venda');
      toast({
        title: 'Erro ao registrar venda',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const updateSale = useCallback(async (id: string, data: Partial<SaleFormData>): Promise<Sale | null> => {
    if (!userId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data: updatedSale, error: updateError } = await supabase
        .from('sales')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      const typedSale = updatedSale as Sale;
      setSales(prev => prev.map(s => s.id === id ? typedSale : s));
      
      toast({
        title: 'Venda atualizada!',
      });

      return typedSale;
    } catch (err: any) {
      console.error('Error updating sale:', err);
      setError(err.message || 'Erro ao atualizar venda');
      toast({
        title: 'Erro ao atualizar venda',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const deleteSale = useCallback(async (id: string): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      setSales(prev => prev.filter(s => s.id !== id));
      
      toast({
        title: 'Venda removida!',
      });

      return true;
    } catch (err: any) {
      console.error('Error deleting sale:', err);
      setError(err.message || 'Erro ao remover venda');
      toast({
        title: 'Erro ao remover venda',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (userId) {
      fetchSales();
    }
  }, [userId, fetchSales]);

  return {
    sales,
    isLoading,
    error,
    createSale,
    updateSale,
    deleteSale,
    fetchSales,
  };
}
