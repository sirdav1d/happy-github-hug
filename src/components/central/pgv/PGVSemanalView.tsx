import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Target, Users, Award, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import InfoTooltip from "../InfoTooltip";
import PGVEditableCell from "./PGVEditableCell";
import PremiumPolicyConfig from "./PremiumPolicyConfig";
import { Salesperson } from "@/types";
import { usePGV } from "@/hooks/usePGV";
import { usePremiumPolicy } from "@/hooks/usePremiumPolicy";

interface PGVSemanalViewProps {
  team: Salesperson[];
  monthlyGoal?: number;
  referenceMonth?: number;
  referenceYear?: number;
}

// Calcular número de semanas em um mês
const getWeeksInMonth = (month: number, year: number): number => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  
  // Conta quantas segundas-feiras iniciam novas semanas
  let weeks = 1;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() === 1 && day > 1) weeks++;
  }
  return weeks;
};

const PGVSemanalView = ({ 
  team, 
  monthlyGoal = 200000,
  referenceMonth,
  referenceYear 
}: PGVSemanalViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(1);
  
  // Mês/ano referência (limite máximo para navegação)
  const refMonth = referenceMonth || new Date().getMonth() + 1;
  const refYear = referenceYear || new Date().getFullYear();
  
  // Estado para navegação entre meses
  const [selectedMonth, setSelectedMonth] = useState(refMonth);
  const [selectedYear, setSelectedYear] = useState(refYear);
  
  const displayMonth = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Verificar se é o mês atual de referência
  const isCurrentReference = selectedMonth === refMonth && selectedYear === refYear;
  
  // Lógica de navegação
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setCurrentWeek(1);
  };
  
  const handleNextMonth = () => {
    if (isCurrentReference) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setCurrentWeek(1);
  };
  
  const { entries, isUpdating, upsertEntry } = usePGV(selectedMonth, selectedYear);
  const { tiers, upsertPolicy, isUpdating: isPolicyUpdating } = usePremiumPolicy();

  // Calcular semanas dinamicamente baseado no mês/ano selecionado
  const weeksInMonth = getWeeksInMonth(selectedMonth, selectedYear);
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

  // Prepare team data with week data
  const activeTeam = team.filter(s => s.active && !s.isPlaceholder);
  
  const teamData = activeTeam.map(salesperson => {
    // Check if there's a database entry for this salesperson
    const dbEntry = entries.find(e => 
      e.salesperson_id === salesperson.id
    );

    // Buscar dados da semana no histórico do vendedor
    const weekData = salesperson.weeks.find(w => w.week === currentWeek) || {
      week: currentWeek,
      revenue: 0,
      goal: 0
    };
    
    const accumulatedRevenue = salesperson.weeks
      .filter(w => w.week <= currentWeek)
      .reduce((sum, w) => sum + w.revenue, 0);
    
    // Calcular meta semanal individual: prioridade para DB > upload (se > 0) > meta mensal do vendedor / semanas
    const salespersonWeeklyGoal = dbEntry?.weekly_goal 
      || (weekData.goal > 0 ? weekData.goal : (salesperson.monthlyGoal || 0) / weeksInMonth);
    
    const dailyGoal = salespersonWeeklyGoal / dailyWorkingDays;
    const weeklyRealized = dbEntry?.weekly_realized ?? weekData.revenue;
    const percentAchieved = salespersonWeeklyGoal > 0 ? (weeklyRealized / salespersonWeeklyGoal) * 100 : 0;
    
    return {
      ...salesperson,
      weeklyGoal: salespersonWeeklyGoal,
      weeklyRealized,
      dailyGoal,
      percentAchieved,
      accumulatedRevenue: dbEntry?.monthly_accumulated || accumulatedRevenue,
      dbEntryId: dbEntry?.id,
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

  const handleUpdateRealized = (salesperson: typeof teamData[0], newValue: number) => {
    // For now, this updates local state. The upsertEntry would need a pgv_week_id
    // which would be created when syncing with RMR
    console.log(`Updating ${salesperson.name}: ${newValue}`);
    // TODO: Integrate with database when PGV weeks are created from RMR
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
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Edit2 className="h-3 w-3" />
            Clique nos valores para editar
          </Badge>
          <InfoTooltip 
            text="O PGV é o painel onde a equipe acompanha diariamente o progresso das vendas. Clique nos valores de 'Realizado' para editar diretamente."
            maxWidth={320}
          />
        </div>
      </div>

      {/* Navegação de Meses */}
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handlePreviousMonth}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center min-w-[200px] flex items-center justify-center gap-2">
          <span className="text-lg font-semibold capitalize">
            {displayMonth}
          </span>
          {isCurrentReference && (
            <Badge variant="secondary" className="text-xs">Atual</Badge>
          )}
          <InfoTooltip 
            text="Navegue entre meses para analisar o histórico de performance da equipe. O mês 'Atual' é o do último upload de dados."
            maxWidth={300}
          />
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleNextMonth}
          disabled={isCurrentReference}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
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
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Meta Semanal
                <InfoTooltip 
                  text={`Meta do mês dividida pelo número de semanas. Cálculo: ${formatCurrency(monthlyGoal)} ÷ ${weeksInMonth} semanas = ${formatCurrency(weeklyGoal)}`}
                  maxWidth={320}
                />
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
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Realizado Semana {currentWeek}
                <InfoTooltip 
                  text="Soma de todas as vendas da equipe nesta semana. Clique nos valores individuais no ranking para editar."
                  maxWidth={300}
                />
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
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                % Atingido
                <InfoTooltip 
                  text={`Percentual de atingimento da meta semanal pela equipe: (Realizado ÷ Meta Semanal) × 100. Cálculo: (${formatCurrency(totalWeeklyRealized)} ÷ ${formatCurrency(totalWeeklyGoal)}) × 100 = ${totalPercent.toFixed(0)}%`}
                  maxWidth={360}
                />
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
              <TabsList className={cn("grid w-full", weeksInMonth === 5 ? "grid-cols-5" : "grid-cols-4")}>
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
              <div className="col-span-2 text-right flex items-center justify-end gap-1">
                Meta Diária
                <InfoTooltip 
                  text="Meta semanal do vendedor dividida por 5 dias úteis."
                  size="sm"
                />
              </div>
              <div className="col-span-2 text-right flex items-center justify-end gap-1">
                Meta Semanal
                <InfoTooltip 
                  text="Calculada automaticamente: Meta Mensal Individual ÷ Número de Semanas do mês."
                  size="sm"
                />
              </div>
              <div className="col-span-2 text-right flex items-center justify-end gap-1">
                Realizado
                <InfoTooltip 
                  text="Total de vendas do vendedor nesta semana. Clique no valor para editar."
                  size="sm"
                />
              </div>
              <div className="col-span-2 text-right flex items-center justify-end gap-1">
                % Atingido
                <InfoTooltip 
                  text="Realizado ÷ Meta Semanal × 100. Verde ≥100%, Amarelo 80-99%, Vermelho <80%."
                  size="sm"
                />
              </div>
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

                  {/* Realizado - Editável */}
                  <div className="col-span-2 flex justify-end">
                    <PGVEditableCell
                      value={salesperson.weeklyRealized}
                      onSave={(value) => handleUpdateRealized(salesperson, value)}
                      isLoading={isUpdating}
                      formatValue={formatCurrency}
                      className={getPercentColor(salesperson.percentAchieved)}
                    />
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-violet-500" />
                Política de Premiação
                <InfoTooltip 
                  text="A política de premiação define as recompensas para cada faixa de atingimento. Configure as faixas no botão 'Configurar' para personalizar de acordo com sua empresa."
                  maxWidth={340}
                />
              </CardTitle>
              <PremiumPolicyConfig
                tiers={tiers}
                onSave={(newTiers) => upsertPolicy({ name: "Política Padrão", tiers: newTiers })}
                isLoading={isPolicyUpdating}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "grid gap-4",
              tiers.length === 3 ? "grid-cols-1 md:grid-cols-3" : 
              tiers.length === 2 ? "grid-cols-1 md:grid-cols-2" : 
              "grid-cols-1"
            )}>
              {tiers.map((tier, idx) => {
                const getTierStyles = (minPercent: number) => {
                  if (minPercent >= 100) return {
                    bg: "bg-emerald-500/10 border-emerald-500/20",
                    icon: "text-emerald-500",
                  };
                  if (minPercent >= 80) return {
                    bg: "bg-amber-500/10 border-amber-500/20",
                    icon: "text-amber-500",
                  };
                  return {
                    bg: "bg-secondary/50 border-border",
                    icon: "text-muted-foreground",
                  };
                };
                const styles = getTierStyles(tier.minPercent);
                const rangeText = tier.maxPercent 
                  ? `${tier.minPercent}-${tier.maxPercent}% da Meta`
                  : `${tier.minPercent}%+ da Meta`;

                return (
                  <div key={idx} className={`p-4 rounded-lg border ${styles.bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className={`h-4 w-4 ${styles.icon}`} />
                      <span className={`text-sm font-medium ${styles.icon}`}>{rangeText}</span>
                    </div>
                    <p className="text-foreground font-medium">{tier.reward}</p>
                    {tier.description && (
                      <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PGVSemanalView;
