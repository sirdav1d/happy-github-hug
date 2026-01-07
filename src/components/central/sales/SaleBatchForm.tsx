import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Layers, Calculator, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Salesperson } from '@/types';
import { BatchSaleEntry, EntryType } from '@/types/sales';

interface SaleBatchFormProps {
  team: Salesperson[];
  onSubmit: (entries: { salesperson_id: string; salesperson_name: string; amount: number; sale_date: string; entry_type: EntryType }[]) => Promise<void>;
  isSubmitting: boolean;
}

const MONTHS = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

const SaleBatchForm: React.FC<SaleBatchFormProps> = ({ team, onSubmit, isSubmitting }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('monthly');
  const [entries, setEntries] = useState<BatchSaleEntry[]>(() => 
    team.map(member => ({
      salesperson_id: member.id,
      salesperson_name: member.name,
    }))
  );

  // Generate year options from 2020 to current year
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = 2020; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Calculate weeks for the selected month
  const weeksInMonth = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth));
    
    const weeks = [];
    let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    let weekNumber = 1;
    
    while (isBefore(weekStart, monthEnd) || weekStart.getTime() === monthStart.getTime()) {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Only include weeks that have days in the selected month
      const effectiveStart = isBefore(weekStart, monthStart) ? monthStart : weekStart;
      const effectiveEnd = isAfter(weekEnd, monthEnd) ? monthEnd : weekEnd;
      
      weeks.push({
        number: weekNumber,
        start: effectiveStart,
        end: effectiveEnd,
        label: `${format(effectiveStart, 'dd/MM')} - ${format(effectiveEnd, 'dd/MM')}`,
      });
      
      weekStart = addWeeks(weekStart, 1);
      weekNumber++;
      
      if (weekNumber > 6) break; // Safety limit
    }
    
    return weeks;
  }, [selectedMonth, selectedYear]);

  const handleValueChange = (salespersonId: string, field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value.replace(',', '.'));
    setEntries(prev => 
      prev.map(entry => 
        entry.salesperson_id === salespersonId 
          ? { ...entry, [field]: numValue }
          : entry
      )
    );
  };

  const calculateTotal = (entry: BatchSaleEntry): number => {
    if (granularity === 'monthly') {
      return entry.monthly || 0;
    }
    return (entry.week1 || 0) + (entry.week2 || 0) + (entry.week3 || 0) + (entry.week4 || 0) + (entry.week5 || 0);
  };

  const grandTotal = useMemo(() => {
    return entries.reduce((sum, entry) => sum + calculateTotal(entry), 0);
  }, [entries, granularity]);

  const hasAnyValue = useMemo(() => {
    return entries.some(entry => calculateTotal(entry) > 0);
  }, [entries, granularity]);

  const isRetroactive = selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth);

  const handleSubmit = async () => {
    const salesToCreate: { salesperson_id: string; salesperson_name: string; amount: number; sale_date: string; entry_type: EntryType }[] = [];

    entries.forEach(entry => {
      if (granularity === 'monthly') {
        if (entry.monthly && entry.monthly > 0) {
          salesToCreate.push({
            salesperson_id: entry.salesperson_id,
            salesperson_name: entry.salesperson_name,
            amount: entry.monthly,
            sale_date: format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd'),
            entry_type: 'batch_monthly',
          });
        }
      } else {
        weeksInMonth.forEach((week, index) => {
          const weekKey = `week${index + 1}` as keyof BatchSaleEntry;
          const value = entry[weekKey] as number | undefined;
          if (value && value > 0) {
            salesToCreate.push({
              salesperson_id: entry.salesperson_id,
              salesperson_name: entry.salesperson_name,
              amount: value,
              sale_date: format(week.start, 'yyyy-MM-dd'),
              entry_type: 'batch_weekly',
            });
          }
        });
      }
    });

    if (salesToCreate.length > 0) {
      await onSubmit(salesToCreate);
      // Reset entries after successful submission
      setEntries(team.map(member => ({
        salesperson_id: member.id,
        salesperson_name: member.name,
      })));
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Selecionar Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Granularidade</Label>
              <Select value={granularity} onValueChange={(v) => setGranularity(v as 'weekly' | 'monthly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal (Valor Total)</SelectItem>
                  <SelectItem value="weekly">Semanal (Por Semana)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isRetroactive && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            Você está lançando vendas retroativas de <strong>{MONTHS[selectedMonth].label}/{selectedYear}</strong>. 
            Esses registros serão marcados como lançamento em lote.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Entry Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            Vendas por Vendedor - {MONTHS[selectedMonth].label}/{selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum vendedor cadastrado. Adicione membros à equipe primeiro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Vendedor</TableHead>
                    {granularity === 'weekly' ? (
                      weeksInMonth.map(week => (
                        <TableHead key={week.number} className="text-center min-w-[120px]">
                          Sem {week.number}
                          <br />
                          <span className="text-xs text-muted-foreground font-normal">{week.label}</span>
                        </TableHead>
                      ))
                    ) : (
                      <TableHead className="text-center min-w-[150px]">Valor Total do Mês</TableHead>
                    )}
                    <TableHead className="text-right min-w-[120px]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry.salesperson_id}>
                      <TableCell className="font-medium">{entry.salesperson_name}</TableCell>
                      {granularity === 'weekly' ? (
                        weeksInMonth.map((week, index) => (
                          <TableCell key={week.number} className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              className="text-right"
                              value={entry[`week${index + 1}` as keyof BatchSaleEntry] || ''}
                              onChange={(e) => handleValueChange(entry.salesperson_id, `week${index + 1}`, e.target.value)}
                            />
                          </TableCell>
                        ))
                      ) : (
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            className="text-right"
                            value={entry.monthly || ''}
                            onChange={(e) => handleValueChange(entry.salesperson_id, 'monthly', e.target.value)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(calculateTotal(entry))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell>TOTAL GERAL</TableCell>
                    {granularity === 'weekly' ? (
                      weeksInMonth.map(week => <TableCell key={week.number} />)
                    ) : (
                      <TableCell />
                    )}
                    <TableCell className="text-right text-lg text-primary">
                      {formatCurrency(grandTotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary and Submit */}
      <Card className="border-border/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calculator size={20} className="text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Resumo do Lançamento</p>
                <p className="text-lg font-semibold">
                  {entries.filter(e => calculateTotal(e) > 0).length} vendedor(es) • {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>
            
            <Button 
              size="lg" 
              onClick={handleSubmit}
              disabled={!hasAnyValue || isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Vendas em Lote'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleBatchForm;
