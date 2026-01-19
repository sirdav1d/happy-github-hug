import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Rocket, Target, Activity, Award, Zap, BarChart3 } from 'lucide-react';
import { JourneyMetrics } from '@/types/mentorship';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import InfoTooltip from '../../InfoTooltip';

interface EvolutionMetricsProps {
  metrics: JourneyMetrics;
}

const EvolutionMetrics: React.FC<EvolutionMetricsProps> = ({ metrics }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  // Preparar dados para sparkline
  const sparklineData = metrics.milestones
    .filter(m => m.status !== 'upcoming' && m.revenue > 0)
    .map(m => ({
      month: m.calendarMonth,
      revenue: m.revenue,
      goal: m.goal,
    }));

  const metricCards = [
    {
      label: 'Metas Batidas',
      value: `${metrics.monthsWithGoalMet}/${metrics.currentMonth}`,
      icon: Target,
      color: metrics.monthsWithGoalMet > 0 ? 'text-emerald-500' : 'text-muted-foreground',
      bgColor: metrics.monthsWithGoalMet > 0 ? 'bg-emerald-500/10' : 'bg-muted',
      description: `${((metrics.monthsWithGoalMet / Math.max(1, metrics.currentMonth)) * 100).toFixed(0)}% de aproveitamento`,
      tooltip: 'Quantidade de meses onde o faturamento foi igual ou superior à meta. Fórmula: Meses com faturamento ≥ meta ÷ Total de meses transcorridos × 100',
    },
    {
      label: 'Streak Atual',
      value: metrics.consecutiveGoalsMet,
      icon: Zap,
      color: metrics.consecutiveGoalsMet >= 2 ? 'text-orange-500' : 'text-muted-foreground',
      bgColor: metrics.consecutiveGoalsMet >= 2 ? 'bg-orange-500/10' : 'bg-muted',
      description: metrics.consecutiveGoalsMet > 0 ? `Melhor: ${metrics.bestStreak} meses` : 'Bata a meta para iniciar',
      tooltip: 'Sequência de meses consecutivos em que você bateu a meta. Reinicia quando a meta não é atingida. Quanto maior o streak, mais consistente é sua performance.',
    },
    {
      label: 'Crescimento',
      value: `${metrics.growthSinceStart >= 0 ? '+' : ''}${metrics.growthSinceStart.toFixed(0)}%`,
      icon: TrendingUp,
      color: metrics.growthSinceStart > 0 ? 'text-primary' : 'text-muted-foreground',
      bgColor: metrics.growthSinceStart > 0 ? 'bg-primary/10' : 'bg-muted',
      description: 'Desde o início da mentoria',
      tooltip: 'Variação percentual do faturamento entre o primeiro mês e o mês mais recente da jornada. Fórmula: (Faturamento Atual - Faturamento Inicial) ÷ Faturamento Inicial × 100',
    },
    {
      label: 'Consistência',
      value: `${metrics.consistencyScore.toFixed(0)}%`,
      icon: Activity,
      color: metrics.consistencyScore >= 70 ? 'text-blue-500' : metrics.consistencyScore >= 50 ? 'text-amber-500' : 'text-red-500',
      bgColor: metrics.consistencyScore >= 70 ? 'bg-blue-500/10' : metrics.consistencyScore >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10',
      description: metrics.consistencyScore >= 70 ? 'Excelente regularidade' : 'Trabalhe a regularidade',
      tooltip: 'Mede a regularidade do faturamento mês a mês. Quanto menor a variação entre os meses, maior a consistência. Fórmula: 100 - (Desvio Padrão ÷ Média × 100). Acima de 70% é excelente.',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-xl ${metric.bgColor} border border-border/50`}
          >
            <div className="flex items-center gap-2 mb-1">
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </span>
              <InfoTooltip text={metric.tooltip} size="sm" />
            </div>
            <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{metric.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Evolution Chart + Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sparkline Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Evolução do Faturamento</span>
          </div>
          
          {sparklineData.length >= 2 ? (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
              Dados insuficientes para gráfico
            </div>
          )}
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          {/* Best Month */}
          {metrics.bestMonth && metrics.bestMonth.revenue > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Melhor Mês</span>
              </div>
              <p className="text-lg font-bold mt-1">{formatCurrency(metrics.bestMonth.revenue)}</p>
              <p className="text-xs text-muted-foreground">{metrics.bestMonth.month}</p>
            </div>
          )}

          {/* Biggest Leap */}
          {metrics.biggestLeap && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Maior Salto</span>
              </div>
              <p className="text-lg font-bold mt-1">+{metrics.biggestLeap.growth.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">
                {metrics.biggestLeap.fromMonth} → {metrics.biggestLeap.toMonth}
              </p>
            </div>
          )}

          {/* No highlights yet */}
          {!metrics.bestMonth?.revenue && !metrics.biggestLeap && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
              <p className="text-sm text-muted-foreground">
                Continue vendendo para desbloquear destaques!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EvolutionMetrics;
