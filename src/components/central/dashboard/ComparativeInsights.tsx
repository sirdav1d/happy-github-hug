import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Trophy, Target, Zap, Calculator } from 'lucide-react';
import { MonthlyData } from '@/types';

interface ComparativeInsightsProps {
  currentYearData: MonthlyData[];
  historicalData: MonthlyData[];
  selectedYear: number;
  lastYear: number;
}

const ComparativeInsights = ({
  currentYearData,
  historicalData,
  selectedYear,
  lastYear,
}: ComparativeInsightsProps) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const insights = useMemo(() => {
    const monthsWithData = currentYearData.filter(d => d.revenue > 0);
    
    // Best month
    const bestMonth = monthsWithData.reduce((best, curr) => 
      curr.revenue > (best?.revenue || 0) ? curr : best, monthsWithData[0]);
    
    const bestMonthVsGoal = bestMonth && bestMonth.goal > 0 
      ? ((bestMonth.revenue - bestMonth.goal) / bestMonth.goal) * 100 
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

    // Annual projection (based on average monthly revenue)
    const avgMonthlyRevenue = monthsWithData.length > 0 
      ? currentYearTotal / monthsWithData.length 
      : 0;
    const projectedAnnual = avgMonthlyRevenue * 12;
    const annualGoal = currentYearData.reduce((sum, d) => sum + d.goal, 0);
    const projectedVsGoal = annualGoal > 0 
      ? ((projectedAnnual - annualGoal) / annualGoal) * 100 
      : 0;

    return { 
      bestMonth, 
      bestMonthVsGoal, 
      monthsAboveGoal, 
      totalMonths: monthsWithData.length,
      growthVsLastYear,
      projectedAnnual,
      projectedVsGoal,
      lastMonthName,
    };
  }, [currentYearData, historicalData, lastYear]);

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
      iconBg: 'bg-amber-500/10 text-amber-500',
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Icon size={16} />
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                  card.badgeColor === 'emerald' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : card.badgeColor === 'amber'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {card.badge}
                </span>
              </div>
              
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {card.title}
              </p>
              <p className="text-xl font-bold text-foreground mb-1">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {card.detail}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ComparativeInsights;
