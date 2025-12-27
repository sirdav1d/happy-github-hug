import React, { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import useSales from '@/hooks/useSales';
import useClients from '@/hooks/useClients';
import SaleForm from './sales/SaleForm';
import SalesList from './sales/SalesList';
import SalesStats from './sales/SalesStats';
import { Salesperson } from '@/types';

interface SalesEntryViewProps {
  team: Salesperson[];
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

const SalesEntryView: React.FC<SalesEntryViewProps> = ({ team }) => {
  const { user } = useAuth();
  const { sales, isLoading: salesLoading, createSale, deleteSale } = useSales(user?.id);
  const { clients, createClient } = useClients(user?.id);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    await createSale(data);
    setIsSubmitting(false);
  };

  const handleCreateClient = async (name: string) => {
    return createClient({ name });
  };

  const filteredSales = useMemo(() => {
    const today = new Date();
    
    switch (periodFilter) {
      case 'today':
        const todayStr = format(today, 'yyyy-MM-dd');
        return sales.filter(s => s.sale_date === todayStr);
      
      case 'week':
        const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        return sales.filter(s => s.sale_date >= weekStart && s.sale_date <= weekEnd);
      
      case 'month':
        const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
        return sales.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd);
      
      case 'all':
      default:
        return sales;
    }
  }, [sales, periodFilter]);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
      case 'all': return 'Todas as Vendas';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <DollarSign className="text-emerald-500" size={28} />
            </div>
            Entrada de Vendas
          </h1>
          <p className="text-muted-foreground mt-1">
            Registre vendas e acompanhe os resultados em tempo real
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Nova Venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SaleForm
            team={team}
            clients={clients}
            onSubmit={handleSubmit}
            onCreateClient={handleCreateClient}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <SalesStats sales={filteredSales} periodLabel={getPeriodLabel()} />

      {/* Sales List */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Vendas Recentes
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SalesList
            sales={filteredSales}
            isLoading={salesLoading}
            onDelete={deleteSale}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesEntryView;
