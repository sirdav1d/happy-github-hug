import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Target, Award, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Salesperson } from "@/types";
import { cn } from "@/lib/utils";
import InfoTooltip from "./InfoTooltip";

interface TeamViewProps {
  team: Salesperson[];
  monthlyGoal: number;
}

const TeamView = ({ team, monthlyGoal }: TeamViewProps) => {
  const activeTeam = team.filter((member) => member.active && !member.isPlaceholder);
  
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 80) return "bg-amber-500";
    return "bg-destructive";
  };

  const totalRevenue = activeTeam.reduce((sum, member) => sum + member.totalRevenue, 0);
  const totalGoal = activeTeam.reduce((sum, member) => sum + member.monthlyGoal, 0);
  const teamPerformance = totalGoal > 0 ? (totalRevenue / totalGoal) * 100 : 0;

  const sortedTeam = [...activeTeam].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const topPerformer = sortedTeam[0];

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Performance da Equipe
                <InfoTooltip text="Percentual do realizado em relação à meta total da equipe. Mostra o desempenho coletivo no período." />
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getPerformanceColor(teamPerformance))}>
                {teamPerformance.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalRevenue)} de {formatCurrency(totalGoal)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Membros Ativos
                <InfoTooltip text="Total de vendedores ativos na equipe que possuem metas e vendas registradas." />
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeTeam.length}</div>
              <p className="text-xs text-muted-foreground mt-1">vendedores ativos</p>
            </CardContent>
          </Card>
        </motion.div>

        {topPerformer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Top Performer
                  <InfoTooltip text="Vendedor com maior faturamento no período. Destaque da equipe." />
                </CardTitle>
                <Award className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{topPerformer.name}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(topPerformer.totalRevenue)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Team Members */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Desempenho Individual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedTeam.map((member, index) => {
            const performance = member.monthlyGoal > 0 
              ? (member.totalRevenue / member.monthlyGoal) * 100 
              : 0;
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground truncate">{member.name}</span>
                    <div className="flex items-center gap-2">
                      {performance >= 100 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className={cn("font-semibold", getPerformanceColor(performance))}>
                        {performance.toFixed(1)}%
                      </span>
                    </div>
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
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamView;
