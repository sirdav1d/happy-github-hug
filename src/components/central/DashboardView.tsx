import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Bar, ReferenceLine, Line, Cell, ReferenceArea
} from 'recharts';
import {
  TrendingUp, Target, Calendar, DollarSign, CreditCard, Users, Activity, Percent, ShoppingBag, Zap, ArrowUpRight, ArrowDownRight, ShoppingCart, Trophy, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import InfoTooltip from './InfoTooltip';
import PulseCard from './dashboard/PulseCard';
import MetricCard from './dashboard/MetricCard';
import useAIInsights from '@/hooks/useAIInsights';
import { DashboardData } from '@/types';

interface DashboardViewProps {
  data: DashboardData;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual' | 'comparative'>('monthly');
  const { insights, isLoading: insightsLoading, fetchInsights } = useAIInsights();

  // Derivar anos dinamicamente dos dados disponíveis
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    data.historicalData.forEach(d => years.add(d.year));
    data.currentYearData.forEach(d => years.add(d.year));
    if (data.yearsAvailable) {
      data.yearsAvailable.forEach(y => years.add(y));
    }
    return Array.from(years).sort();
  }, [data]);

  // Determinar o ano selecionado e o ano anterior
  const selectedYear = useMemo(() => {
    if (data.currentYearData.length > 0) {
      return data.currentYearData[0].year;
    }
    return new Date().getFullYear();
  }, [data]);

  const lastYear = selectedYear - 1;

  // Métricas do mês atual
  const currentMonthMetrics = useMemo(() => {
    const validMonths = data.currentYearData.filter(d => d.revenue > 0);
    const currentMonth = validMonths.length > 0 ? validMonths[validMonths.length - 1] : { revenue: 0, goal: 0, month: 'Jan' };
    
    // Mês anterior para comparação
    const previousMonthIndex = validMonths.length >= 2 ? validMonths.length - 2 : -1;
    const previousMonth = previousMonthIndex >= 0 ? validMonths[previousMonthIndex] : null;
    
    // Mesmo mês do ano passado
    const sameMonthLastYear = data.historicalData.find(
      d => d.year === lastYear && d.month === currentMonth.month
    );

    return {
      current: currentMonth,
      previous: previousMonth,
      sameMonthLastYear,
      progressPercent: currentMonth.goal > 0 ? (currentMonth.revenue / currentMonth.goal) * 100 : 0,
    };
  }, [data, lastYear]);

  // Run Rate corrigido - baseado no mês selecionado dos dados, não dia do sistema
  const runRateMetrics = useMemo(() => {
    const { current } = currentMonthMetrics;
    
    // Mapeamento de meses para número do mês
    const monthMap: Record<string, number> = {
      'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
      'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
    };
    
    const currentMonthNumber = monthMap[current.month] || new Date().getMonth() + 1;
    
    // Calcular dias úteis no mês (aproximadamente 22 por mês)
    const daysInMonth = new Date(selectedYear, currentMonthNumber, 0).getDate();
    const totalWorkingDays = Math.round(daysInMonth * 0.72); // ~72% são dias úteis
    
    // Estimar dia atual baseado na progressão dos dados do time
    const teamWeeksWithData = data.team.reduce((max, t) => {
      const weeksWithRevenue = t.weeks.filter(w => w.revenue > 0).length;
      return Math.max(max, weeksWithRevenue);
    }, 0);
    
    // Cada semana tem ~5 dias úteis
    const estimatedWorkingDaysPassed = Math.max(1, teamWeeksWithData * 5);
    
    // Dias restantes considerando semanas com dados
    // Se o mês já terminou (4+ semanas de dados), dias restantes = 0
    const daysRemaining = teamWeeksWithData >= 4 ? 0 : Math.max(0, totalWorkingDays - estimatedWorkingDaysPassed);
    
    // Run rate baseado em média diária real
    const dailyAverage = estimatedWorkingDaysPassed > 0 ? current.revenue / estimatedWorkingDaysPassed : 0;
    const projection = dailyAverage * totalWorkingDays;
    
    const gap = current.goal - current.revenue; // Valor faltante em R$
    const status = projection >= current.goal ? 'on_track' : 'below';
    
    // Meta diária para os dias restantes
    const dailyTargetRemaining = daysRemaining > 0 
      ? Math.max(0, current.goal - current.revenue) / daysRemaining 
      : 0;

    return {
      projection,
      gap,
      status,
      dailyAverage,
      daysRemaining,
      dailyTargetRemaining,
      workingDaysPassed: estimatedWorkingDaysPassed,
      isMonthComplete: teamWeeksWithData >= 4,
    };
  }, [currentMonthMetrics, data.team, selectedYear]);

  // Informações semanais para o mês atual
  const weeklyInfo = useMemo(() => {
    const allTeamWeeks = data.team.flatMap(t => t.weeks);
    const weeklyTotals = [1, 2, 3, 4, 5].map(week => ({
      week,
      revenue: allTeamWeeks.filter(w => w.week === week).reduce((sum, w) => sum + w.revenue, 0),
      goal: allTeamWeeks.filter(w => w.week === week).reduce((sum, w) => sum + w.goal, 0),
    }));
    
    // Encontrar a semana atual (última com dados)
    const currentWeekIndex = weeklyTotals.reduce((lastIdx, w, idx) => 
      w.revenue > 0 ? idx : lastIdx, 0);
    const currentWeek = weeklyTotals[currentWeekIndex];
    
    const weeklyGoalPercent = currentWeek.goal > 0 
      ? (currentWeek.revenue / currentWeek.goal) * 100 
      : 0;
    
    return {
      currentWeek: currentWeekIndex + 1,
      weeklyRevenue: currentWeek.revenue,
      weeklyGoal: currentWeek.goal,
      weeklyGoalPercent,
    };
  }, [data.team]);

  // Comparativos
  const comparisons = useMemo(() => {
    const { current, previous, sameMonthLastYear } = currentMonthMetrics;
    
    // vs Mês anterior
    const vsPreviousMonth = previous && previous.revenue > 0
      ? ((current.revenue - previous.revenue) / previous.revenue) * 100
      : 0;
    
    // vs Mesmo mês ano passado
    const vsSameMonthLastYear = sameMonthLastYear && sameMonthLastYear.revenue > 0
      ? ((current.revenue - sameMonthLastYear.revenue) / sameMonthLastYear.revenue) * 100
      : 0;

    return {
      vsPreviousMonth,
      vsSameMonthLastYear,
      previousMonthName: previous?.month || '',
    };
  }, [currentMonthMetrics]);

  // Buscar insights de IA quando os dados mudarem
  const refreshInsights = useCallback(() => {
    const metrics = {
      annualGoal: data.kpis.annualGoal,
      annualRealized: data.kpis.annualRealized,
      lastYearGrowth: data.kpis.lastYearGrowth,
      currentMonthRevenue: currentMonthMetrics.current.revenue,
      currentMonthGoal: currentMonthMetrics.current.goal,
      runRateProjection: runRateMetrics.projection,
      averageTicket: data.kpis.averageTicket,
      totalSalesCount: data.kpis.totalSalesCount,
      currentMonthName: currentMonthMetrics.current.month,
      gapToGoal: Math.max(0, currentMonthMetrics.current.goal - currentMonthMetrics.current.revenue),
      daysRemaining: runRateMetrics.daysRemaining,
      selectedYear: selectedYear,
    };
    fetchInsights(metrics);
  }, [data.kpis, currentMonthMetrics, runRateMetrics, fetchInsights, selectedYear]);

  useEffect(() => {
    if (data.kpis.annualGoal > 0) {
      refreshInsights();
    }
  }, [data.kpis.annualGoal, refreshInsights]);

  // Dados de acumulado anual
  const annualAccumulated = useMemo(() => {
    const totalRevenue = data.currentYearData.reduce((acc, d) => acc + d.revenue, 0);
    const totalGoal = data.kpis.annualGoal || data.currentYearData.reduce((acc, d) => acc + d.goal, 0);
    const progressPercent = totalGoal > 0 ? (totalRevenue / totalGoal) * 100 : 0;
    
    // Calcular acumulado do ano passado até o mesmo mês
    const currentMonthName = currentMonthMetrics.current.month;
    const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIndex = monthOrder.indexOf(currentMonthName);
    
    const lastYearAccumulated = data.historicalData
      .filter(d => d.year === lastYear && monthOrder.indexOf(d.month) <= currentMonthIndex)
      .reduce((acc, d) => acc + d.revenue, 0);
    
    const vsLastYear = lastYearAccumulated > 0 
      ? ((totalRevenue - lastYearAccumulated) / lastYearAccumulated) * 100 
      : 0;
    
    return { totalRevenue, totalGoal, progressPercent, vsLastYear };
  }, [data, currentMonthMetrics, lastYear]);

  // Chart data com previsão
  const chartData = useMemo(() => {
    // Dados trimestrais
    if (period === 'quarterly') {
      const quarters = [
        { name: 'Q1', months: ['Jan', 'Fev', 'Mar'] },
        { name: 'Q2', months: ['Abr', 'Mai', 'Jun'] },
        { name: 'Q3', months: ['Jul', 'Ago', 'Set'] },
        { name: 'Q4', months: ['Out', 'Nov', 'Dez'] },
      ];
      
      return quarters.map(q => {
        const currentYearRevenue = data.currentYearData
          .filter(d => q.months.includes(d.month))
          .reduce((sum, d) => sum + d.revenue, 0);
        const currentYearGoal = data.currentYearData
          .filter(d => q.months.includes(d.month))
          .reduce((sum, d) => sum + d.goal, 0);
        const lastYearRevenue = data.historicalData
          .filter(d => d.year === lastYear && q.months.includes(d.month))
          .reduce((sum, d) => sum + d.revenue, 0);
        
        return {
          name: q.name,
          revenue: currentYearRevenue,
          goal: currentYearGoal,
          lastYear: lastYearRevenue,
          forecast: null as number | null,
        };
      });
    }

    // Anual
    if (period === 'annual') {
      return availableYears.map(year => {
        const isCurrentYear = year === selectedYear;
        const yearData = isCurrentYear 
          ? data.currentYearData 
          : data.historicalData.filter(d => d.year === year);
        
        const totalRevenue = yearData.reduce((acc, curr) => acc + curr.revenue, 0);
        const totalGoal = yearData.reduce((acc, curr) => acc + curr.goal, 0);
        
        return { 
          name: year.toString(), 
          revenue: totalRevenue, 
          goal: totalGoal > 0 ? totalGoal : totalRevenue * 1.1,
          lastYear: 0,
          forecast: null as number | null,
        };
      });
    }

    // Comparativo: lado a lado ano atual vs anterior
    if (period === 'comparative') {
      const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return monthOrder.map(month => {
        const currentYearMonth = data.currentYearData.find(d => d.month === month);
        const lastYearMonth = data.historicalData.find(d => d.year === lastYear && d.month === month);
        return {
          name: month,
          [selectedYear.toString()]: currentYearMonth?.revenue || 0,
          [lastYear.toString()]: lastYearMonth?.revenue || 0,
          revenue: currentYearMonth?.revenue || 0,
          lastYear: lastYearMonth?.revenue || 0,
          goal: currentYearMonth?.goal || 0,
          forecast: null as number | null,
        };
      });
    }

    // Mensal com linha de previsão
    const monthlyData = data.currentYearData.map(d => {
      const lastYearMonth = data.historicalData.find(h => h.year === lastYear && h.month === d.month);
      return { 
        name: d.month, 
        revenue: d.revenue, 
        goal: d.goal, 
        lastYear: lastYearMonth?.revenue || 0,
        forecast: null as number | null,
      };
    });

    // Adicionar previsão para meses futuros
    let lastMonthWithRevenue = -1;
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i].revenue > 0) {
        lastMonthWithRevenue = i;
        break;
      }
    }
    if (lastMonthWithRevenue >= 0 && lastMonthWithRevenue < monthlyData.length - 1) {
      const avgGrowth = runRateMetrics.dailyAverage * 22; // Projeção mensal
      for (let i = lastMonthWithRevenue; i < monthlyData.length; i++) {
        if (i === lastMonthWithRevenue) {
          monthlyData[i].forecast = runRateMetrics.projection;
        } else {
          monthlyData[i].forecast = avgGrowth;
        }
      }
    }

    return monthlyData;
  }, [period, data, availableYears, selectedYear, lastYear, runRateMetrics]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main KPIs Grid - 5 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Meta Prevista do Mês */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-card shadow-lg border border-border"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Meta Prevista
                </p>
                <p className="text-xs text-primary font-semibold">{currentMonthMetrics.current.month}/{selectedYear}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Target size={16} />
              </div>
            </div>
            
            <h3 className="text-xl font-black text-foreground mb-2">
              {formatCurrency(currentMonthMetrics.current.goal)}
            </h3>

            {/* Percentual realizado vs previsto */}
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                currentMonthMetrics.progressPercent >= 100 
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : currentMonthMetrics.progressPercent >= 80
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {currentMonthMetrics.progressPercent >= 100 ? (
                  <><Trophy size={10} /> +{(currentMonthMetrics.progressPercent - 100).toFixed(0)}% acima</>
                ) : (
                  <><AlertTriangle size={10} /> -{(100 - currentMonthMetrics.progressPercent).toFixed(0)}% faltando</>
                )}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Realizado no Mês */}
        <MetricCard
          title="Realizado"
          subtitle={`${currentMonthMetrics.current.month}/${selectedYear}`}
          value={currentMonthMetrics.current.revenue}
          formatter={formatCurrency}
          icon={<DollarSign size={16} />}
          comparison={comparisons.vsPreviousMonth !== 0 ? {
            value: comparisons.vsPreviousMonth,
            label: `vs ${comparisons.previousMonthName}`,
            type: 'percentage',
          } : undefined}
          delay={1}
        />

        {/* Projeção Run Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg border border-slate-700"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Projeção
                </p>
                <p className="text-xs text-slate-400 font-semibold">{currentMonthMetrics.current.month}/{selectedYear}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Zap size={16} fill="currentColor" />
              </div>
            </div>
            
            <h3 className="text-xl font-black text-white mb-2">
              {formatCurrency(runRateMetrics.projection)}
            </h3>

            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                runRateMetrics.status === 'on_track' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {runRateMetrics.status === 'on_track' ? (
                  <><ArrowUpRight size={10} /> No ritmo</>
                ) : (
                  <><ArrowDownRight size={10} /> Gap: {formatCurrency(Math.abs(runRateMetrics.gap))}</>
                )}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Crescimento YoY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-card shadow-lg border border-border"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Crescimento %
                </p>
                <p className="text-xs text-primary font-semibold">{lastYear} vs {selectedYear}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Percent size={16} />
              </div>
            </div>
            
            {(() => {
              const growthPercent = comparisons.vsSameMonthLastYear;
              const isPositive = growthPercent >= 0;
              
              return (
                <>
                  <h3 className={`text-xl font-black mb-2 ${
                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}{growthPercent.toFixed(1)}%
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                      isPositive 
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                      {isPositive ? (
                        <><ArrowUpRight size={10} /> Crescimento</>
                      ) : (
                        <><ArrowDownRight size={10} /> Retração</>
                      )}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </motion.div>

        {/* Acumulado Ano */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-lg border border-indigo-500/30"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Acumulado
                </p>
                <p className="text-xs text-indigo-300 font-semibold">{selectedYear}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/10 text-indigo-200">
                <TrendingUp size={16} />
              </div>
            </div>
            
            <h3 className="text-xl font-black text-white mb-2">
              {formatCurrency(annualAccumulated.totalRevenue)}
            </h3>

            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                annualAccumulated.vsLastYear >= 0 
                  ? 'bg-emerald-500/30 text-emerald-300' 
                  : 'bg-red-500/30 text-red-300'
              }`}>
                {annualAccumulated.vsLastYear >= 0 ? (
                  <><ArrowUpRight size={10} /> +{annualAccumulated.vsLastYear.toFixed(1)}% vs {lastYear}</>
                ) : (
                  <><ArrowDownRight size={10} /> {annualAccumulated.vsLastYear.toFixed(1)}% vs {lastYear}</>
                )}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-border"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} />
              Performance de Vendas {selectedYear}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {period === 'monthly' && `Evolução mensal com meta e comparativo ${lastYear}`}
              {period === 'quarterly' && `Evolução trimestral ${selectedYear} vs ${lastYear}`}
              {period === 'annual' && 'Histórico anual de receita vs meta'}
              {period === 'comparative' && `Comparativo lado a lado: ${lastYear} vs ${selectedYear}`}
            </p>
          </div>
          
          <div className="bg-muted p-1 rounded-xl flex items-center gap-1 border border-border">
            {[
              { id: 'monthly', label: 'Mensal' },
              { id: 'quarterly', label: 'Trimestral' },
              { id: 'annual', label: 'Anual' },
              { id: 'comparative', label: 'Comparativo' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as 'monthly' | 'quarterly' | 'annual' | 'comparative')}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  period === p.id 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="aboveGoalZone" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="belowGoalZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              
              {/* Performance zones - Above and Below Goal */}
              {period === 'monthly' && currentMonthMetrics.current.goal > 0 && (
                <>
                  <ReferenceArea
                    y1={currentMonthMetrics.current.goal}
                    y2={currentMonthMetrics.current.goal * 1.5}
                    fill="url(#aboveGoalZone)"
                    fillOpacity={1}
                    label={{ 
                      value: '✓ Acima da Meta', 
                      position: 'insideTopRight',
                      fill: '#10b981',
                      fontSize: 9,
                      fontWeight: 600,
                      opacity: 0.7
                    }}
                  />
                  <ReferenceArea
                    y1={0}
                    y2={currentMonthMetrics.current.goal}
                    fill="url(#belowGoalZone)"
                    fillOpacity={1}
                  />
                </>
              )}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }} 
                dy={10} 
              />
              <YAxis 
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                width={45}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const data = payload[0]?.payload;
                  const revenue = data?.revenue || 0;
                  const goal = data?.goal || 0;
                  const lastYearValue = data?.lastYear || 0;
                  const progressPercent = goal > 0 ? (revenue / goal) * 100 : 0;
                  const vsLastYear = lastYearValue > 0 ? ((revenue - lastYearValue) / lastYearValue) * 100 : 0;
                  
                  return (
                    <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl p-4 shadow-xl min-w-[200px]">
                      <p className="text-sm font-bold text-foreground mb-3 pb-2 border-b border-border">{label}/{selectedYear}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Realizado</span>
                          <span className="text-sm font-bold text-foreground">{formatCurrency(revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Meta</span>
                          <span className="text-sm font-medium text-muted-foreground">{formatCurrency(goal)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">% da Meta</span>
                          <span className={`text-sm font-bold ${
                            progressPercent >= 100 ? 'text-emerald-500' : 
                            progressPercent >= 80 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {progressPercent.toFixed(0)}%
                          </span>
                        </div>
                        {period === 'monthly' && lastYearValue > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">vs {lastYear}</span>
                            <span className={`text-sm font-bold ${vsLastYear >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {vsLastYear >= 0 ? '+' : ''}{vsLastYear.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              
              {/* Goal Reference Line */}
              {period === 'monthly' && currentMonthMetrics.current.goal > 0 && (
                <ReferenceLine 
                  y={currentMonthMetrics.current.goal} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="8 4" 
                  strokeWidth={2}
                  opacity={0.6}
                  label={{ 
                    value: `Meta: ${formatCurrency(currentMonthMetrics.current.goal)}`, 
                    position: 'right',
                    fill: 'hsl(var(--primary))',
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
              )}
              
              {/* Goal bars with colored feedback */}
              <Bar 
                dataKey="goal" 
                fill="url(#goalGradient)" 
                radius={[6, 6, 0, 0]} 
                opacity={0.7}
                maxBarSize={40}
              />
              
              {/* Last year line (for monthly, quarterly, and comparative views) */}
              {(period === 'monthly' || period === 'quarterly' || period === 'comparative') && (
                <Line
                  type="monotone"
                  dataKey="lastYear"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={period === 'comparative' ? 3 : 2}
                  strokeDasharray={period === 'comparative' ? undefined : "6 3"}
                  dot={period === 'comparative' || period === 'quarterly' ? { fill: 'hsl(var(--muted-foreground))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' } : false}
                  opacity={period === 'comparative' || period === 'quarterly' ? 0.8 : 0.4}
                  name={lastYear.toString()}
                />
              )}
              
              {/* Forecast line */}
              {period === 'monthly' && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeDasharray="10 5"
                  dot={{ fill: '#f59e0b', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  connectNulls={false}
                />
              )}
              
              {/* Revenue area with dynamic styling */}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fill="url(#revenueGradient)"
                activeDot={{ 
                  r: 8, 
                  stroke: 'hsl(var(--primary))', 
                  strokeWidth: 3,
                  fill: 'hsl(var(--background))'
                }}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload || payload.revenue === 0) return null;
                  const isAboveGoal = payload.goal > 0 && payload.revenue >= payload.goal;
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isAboveGoal ? 6 : 4} 
                      fill={isAboveGoal ? '#10b981' : 'hsl(var(--primary))'} 
                      stroke="hsl(var(--background))" 
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary shadow-sm" />
            <span className="text-xs font-medium text-muted-foreground">Realizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-muted-foreground/30" />
            <span className="text-xs font-medium text-muted-foreground">Meta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-xs font-medium text-muted-foreground">Meta Batida</span>
          </div>
          {(period === 'monthly' || period === 'quarterly' || period === 'comparative') && (
            <div className="flex items-center gap-2">
              <div className={`w-6 h-0.5 bg-muted-foreground ${period === 'comparative' ? '' : 'opacity-40'}`} style={period === 'comparative' ? {} : { backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, currentColor 3px, currentColor 6px)' }} />
              <span className="text-xs font-medium text-muted-foreground">{lastYear}</span>
            </div>
          )}
          {period === 'monthly' && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-amber-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 5px, #f59e0b 5px, #f59e0b 10px)' }} />
              <span className="text-xs font-medium text-muted-foreground">Projeção</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Efficiency Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h4 className="text-sm font-bold text-muted-foreground mb-4 px-1 flex items-center gap-2 uppercase tracking-widest">
          Eficiência Operacional
          <InfoTooltip text="Métricas baseadas em vendas, atendimentos e investimentos." />
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { icon: <CreditCard size={16} />, label: 'Ticket Médio', value: data.kpis.averageTicket, format: formatCurrency },
            { icon: <Percent size={16} />, label: 'Conversão', value: data.kpis.conversionRate, format: (v: number) => `${v.toFixed(1)}%` },
            { icon: <Users size={16} />, label: 'CAC', value: data.kpis.cac, format: formatCurrency },
            { icon: <Activity size={16} />, label: 'LTV Estimado', value: data.kpis.ltv, format: formatCurrency },
            { icon: <ShoppingBag size={16} />, label: 'Vendas Totais', value: data.kpis.totalSalesCount, format: (v: number) => Math.round(v).toString() },
          ].map((metric, idx) => (
            <div
              key={metric.label}
              className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col gap-2 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                {metric.icon}
                <span className="text-[9px] font-bold uppercase tracking-wider">{metric.label}</span>
              </div>
              <span className="text-lg font-bold text-foreground">{metric.format(metric.value)}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Pulse Banner - Final Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h4 className="text-sm font-bold text-muted-foreground mb-4 px-1 flex items-center gap-2 uppercase tracking-widest">
          Análise Inteligente
          <InfoTooltip text="Insights gerados por IA com base nos seus dados de vendas." />
        </h4>
        <PulseCard
          insights={insights}
          isLoading={insightsLoading}
          onRefresh={refreshInsights}
          variant="banner"
        />
      </motion.div>
    </div>
  );
};

export default DashboardView;
