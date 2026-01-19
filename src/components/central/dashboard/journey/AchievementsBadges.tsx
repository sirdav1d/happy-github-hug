import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Rocket, Zap, Star, Target, RefreshCw, Award, Crown, Lock 
} from 'lucide-react';
import { Achievement } from '@/types/mentorship';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';

interface AchievementsBadgesProps {
  achievements: Achievement[];
  compact?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'trophy': Trophy,
  'flame': Flame,
  'rocket': Rocket,
  'zap': Zap,
  'star': Star,
  'target': Target,
  'refresh-cw': RefreshCw,
  'award': Award,
  'crown': Crown,
};

const CATEGORY_COLORS: Record<string, { gradient: string; bg: string }> = {
  performance: { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/20' },
  consistency: { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/20' },
  growth: { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/20' },
  milestone: { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/20' },
};

const AchievementsBadges: React.FC<AchievementsBadgesProps> = ({ achievements, compact = false }) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  // Ordenar: desbloqueados primeiro, depois por categoria
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    return 0;
  });

  if (compact) {
    // Versão compacta: apenas mostra badges desbloqueados
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);
    
    if (unlockedAchievements.length === 0) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span className="text-xs">Nenhuma conquista ainda</span>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {unlockedAchievements.slice(0, 4).map((achievement) => {
          const Icon = ICON_MAP[achievement.icon] || Trophy;
          const colors = CATEGORY_COLORS[achievement.category];
          
          return (
            <motion.button
              key={achievement.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={`p-2 rounded-lg ${colors.bg} border border-white/10`}
              title={achievement.name}
            >
              <Icon className={`w-4 h-4 bg-gradient-to-br ${colors.gradient} bg-clip-text text-transparent`} 
                style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' }}
              />
            </motion.button>
          );
        })}
        {unlockedAchievements.length > 4 && (
          <span className="text-xs text-muted-foreground self-center">
            +{unlockedAchievements.length - 4}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">Conquistas</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {unlockedCount}/{totalCount} desbloqueadas
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {sortedAchievements.map((achievement, index) => {
            const Icon = ICON_MAP[achievement.icon] || Trophy;
            const colors = CATEGORY_COLORS[achievement.category];
            
            return (
              <motion.button
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                onClick={() => setSelectedAchievement(achievement)}
                className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                  achievement.isUnlocked
                    ? `${colors.bg} border-white/20 shadow-lg cursor-pointer`
                    : 'bg-muted/30 border-border/50 opacity-50'
                }`}
              >
                {/* Icon */}
                <div className={`p-2 rounded-lg mb-2 ${
                  achievement.isUnlocked
                    ? `bg-gradient-to-br ${colors.gradient}`
                    : 'bg-muted'
                }`}>
                  {achievement.isUnlocked ? (
                    <Icon className="w-5 h-5 text-white" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                
                {/* Name */}
                <span className={`text-[10px] font-medium text-center leading-tight ${
                  achievement.isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {achievement.name}
                </span>

                {/* Unlocked Indicator */}
                {achievement.isUnlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-[8px] text-white">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Achievement Detail Modal */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="max-w-sm">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = ICON_MAP[selectedAchievement.icon] || Trophy;
                    const colors = CATEGORY_COLORS[selectedAchievement.category];
                    return (
                      <div className={`p-3 rounded-xl ${
                        selectedAchievement.isUnlocked
                          ? `bg-gradient-to-br ${colors.gradient}`
                          : 'bg-muted'
                      }`}>
                        {selectedAchievement.isUnlocked ? (
                          <Icon className="w-6 h-6 text-white" />
                        ) : (
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <DialogTitle>{selectedAchievement.name}</DialogTitle>
                    <span className={`text-xs ${
                      selectedAchievement.isUnlocked ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}>
                      {selectedAchievement.isUnlocked ? '✓ Desbloqueada' : '🔒 Bloqueada'}
                    </span>
                  </div>
                </div>
              </DialogHeader>
              <DialogDescription className="mt-4">
                {selectedAchievement.description}
              </DialogDescription>
              {selectedAchievement.unlockedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Conquistada em {new Date(selectedAchievement.unlockedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AchievementsBadges;
