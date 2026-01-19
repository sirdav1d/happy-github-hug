import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Target, Award, User, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Receipt, UserCheck, Percent, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Salesperson, MonthlyData } from "@/types";
import { cn, namesMatch } from "@/lib/utils";
import InfoTooltip from "./InfoTooltip";
import TeamPerformanceChart from "./team/TeamPerformanceChart";
import TeamDistributionPie from "./team/TeamDistributionPie";
import TeamInsights from "./team/TeamInsights";
import { useTeamSalesMetrics } from "@/hooks/useTeamSalesMetrics";
import { useBehavioralProfiles } from "@/hooks/useBehavioralProfiles";
import { useSalespeople } from "@/hooks/useSalespeople";
import { DISCBadge } from "./behavioral/DISCBadge";



interface TeamViewProps {
  team: Salesperson[];
  monthlyGoal: number;
  referenceMonth?: number;
  referenceYear?: number;
  historicalData?: MonthlyData[];
  currentYearData?: MonthlyData[];
}

const TeamView = ({ 
  team, 
  monthlyGoal,
  referenceMonth,
  referenceYear,
  historicalData = [],
  currentYearData = []
}: TeamViewProps) => {
  const now = new Date();
  // Usar sempre a data atual como limite máximo de navegação
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Mês de referência inicial (pode vir do dashboard ou usar mês atual)
  const initialMonth = referenceMonth || currentMonth;
  const initialYear = referenceYear || currentYear;
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  

  // Hook de métricas com filtro de período
  const { metrics, isLoading } = useTeamSalesMetrics(selectedMonth, selectedYear);
  
  // Hook de perfis comportamentais
  const { profiles, moduleConfig, isModuleEnabled } = useBehavioralProfiles();
  const showBehavioralBadges = isModuleEnabled && moduleConfig?.show_in_team_view;
  
  // Hook de vendedores do banco para fazer match com perfis comportamentais
  const { salespeople } = useSalespeople();

  // Função para encontrar perfil comportamental de um membro da equipe
  const findBehavioralProfile = (member: Salesperson) => {
    // 1. Match direto por salespersonId (se o membro já usa UUID)
    let profile = profiles.find(p => p.salespersonId === member.id);
    if (profile) return profile;
    
    // 2. Buscar o vendedor na tabela salespeople por legacy_id OU nome
    const salesperson = salespeople.find(sp => 
      sp.legacy_id === member.id || // Match por legacy_id (ex: "1" -> "1")
      namesMatch(sp.name, member.name) // Match por nome
    );
    
    if (salesperson) {
      profile = profiles.find(p => p.salespersonId === salesperson.id);
      if (profile) return profile;
    }
    
    return null;
  };

  // Debug logs para investigar o problema
  console.log('[TeamView Debug] selectedMonth:', selectedMonth, 'selectedYear:', selectedYear);
  console.log('[TeamView Debug] team prop:', team);
  console.log('[TeamView Debug] activeTeam:', team.filter((member) => member.active && !member.isPlaceholder));
  console.log('[TeamView Debug] metrics from hook:', metrics);
  console.log('[TeamView Debug] Behavioral - showBadges:', showBehavioralBadges, 'profiles:', profiles, 'salespeople:', salespeople);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const monthNamesShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Buscar a meta do mês selecionado dinamicamente
  const selectedMonthGoal = useMemo(() => {
    const monthName = monthNamesShort[selectedMonth - 1];
    
    // Primeiro tenta no currentYearData
    const currentYearMatch = currentYearData.find(d => d.month === monthName && d.year === selectedYear);
    if (currentYearMatch?.goal) return currentYearMatch.goal;
    
    // Senão busca no historicalData
    const historicalMatch = historicalData.find(
      d => d.month === monthName && d.year === selectedYear
    );
    if (historicalMatch?.goal) return historicalMatch.goal;
    
    // Fallback para o monthlyGoal prop
    return monthlyGoal;
  }, [selectedMonth, selectedYear, currentYearData, historicalData, monthlyGoal]);

  // Navegação de mês
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    // Não permitir navegar além do mês atual
    if (selectedYear === currentYear && selectedMonth >= currentMonth) return;
    
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentPeriod = selectedMonth === currentMonth && selectedYear === currentYear;
  const canGoNext = !(selectedYear === currentYear && selectedMonth >= currentMonth);
  
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
    // Meta individual proporcional para cada membro ativo (fallback quando não há meta individual por período)
    const memberCount = activeTeam.length;
    const individualGoal = memberCount > 0 ? selectedMonthGoal / memberCount : 0;

    // Evitar "matches" ambíguos para não duplicar faturamento.
    const usedMetricIds = new Set<string>();

    /**
     * Busca métricas para um membro usando matching robusto:
     * 1. Match por ID exato (UUID)
     * 2. Match por nome usando namesMatch (normalizado, parcial)
     */
    const findMetricsForMember = (member: Salesperson) => {
      // 1. Tentar match por ID exato
      let found = metrics.find(
        (m) => !usedMetricIds.has(m.salespersonId) && m.salespersonId === member.id
      );
      
      // 2. Se não encontrou, tentar por nome com matching robusto
      if (!found) {
        found = metrics.find(
          (m) => !usedMetricIds.has(m.salespersonId) && namesMatch(m.salespersonName, member.name)
        );
      }
      
      if (found) {
        usedMetricIds.add(found.salespersonId);
      }
      
      return found;
    };

    // Enriquecer a equipe com métricas do período selecionado (sem duplicar métricas entre membros)
    const enrichedTeam = activeTeam.map((member) => {
      const salesMetrics = findMetricsForMember(member);
      const periodRevenue = salesMetrics?.totalRevenue ?? 0;

      return {
        ...member,
        totalRevenue: periodRevenue,
        monthlyGoal: individualGoal,
        averageTicket: salesMetrics?.averageTicket ?? 0,
        conversionRate: salesMetrics?.conversionRate ?? 0,
        salesCount: salesMetrics?.salesCount ?? 0,
        attendances: salesMetrics?.attendances ?? 0,
      };
    });

    const totalRevenue = enrichedTeam.reduce((sum, member) => sum + member.totalRevenue, 0);
    const totalGoal = selectedMonthGoal;
    const teamPerformance = totalGoal > 0 ? (totalRevenue / totalGoal) * 100 : 0;

    const membersWithPerformance = enrichedTeam.map((member) => ({
      ...member,
      performance: member.monthlyGoal > 0 ? (member.totalRevenue / member.monthlyGoal) * 100 : 0,
      participation: totalRevenue > 0 ? (member.totalRevenue / totalRevenue) * 100 : 0,
    }));

    const sortedTeam = [...membersWithPerformance].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const aboveGoal = membersWithPerformance.filter((m) => m.performance >= 100).length;
    const belowGoal = membersWithPerformance.filter((m) => m.performance < 80).length;

    // Concentration risk (top 2)
    const top2Participation = sortedTeam.slice(0, 2).reduce((sum, m) => sum + m.participation, 0);
    let concentrationRisk: "Baixo" | "Moderado" | "Alto" = "Baixo";
    if (top2Participation > 50) concentrationRisk = "Alto";
    else if (top2Participation >= 40) concentrationRisk = "Moderado";

    return {
      totalRevenue,
      totalGoal,
      teamPerformance,
      sortedTeam,
      enrichedTeam: membersWithPerformance,
      aboveGoal,
      belowGoal,
      concentrationRisk,
      top2Participation: Math.round(top2Participation),
    };
  }, [activeTeam, metrics, selectedMonthGoal]);

  // Ordenação fixa por faturamento (maior para menor)
  const displayTeam = useMemo(() => {
    return [...stats.enrichedTeam].sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [stats.enrichedTeam]);

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
      {/* Navegador de Mês */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousMonth}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h2>
            {isCurrentPeriod && (
              <Badge variant="secondary" className="text-xs mt-1">
                Período Atual
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          disabled={!canGoNext}
          className="flex items-center gap-1"
        >
          <span className="hidden sm:inline">Próximo</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TeamPerformanceChart team={stats.enrichedTeam} />
        <TeamDistributionPie team={stats.enrichedTeam} />
      </div>

      {/* Team Members Ranking */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            Ranking de Desempenho
            <InfoTooltip text="Lista ordenada por faturamento. Mostra a participação e performance de cada vendedor no período." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayTeam.map((member, index) => {
            const performance = member.performance;
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm shrink-0",
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
                      {/* Badge DISC se configurado */}
                      {showBehavioralBadges && (() => {
                        const profile = findBehavioralProfile(member);
                        return profile?.discNatural ? (
                          <DISCBadge scores={profile.discNatural} size="sm" />
                        ) : null;
                      })()}
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
                </div>

                {/* KPIs Individuais */}
                {(member.salesCount > 0 || member.attendances > 0) && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ticket Médio</p>
                          <p className="text-sm font-medium text-foreground">
                            {formatCurrency(member.averageTicket)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Nº Vendas</p>
                          <p className="text-sm font-medium text-foreground">
                            {member.salesCount}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Atendimentos</p>
                          <p className="text-sm font-medium text-foreground">
                            {member.attendances > 0 ? member.attendances : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Conversão</p>
                          <p className={cn(
                            "text-sm font-medium",
                            member.conversionRate >= 30 ? "text-emerald-500" :
                            member.conversionRate >= 15 ? "text-amber-500" :
                            member.conversionRate > 0 ? "text-destructive" : "text-foreground"
                          )}>
                            {member.conversionRate > 0 ? `${member.conversionRate.toFixed(1)}%` : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Análise e Recomendações - Insights ao final */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          Análise e Recomendações
          <InfoTooltip text="Resumo executivo da performance da equipe com recomendações de ação." />
        </h2>
        <TeamInsights team={stats.enrichedTeam} month={selectedMonth} year={selectedYear} />
      </div>
    </motion.div>
  );
};

export default TeamView;
