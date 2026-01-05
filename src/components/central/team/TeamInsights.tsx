import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Salesperson } from "@/types";
import { Trophy, AlertCircle, Users, TrendingUp } from "lucide-react";

interface TeamInsightsProps {
  team: Salesperson[];
}

const TeamInsights = ({ team }: TeamInsightsProps) => {
  const insights = useMemo(() => {
    const activeTeam = team.filter((member) => member.active && !member.isPlaceholder);
    const totalRevenue = activeTeam.reduce((sum, m) => sum + m.totalRevenue, 0);

    // Sort by performance
    const sortedByPerformance = [...activeTeam]
      .map((member) => ({
        ...member,
        performance: member.monthlyGoal > 0 
          ? (member.totalRevenue / member.monthlyGoal) * 100 
          : 0,
        participation: totalRevenue > 0 
          ? (member.totalRevenue / totalRevenue) * 100 
          : 0,
      }))
      .sort((a, b) => b.performance - a.performance);

    const topPerformer = sortedByPerformance[0];
    const aboveGoal = sortedByPerformance.filter((m) => m.performance >= 100);
    const belowGoal = sortedByPerformance.filter((m) => m.performance < 80);
    const needsAttention = sortedByPerformance.filter((m) => m.performance < 100);

    // Concentration analysis
    const top2Participation = sortedByPerformance
      .slice(0, 2)
      .reduce((sum, m) => sum + m.participation, 0);

    return {
      topPerformer,
      aboveGoalCount: aboveGoal.length,
      belowGoalCount: belowGoal.length,
      needsAttentionCount: needsAttention.length,
      top2Participation: Math.round(top2Participation),
      totalMembers: activeTeam.length,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {insightCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-card border-border h-full`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                  {card.title}
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
