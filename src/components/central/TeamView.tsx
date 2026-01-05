import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Target, Award, User, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Salesperson } from "@/types";
import { cn } from "@/lib/utils";
import InfoTooltip from "./InfoTooltip";
import TeamPerformanceChart from "./team/TeamPerformanceChart";
import TeamDistributionPie from "./team/TeamDistributionPie";
import TeamInsights from "./team/TeamInsights";

interface TeamViewProps {
  team: Salesperson[];
  monthlyGoal: number;
}

const TeamView = ({ team, monthlyGoal }: TeamViewProps) => {
  const activeTeam = useMemo(() => 
    team.filter((member) => member.active && !member.isPlaceholder),
    [team]
  );
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return "text-emerald-500";
    if (percentage >= 80) return "text-amber-500";
    return "text-destructive";
  };

  const stats = useMemo(() => {
    const totalRevenue = activeTeam.reduce((sum, member) => sum + member.totalRevenue, 0);
    const totalGoal = activeTeam.reduce((sum, member) => sum + member.monthlyGoal, 0);
    const teamPerformance = totalGoal > 0 ? (totalRevenue / totalGoal) * 100 : 0;

    const membersWithPerformance = activeTeam.map((member) => ({
      ...member,
      performance: member.monthlyGoal > 0 
        ? (member.totalRevenue / member.monthlyGoal) * 100 
        : 0,
      participation: totalRevenue > 0 
        ? (member.totalRevenue / totalRevenue) * 100 
        : 0,
    }));

    const sortedTeam = [...membersWithPerformance].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const aboveGoal = membersWithPerformance.filter((m) => m.performance >= 100).length;
    const belowGoal = membersWithPerformance.filter((m) => m.performance < 80).length;

    // Concentration risk
    const top2Participation = sortedTeam.slice(0, 2).reduce((sum, m) => sum + m.participation, 0);
    let concentrationRisk: 'Baixo' | 'Moderado' | 'Alto' = 'Baixo';
    if (top2Participation > 50) concentrationRisk = 'Alto';
    else if (top2Participation >= 40) concentrationRisk = 'Moderado';

    return {
      totalRevenue,
      totalGoal,
      teamPerformance,
      sortedTeam,
      aboveGoal,
      belowGoal,
      concentrationRisk,
      top2Participation: Math.round(top2Participation),
    };
  }, [activeTeam]);

  if (activeTeam.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum membro da equipe</h3>
        <p className="text-muted-foreground max-w-md">
          Adicione membros da sua equipe para acompanhar o desempenho individual e coletivo.
        </p>
      </motion.div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Alto': return 'text-destructive';
      case 'Moderado': return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Alto': return AlertTriangle;
      case 'Moderado': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  const RiskIcon = getRiskIcon(stats.concentrationRisk);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Stats - 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Performance Equipe
                <InfoTooltip text="Percentual do realizado em relação à meta total da equipe." />
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getPerformanceColor(stats.teamPerformance))}>
                {stats.teamPerformance.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(stats.totalRevenue)} de {formatCurrency(stats.totalGoal)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Acima da Meta
                <InfoTooltip text="Vendedores que atingiram ou superaram 100% da meta individual." />
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{stats.aboveGoal}</div>
              <p className="text-xs text-muted-foreground mt-1">
                de {activeTeam.length} vendedores
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Abaixo de 80%
                <InfoTooltip text="Vendedores com performance abaixo de 80% da meta. Precisam de atenção." />
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stats.belowGoal > 0 ? "text-destructive" : "text-emerald-500")}>
                {stats.belowGoal}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.belowGoal > 0 ? "precisam de suporte" : "todos performando bem"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Risco Concentração
                <InfoTooltip text="Mede a dependência dos top 2 vendedores. Alto (>50%), Moderado (40-50%), Baixo (<40%)." />
              </CardTitle>
              <RiskIcon className={cn("h-4 w-4", getRiskColor(stats.concentrationRisk))} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getRiskColor(stats.concentrationRisk))}>
                {stats.concentrationRisk}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Top 2: {stats.top2Participation}% do total
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights Cards */}
      <TeamInsights team={team} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TeamPerformanceChart team={team} />
        <TeamDistributionPie team={team} />
      </div>

      {/* Team Members Ranking */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            Ranking de Desempenho
            <InfoTooltip text="Lista ordenada por faturamento. Mostra a participação de cada vendedor no total." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.sortedTeam.map((member, index) => {
            const performance = member.performance;
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm",
                  index === 0 ? "bg-amber-500/20 text-amber-500" :
                  index === 1 ? "bg-zinc-400/20 text-zinc-400" :
                  index === 2 ? "bg-amber-700/20 text-amber-700" :
                  "bg-primary/10 text-primary"
                )}>
                  {index + 1}
                </div>
                
                <div className="flex-shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-foreground truncate">{member.name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {member.participation.toFixed(1)}% do total
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(performance, 100)} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(member.totalRevenue)}</span>
                      <span>Meta: {formatCurrency(member.monthlyGoal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {performance >= 100 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : performance >= 80 ? (
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className={cn("font-semibold text-sm", getPerformanceColor(performance))}>
                    {performance.toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamView;
