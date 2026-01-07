import React, { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Filter, Calendar, Plus, Layers, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import useSales from '@/hooks/useSales';
import useClients from '@/hooks/useClients';
import SaleForm from './sales/SaleForm';
import SaleBatchForm from './sales/SaleBatchForm';
import SalesImportWizard from './sales/SalesImportWizard';
import SalesList from './sales/SalesList';
import SalesStats from './sales/SalesStats';
import { Salesperson } from '@/types';
import { EntryType, ENTRY_TYPE_OPTIONS } from '@/types/sales';
import { useToast } from '@/hooks/use-toast';

interface SalesEntryViewProps {
  team: Salesperson[];
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

const SalesEntryView: React.FC<SalesEntryViewProps> = ({ team }) => {
  const { user } = useAuth();
  const { sales, isLoading: salesLoading, createSale, createBatchSales, deleteSale } = useSales(user?.id);
  const { clients, createClient } = useClients(user?.id);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | EntryType>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    await createSale({ ...data, entry_type: 'individual' });
    setIsSubmitting(false);
  };

  const handleCreateClient = async (name: string) => {
    return createClient({ name });
  };

  const handleBatchSubmit = async (entries: { salesperson_id: string; salesperson_name: string; amount: number; sale_date: string; entry_type: EntryType }[]) => {
    setIsSubmitting(true);
    const success = await createBatchSales(entries);
    if (success) {
      toast({
        title: 'Vendas em lote registradas!',
        description: `${entries.length} registro(s) criado(s) com sucesso.`,
      });
    }
    setIsSubmitting(false);
  };

  const handleImportSubmit = async (entries: { salesperson_id: string; salesperson_name: string; amount: number; sale_date: string; entry_type: EntryType }[]) => {
    setIsSubmitting(true);
    const success = await createBatchSales(entries);
    if (success) {
      toast({
        title: 'Importação concluída!',
        description: `${entries.length} registro(s) importado(s) com sucesso.`,
      });
    }
    setIsSubmitting(false);
  };

  const filteredSales = useMemo(() => {
    const today = new Date();
    let result = sales;
    
    // Apply period filter
    switch (periodFilter) {
      case 'today':
        const todayStr = format(today, 'yyyy-MM-dd');
        result = result.filter(s => s.sale_date === todayStr);
        break;
      
      case 'week':
        const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        result = result.filter(s => s.sale_date >= weekStart && s.sale_date <= weekEnd);
        break;
      
      case 'month':
        const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
        result = result.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd);
        break;
      
      case 'all':
      default:
        break;
    }

    // Apply entry type filter
    if (entryTypeFilter !== 'all') {
      result = result.filter(s => s.entry_type === entryTypeFilter);
    }

    return result;
  }, [sales, periodFilter, entryTypeFilter]);

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
            Registre vendas individuais, em lote ou importe histórico
          </p>
        </div>
      </div>

      {/* Tabs for different entry methods */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
        <Tabs defaultValue="individual" className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="individual" className="flex items-center gap-2 py-3">
                <Plus size={16} />
                <span className="hidden sm:inline">Venda Individual</span>
                <span className="sm:hidden">Individual</span>
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2 py-3">
                <Layers size={16} />
                <span className="hidden sm:inline">Lançamento em Lote</span>
                <span className="sm:hidden">Lote</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2 py-3">
                <Upload size={16} />
                <span className="hidden sm:inline">Importar Histórico</span>
                <span className="sm:hidden">Importar</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="pt-6">
            <TabsContent value="individual" className="mt-0 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b border-border/50">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Registre vendas conforme elas acontecem
              </div>
              <SaleForm
                team={team}
                clients={clients}
                onSubmit={handleSubmit}
                onCreateClient={handleCreateClient}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
            
            <TabsContent value="batch" className="mt-0 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b border-border/50">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Lance valores agregados por semana ou mês
              </div>
              <SaleBatchForm
                team={team}
                onSubmit={handleBatchSubmit}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
            
            <TabsContent value="import" className="mt-0 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b border-border/50">
                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                Importe dados históricos de anos anteriores
              </div>
              <SalesImportWizard
                team={team}
                onSubmit={handleImportSubmit}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
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
            
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={entryTypeFilter} onValueChange={(v) => setEntryTypeFilter(v as 'all' | EntryType)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {ENTRY_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
