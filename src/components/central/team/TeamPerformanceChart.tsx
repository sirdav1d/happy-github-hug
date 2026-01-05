import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { Salesperson } from "@/types";
import InfoTooltip from "../InfoTooltip";

interface TeamPerformanceChartProps {
  team: Salesperson[];
}

const TeamPerformanceChart = ({ team }: TeamPerformanceChartProps) => {
  const chartData = useMemo(() => {
    return team
      .filter((member) => member.active && !member.isPlaceholder)
      .map((member) => {
        const performance = member.monthlyGoal > 0 
          ? (member.totalRevenue / member.monthlyGoal) * 100 
          : 0;
        return {
          name: member.name.split(' ')[0], // First name only for chart
          fullName: member.name,
          performance: Math.round(performance * 10) / 10,
          revenue: member.totalRevenue,
          goal: member.monthlyGoal,
        };
      })
      .sort((a, b) => b.performance - a.performance);
  }, [team]);

  const getBarColor = (performance: number) => {
    if (performance >= 100) return "hsl(160 84% 39%)"; // emerald
    if (performance >= 80) return "hsl(38 92% 50%)"; // amber
    return "hsl(0 84% 60%)"; // destructive/red
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartConfig = {
    performance: {
      label: "Performance",
    },
  };

  if (chartData.length === 0) return null;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          Performance vs Meta
          <InfoTooltip text="Gráfico de barras mostrando o percentual da meta atingido por cada vendedor. Verde: ≥100%, Amarelo: 80-99%, Vermelho: <80%." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground">≥ 100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-muted-foreground">80-99%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-destructive" />
            <span className="text-muted-foreground">&lt; 80%</span>
          </div>
        </div>
        
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <XAxis 
              type="number" 
              domain={[0, Math.max(120, ...chartData.map(d => d.performance))]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              width={55}
            />
            <ReferenceLine 
              x={100} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{ 
                value: 'Meta', 
                position: 'top', 
                fill: 'hsl(var(--primary))',
                fontSize: 11
              }}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const data = item.payload;
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{data.fullName}</div>
                        <div>Performance: {data.performance}%</div>
                        <div>Realizado: {formatCurrency(data.revenue)}</div>
                        <div>Meta: {formatCurrency(data.goal)}</div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar 
              dataKey="performance" 
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.performance)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceChart;
