import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface RMRDeadlineIndicatorProps {
  deadline: Date;
  daysRemaining: number;
  isPrepared?: boolean;
  className?: string;
  compact?: boolean;
}

export const RMRDeadlineIndicator: React.FC<RMRDeadlineIndicatorProps> = ({
  deadline,
  daysRemaining,
  isPrepared = false,
  className,
  compact = false
}) => {
  // Calculate progress (7 days = 0%, 0 days = 100%)
  const maxDays = 7;
  const progress = Math.max(0, Math.min(100, ((maxDays - daysRemaining) / maxDays) * 100));

  // Determine status
  const getStatus = () => {
    if (isPrepared) {
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        progressColor: 'bg-green-500',
        icon: CheckCircle2,
        label: 'Preparada',
        description: 'RMR está pronta!'
      };
    }
    
    if (daysRemaining < 0) {
      return {
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
        progressColor: 'bg-destructive',
        icon: AlertCircle,
        label: 'Atrasado',
        description: `${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) !== 1 ? 's' : ''} de atraso`
      };
    }
    
    if (daysRemaining <= 1) {
      return {
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
        progressColor: 'bg-destructive',
        icon: AlertTriangle,
        label: 'Urgente',
        description: daysRemaining === 0 ? 'Último dia!' : '1 dia restante'
      };
    }
    
    if (daysRemaining <= 3) {
      return {
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        progressColor: 'bg-amber-500',
        icon: AlertTriangle,
        label: 'Atenção',
        description: `${daysRemaining} dias restantes`
      };
    }
    
    if (daysRemaining <= 5) {
      return {
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
        borderColor: 'border-amber-400/30',
        progressColor: 'bg-amber-400',
        icon: Clock,
        label: 'Em breve',
        description: `${daysRemaining} dias restantes`
      };
    }
    
    return {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      progressColor: 'bg-green-500',
      icon: Clock,
      label: 'No prazo',
      description: `${daysRemaining} dias restantes`
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <motion.div
          animate={!isPrepared && daysRemaining <= 3 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Icon className={cn("h-4 w-4", status.color)} />
        </motion.div>
        <span className={cn("text-sm font-medium", status.color)}>
          {status.description}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border p-4",
        status.bgColor,
        status.borderColor,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={!isPrepared && daysRemaining <= 3 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Icon className={cn("h-5 w-5", status.color)} />
          </motion.div>
          <div>
            <p className={cn("font-semibold", status.color)}>{status.label}</p>
            <p className="text-sm text-muted-foreground">{status.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Prazo</p>
          <p className="text-sm font-medium">{formatDate(deadline)}</p>
        </div>
      </div>

      {!isPrepared && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso do prazo</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn("h-full rounded-full", status.progressColor)}
            />
          </div>
        </div>
      )}

      {isPrepared && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Sua RMR está preparada e pronta para a reunião!</span>
        </div>
      )}
    </motion.div>
  );
};

export default RMRDeadlineIndicator;
