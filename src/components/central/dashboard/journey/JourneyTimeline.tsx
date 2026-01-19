import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Target, Trophy, AlertTriangle, Flame } from 'lucide-react';
import { MonthlyMilestone } from '@/types/mentorship';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface JourneyTimelineProps {
  milestones: MonthlyMilestone[];
  currentMonth: number;
  onMonthClick?: (milestone: MonthlyMilestone) => void;
}

const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ 
  milestones, 
  currentMonth,
  onMonthClick 
}) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const getNodeStyle = (milestone: MonthlyMilestone) => {
    if (milestone.status === 'upcoming') {
      return {
        bg: 'bg-muted',
        border: 'border-muted-foreground/30',
        icon: Circle,
        iconColor: 'text-muted-foreground',
      };
    }
    
    if (milestone.goalMet) {
      return {
        bg: 'bg-emerald-500',
        border: 'border-emerald-400',
        icon: CheckCircle,
        iconColor: 'text-white',
      };
    }
    
    if (milestone.status === 'current') {
      return {
        bg: 'bg-primary',
        border: 'border-primary',
        icon: Target,
        iconColor: 'text-white',
      };
    }
    
    // Completed but goal not met
    return {
      bg: 'bg-amber-500',
      border: 'border-amber-400',
      icon: AlertTriangle,
      iconColor: 'text-white',
    };
  };

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full" />
        
        {/* Progress Line */}
        <motion.div
          className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentMonth - 0.5) / milestones.length) * 100}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
        
        {/* Nodes */}
        <div className="relative flex justify-between">
          {milestones.map((milestone, index) => {
            const style = getNodeStyle(milestone);
            const Icon = style.icon;
            const isCurrentOrPast = milestone.status !== 'upcoming';
            
            return (
              <Tooltip key={milestone.month}>
                <TooltipTrigger asChild>
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => onMonthClick?.(milestone)}
                    className={`relative flex flex-col items-center cursor-pointer group`}
                  >
                    {/* Node Circle */}
                    <motion.div
                      className={`w-12 h-12 rounded-full ${style.bg} border-2 ${style.border} flex items-center justify-center shadow-lg transition-all group-hover:shadow-xl`}
                      animate={milestone.status === 'current' ? { 
                        boxShadow: ['0 0 0 0 hsl(var(--primary) / 0.4)', '0 0 0 8px hsl(var(--primary) / 0)']
                      } : {}}
                      transition={milestone.status === 'current' ? { 
                        duration: 1.5, 
                        repeat: Infinity 
                      } : {}}
                    >
                      <Icon className={`w-5 h-5 ${style.iconColor}`} />
                    </motion.div>
                    
                    {/* Month Label */}
                    <span className={`mt-2 text-xs font-medium ${
                      milestone.status === 'current' 
                        ? 'text-primary' 
                        : milestone.status === 'completed'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}>
                      {milestone.calendarMonth}
                    </span>
                    
                    {/* Progress Badge */}
                    {isCurrentOrPast && milestone.progressPercent > 0 && (
                      <motion.span
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-[10px] font-bold ${
                          milestone.goalMet ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {milestone.progressPercent.toFixed(0)}%
                      </motion.span>
                    )}

                    {/* Streak Badge */}
                    {milestone.goalMet && index > 0 && milestones[index - 1]?.goalMet && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                      >
                        <Flame className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Mês {milestone.month} • {milestone.calendarMonth}/{milestone.year}
                    </p>
                    {isCurrentOrPast && milestone.revenue > 0 ? (
                      <>
                        <p className="text-sm">
                          Faturamento: <span className="font-medium">{formatCurrency(milestone.revenue)}</span>
                        </p>
                        <p className="text-sm">
                          Meta: <span className="font-medium">{formatCurrency(milestone.goal)}</span>
                        </p>
                        <p className={`text-sm font-semibold ${milestone.goalMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {milestone.goalMet ? '✓ Meta batida!' : `Faltou ${(100 - milestone.progressPercent).toFixed(0)}%`}
                        </p>
                        {milestone.growthFromPrevious !== undefined && (
                          <p className={`text-xs ${milestone.growthFromPrevious >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {milestone.growthFromPrevious >= 0 ? '↑' : '↓'} {Math.abs(milestone.growthFromPrevious).toFixed(1)}% vs mês anterior
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {milestone.status === 'current' ? 'Mês em andamento' : 'Aguardando...'}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default JourneyTimeline;
