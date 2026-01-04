import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Target } from 'lucide-react';
import { MonthlyData } from '@/types';

interface GoalPercentChartProps {
  currentYearData: MonthlyData[];
  selectedYear: number;
}

const GoalPercentChart: React.FC<GoalPercentChartProps> = ({ currentYearData, selectedYear }) => {
  // Calculate percentage of goal achieved for each month
  const chartData = currentYearData.map(d => {
    const percent = d.goal > 0 ? (d.revenue / d.goal) * 100 : 0;
    return {
      name: d.month,
      percent: percent,
      revenue: d.revenue,
      goal: d.goal,
      hasData: d.revenue > 0,
    };
  });

  // Get bar color based on percentage
  const getBarColor = (percent: number, hasData: boolean) => {
    if (!hasData) return 'hsl(var(--muted))';
    if (percent >= 100) return '#10b981'; // emerald
    if (percent >= 80) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  // Stats
  const monthsAboveGoal = chartData.filter(d => d.hasData && d.percent >= 100).length;
  const monthsWithData = chartData.filter(d => d.hasData).length;
  const avgPercent = monthsWithData > 0 
    ? chartData.filter(d => d.hasData).reduce((sum, d) => sum + d.percent, 0) / monthsWithData 
    : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-card backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-border"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Target className="text-primary" size={20} />
            % Meta Atingida por Mês
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Percentual da meta alcançada em cada mês de {selectedYear}
          </p>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 rounded-xl bg-muted/50">
            <p className="text-xl font-bold text-foreground">{monthsAboveGoal}/{monthsWithData}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Meses acima</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-muted/50">
            <p className={`text-xl font-bold ${avgPercent >= 100 ? 'text-emerald-500' : avgPercent >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
              {avgPercent.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Média</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
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
            
            {/* 100% Reference Line */}
            <ReferenceLine 
              y={100} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="8 4" 
              strokeWidth={2}
              label={{ 
                value: 'Meta 100%', 
                position: 'right',
                fill: 'hsl(var(--primary))',
                fontSize: 10,
                fontWeight: 600
              }}
            />
            
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                
                const data = payload[0]?.payload;
                if (!data.hasData) return null;
                
                return (
                  <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl p-4 shadow-xl min-w-[180px]">
                    <p className="text-sm font-bold text-foreground mb-3 pb-2 border-b border-border">{label}/{selectedYear}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Realizado</span>
                        <span className="text-sm font-bold text-foreground">{formatCurrency(data.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Meta</span>
                        <span className="text-sm font-medium text-muted-foreground">{formatCurrency(data.goal)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">% Atingido</span>
                        <span className={`text-sm font-bold ${
                          data.percent >= 100 ? 'text-emerald-500' : 
                          data.percent >= 80 ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {data.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            
            <Bar dataKey="percent" radius={[6, 6, 0, 0]} maxBarSize={35}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percent, entry.hasData)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-xs font-medium text-muted-foreground">≥100% (Meta batida)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span className="text-xs font-medium text-muted-foreground">80-99% (Próximo)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-xs font-medium text-muted-foreground">&lt;80% (Atenção)</span>
        </div>
      </div>
    </motion.div>
  );
};

export default GoalPercentChart;
