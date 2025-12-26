import { motion } from "framer-motion";
import { Target, TrendingUp, Clock, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardData, MonthlyData } from "@/types";
import { cn } from "@/lib/utils";

interface PGVViewProps {
  data: DashboardData;
}

const PGVView = ({ data }: PGVViewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate PGV metrics
  const completedMonths = data.currentYearData.filter((m) => m.revenue > 0);
  const currentMonthIndex = completedMonths.length;
  const remainingMonths = 12 - currentMonthIndex;
  
  const totalRealized = data.kpis.annualRealized;
  const annualGoal = data.kpis.annualGoal;
  const remaining = annualGoal - totalRealized;
  const progress = (totalRealized / annualGoal) * 100;
  
  const monthlyNeeded = remainingMonths > 0 ? remaining / remainingMonths : 0;
  const averageRealized = currentMonthIndex > 0 
    ? totalRealized / currentMonthIndex 
    : 0;
  
  const projectedAnnual = averageRealized * 12;
  const projectionVsGoal = ((projectedAnnual - annualGoal) / annualGoal) * 100;

  const isOnTrack = monthlyNeeded <= averageRealized;
  const isAhead = progress > (currentMonthIndex / 12) * 100;

  const getStatusColor = () => {
    if (isAhead) return "text-emerald-500";
    if (isOnTrack) return "text-amber-500";
    return "text-destructive";
  };

  const getStatusIcon = () => {
    if (isAhead) return CheckCircle;
    if (isOnTrack) return Clock;
    return AlertTriangle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Main Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground">
                Plano de Gestão de Vendas
              </CardTitle>
              <div className={cn("flex items-center gap-2", getStatusColor())}>
                <StatusIcon className="h-5 w-5" />
                <span className="font-medium">
                  {isAhead ? "Acima da Meta" : isOnTrack ? "No Ritmo" : "Atenção Necessária"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso Anual</span>
                <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-4" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(totalRealized)}</span>
                <span>Meta: {formatCurrency(annualGoal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Faltam</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(remaining)}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Meses Restantes</p>
                <p className="text-lg font-bold text-foreground">{remainingMonths}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Média Mensal</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(averageRealized)}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Necessário/Mês</p>
                <p className={cn("text-lg font-bold", 
                  monthlyNeeded <= averageRealized ? "text-emerald-500" : "text-amber-500"
                )}>
                  {formatCurrency(monthlyNeeded)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projeção Anual
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(projectedAnnual)}
              </div>
              <p className={cn("text-xs mt-1", projectionVsGoal >= 0 ? "text-emerald-500" : "text-destructive")}>
                {projectionVsGoal >= 0 ? "+" : ""}{projectionVsGoal.toFixed(1)}% vs meta
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Médio
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(data.kpis.averageTicket)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                por venda
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conversão
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {data.kpis.conversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de conversão
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Desempenho Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {data.currentYearData.map((month, index) => {
                const monthProgress = month.goal > 0 
                  ? (month.revenue / month.goal) * 100 
                  : 0;
                const isPast = month.revenue > 0;
                const isCurrentMonth = index === currentMonthIndex;

                return (
                  <motion.div
                    key={month.month}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className={cn(
                      "p-3 rounded-lg text-center transition-all",
                      isPast && monthProgress >= 100 && "bg-emerald-500/10 border border-emerald-500/20",
                      isPast && monthProgress < 100 && "bg-amber-500/10 border border-amber-500/20",
                      !isPast && !isCurrentMonth && "bg-secondary/30 border border-border",
                      isCurrentMonth && "bg-primary/10 border border-primary/30 ring-2 ring-primary/20"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {month.month}
                    </p>
                    <p className={cn(
                      "text-sm font-bold",
                      isPast && monthProgress >= 100 && "text-emerald-500",
                      isPast && monthProgress < 100 && "text-amber-500",
                      !isPast && "text-muted-foreground"
                    )}>
                      {isPast ? `${monthProgress.toFixed(0)}%` : "-"}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PGVView;
