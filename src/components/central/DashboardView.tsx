import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Bar, ReferenceLine, Line
} from 'recharts';
import {
  TrendingUp, Target, Calendar, DollarSign, CreditCard, Users, Activity, Percent, ShoppingBag, Zap, ArrowUpRight, ArrowDownRight, ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';
import InfoTooltip from './InfoTooltip';
import PulseCard from './dashboard/PulseCard';
import MetricCard from './dashboard/MetricCard';
import { GamificationSection } from './dashboard/GamificationBadge';
import useAIInsights from '@/hooks/useAIInsights';
import { DashboardData } from '@/types';

interface DashboardViewProps {
  data: DashboardData;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
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

  // Run Rate corrigido - baseado em semanas passadas, não dia do sistema
  const runRateMetrics = useMemo(() => {
    const { current } = currentMonthMetrics;
    
    // Calcular dias úteis - usar dados reais quando disponíveis
    // Para simplificar: assumir 22 dias úteis por mês
    const totalWorkingDays = 22;
    
    // Estimar dia atual baseado na progressão dos dados do time
    // Se tivermos dados de semanas, podemos ser mais precisos
    const teamWeeksWithData = data.team.reduce((max, t) => {
      const weeksWithRevenue = t.weeks.filter(w => w.revenue > 0).length;
      return Math.max(max, weeksWithRevenue);
    }, 0);
    
    const estimatedWorkingDaysPassed = Math.max(1, teamWeeksWithData * 5);
    const daysRemaining = Math.max(0, totalWorkingDays - estimatedWorkingDaysPassed);
    
    // Run rate baseado em média diária real
    const dailyAverage = estimatedWorkingDaysPassed > 0 ? current.revenue / estimatedWorkingDaysPassed : 0;
    const projection = dailyAverage * totalWorkingDays;
    
    const gap = current.goal - projection;
    const status = projection >= current.goal ? 'on_track' : 'below';
    
    // Vendas necessárias para bater a meta
    const salesNeeded = data.kpis.averageTicket > 0 
      ? Math.ceil(Math.max(0, current.goal - current.revenue) / data.kpis.averageTicket)
      : 0;
    
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
      salesNeeded,
      dailyTargetRemaining,
      workingDaysPassed: estimatedWorkingDaysPassed,
    };
  }, [currentMonthMetrics, data.team, data.kpis.averageTicket]);

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

  // Gamificação - calcular streaks e conquistas
  const gamificationMetrics = useMemo(() => {
    // Streak: semanas consecutivas acima de 80% da meta
    let currentStreak = 0;
    const allTeamWeeks = data.team.flatMap(t => t.weeks);
    const weeklyTotals = [1, 2, 3, 4, 5].map(week => ({
      revenue: allTeamWeeks.filter(w => w.week === week).reduce((sum, w) => sum + w.revenue, 0),
      goal: allTeamWeeks.filter(w => w.week === week).reduce((sum, w) => sum + w.goal, 0),
    }));
    
    for (let i = weeklyTotals.length - 1; i >= 0; i--) {
      const { revenue, goal } = weeklyTotals[i];
      if (goal > 0 && (revenue / goal) >= 0.8) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Semanas com meta batida
    const weeklyGoalsMet = weeklyTotals.filter(w => w.goal > 0 && w.revenue >= w.goal).length;

    // Conquistas (simplificado)
    let achievements = 0;
    if (currentMonthMetrics.progressPercent >= 100) achievements++;
    if (data.kpis.lastYearGrowth > 10) achievements++;
    if (data.team.filter(t => t.totalRevenue >= t.monthlyGoal).length >= data.team.length * 0.8) achievements++;

    return { currentStreak, weeklyGoalsMet, achievements };
  }, [data.team, currentMonthMetrics.progressPercent, data.kpis.lastYearGrowth]);

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
    };
    fetchInsights(metrics);
  }, [data.kpis, currentMonthMetrics, runRateMetrics, fetchInsights]);

  useEffect(() => {
    if (data.kpis.annualGoal > 0) {
      refreshInsights();
    }
  }, [data.kpis.annualGoal, refreshInsights]);

  // Chart data com previsão
  const chartData = useMemo(() => {
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
      {/* Hero Section: Pulse + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* AI Pulse Card - Destaque */}
        <div className="lg:col-span-1">
          <PulseCard
            insights={insights}
            isLoading={insightsLoading}
            onRefresh={refreshInsights}
          />
        </div>

        {/* Main Metrics */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Meta do Mês */}
          <MetricCard
            title="Meta do Mês"
            subtitle={currentMonthMetrics.current.month}
            value={currentMonthMetrics.current.goal}
            formatter={formatCurrency}
            icon={<Target size={20} />}
            progress={{
              current: currentMonthMetrics.current.revenue,
              total: currentMonthMetrics.current.goal,
              showBar: true,
            }}
            delay={0}
          />

          {/* Realizado no Mês */}
          <MetricCard
            title="Realizado"
            subtitle={currentMonthMetrics.current.month}
            value={currentMonthMetrics.current.revenue}
            formatter={formatCurrency}
            icon={<DollarSign size={20} />}
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
            className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-700"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Projeção {currentMonthMetrics.current.month}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Zap size={18} fill="currentColor" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2">
                {formatCurrency(runRateMetrics.projection)}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                  runRateMetrics.status === 'on_track' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {runRateMetrics.status === 'on_track' ? (
                    <><ArrowUpRight size={12} /> No ritmo</>
                  ) : (
                    <><ArrowDownRight size={12} /> Gap: {formatCurrency(Math.abs(runRateMetrics.gap))}</>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Vendas p/ Meta</p>
                  <p className="text-sm font-bold text-white">{runRateMetrics.salesNeeded}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Dias Restantes</p>
                  <p className="text-sm font-bold text-white">{runRateMetrics.daysRemaining}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Meta Anual"
          value={data.kpis.annualGoal}
          formatter={formatCurrency}
          icon={<Target size={18} />}
          progress={{
            current: data.kpis.annualRealized,
            total: data.kpis.annualGoal,
            showBar: true,
          }}
          delay={3}
        />

        <MetricCard
          title="Acumulado Ano"
          value={data.kpis.annualRealized}
          formatter={formatCurrency}
          icon={<TrendingUp size={18} />}
          comparison={{
            value: data.kpis.lastYearGrowth,
            label: `vs ${lastYear}`,
            type: 'percentage',
          }}
          delay={4}
        />

        <MetricCard
          title="Ticket Médio"
          value={data.kpis.averageTicket}
          formatter={formatCurrency}
          icon={<CreditCard size={18} />}
          delay={5}
        />

        <MetricCard
          title="Total de Vendas"
          value={data.kpis.totalSalesCount}
          formatter={(v) => Math.round(v).toString()}
          icon={<ShoppingCart size={18} />}
          delay={6}
        />
      </div>

      {/* Gamification Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between flex-wrap gap-4 p-4 bg-card rounded-2xl border border-border"
      >
        <div>
          <h4 className="text-sm font-bold text-foreground mb-1">Conquistas & Streaks</h4>
          <p className="text-xs text-muted-foreground">Mantenha o ritmo para desbloquear mais!</p>
        </div>
        <GamificationSection
          currentStreak={gamificationMetrics.currentStreak}
          weeklyGoalsMet={gamificationMetrics.weeklyGoalsMet}
          totalMilestones={gamificationMetrics.achievements}
        />
      </motion.div>

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
              Performance de Vendas
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {period === 'monthly' 
                ? 'Comparativo mensal com projeção e ano anterior'
                : 'Evolução anual de receita'}
            </p>
          </div>
          
          <div className="bg-muted p-1 rounded-xl flex items-center gap-1 border border-border">
            {[
              { id: 'monthly', label: 'Mensal' },
              { id: 'annual', label: 'Anual' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as 'monthly' | 'annual')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  period === p.id 
                    ? 'bg-card text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                dy={10} 
              />
              <YAxis 
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'revenue' ? 'Realizado' : 
                  name === 'goal' ? 'Meta' : 
                  name === 'lastYear' ? `${lastYear}` :
                  name === 'forecast' ? 'Projeção' : name
                ]}
              />
              
              {/* Goal bars */}
              <Bar 
                dataKey="goal" 
                fill="hsl(var(--muted))" 
                radius={[4, 4, 0, 0]} 
                opacity={0.6}
              />
              
              {/* Last year line (only for monthly view) */}
              {period === 'monthly' && (
                <Line
                  type="monotone"
                  dataKey="lastYear"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  opacity={0.5}
                />
              )}
              
              {/* Forecast line */}
              {period === 'monthly' && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--amber))"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={{ fill: 'hsl(var(--amber))', r: 4 }}
                  connectNulls={false}
                />
              )}
              
              {/* Revenue area */}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fill="url(#revenueGradient)"
                activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Realizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted" />
            <span className="text-xs text-muted-foreground">Meta</span>
          </div>
          {period === 'monthly' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-muted-foreground" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, hsl(var(--muted-foreground)) 2px, hsl(var(--muted-foreground)) 4px)' }} />
                <span className="text-xs text-muted-foreground">{lastYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5" style={{ backgroundColor: 'hsl(var(--amber))', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, hsl(var(--amber)) 4px, hsl(var(--amber)) 8px)' }} />
                <span className="text-xs text-muted-foreground">Projeção</span>
              </div>
            </>
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
    </div>
  );
};

export default DashboardView;
