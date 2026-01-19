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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Salesperson } from '@/types';
import { BatchSaleEntry, EntryType } from '@/types/sales';
import { cn } from '@/lib/utils';

interface BatchSaleSubmission {
  salesperson_id: string;
  salesperson_name: string;
  amount: number;
  sale_date: string;
  entry_type: EntryType;
  sales_count: number;
  attendances?: number;
}

interface SaleBatchFormProps {
  team: Salesperson[];
  onSubmit: (entries: BatchSaleSubmission[]) => Promise<void>;
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

type Granularity = 'daily' | 'weekly' | 'monthly';

const SaleBatchForm: React.FC<SaleBatchFormProps> = ({ team, onSubmit, isSubmitting }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [granularity, setGranularity] = useState<Granularity>('monthly');
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
    if (granularity === 'daily') {
      return entry.daily_amount || 0;
    }
    if (granularity === 'monthly') {
      return entry.monthly || 0;
    }
    return (entry.week1 || 0) + (entry.week2 || 0) + (entry.week3 || 0) + (entry.week4 || 0) + (entry.week5 || 0);
  };

  const calculateTotalSalesCount = (entry: BatchSaleEntry): number => {
    if (granularity === 'daily') {
      return entry.daily_sales_count || 0;
    }
    if (granularity === 'monthly') {
      return entry.monthly_sales_count || 0;
    }
    return (entry.week1_sales_count || 0) + (entry.week2_sales_count || 0) + 
           (entry.week3_sales_count || 0) + (entry.week4_sales_count || 0) + (entry.week5_sales_count || 0);
  };

  const calculateTotalAttendances = (entry: BatchSaleEntry): number => {
    if (granularity === 'daily') {
      return entry.daily_attendances || 0;
    }
    if (granularity === 'monthly') {
      return entry.monthly_attendances || 0;
    }
    return (entry.week1_attendances || 0) + (entry.week2_attendances || 0) + 
           (entry.week3_attendances || 0) + (entry.week4_attendances || 0) + (entry.week5_attendances || 0);
  };

  const grandTotal = useMemo(() => {
    return entries.reduce((sum, entry) => sum + calculateTotal(entry), 0);
  }, [entries, granularity]);

  const grandTotalSalesCount = useMemo(() => {
    return entries.reduce((sum, entry) => sum + calculateTotalSalesCount(entry), 0);
  }, [entries, granularity]);

  const grandTotalAttendances = useMemo(() => {
    return entries.reduce((sum, entry) => sum + calculateTotalAttendances(entry), 0);
  }, [entries, granularity]);

  const hasAnyValue = useMemo(() => {
    return entries.some(entry => calculateTotal(entry) > 0);
  }, [entries, granularity]);

  const isRetroactive = granularity === 'daily' 
    ? selectedDate && selectedDate < new Date()
    : selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth);

  const handleSubmit = async () => {
    const salesToCreate: BatchSaleSubmission[] = [];

    entries.forEach(entry => {
      if (granularity === 'daily') {
        if (entry.daily_amount && entry.daily_amount > 0 && selectedDate) {
          salesToCreate.push({
            salesperson_id: entry.salesperson_id,
            salesperson_name: entry.salesperson_name,
            amount: entry.daily_amount,
            sale_date: format(selectedDate, 'yyyy-MM-dd'),
            entry_type: 'batch_daily',
            sales_count: entry.daily_sales_count || 1,
            attendances: entry.daily_attendances,
          });
        }
      } else if (granularity === 'monthly') {
        if (entry.monthly && entry.monthly > 0) {
          salesToCreate.push({
            salesperson_id: entry.salesperson_id,
            salesperson_name: entry.salesperson_name,
            amount: entry.monthly,
            sale_date: format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd'),
            entry_type: 'batch_monthly',
            sales_count: entry.monthly_sales_count || 1,
            attendances: entry.monthly_attendances,
          });
        }
      } else {
        weeksInMonth.forEach((week, index) => {
          const weekKey = `week${index + 1}` as keyof BatchSaleEntry;
          const salesCountKey = `week${index + 1}_sales_count` as keyof BatchSaleEntry;
          const attendancesKey = `week${index + 1}_attendances` as keyof BatchSaleEntry;
          const value = entry[weekKey] as number | undefined;
          if (value && value > 0) {
            salesToCreate.push({
              salesperson_id: entry.salesperson_id,
              salesperson_name: entry.salesperson_name,
              amount: value,
              sale_date: format(week.start, 'yyyy-MM-dd'),
              entry_type: 'batch_weekly',
              sales_count: (entry[salesCountKey] as number) || 1,
              attendances: entry[attendancesKey] as number | undefined,
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

  const renderDailyTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[150px]">Vendedor</TableHead>
          <TableHead className="text-center min-w-[120px]">Faturamento (R$)</TableHead>
          <TableHead className="text-center min-w-[100px]">Nº Vendas</TableHead>
          <TableHead className="text-center min-w-[100px]">Atendimentos</TableHead>
          <TableHead className="text-right min-w-[120px]">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(entry => (
          <TableRow key={entry.salesperson_id}>
            <TableCell className="font-medium">{entry.salesperson_name}</TableCell>
            <TableCell className="p-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="text-right"
                value={entry.daily_amount || ''}
                onChange={(e) => handleValueChange(entry.salesperson_id, 'daily_amount', e.target.value)}
              />
            </TableCell>
            <TableCell className="p-2">
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                className="text-center"
                value={entry.daily_sales_count || ''}
                onChange={(e) => handleValueChange(entry.salesperson_id, 'daily_sales_count', e.target.value)}
              />
            </TableCell>
            <TableCell className="p-2">
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                className="text-center"
                value={entry.daily_attendances || ''}
                onChange={(e) => handleValueChange(entry.salesperson_id, 'daily_attendances', e.target.value)}
              />
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(calculateTotal(entry))}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="bg-muted/30 font-bold">
          <TableCell>TOTAL GERAL</TableCell>
          <TableCell />
          <TableCell className="text-center">{grandTotalSalesCount}</TableCell>
          <TableCell className="text-center">{grandTotalAttendances}</TableCell>
          <TableCell className="text-right text-lg text-primary">
            {formatCurrency(grandTotal)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  const renderMonthlyTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[150px]">Vendedor</TableHead>
          <TableHead className="text-center min-w-[120px]">Faturamento (R$)</TableHead>
          <TableHead className="text-center min-w-[100px]">Nº Vendas</TableHead>
          <TableHead className="text-center min-w-[100px]">Atendimentos</TableHead>
          <TableHead className="text-right min-w-[120px]">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(entry => (
          <TableRow key={entry.salesperson_id}>
            <TableCell className="font-medium">{entry.salesperson_name}</TableCell>
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
            <TableCell className="p-2">
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                className="text-center"
                value={entry.monthly_sales_count || ''}
                onChange={(e) => handleValueChange(entry.salesperson_id, 'monthly_sales_count', e.target.value)}
              />
            </TableCell>
            <TableCell className="p-2">
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                className="text-center"
                value={entry.monthly_attendances || ''}
                onChange={(e) => handleValueChange(entry.salesperson_id, 'monthly_attendances', e.target.value)}
              />
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(calculateTotal(entry))}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="bg-muted/30 font-bold">
          <TableCell>TOTAL GERAL</TableCell>
          <TableCell />
          <TableCell className="text-center">{grandTotalSalesCount}</TableCell>
          <TableCell className="text-center">{grandTotalAttendances}</TableCell>
          <TableCell className="text-right text-lg text-primary">
            {formatCurrency(grandTotal)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  const renderWeeklyTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead rowSpan={2} className="min-w-[150px] align-bottom">Vendedor</TableHead>
          {weeksInMonth.map(week => (
            <TableHead key={week.number} colSpan={3} className="text-center border-l">
              Sem {week.number}
              <br />
              <span className="text-xs text-muted-foreground font-normal">{week.label}</span>
            </TableHead>
          ))}
          <TableHead rowSpan={2} className="text-right min-w-[120px] align-bottom border-l">Total</TableHead>
        </TableRow>
        <TableRow>
          {weeksInMonth.map(week => (
            <React.Fragment key={`header-${week.number}`}>
              <TableHead className="text-center text-xs border-l">R$</TableHead>
              <TableHead className="text-center text-xs">Vnd</TableHead>
              <TableHead className="text-center text-xs">Atd</TableHead>
            </React.Fragment>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(entry => (
          <TableRow key={entry.salesperson_id}>
            <TableCell className="font-medium">{entry.salesperson_name}</TableCell>
            {weeksInMonth.map((week, index) => (
              <React.Fragment key={week.number}>
                <TableCell className="p-1 border-l">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    className="text-right text-xs h-8 w-20"
                    value={entry[`week${index + 1}` as keyof BatchSaleEntry] || ''}
                    onChange={(e) => handleValueChange(entry.salesperson_id, `week${index + 1}`, e.target.value)}
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    className="text-center text-xs h-8 w-14"
                    value={entry[`week${index + 1}_sales_count` as keyof BatchSaleEntry] || ''}
                    onChange={(e) => handleValueChange(entry.salesperson_id, `week${index + 1}_sales_count`, e.target.value)}
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    className="text-center text-xs h-8 w-14"
                    value={entry[`week${index + 1}_attendances` as keyof BatchSaleEntry] || ''}
                    onChange={(e) => handleValueChange(entry.salesperson_id, `week${index + 1}_attendances`, e.target.value)}
                  />
                </TableCell>
              </React.Fragment>
            ))}
            <TableCell className="text-right font-semibold border-l">
              {formatCurrency(calculateTotal(entry))}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="bg-muted/30 font-bold">
          <TableCell>TOTAL</TableCell>
          {weeksInMonth.map(week => (
            <React.Fragment key={`total-${week.number}`}>
              <TableCell className="border-l" />
              <TableCell />
              <TableCell />
            </React.Fragment>
          ))}
          <TableCell className="text-right text-lg text-primary border-l">
            {formatCurrency(grandTotal)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  const getTableTitle = () => {
    if (granularity === 'daily' && selectedDate) {
      return `Vendas por Vendedor - ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
    }
    return `Vendas por Vendedor - ${MONTHS[selectedMonth].label}/${selectedYear}`;
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
            {granularity === 'daily' ? (
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <>
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
              </>
            )}
            
            <div className="space-y-2">
              <Label>Granularidade</Label>
              <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diária (Por Dia)</SelectItem>
                  <SelectItem value="weekly">Semanal (Por Semana)</SelectItem>
                  <SelectItem value="monthly">Mensal (Valor Total)</SelectItem>
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
            {granularity === 'daily' && selectedDate
              ? `Você está lançando vendas retroativas de ${format(selectedDate, 'dd/MM/yyyy')}.`
              : `Você está lançando vendas retroativas de ${MONTHS[selectedMonth].label}/${selectedYear}.`
            } Esses registros serão marcados como lançamento em lote.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Entry Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            {getTableTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum vendedor cadastrado. Adicione membros à equipe primeiro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              {granularity === 'daily' && renderDailyTable()}
              {granularity === 'monthly' && renderMonthlyTable()}
              {granularity === 'weekly' && renderWeeklyTable()}
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
                  {entries.filter(e => calculateTotal(e) > 0).length} vendedor(es) • {grandTotalSalesCount} vendas • {grandTotalAttendances} atendimentos • {formatCurrency(grandTotal)}
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