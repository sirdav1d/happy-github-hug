import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Flame, Rocket, PartyPopper, X } from 'lucide-react';

interface CelebrationOverlayProps {
  type: 'goal_met' | 'streak' | 'achievement' | 'journey_complete' | 'record';
  title: string;
  description: string;
  onDismiss: () => void;
  autoClose?: number; // ms
}

const CELEBRATION_CONFIG = {
  goal_met: {
    icon: Trophy,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    confettiColors: ['#10b981', '#14b8a6', '#22c55e'],
  },
  streak: {
    icon: Flame,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-500/20 via-red-500/10 to-transparent',
    confettiColors: ['#f97316', '#ef4444', '#fbbf24'],
  },
  achievement: {
    icon: Star,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    confettiColors: ['#a855f7', '#ec4899', '#8b5cf6'],
  },
  journey_complete: {
    icon: PartyPopper,
    gradient: 'from-amber-500 to-yellow-500',
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    confettiColors: ['#f59e0b', '#eab308', '#fbbf24', '#10b981'],
  },
  record: {
    icon: Rocket,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    confettiColors: ['#3b82f6', '#06b6d4', '#0ea5e9'],
  },
};

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  type,
  title,
  description,
  onDismiss,
  autoClose = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = CELEBRATION_CONFIG[type];
  const Icon = config.icon;

  // Auto-close timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, autoClose);

    return () => clearTimeout(timer);
  }, [autoClose, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-sm w-full p-6 rounded-2xl bg-gradient-to-br ${config.bgGradient} bg-card border border-border shadow-2xl`}
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="flex justify-center mb-4"
            >
              <div className={`p-4 rounded-full bg-gradient-to-br ${config.gradient} shadow-lg`}>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: 3,
                    repeatDelay: 0.5,
                  }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-center mb-2"
            >
              {title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground text-center"
            >
              {description}
            </motion.p>

            {/* Animated Stars */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, (i - 2) * 40],
                  y: [0, -30 - Math.random() * 20],
                }}
                transition={{ 
                  delay: 0.5 + i * 0.1,
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para gerenciar celebrações
export const useCelebration = () => {
  const [celebration, setCelebration] = useState<{
    type: CelebrationOverlayProps['type'];
    title: string;
    description: string;
  } | null>(null);

  const celebrate = (
    type: CelebrationOverlayProps['type'],
    title: string,
    description: string
  ) => {
    setCelebration({ type, title, description });
  };

  const dismiss = () => setCelebration(null);

  return { celebration, celebrate, dismiss };
};

export default CelebrationOverlay;
