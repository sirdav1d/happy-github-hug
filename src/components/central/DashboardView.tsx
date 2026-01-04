import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, Cell
} from 'recharts';
import {
  TrendingUp, Target, Calendar, DollarSign, CreditCard, Users, Activity, Percent, ShoppingBag, Zap, ArrowUpRight, ArrowDownRight, ShoppingCart, Trophy, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import InfoTooltip from './InfoTooltip';
import PulseCard from './dashboard/PulseCard';
import MetricCard from './dashboard/MetricCard';
import JourneyBanner from './dashboard/JourneyBanner';

import ComparativeInsights from './dashboard/ComparativeInsights';
import useAIInsights from '@/hooks/useAIInsights';
import { DashboardData } from '@/types';

interface DashboardViewProps {
  data: DashboardData;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
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

  // Chart data com % de meta atingida
  const chartData = useMemo(() => {
    const calculateGoalPercent = (revenue: number, goal: number) => 
      goal > 0 ? (revenue / goal) * 100 : 0;

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
        
        return {
          name: q.name,
          revenue: currentYearRevenue,
          goal: currentYearGoal,
          goalPercent: calculateGoalPercent(currentYearRevenue, currentYearGoal),
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
        const effectiveGoal = totalGoal > 0 ? totalGoal : totalRevenue * 1.1;
        
        return { 
          name: year.toString(), 
          revenue: totalRevenue, 
          goal: effectiveGoal,
          goalPercent: calculateGoalPercent(totalRevenue, effectiveGoal),
        };
      });
    }

    // Mensal
    return data.currentYearData.map(d => ({ 
      name: d.month, 
      revenue: d.revenue, 
      goal: d.goal, 
      goalPercent: calculateGoalPercent(d.revenue, d.goal),
    }));
  }, [period, data, availableYears, selectedYear]);

  // Função para determinar cor da barra
  const getBarColor = (goalPercent: number) => {
    if (goalPercent >= 100) return '#10b981'; // emerald-500
    if (goalPercent >= 80) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Journey Banner */}
      <JourneyBanner
        mentorshipStartDate={data.mentorshipStartDate}
        mentorshipDurationMonths={6}
        selectedMonth={(() => {
          const monthMap: Record<string, number> = {
            'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
            'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
          };
          return monthMap[currentMonthMetrics.current.month] || 1;
        })()}
        selectedYear={selectedYear}
        currentMonthName={currentMonthMetrics.current.month}
        progressPercent={currentMonthMetrics.progressPercent}
        annualProgress={annualAccumulated.progressPercent}
      />

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

        {/* Falta p/ Meta */}
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
                  Falta p/ Meta
                </p>
                <p className="text-xs text-slate-400 font-semibold">{currentMonthMetrics.current.month}/{selectedYear}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Target size={16} />
              </div>
            </div>
            
            {(() => {
              const remaining = currentMonthMetrics.current.goal - currentMonthMetrics.current.revenue;
              return (
                <>
                  <h3 className="text-xl font-black text-white mb-2">
                    {remaining > 0 
                      ? formatCurrency(remaining) 
                      : 'Meta batida! 🎉'}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                      remaining <= 0 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {remaining <= 0 ? (
                        <><ArrowUpRight size={10} /> +{formatCurrency(Math.abs(remaining))} acima</>
                      ) : (
                        <>{runRateMetrics.daysRemaining} dias úteis restantes</>
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
              <Target className="text-primary" size={20} />
              Você bateu a meta?
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {period === 'monthly' && `% de meta atingida por mês em ${selectedYear}`}
              {period === 'quarterly' && `% de meta atingida por trimestre em ${selectedYear}`}
              {period === 'annual' && '% de meta atingida por ano'}
            </p>
          </div>
          
          <div className="bg-muted p-1 rounded-xl flex items-center gap-1 border border-border">
            {[
              { id: 'monthly', label: 'Mensal' },
              { id: 'quarterly', label: 'Trimestral' },
              { id: 'annual', label: 'Anual' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as 'monthly' | 'quarterly' | 'annual')}
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

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 30, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }} 
                dy={10} 
              />
              <YAxis 
                tickFormatter={(val) => `${val}%`} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                width={45}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const data = payload[0]?.payload;
                  const revenue = data?.revenue || 0;
                  const goal = data?.goal || 0;
                  const goalPercent = data?.goalPercent || 0;
                  
                  return (
                    <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl p-4 shadow-xl min-w-[180px]">
                      <p className="text-sm font-bold text-foreground mb-3 pb-2 border-b border-border">{label}</p>
                      
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
                          <span className="text-xs text-muted-foreground">% Atingido</span>
                          <span className={`text-sm font-bold ${
                            goalPercent >= 100 ? 'text-emerald-500' : 
                            goalPercent >= 80 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {goalPercent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              
              {/* Linha de referência em 100% */}
              <ReferenceLine 
                y={100} 
                stroke="#10b981" 
                strokeDasharray="8 4" 
                strokeWidth={2}
                label={{ 
                  value: 'Meta 100%', 
                  position: 'right',
                  fill: '#10b981',
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
              
              {/* Barras coloridas por performance */}
              <Bar 
                dataKey="goalPercent" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={50}
                label={{
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                  fontWeight: 600,
                  formatter: (value: number) => value > 0 ? `${value.toFixed(0)}%` : ''
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.goalPercent)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend - Simples e claro */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">Acima da Meta (≥100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Atenção (80-99%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-xs font-medium text-muted-foreground">Abaixo ({"<"}80%)</span>
          </div>
        </div>
      </motion.div>


      {/* Comparative Insights */}
      <ComparativeInsights
        currentYearData={data.currentYearData}
        historicalData={data.historicalData}
        selectedYear={selectedYear}
        lastYear={lastYear}
      />

      {/* Efficiency Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
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
        transition={{ delay: 1.1 }}
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
