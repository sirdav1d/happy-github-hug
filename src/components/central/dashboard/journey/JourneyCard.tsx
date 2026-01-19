import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, Calendar, Trophy, HelpCircle } from 'lucide-react';
import { DashboardData } from '@/types';
import { MonthlyMilestone } from '@/types/mentorship';
import { useJourneyMetrics, useAchievements } from '@/hooks/useJourneyMetrics';
import JourneyTimeline from './JourneyTimeline';
import EvolutionMetrics from './EvolutionMetrics';
import AchievementsBadges from './AchievementsBadges';
import ProjectionCard from './ProjectionCard';
import JourneyOnboarding from './JourneyOnboarding';
import JourneyMonthDetailModal from './JourneyMonthDetailModal';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import InfoTooltip from '../../InfoTooltip';

interface JourneyCardProps {
  data: DashboardData;
  selectedMonth: number;
  selectedYear: number;
  currentMonthName: string;
  progressPercent: number;
}

interface SalesByMonth {
  month: number;
  year: number;
  revenue: number;
}

const parseDateOnly = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const JourneyCard: React.FC<JourneyCardProps> = ({
  data,
  selectedMonth,
  selectedYear,
  currentMonthName,
  progressPercent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [salesByMonth, setSalesByMonth] = useState<SalesByMonth[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MonthlyMilestone | null>(null);
  const { user } = useAuth();

  const handleMonthClick = (milestone: MonthlyMilestone) => {
    setSelectedMilestone(milestone);
  };

  // Verificar se deve mostrar onboarding na primeira expansão
  const handleExpandChange = (open: boolean) => {
    setIsExpanded(open);
    if (open && !localStorage.getItem('journey-onboarding-seen')) {
      setShowOnboarding(true);
    }
  };

  // Buscar vendas reais do período da mentoria
  useEffect(() => {
    const fetchSalesForMentorship = async () => {
      if (!data.mentorshipStartDate || !user) return;

      const startDate = parseDateOnly(data.mentorshipStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);

      const startISO = startDate.toISOString().split('T')[0];
      const endISO = endDate.toISOString().split('T')[0];

      try {
        const { data: salesData, error } = await supabase
          .from('sales')
          .select('sale_date, amount')
          .eq('user_id', user.id)
          .gte('sale_date', startISO)
          .lte('sale_date', endISO);

        if (error) {
          console.error('Error fetching mentorship sales:', error);
          return;
        }

        // Agrupar vendas por mês
        const grouped: Record<string, { month: number; year: number; revenue: number }> = {};
        salesData?.forEach(sale => {
          const saleDate = new Date(sale.sale_date);
          const key = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
          if (!grouped[key]) {
            grouped[key] = {
              month: saleDate.getMonth() + 1,
              year: saleDate.getFullYear(),
              revenue: 0,
            };
          }
          grouped[key].revenue += sale.amount;
        });

        setSalesByMonth(Object.values(grouped));
      } catch (err) {
        console.error('Error in fetchSalesForMentorship:', err);
      }
    };

    fetchSalesForMentorship();
  }, [data.mentorshipStartDate, user]);

  const metrics = useJourneyMetrics({ data, selectedMonth, selectedYear, salesByMonth });
  const achievements = useAchievements(metrics);

  // Se não há data de início da mentoria, mostrar mensagem
  if (!data.mentorshipStartDate || !metrics) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-muted/50 to-muted/30 border border-border"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Jornada de Mentoria</h3>
            <p className="text-sm text-muted-foreground">
              Configure a data de início nas Configurações para acompanhar sua evolução.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.isUnlocked).length;

  // Determinar cor baseada no progresso
  const getStatusColor = () => {
    if (progressPercent >= 100) return 'emerald';
    if (progressPercent >= 80) return 'amber';
    if (progressPercent >= 50) return 'primary';
    return 'red';
  };

  const statusColor = getStatusColor();
  const gradientMap: Record<string, string> = {
    emerald: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
    amber: 'from-amber-500/20 via-amber-400/10 to-transparent',
    primary: 'from-primary/20 via-primary/10 to-transparent',
    red: 'from-red-500/20 via-red-400/10 to-transparent',
  };

  return (
    <>
      <JourneyOnboarding 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
      />

      <JourneyMonthDetailModal
        milestone={selectedMilestone}
        isOpen={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
      />
      
      <Collapsible open={isExpanded} onOpenChange={handleExpandChange}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradientMap[statusColor]} border border-border/50 backdrop-blur-xl`}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />

          {/* Header - Always Visible */}
          <CollapsibleTrigger asChild>
            <div className="relative z-10 p-4 md:p-5 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Title and Status */}
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="p-3 rounded-xl bg-primary/20 text-primary"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Jornada de Mentoria
                      </span>
                      <InfoTooltip 
                        text="Acompanhamento de 6 meses do programa de mentoria. Visualize sua evolução mês a mês, metas batidas, conquistas e projeções inteligentes."
                        variant="help"
                        size="sm"
                      />
                      {metrics.isComplete ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                          Concluída
                        </span>
                      ) : metrics.remainingMonths <= 1 ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600">
                          {metrics.remainingMonths === 0 ? 'Último mês!' : 'Falta 1 mês!'}
                        </span>
                      ) : null}
                    </div>
                  
                  <p className="text-sm md:text-base font-semibold">
                    Mês {metrics.currentMonth} de {metrics.totalMonths} • {currentMonthName}/{selectedYear}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {metrics.monthsWithGoalMet} metas batidas
                    </span>
                    {unlockedAchievements > 0 && (
                      <span>{unlockedAchievements} conquistas</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Quick Stats + Expand */}
              <div className="flex items-center gap-4">
                {/* Progress Bars */}
                <div className="hidden md:block w-48 space-y-2">
                  {/* Journey Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Jornada</span>
                      <span className="text-[10px] font-bold text-primary">{metrics.currentMonth}/{metrics.totalMonths}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metrics.journeyPercent}%` }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                  
                  {/* Monthly Goal */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Meta Mês</span>
                      <span className={`text-[10px] font-bold ${
                        progressPercent >= 100 ? 'text-emerald-500' : 'text-foreground'
                      }`}>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                        className={`h-full rounded-full ${
                          progressPercent >= 100 ? 'bg-emerald-500' : progressPercent >= 80 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                  {/* Expand Button */}
                  <Button variant="ghost" size="sm" className="gap-1">
                    {isExpanded ? (
                      <>
                        <span className="text-xs">Menos</span>
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span className="text-xs">Detalhes</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                  
                  {/* Help Button */}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOnboarding(true);
                    }}
                  >
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-10 px-4 md:px-5 pb-5 space-y-6 border-t border-border/30"
              >
                {/* Timeline */}
                <div className="pt-5">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Timeline da Jornada
                    <InfoTooltip 
                      text="Cada círculo representa um mês. Verde = meta batida, Âmbar = abaixo da meta, Fogo = streak (meses consecutivos de sucesso)."
                      size="sm"
                    />
                  </h4>
                  <JourneyTimeline 
                    milestones={metrics.milestones}
                    currentMonth={metrics.currentMonth}
                    onMonthClick={handleMonthClick}
                  />
                </div>

                {/* Evolution Metrics */}
                <div>
                  <h4 className="text-sm font-semibold mb-4">📊 Métricas de Evolução</h4>
                  <EvolutionMetrics metrics={metrics} />
                </div>

                {/* Projection */}
                <ProjectionCard metrics={metrics} />

                {/* Achievements */}
                <div>
                  <AchievementsBadges achievements={achievements} />
                </div>
              </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>
    </>
  );
};

export default JourneyCard;
