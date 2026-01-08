import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalHealthScoreProps {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  isLoading?: boolean;
}

const statusConfig = {
  excellent: {
    label: 'Excelente',
    gradient: 'from-emerald-500 to-teal-400',
    glow: 'shadow-emerald-500/30',
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  good: {
    label: 'Bom',
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'shadow-blue-500/30',
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  warning: {
    label: 'Atenção',
    gradient: 'from-amber-500 to-orange-400',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  critical: {
    label: 'Crítico',
    gradient: 'from-red-500 to-rose-400',
    glow: 'shadow-red-500/30',
    text: 'text-red-500',
    bg: 'bg-red-500/10',
  },
};

const GlobalHealthScore = ({ score, status, isLoading }: GlobalHealthScoreProps) => {
  const config = statusConfig[status];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center"
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 blur-3xl opacity-20 rounded-full",
        `bg-gradient-to-br ${config.gradient}`
      )} />

      {/* Score Circle */}
      <div className="relative">
        <svg width="160" height="160" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r="45"
            stroke="url(#healthGradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: isLoading ? circumference : strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={cn("stop-color-current", config.text)} style={{ stopColor: 'currentColor' }} />
              <stop offset="100%" className="stop-color-current" style={{ stopColor: 'currentColor', opacity: 0.6 }} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-8 w-8 text-violet-500" />
            </motion.div>
          ) : (
            <>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={cn("text-4xl font-bold", config.text)}
              >
                {score}
              </motion.span>
              <span className="text-xs text-muted-foreground mt-1">de 100</span>
            </>
          )}
        </div>
      </div>

      {/* Status label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={cn(
          "mt-4 px-4 py-1.5 rounded-full text-sm font-medium",
          config.bg,
          config.text
        )}
      >
        {isLoading ? 'Analisando...' : config.label}
      </motion.div>

      {/* IRIS branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground"
      >
        <Sparkles className="h-3 w-3 text-violet-500" />
        <span>Health Score por IRIS</span>
      </motion.div>
    </motion.div>
  );
};

export default GlobalHealthScore;
