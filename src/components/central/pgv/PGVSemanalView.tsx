import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Target, TrendingUp, Users, ChevronLeft, ChevronRight, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import InfoTooltip from "../InfoTooltip";
import { Salesperson } from "@/types";

interface PGVSemanalViewProps {
  team: Salesperson[];
  monthlyGoal?: number;
}

const PGVSemanalView = ({ team, monthlyGoal = 200000 }: PGVSemanalViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  // Calcular semanas do mês atual
  const weeksInMonth = 4;
  const weeklyGoal = monthlyGoal / weeksInMonth;
  const dailyWorkingDays = 5;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Preparar dados por vendedor com dados das semanas
  const teamData = team.filter(s => s.active && !s.isPlaceholder).map(salesperson => {
    const weekData = salesperson.weeks.find(w => w.week === currentWeek) || {
      week: currentWeek,
      revenue: 0,
      goal: weeklyGoal / team.length
    };
    
    const accumulatedRevenue = salesperson.weeks
      .filter(w => w.week <= currentWeek)
      .reduce((sum, w) => sum + w.revenue, 0);
    
    const dailyGoal = weekData.goal / dailyWorkingDays;
    const percentAchieved = weekData.goal > 0 ? (weekData.revenue / weekData.goal) * 100 : 0;
    
    return {
      ...salesperson,
      weeklyGoal: weekData.goal,
      weeklyRealized: weekData.revenue,
      dailyGoal,
      percentAchieved,
      accumulatedRevenue,
    };
  }).sort((a, b) => b.percentAchieved - a.percentAchieved);

  const totalWeeklyGoal = teamData.reduce((sum, s) => sum + s.weeklyGoal, 0);
  const totalWeeklyRealized = teamData.reduce((sum, s) => sum + s.weeklyRealized, 0);
  const totalPercent = totalWeeklyGoal > 0 ? (totalWeeklyRealized / totalWeeklyGoal) * 100 : 0;

  const getPercentColor = (percent: number) => {
    if (percent >= 100) return "text-emerald-500";
    if (percent >= 80) return "text-amber-500";
    return "text-destructive";
  };

  const getPercentBg = (percent: number) => {
    if (percent >= 100) return "bg-emerald-500/10 border-emerald-500/20";
    if (percent >= 80) return "bg-amber-500/10 border-amber-500/20";
    return "bg-destructive/10 border-destructive/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <ClipboardList className="h-6 w-6 text-emerald-500" />
            </div>
            PGV - Painel de Gestão à Vista
          </h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {currentMonth}
          </p>
        </div>
        <InfoTooltip 
          text="O PGV é o painel onde a equipe acompanha diariamente o progresso das vendas. Preencha os resultados de cada vendedor para visualizar o ranking e identificar quem precisa de apoio."
          maxWidth={320}
        />
      </div>

      {/* Resumo do Mês */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Meta do Mês
                <InfoTooltip text="Meta total de faturamento definida para o mês atual." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(monthlyGoal)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meta Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(weeklyGoal)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Realizado Semana {currentWeek}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getPercentColor(totalPercent))}>
                {formatCurrency(totalWeeklyRealized)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                % Atingido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getPercentColor(totalPercent))}>
                {totalPercent.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Navegação de Semanas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border">
          <CardContent className="py-4">
            <Tabs value={`week-${currentWeek}`} onValueChange={(v) => setCurrentWeek(parseInt(v.replace('week-', '')))}>
              <TabsList className="grid grid-cols-4 w-full">
                {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((week) => (
                  <TabsTrigger 
                    key={week} 
                    value={`week-${week}`}
                    className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500"
                  >
                    Semana {week}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Painel de Vendedores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" />
                Ranking da Semana {currentWeek}
              </CardTitle>
              <Badge variant="outline" className="bg-secondary">
                {teamData.length} vendedores
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cabeçalho da Tabela */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Vendedor</div>
              <div className="col-span-2 text-right">Meta Diária</div>
              <div className="col-span-2 text-right">Meta Semanal</div>
              <div className="col-span-2 text-right">Realizado</div>
              <div className="col-span-2 text-right">% Atingido</div>
            </div>

            {/* Linhas de Vendedores */}
            <div className="divide-y divide-border">
              {teamData.map((salesperson, idx) => (
                <motion.div
                  key={salesperson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className={cn(
                    "grid grid-cols-12 gap-4 px-4 py-4 items-center transition-colors hover:bg-secondary/30",
                    idx === 0 && "bg-gradient-to-r from-amber-500/5 to-transparent"
                  )}
                >
                  {/* Posição */}
                  <div className="col-span-1">
                    {idx === 0 ? (
                      <div className="p-1.5 rounded-full bg-amber-500/20">
                        <Award className="h-4 w-4 text-amber-500" />
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Nome */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-medium text-primary">
                      {salesperson.name.charAt(0)}
                    </div>
                    <span className="font-medium text-foreground truncate">
                      {salesperson.name}
                    </span>
                  </div>

                  {/* Meta Diária */}
                  <div className="col-span-2 text-right text-sm text-muted-foreground">
                    {formatCurrency(salesperson.dailyGoal)}
                  </div>

                  {/* Meta Semanal */}
                  <div className="col-span-2 text-right text-sm text-foreground">
                    {formatCurrency(salesperson.weeklyGoal)}
                  </div>

                  {/* Realizado */}
                  <div className="col-span-2 text-right">
                    <span className={cn("font-medium", getPercentColor(salesperson.percentAchieved))}>
                      {formatCurrency(salesperson.weeklyRealized)}
                    </span>
                  </div>

                  {/* % Atingido */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-end gap-2">
                      <Progress 
                        value={Math.min(salesperson.percentAchieved, 100)} 
                        className="h-2 w-16"
                      />
                      <Badge 
                        variant="outline" 
                        className={cn("min-w-[60px] justify-center", getPercentBg(salesperson.percentAchieved))}
                      >
                        <span className={getPercentColor(salesperson.percentAchieved)}>
                          {salesperson.percentAchieved.toFixed(0)}%
                        </span>
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {teamData.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum vendedor cadastrado</p>
                <p className="text-sm">Adicione vendedores para visualizar o painel</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Política de Premiação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-violet-500/5 via-card to-card border-violet-500/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-violet-500" />
              Política de Premiação
              <InfoTooltip text="Defina as faixas de premiação para motivar sua equipe. Vincule o atingimento de metas a recompensas claras." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">100%+ da Meta</span>
                </div>
                <p className="text-foreground font-medium">Premiação Integral</p>
                <p className="text-xs text-muted-foreground mt-1">+ Bônus por superação</p>
              </div>
              
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">80-99% da Meta</span>
                </div>
                <p className="text-foreground font-medium">Premiação Proporcional</p>
                <p className="text-xs text-muted-foreground mt-1">Baseada no % atingido</p>
              </div>
              
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Abaixo de 80%</span>
                </div>
                <p className="text-foreground font-medium">Sem Premiação</p>
                <p className="text-xs text-muted-foreground mt-1">Foco em melhoria</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PGVSemanalView;
