import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Trophy, Target, TrendingUp, Sparkles } from 'lucide-react';

interface JourneyBannerProps {
  mentorshipStartDate?: string;
  currentMonth: string;
  currentYear: number;
  progressPercent: number;
  annualProgress: number;
}

const JourneyBanner: React.FC<JourneyBannerProps> = ({
  mentorshipStartDate,
  currentMonth,
  currentYear,
  progressPercent,
  annualProgress,
}) => {
  // Calculate mentorship journey months
  const calculateMentorshipMonths = () => {
    if (!mentorshipStartDate) return null;
    
    const startDate = new Date(mentorshipStartDate);
    const now = new Date();
    const months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1;
    const totalMonths = 12; // Assuming 12-month journey
    
    return { current: Math.min(months, totalMonths), total: totalMonths };
  };

  const mentorshipProgress = calculateMentorshipMonths();

  // Determine status and message based on performance
  const getStatusConfig = () => {
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
                Jornada de Evolução
              </span>
            </div>
            <p className={`text-sm md:text-base font-semibold ${status.textColor}`}>
              {status.message}
            </p>
            {mentorshipProgress && (
              <p className="text-xs text-muted-foreground mt-1">
                Mês {mentorshipProgress.current} de {mentorshipProgress.total} da mentoria
              </p>
            )}
          </div>
        </div>

        {/* Right: Progress Bar */}
        <div className="w-full md:w-64">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {currentMonth}/{currentYear}
            </span>
            <span className={`text-sm font-bold ${status.textColor}`}>
              {progressPercent.toFixed(0)}% da meta
            </span>
          </div>
          
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
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
          
          {/* Annual progress indicator */}
          <div className="flex justify-between items-center mt-2">
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
