import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, Star, Target, ArrowRight, Clock, CheckCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InfoTooltip from "../InfoTooltip";
import { Salesperson } from "@/types";
import { useRMR } from "@/hooks/useRMR";
import RMRWizard from "./RMRWizard";

interface RMRViewProps {
  team: Salesperson[];
  previousMonthRevenue?: number;
  previousMonthGoal?: number;
}

const RMRView = ({ team = [], previousMonthRevenue = 0, previousMonthGoal = 200000 }: RMRViewProps) => {
  const [showWizard, setShowWizard] = useState(false);
  const { meetings, isLoading, getNextRMRDate, getLatestCompletedRMR } = useRMR();
  
  const lastRMR = getLatestCompletedRMR();

  const nextRMRDate = getNextRMRDate();
  const daysUntilRMR = Math.ceil((nextRMRDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Get completed meetings for stats
  const completedMeetings = meetings.filter(m => m.status === 'completed');
  const uniqueHighlights = new Set(completedMeetings.map(m => m.highlighted_employee_id).filter(Boolean));

  // Calculate achievement rate
  const achievementRate = completedMeetings.length > 0
    ? completedMeetings.filter(m => m.previous_month_revenue >= m.monthly_goal).length / completedMeetings.length * 100
    : 0;

  // Check preparation status for next RMR
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextRMR = meetings.find(m => 
    m.month === nextMonth.getMonth() + 1 && 
    m.year === nextMonth.getFullYear()
  );

  const preparationItems = [
    { label: 'Resultados do Mês', icon: Target, done: previousMonthRevenue > 0 },
    { label: 'Colaborador Destaque', icon: Star, done: !!nextRMR?.highlighted_employee_id },
    { label: 'Tema Motivacional', icon: Trophy, done: !!nextRMR?.motivational_theme },
    { label: 'Metas do Próximo Mês', icon: Calendar, done: !!nextRMR?.monthly_goal },
  ];

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
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            RMR - Reunião de Metas e Reconhecimento
          </h1>
          <p className="text-muted-foreground mt-1">
            Ritual mensal de alinhamento, celebração e definição de metas
          </p>
        </div>
        <InfoTooltip 
          text="A RMR acontece todo 1º dia útil do mês. É o momento de celebrar resultados, reconhecer destaques e alinhar as metas do próximo período."
          maxWidth={320}
        />
      </div>

      {/* Próxima RMR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                Próxima RMR
              </CardTitle>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                Em {daysUntilRMR} dias
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground capitalize">
                  {formatDate(nextRMRDate)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  1º dia útil do mês
                </p>
              </div>
              <Button 
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                onClick={() => setShowWizard(true)}
              >
                <Plus className="h-4 w-4" />
                Preparar RMR
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Checklist de Preparação */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              {preparationItems.map((item, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    item.done ? 'bg-emerald-500/10' : 'bg-secondary/50'
                  }`}
                >
                  {item.done ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={`text-sm font-medium ${
                    item.done ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Card de Última RMR */}
      {lastRMR && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Última RMR Realizada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Destaque</p>
                  <p className="font-medium text-foreground">{lastRMR.highlighted_employee_name || "Não definido"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meta Definida</p>
                  <p className="font-medium text-foreground">{formatCurrency(lastRMR.monthly_goal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tema</p>
                  <p className="font-medium text-foreground">{lastRMR.motivational_theme || "Não definido"}</p>
                </div>
              </div>
              {lastRMR.strategies && lastRMR.strategies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Estratégias definidas</p>
                  <div className="flex flex-wrap gap-2">
                    {lastRMR.strategies.slice(0, 3).map((strategy, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {strategy}
                      </Badge>
                    ))}
                    {lastRMR.strategies.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{lastRMR.strategies.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                RMRs Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {completedMeetings.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? 'carregando...' : 'registradas no sistema'}
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Cumprimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">
                {achievementRate.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                das metas foram atingidas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Destaques Únicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {uniqueHighlights.size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                colaboradores reconhecidos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Histórico de RMRs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Histórico de Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Carregando histórico...
              </div>
            ) : completedMeetings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma RMR registrada ainda</p>
                <p className="text-sm">Clique em "Preparar RMR" para criar a primeira</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedMeetings.slice(0, 5).map((rmr, idx) => {
                  const monthName = new Date(rmr.year, rmr.month - 1).toLocaleDateString('pt-BR', { month: 'long' });
                  const percent = rmr.monthly_goal > 0 
                    ? (rmr.previous_month_revenue / rmr.monthly_goal) * 100 
                    : 0;

                  return (
                    <motion.div
                      key={rmr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {monthName} {rmr.year}
                          </p>
                          {rmr.highlighted_employee_name && (
                            <p className="text-sm text-muted-foreground">
                              Destaque: {rmr.highlighted_employee_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {formatCurrency(rmr.previous_month_revenue)}
                        </p>
                        <p className={`text-sm ${percent >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {percent.toFixed(0)}% da meta
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* RMR Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <RMRWizard
            team={team}
            previousMonthRevenue={previousMonthRevenue}
            previousMonthGoal={previousMonthGoal}
            lastRMR={lastRMR}
            onClose={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RMRView;
