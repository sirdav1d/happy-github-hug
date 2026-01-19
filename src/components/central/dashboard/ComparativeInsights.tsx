import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Trophy, Target, Zap } from 'lucide-react';
import { MonthlyData } from '@/types';
import InfoTooltip from '../InfoTooltip';

interface ComparativeInsightsProps {
  currentYearData: MonthlyData[];
  historicalData: MonthlyData[];
  selectedYear: number;
  lastYear: number;
  availableYears?: number[];
}

const ComparativeInsights = ({
  currentYearData,
  historicalData,
  selectedYear,
  lastYear,
  availableYears = [],
}: ComparativeInsightsProps) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const insights = useMemo(() => {
    const monthsWithData = currentYearData.filter(d => d.revenue > 0);
    
    // Best month current year
    const bestMonth = monthsWithData.reduce((best, curr) => 
      curr.revenue > (best?.revenue || 0) ? curr : best, monthsWithData[0]);
    
    const bestMonthVsGoal = bestMonth && bestMonth.goal > 0 
      ? ((bestMonth.revenue - bestMonth.goal) / bestMonth.goal) * 100 
      : 0;

    // Best month last year
    const lastYearData = historicalData.filter(d => d.year === lastYear);
    const bestMonthLastYear = lastYearData.reduce((best, curr) => 
      curr.revenue > (best?.revenue || 0) ? curr : best, lastYearData[0] || null);

    // Historical best months for ALL years (complete study)
    const yearsToShow = availableYears.length > 0 ? [...availableYears].sort((a, b) => b - a) : [selectedYear, lastYear];
    const bestByYear = yearsToShow
      .map(year => {
        const yearData = year === selectedYear 
          ? currentYearData.map(d => ({ ...d, year }))
          : historicalData.filter(d => d.year === year);
        const best = yearData.reduce((b, c) => c.revenue > (b?.revenue || 0) ? c : b, yearData[0] || null);
        return best && best.revenue > 0 ? { year, month: best.month, revenue: best.revenue } : null;
      })
      .filter(Boolean) as { year: number; month: string; revenue: number }[];

    // Ranking of all best months (sorted by revenue)
    const allTimeBestMonths = [...bestByYear].sort((a, b) => b.revenue - a.revenue);
    
    // Current year's best month position in the all-time ranking
    const currentRank = allTimeBestMonths.findIndex(b => b.year === selectedYear) + 1;
    
    // All-time record
    const allTimeRecord = allTimeBestMonths[0] || null;

    // Is current year a new record?
    const isNewRecord = currentRank === 1 && bestMonth && bestMonth.revenue > 0;

    // % vs last year best
    const vsLastYearBest = bestMonth && bestMonthLastYear && bestMonthLastYear.revenue > 0
      ? ((bestMonth.revenue - bestMonthLastYear.revenue) / bestMonthLastYear.revenue) * 100
      : null;

    // CAGR calculation (Compound Annual Growth Rate of best months)
    const sortedByYear = [...bestByYear].sort((a, b) => a.year - b.year);
    const firstYearBest = sortedByYear[0];
    const lastYearBest = sortedByYear[sortedByYear.length - 1];
    const yearsSpan = lastYearBest && firstYearBest ? lastYearBest.year - firstYearBest.year : 0;
    const cagr = yearsSpan > 0 && firstYearBest && lastYearBest && firstYearBest.revenue > 0
      ? (Math.pow(lastYearBest.revenue / firstYearBest.revenue, 1 / yearsSpan) - 1) * 100
      : 0;

    // Total evolution percentage (first year to current)
    const totalEvolution = firstYearBest && lastYearBest && firstYearBest.revenue > 0
      ? ((lastYearBest.revenue - firstYearBest.revenue) / firstYearBest.revenue) * 100
      : 0;

    // Months above goal
    const monthsAboveGoal = monthsWithData.filter(d => d.goal > 0 && d.revenue >= d.goal).length;
    
    // Accumulated comparison (YoY)
    const currentYearTotal = monthsWithData.reduce((sum, d) => sum + d.revenue, 0);
    const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const lastMonthName = monthsWithData[monthsWithData.length - 1]?.month || 'Jan';
    const lastMonthIndex = monthOrder.indexOf(lastMonthName);
    
    const lastYearSamePeriod = historicalData
      .filter(d => d.year === lastYear && monthOrder.indexOf(d.month) <= lastMonthIndex)
      .reduce((sum, d) => sum + d.revenue, 0);
    
    const growthVsLastYear = lastYearSamePeriod > 0 
      ? ((currentYearTotal - lastYearSamePeriod) / lastYearSamePeriod) * 100 
      : 0;

    return { 
      bestMonth, 
      bestMonthVsGoal, 
      bestMonthLastYear,
      isNewRecord,
      vsLastYearBest,
      bestByYear,
      allTimeBestMonths,
      currentRank,
      allTimeRecord,
      cagr,
      totalEvolution,
      firstYear: firstYearBest?.year,
      monthsAboveGoal, 
      totalMonths: monthsWithData.length,
      growthVsLastYear,
      lastMonthName,
    };
  }, [currentYearData, historicalData, lastYear, selectedYear, availableYears]);

  // Helper to get rank suffix
  const getRankSuffix = (rank: number): string => {
    if (rank === 1) return '🏆 Recorde All-Time!';
    if (rank === 2) return '2º melhor da história';
    if (rank === 3) return '3º melhor da história';
    return `${rank}º all-time`;
  };

  // Complete historical tooltip content
  const bestMonthTooltipContent = useMemo(() => {
    if (!insights.bestByYear || insights.bestByYear.length === 0) {
      return 'Mês com o maior faturamento registrado no ano.';
    }
    
    const { currentRank, allTimeRecord, cagr, totalEvolution, firstYear, bestByYear, allTimeBestMonths } = insights;
    
    // Header with position and stats
    const header = [
      '📊 ANÁLISE HISTÓRICA COMPLETA',
      '',
      `📍 Posição Atual: ${currentRank > 0 ? getRankSuffix(currentRank) : '-'}`,
      allTimeRecord ? `🏆 Recorde All-Time: ${allTimeRecord.month}/${allTimeRecord.year} - ${formatCurrency(allTimeRecord.revenue)}` : '',
      cagr !== 0 ? `📈 Crescimento Médio: ${cagr >= 0 ? '+' : ''}${cagr.toFixed(0)}% ao ano` : '',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'TIMELINE DE MELHORES MESES:',
      '',
    ].filter(Boolean);

    // Timeline - show all years
    const timeline = bestByYear.map((b, i) => {
      const isRecordYear = allTimeBestMonths[0]?.year === b.year;
      return `• ${b.year}: ${b.month} - ${formatCurrency(b.revenue)}${i === 0 ? ' ← Atual' : ''}${isRecordYear && i !== 0 ? ' 🏆' : ''}`;
    });

    // Footer with total evolution
    const footer = firstYear && totalEvolution !== 0 ? [
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `↗ Desde ${firstYear}: ${totalEvolution >= 0 ? '+' : ''}${totalEvolution.toFixed(0)}% de evolução`,
    ] : [];

    return [...header, ...timeline, ...footer].join('\n');
  }, [insights]);

  // Comparison badge for best month
  const comparisonBadge = useMemo(() => {
    const { isNewRecord, currentRank, vsLastYearBest } = insights;
    
    if (isNewRecord) {
      return { text: '🏆 Novo Recorde!', color: 'amber' as const };
    }
    
    // Show ranking if not first place
    if (currentRank > 1 && currentRank <= 3) {
      return { text: `${currentRank}º all-time`, color: 'emerald' as const };
    }
    
    // Fall back to comparison with last year
    if (vsLastYearBest !== null) {
      return vsLastYearBest >= 0
        ? { text: `+${vsLastYearBest.toFixed(0)}% vs ${lastYear}`, color: 'emerald' as const }
        : { text: `${vsLastYearBest.toFixed(0)}% vs ${lastYear}`, color: 'red' as const };
    }
    
    return null;
  }, [insights, lastYear]);

  const cards = [
    {
      icon: Trophy,
      title: 'Melhor Mês',
      value: insights.bestMonth ? `${insights.bestMonth.month}/${selectedYear}` : '-',
      detail: insights.bestMonth ? formatCurrency(insights.bestMonth.revenue) : '-',
      badge: insights.bestMonthVsGoal >= 0 
        ? `+${insights.bestMonthVsGoal.toFixed(0)}% vs meta` 
        : `${insights.bestMonthVsGoal.toFixed(0)}% vs meta`,
      badgeColor: insights.bestMonthVsGoal >= 0 ? 'emerald' : 'red',
      secondaryBadge: comparisonBadge,
      iconBg: insights.isNewRecord 
        ? 'bg-amber-500/20 text-amber-500' 
        : 'bg-amber-500/10 text-amber-500',
      iconPulse: insights.isNewRecord,
      tooltip: bestMonthTooltipContent,
      footer: insights.allTimeRecord && !insights.isNewRecord
        ? `Recorde: ${insights.allTimeRecord.month}/${insights.allTimeRecord.year} (${formatCurrency(insights.allTimeRecord.revenue)})`
        : null,
    },
    {
      icon: Target,
      title: 'Metas Batidas',
      value: `${insights.monthsAboveGoal}/${insights.totalMonths}`,
      detail: 'meses acima da meta',
      badge: insights.totalMonths > 0 
        ? `${((insights.monthsAboveGoal / insights.totalMonths) * 100).toFixed(0)}% de sucesso`
        : '-',
      badgeColor: insights.monthsAboveGoal >= insights.totalMonths / 2 ? 'emerald' : 'amber',
      iconBg: 'bg-primary/10 text-primary',
      tooltip: 'Contagem de quantos meses você atingiu ou superou a meta estabelecida. Indica consistência na execução.',
    },
    {
      icon: insights.growthVsLastYear >= 0 ? TrendingUp : TrendingDown,
      title: `Comparativo ${selectedYear} vs ${lastYear}`,
      value: `${insights.growthVsLastYear >= 0 ? '+' : ''}${insights.growthVsLastYear.toFixed(1)}%`,
      detail: `acumulado Jan-${insights.lastMonthName}`,
      badge: insights.growthVsLastYear >= 0 ? 'Crescendo' : 'Retraindo',
      badgeColor: insights.growthVsLastYear >= 0 ? 'emerald' : 'red',
      iconBg: insights.growthVsLastYear >= 0 
        ? 'bg-emerald-500/10 text-emerald-500' 
        : 'bg-red-500/10 text-red-500',
      tooltip: 'Comparação do faturamento acumulado no mesmo período entre os dois anos. Mostra se o negócio está crescendo ou retraindo.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
    >
      <h4 className="text-sm font-bold text-muted-foreground mb-4 px-1 flex items-center gap-2 uppercase tracking-widest">
        <Zap size={14} className="text-primary" />
        Análise Comparativa
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {cards.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon size={16} className={'iconPulse' in card && card.iconPulse ? 'animate-pulse' : ''} />
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    card.badgeColor === 'emerald' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : card.badgeColor === 'amber'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {card.badge}
                  </span>
                  {'secondaryBadge' in card && card.secondaryBadge && (
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                      card.secondaryBadge.color === 'emerald' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : card.secondaryBadge.color === 'amber'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {card.secondaryBadge.text}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </p>
                <InfoTooltip text={card.tooltip} size="sm" />
              </div>
              <p className="text-xl font-bold text-foreground mb-1">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {card.detail}
              </p>
              
              {'footer' in card && card.footer && (
                <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
                  {card.footer}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ComparativeInsights;
