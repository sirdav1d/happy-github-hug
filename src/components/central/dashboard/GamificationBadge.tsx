import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Star, Zap, Award } from 'lucide-react';

interface GamificationBadgeProps {
  type: 'streak' | 'milestone' | 'achievement';
  value: number;
  label: string;
  isActive?: boolean;
}

const badgeConfig = {
  streak: {
    icon: Flame,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-500/20 to-red-500/20',
  },
  milestone: {
    icon: Trophy,
    gradient: 'from-amber-500 to-yellow-500',
    bgGradient: 'from-amber-500/20 to-yellow-500/20',
  },
  achievement: {
    icon: Star,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
  },
};

const GamificationBadge: React.FC<GamificationBadgeProps> = ({
  type,
  value,
  label,
  isActive = true,
}) => {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border ${
        isActive 
          ? `bg-gradient-to-r ${config.bgGradient} border-white/10` 
          : 'bg-muted/50 border-border opacity-50'
      }`}
    >
      {isActive && (
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient}`}
        >
          <Icon className="w-3.5 h-3.5 text-white" />
        </motion.div>
      )}
      {!isActive && (
        <div className="p-1.5 rounded-lg bg-muted">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col">
        <span className={`text-sm font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
          {value}
        </span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
    </motion.div>
  );
};

interface GamificationSectionProps {
  currentStreak: number;
  weeklyGoalsMet: number;
  totalMilestones: number;
}

export const GamificationSection: React.FC<GamificationSectionProps> = ({
  currentStreak,
  weeklyGoalsMet,
  totalMilestones,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <GamificationBadge
        type="streak"
        value={currentStreak}
        label="Dias em Streak"
        isActive={currentStreak > 0}
      />
      <GamificationBadge
        type="milestone"
        value={weeklyGoalsMet}
        label="Semanas ✓"
        isActive={weeklyGoalsMet > 0}
      />
      <GamificationBadge
        type="achievement"
        value={totalMilestones}
        label="Conquistas"
        isActive={totalMilestones > 0}
      />
    </div>
  );
};

export default GamificationBadge;
