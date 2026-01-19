import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, AlertCircle, Users, Receipt, Percent, TrendingUp } from "lucide-react";
import InfoTooltip from "../InfoTooltip";

interface EnrichedSalesperson {
  id: string;
  name: string;
  active: boolean;
  isPlaceholder?: boolean;
  totalRevenue: number;
  monthlyGoal: number;
  averageTicket?: number;
  conversionRate?: number;
  salesCount?: number;
  attendances?: number;
  performance?: number;
  participation?: number;
}

interface TeamInsightsProps {
  team: EnrichedSalesperson[];
  month?: number;
  year?: number;
}

const TeamInsights = ({ team }: TeamInsightsProps) => {
  const insights = useMemo(() => {
    // Usa os dados já enriquecidos que vêm do TeamView
    const activeTeam = team.filter((member) => member.active && !member.isPlaceholder);
    const totalRevenue = activeTeam.reduce((sum, m) => sum + m.totalRevenue, 0);

    // Calcula performance/participation se não vier pronto
    const teamWithMetrics = activeTeam.map((member) => ({
      ...member,
      performance: member.performance ?? (member.monthlyGoal > 0 
        ? (member.totalRevenue / member.monthlyGoal) * 100 
        : 0),
      participation: member.participation ?? (totalRevenue > 0 
        ? (member.totalRevenue / totalRevenue) * 100 
        : 0),
    }));

    // Sort by performance
    const sortedByPerformance = [...teamWithMetrics].sort((a, b) => b.performance - a.performance);

    const topPerformer = sortedByPerformance[0];
    const aboveGoal = sortedByPerformance.filter((m) => m.performance >= 100);
    const needsAttention = sortedByPerformance.filter((m) => m.performance < 100);
    const belowGoal = sortedByPerformance.filter((m) => m.performance < 80);

    // Concentration analysis
    const top2Participation = sortedByPerformance
      .slice(0, 2)
      .reduce((sum, m) => sum + m.participation, 0);

    // Find best metrics from enriched team data
    const membersWithSales = activeTeam.filter(m => (m.salesCount ?? 0) > 0);
    
    let bestConversion: EnrichedSalesperson | null = null;
    let bestTicket: EnrichedSalesperson | null = null;

    if (membersWithSales.length > 0) {
      bestConversion = membersWithSales.reduce((best, curr) => 
        (curr.conversionRate ?? 0) > (best.conversionRate ?? 0) ? curr : best, membersWithSales[0]);
      bestTicket = membersWithSales.reduce((best, curr) => 
        (curr.averageTicket ?? 0) > (best.averageTicket ?? 0) ? curr : best, membersWithSales[0]);
    }

    // Team averages from enriched data
    const teamTotalSales = activeTeam.reduce((sum, m) => sum + (m.salesCount ?? 0), 0);
    const teamTotalAttendances = activeTeam.reduce((sum, m) => sum + (m.attendances ?? 0), 0);
    const teamAvgTicket = teamTotalSales > 0 
      ? totalRevenue / teamTotalSales 
      : 0;
    const teamConversionRate = teamTotalAttendances > 0 
      ? (teamTotalSales / teamTotalAttendances) * 100 
      : 0;

    return {
      topPerformer,
      aboveGoalCount: aboveGoal.length,
      belowGoalCount: belowGoal.length,
      needsAttentionCount: needsAttention.length,
      top2Participation: Math.round(top2Participation),
      totalMembers: activeTeam.length,
      bestConversion,
      bestTicket,
      teamAvgTicket,
      teamConversionRate,
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

  if (!insights.topPerformer) return null;

  const insightCards = [
    {
      title: "Destaque do Mês",
      tooltip: "Vendedor com maior percentual da meta atingida. Fórmula: Faturamento ÷ Meta × 100",
      icon: Trophy,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      content: (
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            {insights.topPerformer.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Atingiu{" "}
            <span className="text-emerald-500 font-medium">
              {insights.topPerformer.performance?.toFixed(0)}%
            </span>{" "}
            da meta
          </p>
          <p className="text-sm text-muted-foreground">
            Faturou {formatCurrency(insights.topPerformer.totalRevenue)} (
            {insights.topPerformer.participation?.toFixed(1)}% do total)
          </p>
        </div>
      ),
    },
    {
      title: "Atenção Necessária",
      tooltip: "Vendedores abaixo de 100% da meta. Crítico: abaixo de 80%. Fórmula: Faturamento ÷ Meta × 100",
      icon: AlertCircle,
      iconColor: insights.needsAttentionCount > 0 ? "text-destructive" : "text-emerald-500",
      bgColor: insights.needsAttentionCount > 0 ? "bg-destructive/10" : "bg-emerald-500/10",
      content: (
        <div className="space-y-1">
          {insights.needsAttentionCount > 0 ? (
            <>
              <p className="text-lg font-semibold text-foreground">
                {insights.needsAttentionCount} vendedor{insights.needsAttentionCount > 1 ? 'es' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Ainda não bateram a meta este mês
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="text-destructive font-medium">{insights.belowGoalCount}</span> abaixo de 80%
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-emerald-500">
                Todos na meta!
              </p>
              <p className="text-sm text-muted-foreground">
                Equipe performando acima de 100%
              </p>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Concentração de Vendas",
      tooltip: "Mede dependência nos top 2 vendedores. Risco: >50%. Fórmula: (Faturamento Top 2 ÷ Faturamento Total) × 100",
      icon: Users,
      iconColor: insights.top2Participation > 50 ? "text-amber-500" : "text-primary",
      bgColor: insights.top2Participation > 50 ? "bg-amber-500/10" : "bg-primary/10",
      content: (
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            Top 2: {insights.top2Participation}%
          </p>
          <p className="text-sm text-muted-foreground">
            {insights.top2Participation > 50
              ? "Alta dependência dos top performers"
              : "Boa distribuição de vendas"}
          </p>
          <p className="text-sm text-muted-foreground">
            {insights.totalMembers} vendedores ativos na equipe
          </p>
        </div>
      ),
    },
  ];

  // Cards de eficiência - só exibe se houver dados
  const efficiencyCards: typeof insightCards = [];

  if (insights.bestTicket && (insights.bestTicket.averageTicket ?? 0) > 0) {
    efficiencyCards.push({
      title: "Maior Ticket Médio",
      tooltip: "Vendedor com maior valor médio por venda. Fórmula: Faturamento ÷ Nº Vendas",
      icon: Receipt,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      content: (
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            {insights.bestTicket.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Ticket:{" "}
            <span className="text-primary font-medium">
              {formatCurrency(insights.bestTicket.averageTicket ?? 0)}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Média equipe: {formatCurrency(insights.teamAvgTicket)}
          </p>
        </div>
      ),
    });
  }

  if (insights.bestConversion && (insights.bestConversion.conversionRate ?? 0) > 0) {
    efficiencyCards.push({
      title: "Maior Conversão",
      tooltip: "Vendedor mais eficiente em converter atendimentos. Fórmula: (Nº Vendas ÷ Atendimentos) × 100",
      icon: Percent,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      content: (
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            {insights.bestConversion.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Taxa:{" "}
            <span className="text-emerald-500 font-medium">
              {(insights.bestConversion.conversionRate ?? 0).toFixed(1)}%
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Média equipe: {insights.teamConversionRate.toFixed(1)}%
          </p>
        </div>
      ),
    });
  }

  if (insights.teamAvgTicket > 0 || insights.teamConversionRate > 0) {
    efficiencyCards.push({
      title: "Eficiência Operacional",
      tooltip: "Médias da equipe. Ticket: Faturamento Total ÷ Total Vendas. Conversão: (Total Vendas ÷ Total Atendimentos) × 100",
      icon: TrendingUp,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      content: (
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            Métricas da Equipe
          </p>
          <p className="text-sm text-muted-foreground">
            Ticket Médio:{" "}
            <span className="text-foreground font-medium">
              {formatCurrency(insights.teamAvgTicket)}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Conversão:{" "}
            <span className="text-foreground font-medium">
              {insights.teamConversionRate > 0 ? `${insights.teamConversionRate.toFixed(1)}%` : '—'}
            </span>
          </p>
        </div>
      ),
    });
  }

  const allCards = [...insightCards, ...efficiencyCards];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {allCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card border-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                  {card.title}
                  {card.tooltip && <InfoTooltip text={card.tooltip} />}
                </CardTitle>
              </CardHeader>
              <CardContent>{card.content}</CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TeamInsights;
