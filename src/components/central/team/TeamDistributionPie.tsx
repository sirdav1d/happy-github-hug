import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Salesperson } from "@/types";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import InfoTooltip from "../InfoTooltip";

interface TeamDistributionPieProps {
  team: Salesperson[];
}

const COLORS = [
  "hsl(221 83% 53%)", // primary blue
  "hsl(186 94% 50%)", // cyan
  "hsl(160 84% 39%)", // emerald
  "hsl(38 92% 50%)", // amber
  "hsl(280 67% 60%)", // purple
  "hsl(0 84% 60%)", // red
  "hsl(200 70% 50%)", // light blue
  "hsl(120 60% 45%)", // green
];

const TeamDistributionPie = ({ team }: TeamDistributionPieProps) => {
  const { chartData, totalRevenue, concentrationRisk, top2Percentage } = useMemo(() => {
    const activeTeam = team.filter((member) => member.active && !member.isPlaceholder);
    const total = activeTeam.reduce((sum, member) => sum + member.totalRevenue, 0);
    
    const data = activeTeam
      .map((member) => ({
        name: member.name.split(' ')[0],
        fullName: member.name,
        value: member.totalRevenue,
        percentage: total > 0 ? (member.totalRevenue / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // Calculate concentration risk (top 2 sellers)
    const top2 = data.slice(0, 2).reduce((sum, d) => sum + d.percentage, 0);
    let risk: 'low' | 'moderate' | 'high' = 'low';
    if (top2 > 50) risk = 'high';
    else if (top2 >= 40) risk = 'moderate';

    return {
      chartData: data,
      totalRevenue: total,
      concentrationRisk: risk,
      top2Percentage: Math.round(top2),
    };
  }, [team]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskConfig = (risk: 'low' | 'moderate' | 'high') => {
    switch (risk) {
      case 'high':
        return {
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          icon: AlertTriangle,
          label: 'Alto',
          message: `Os 2 maiores vendedores representam ${top2Percentage}% do faturamento. Recomenda-se diversificar a carteira.`,
        };
      case 'moderate':
        return {
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          icon: Info,
          label: 'Moderado',
          message: `Os 2 maiores vendedores representam ${top2Percentage}% do faturamento. Atenção à dependência.`,
        };
      default:
        return {
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          icon: CheckCircle,
          label: 'Baixo',
          message: `Boa distribuição! Os 2 maiores vendedores representam ${top2Percentage}% do faturamento.`,
        };
    }
  };

  const riskConfig = getRiskConfig(concentrationRisk);
  const RiskIcon = riskConfig.icon;

  const chartConfig = chartData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.fullName,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  if (chartData.length === 0) return null;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          Participação no Faturamento
          <InfoTooltip text="Distribuição percentual do faturamento por vendedor. Mostra quanto cada um representa do total da equipe." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }) => `${name}: ${Math.round(percentage)}%`}
                labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const data = item.payload;
                      return (
                        <div className="space-y-1">
                          <div className="font-medium">{data.fullName}</div>
                          <div>{formatCurrency(data.value)}</div>
                          <div>{data.percentage.toFixed(1)}% do total</div>
                        </div>
                      );
                    }}
                  />
                }
              />
            </PieChart>
          </ChartContainer>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Ranking de Participação</h4>
              {chartData.slice(0, 5).map((item, index) => (
                <div key={item.fullName} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{item.fullName}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
              {chartData.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{chartData.length - 5} outros vendedores
                </p>
              )}
            </div>

            <div className={`p-3 rounded-lg ${riskConfig.bgColor}`}>
              <div className="flex items-center gap-2 mb-1">
                <RiskIcon className={`h-4 w-4 ${riskConfig.color}`} />
                <span className={`text-sm font-medium ${riskConfig.color}`}>
                  Risco de Concentração: {riskConfig.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{riskConfig.message}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamDistributionPie;
