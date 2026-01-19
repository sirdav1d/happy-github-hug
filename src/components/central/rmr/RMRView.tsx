import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, Star, Target, ArrowRight, Clock, CheckCircle, Plus, History, Sparkles, Play, ExternalLink, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import InfoTooltip from "../InfoTooltip";
import { Salesperson, ViewState, NavigationOptions } from "@/types";
import { useRMR } from "@/hooks/useRMR";
import { useRMRPreparation } from "@/hooks/useRMRPreparation";
import { useMentorshipPhase } from "@/hooks/useMentorshipPhase";
import RMRWizard from "./RMRWizard";
import RMRDeadlineIndicator from "./RMRDeadlineIndicator";
import RMRMaterialsSection from "./RMRMaterialsSection";
import RMRRulesCard from "./RMRRulesCard";
import RMRHistoryCard from "./RMRHistoryCard";
import RMROnboarding from "./RMROnboarding";

interface RMRViewProps {
  team: Salesperson[];
  previousMonthRevenue?: number;
  previousMonthGoal?: number;
  onNavigate?: (view: ViewState, options?: NavigationOptions) => void;
}

const RMRView = ({ team = [], previousMonthRevenue = 0, previousMonthGoal = 200000, onNavigate }: RMRViewProps) => {
  const [showWizard, setShowWizard] = useState(false);
  const [showRetroactiveWizard, setShowRetroactiveWizard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { meetings, isLoading, deleteRMR, isDeleting, getNextRMRDate, getLatestCompletedRMR } = useRMR();
  const { 
    preparationStatus, 
    deadline: preparationDeadline, 
    daysRemaining: daysToDeadline
  } = useRMRPreparation();
  const { currentPhase } = useMentorshipPhase();
  const isPhase2 = currentPhase >= 2;
  
  const lastRMR = getLatestCompletedRMR();

  // Check if onboarding should be shown
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("rmr-onboarding-seen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Helper to get YouTube thumbnail
  const getYouTubeThumbnail = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              RMR - Reunião de Metas e Reconhecimento
            </h1>
            <Badge
              variant="secondary"
              className={
                isPhase2
                  ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                  : "bg-muted text-muted-foreground"
              }
            >
              {isPhase2 ? "Fase 2" : "Fase 1"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Ritual mensal de alinhamento, celebração e definição de metas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowOnboarding(true)}
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Guia da RMR</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <InfoTooltip 
            text="A RMR acontece todo 1º dia útil do mês. É o momento de celebrar resultados, reconhecer destaques e alinhar as metas do próximo período."
            maxWidth={320}
          />
        </div>
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

            {/* Deadline Indicator */}
            <RMRDeadlineIndicator 
              deadline={preparationDeadline}
              daysRemaining={daysToDeadline}
              isPrepared={preparationStatus?.is_prepared || false}
            />

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

      {/* Card de Última RMR ou Registrar Histórico */}
      {lastRMR ? (
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                {/* Video Column */}
                {lastRMR.selected_video_title ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vídeo Motivacional</p>
                    <a 
                      href={lastRMR.selected_video_url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2"
                    >
                      {getYouTubeThumbnail(lastRMR.selected_video_url) && (
                        <div className="relative flex-shrink-0">
                          <img 
                            src={getYouTubeThumbnail(lastRMR.selected_video_url)!}
                            alt={lastRMR.selected_video_title}
                            className="w-16 h-10 object-cover rounded"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate group-hover:text-violet-500 transition-colors">
                          {lastRMR.selected_video_title}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Assistir
                        </p>
                      </div>
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Vídeo</p>
                    <p className="font-medium text-muted-foreground/50">Não definido</p>
                  </div>
                )}
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

          {/* Materials Section for Phase 2 */}
          <RMRMaterialsSection rmr={lastRMR} team={team} isPhase2={isPhase2} onNavigate={onNavigate} />
        </motion.div>
      ) : null}

      {/* Permanent "Register Past RMR" Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-dashed border-2 border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <History className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Registrar RMR Passada</p>
                  <p className="text-sm text-muted-foreground">
                    Já realizou uma RMR? Registre no histórico para ativar sugestões inteligentes.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 gap-2"
                onClick={() => setShowRetroactiveWizard(true)}
              >
                <History className="h-4 w-4" />
                Registrar Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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

      {/* RMR Rules Card */}
      <RMRRulesCard />

      {/* Historico de RMRs */}
      <RMRHistoryCard 
        meetings={meetings} 
        isLoading={isLoading}
        onDelete={deleteRMR}
        isDeleting={isDeleting}
        team={team}
      />

      {/* RMR Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            key="rmr-wizard-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RMRWizard
              team={team}
              previousMonthRevenue={previousMonthRevenue}
              previousMonthGoal={previousMonthGoal}
              lastRMR={lastRMR}
              isPhase2={isPhase2}
              onClose={() => setShowWizard(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RMR Retroactive Wizard Modal */}
      <AnimatePresence>
        {showRetroactiveWizard && (
          <motion.div
            key="rmr-retroactive-wizard-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RMRWizard
              team={team}
              previousMonthRevenue={previousMonthRevenue}
              previousMonthGoal={previousMonthGoal}
              lastRMR={lastRMR}
              isPhase2={isPhase2}
              retroactiveMode={true}
              onClose={() => setShowRetroactiveWizard(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RMR Onboarding */}
      <RMROnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
      />
    </motion.div>
  );
};

export default RMRView;
