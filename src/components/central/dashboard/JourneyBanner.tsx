import { motion } from 'framer-motion';
import { Rocket, Trophy, Target, TrendingUp, Sparkles, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface JourneyBannerProps {
  mentorshipStartDate?: string;
  mentorshipDurationMonths?: number;
  selectedMonth: number;
  selectedYear: number;
  currentMonthName: string;
  progressPercent: number;
  annualProgress: number;
}

const JourneyBanner = ({
  mentorshipStartDate,
  mentorshipDurationMonths = 6,
  selectedMonth,
  selectedYear,
  currentMonthName,
  progressPercent,
  annualProgress,
}: JourneyBannerProps) => {
  // Calculate mentorship journey months based on selected data period
  const calculateMentorshipMonths = () => {
    if (!mentorshipStartDate) return null;
    
    const startDate = new Date(mentorshipStartDate);
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();
    
    // Calculate months elapsed based on selected period, NOT system date
    const monthsElapsed = (selectedYear - startYear) * 12 + (selectedMonth - startMonth) + 1;
    const totalMonths = mentorshipDurationMonths;
    const remaining = totalMonths - monthsElapsed;
    
    return { 
      current: Math.max(1, Math.min(monthsElapsed, totalMonths)), 
      total: totalMonths,
      remaining: Math.max(0, remaining),
      isComplete: monthsElapsed > totalMonths,
      isNearEnd: remaining === 1,
      isLastMonth: remaining === 0 && monthsElapsed === totalMonths,
      journeyPercent: Math.min(100, (monthsElapsed / totalMonths) * 100),
    };
  };

  const mentorshipProgress = calculateMentorshipMonths();

  // Determine status based on performance AND journey phase
  const getStatusConfig = () => {
    const isLastMonth = mentorshipProgress?.isLastMonth;
    const isNearEnd = mentorshipProgress?.isNearEnd;
    const isComplete = mentorshipProgress?.isComplete;

    // Special messages for journey milestones
    if (isComplete) {
      return {
        icon: CheckCircle,
        message: 'Jornada concluída! Continue evoluindo com consistência.',
        color: 'primary',
        gradient: 'from-primary/20 via-primary/10 to-transparent',
        borderColor: 'border-primary/30',
        iconBg: 'bg-primary/20 text-primary',
        textColor: 'text-primary',
      };
    }

    if (isLastMonth) {
      if (progressPercent >= 100) {
        return {
          icon: Trophy,
          message: 'Último mês! Meta batida - finalize com resultado!',
          color: 'emerald',
          gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
          borderColor: 'border-emerald-500/30',
          iconBg: 'bg-emerald-500/20 text-emerald-500',
          textColor: 'text-emerald-600 dark:text-emerald-400',
        };
      }
      return {
        icon: AlertTriangle,
        message: 'Último mês da mentoria! Acelere para fechar bem.',
        color: 'amber',
        gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
        borderColor: 'border-amber-500/30',
        iconBg: 'bg-amber-500/20 text-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
      };
    }

    if (isNearEnd) {
      return {
        icon: Clock,
        message: 'Penúltimo mês! Acelere para fechar bem a jornada.',
        color: 'amber',
        gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
        borderColor: 'border-amber-500/30',
        iconBg: 'bg-amber-500/20 text-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
      };
    }

    // Standard performance-based messages
    if (progressPercent >= 100) {
      return {
        icon: Trophy,
        message: 'Meta batida! Continue acelerando!',
        color: 'emerald',
        gradient: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
        borderColor: 'border-emerald-500/30',
        iconBg: 'bg-emerald-500/20 text-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      };
    } else if (progressPercent >= 80) {
      return {
        icon: Target,
        message: 'Quase lá! Falta pouco para bater a meta.',
        color: 'amber',
        gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
        borderColor: 'border-amber-500/30',
        iconBg: 'bg-amber-500/20 text-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
      };
    } else if (progressPercent >= 50) {
      return {
        icon: TrendingUp,
        message: 'Bom ritmo! Acelere para alcançar a meta.',
        color: 'primary',
        gradient: 'from-primary/20 via-primary/10 to-transparent',
        borderColor: 'border-primary/30',
        iconBg: 'bg-primary/20 text-primary',
        textColor: 'text-primary',
      };
    } else {
      return {
        icon: Rocket,
        message: 'Hora de acelerar! Foque nas oportunidades.',
        color: 'red',
        gradient: 'from-red-500/20 via-red-400/10 to-transparent',
        borderColor: 'border-red-500/30',
        iconBg: 'bg-red-500/20 text-red-500',
        textColor: 'text-red-600 dark:text-red-400',
      };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  // Journey badge text
  const getJourneyBadge = () => {
    if (!mentorshipProgress) return null;
    if (mentorshipProgress.isComplete) return { text: 'Concluída', color: 'bg-primary/20 text-primary' };
    if (mentorshipProgress.isLastMonth) return { text: 'Último mês!', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' };
    if (mentorshipProgress.isNearEnd) return { text: 'Falta 1 mês!', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' };
    if (mentorshipProgress.remaining <= 2) return { text: `Faltam ${mentorshipProgress.remaining} meses`, color: 'bg-primary/20 text-primary' };
    return null;
  };

  const journeyBadge = getJourneyBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl p-4 md:p-5 bg-gradient-to-r ${status.gradient} border ${status.borderColor} backdrop-blur-xl`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Status and Message */}
        <div className="flex items-center gap-4">
          <motion.div 
            className={`p-3 rounded-xl ${status.iconBg}`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <StatusIcon size={24} />
          </motion.div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Jornada de Mentoria
              </span>
              {journeyBadge && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${journeyBadge.color}`}>
                  {journeyBadge.text}
                </span>
              )}
            </div>
            <p className={`text-sm md:text-base font-semibold ${status.textColor}`}>
              {status.message}
            </p>
            {mentorshipProgress && !mentorshipProgress.isComplete && (
              <p className="text-xs text-muted-foreground mt-1">
                Mês {mentorshipProgress.current} de {mentorshipProgress.total} • {currentMonthName}/{selectedYear}
              </p>
            )}
            {mentorshipProgress?.isComplete && (
              <p className="text-xs text-muted-foreground mt-1">
                Mentoria finalizada • {currentMonthName}/{selectedYear}
              </p>
            )}
          </div>
        </div>

        {/* Right: Progress Bars */}
        <div className="w-full md:w-72 space-y-3">
          {/* Journey Progress Bar */}
          {mentorshipProgress && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Jornada
                </span>
                <span className="text-xs font-bold text-primary">
                  {mentorshipProgress.current}/{mentorshipProgress.total} meses
                </span>
              </div>
              
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mentorshipProgress.journeyPercent}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>
          )}

          {/* Monthly Goal Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Meta {currentMonthName}
              </span>
              <span className={`text-xs font-bold ${status.textColor}`}>
                {progressPercent.toFixed(0)}%
              </span>
            </div>
            
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className={`h-full rounded-full ${
                  progressPercent >= 100 
                    ? 'bg-emerald-500' 
                    : progressPercent >= 80 
                      ? 'bg-amber-500' 
                      : progressPercent >= 50 
                        ? 'bg-primary' 
                        : 'bg-red-500'
                }`}
              />
            </div>
          </div>
          
          {/* Annual progress indicator */}
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">
              Acumulado anual
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {annualProgress.toFixed(0)}% do ano
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JourneyBanner;
