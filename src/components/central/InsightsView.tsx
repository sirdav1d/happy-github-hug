import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardData } from "@/types";
import { cn } from "@/lib/utils";

interface InsightsViewProps {
  data: DashboardData;
}

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "danger";
  title: string;
  description: string;
  icon: typeof TrendingUp;
  metric?: string;
}

const InsightsView = ({ data }: InsightsViewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate insights based on data
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    const { kpis, currentYearData, team } = data;

    // Progress insight
    const progress = (kpis.annualRealized / kpis.annualGoal) * 100;
    const completedMonths = currentYearData.filter((m) => m.revenue > 0).length;
    const expectedProgress = (completedMonths / 12) * 100;

    if (progress >= expectedProgress) {
      insights.push({
        id: "progress-ahead",
        type: "success",
        title: "Performance Acima do Esperado",
        description: `Você está ${(progress - expectedProgress).toFixed(1)}% acima do ritmo ideal para alcançar sua meta anual.`,
        icon: CheckCircle,
        metric: `${progress.toFixed(1)}% completo`,
      });
    } else {
      insights.push({
        id: "progress-behind",
        type: "warning",
        title: "Atenção ao Ritmo de Vendas",
        description: `Você está ${(expectedProgress - progress).toFixed(1)}% abaixo do ritmo ideal. Considere ajustar suas estratégias.`,
        icon: AlertTriangle,
        metric: `${progress.toFixed(1)}% completo`,
      });
    }

    // Growth insight
    if (kpis.lastYearGrowth > 0) {
      insights.push({
        id: "growth-positive",
        type: "success",
        title: "Crescimento Consistente",
        description: `Você cresceu ${kpis.lastYearGrowth}% em relação ao ano anterior. Continue com as estratégias que estão funcionando.`,
        icon: TrendingUp,
        metric: `+${kpis.lastYearGrowth}%`,
      });
    } else if (kpis.lastYearGrowth < 0) {
      insights.push({
        id: "growth-negative",
        type: "danger",
        title: "Queda nas Vendas",
        description: `Houve uma redução de ${Math.abs(kpis.lastYearGrowth)}% em relação ao ano anterior. Revise suas estratégias de captação.`,
        icon: TrendingDown,
        metric: `${kpis.lastYearGrowth}%`,
      });
    }

    // Conversion rate insight
    if (kpis.conversionRate >= 30) {
      insights.push({
        id: "conversion-high",
        type: "success",
        title: "Excelente Taxa de Conversão",
        description: `Sua taxa de conversão de ${kpis.conversionRate}% está acima da média do mercado. Mantenha a qualidade do atendimento.`,
        icon: Target,
        metric: `${kpis.conversionRate}%`,
      });
    } else if (kpis.conversionRate < 20) {
      insights.push({
        id: "conversion-low",
        type: "warning",
        title: "Oportunidade de Melhoria na Conversão",
        description: `Uma taxa de conversão de ${kpis.conversionRate}% indica espaço para melhorias no processo de vendas.`,
        icon: Target,
        metric: `${kpis.conversionRate}%`,
      });
    }

    // LTV/CAC insight
    const ltvCacRatio = kpis.cac > 0 ? kpis.ltv / kpis.cac : 0;
    if (ltvCacRatio >= 3) {
      insights.push({
        id: "ltv-cac-good",
        type: "success",
        title: "Ótima Relação LTV/CAC",
        description: `Sua relação LTV/CAC de ${ltvCacRatio.toFixed(1)}x indica que o investimento em aquisição está gerando bons retornos.`,
        icon: DollarSign,
        metric: `${ltvCacRatio.toFixed(1)}x`,
      });
    } else if (ltvCacRatio > 0 && ltvCacRatio < 2) {
      insights.push({
        id: "ltv-cac-low",
        type: "danger",
        title: "LTV/CAC Precisa Melhorar",
        description: `Uma relação LTV/CAC de ${ltvCacRatio.toFixed(1)}x está abaixo do ideal. Revise seus custos de aquisição.`,
        icon: DollarSign,
        metric: `${ltvCacRatio.toFixed(1)}x`,
      });
    }

    // Team insight
    const activeTeam = team.filter((m) => m.active && !m.isPlaceholder);
    if (activeTeam.length > 0) {
      const avgPerformance = activeTeam.reduce((sum, m) => {
        const perf = m.monthlyGoal > 0 ? (m.totalRevenue / m.monthlyGoal) * 100 : 0;
        return sum + perf;
      }, 0) / activeTeam.length;

      if (avgPerformance >= 100) {
        insights.push({
          id: "team-performing",
          type: "success",
          title: "Equipe Performando Bem",
          description: `A performance média da equipe está em ${avgPerformance.toFixed(1)}%, superando as metas estabelecidas.`,
          icon: Users,
          metric: `${avgPerformance.toFixed(1)}%`,
        });
      }
    }

    // Ticket insight
    if (kpis.averageTicket > 0) {
      insights.push({
        id: "ticket-info",
        type: "info",
        title: "Ticket Médio Atual",
        description: `Seu ticket médio de ${formatCurrency(kpis.averageTicket)} é uma métrica importante para acompanhar. Considere estratégias de upsell.`,
        icon: DollarSign,
        metric: formatCurrency(kpis.averageTicket),
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getTypeStyles = (type: Insight["type"]) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          icon: "text-emerald-500",
          badge: "bg-emerald-500/20 text-emerald-600",
        };
      case "warning":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          icon: "text-amber-500",
          badge: "bg-amber-500/20 text-amber-600",
        };
      case "danger":
        return {
          bg: "bg-destructive/10",
          border: "border-destructive/20",
          icon: "text-destructive",
          badge: "bg-destructive/20 text-destructive",
        };
      default:
        return {
          bg: "bg-primary/10",
          border: "border-primary/20",
          icon: "text-primary",
          badge: "bg-primary/20 text-primary",
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="p-3 rounded-xl bg-primary/10">
          <Lightbulb className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Insights Inteligentes</h2>
          <p className="text-sm text-muted-foreground">
            Análises automáticas baseadas nos seus dados de vendas
          </p>
        </div>
      </motion.div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const styles = getTypeStyles(insight.type);
          const Icon = insight.icon;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn("border", styles.bg, styles.border)}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2 rounded-lg", styles.bg)}>
                      <Icon className={cn("h-5 w-5", styles.icon)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{insight.title}</h3>
                        {insight.metric && (
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles.badge)}>
                            {insight.metric}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {insights.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum insight disponível
          </h3>
          <p className="text-muted-foreground">
            Adicione mais dados para gerar análises automáticas.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InsightsView;
