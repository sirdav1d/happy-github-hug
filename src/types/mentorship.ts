// Tipos específicos para o sistema de Jornada de Mentoria

export interface MentorshipConfig {
  startDate: string; // ISO date
  durationMonths: number; // Tipicamente 6
  consultantId?: string;
}

export interface MonthlyMilestone {
  month: number; // 1-6
  monthName: string;
  year: number;
  calendarMonth: string; // 'Jan', 'Fev', etc.
  goalMet: boolean;
  progressPercent: number;
  revenue: number;
  goal: number;
  status: 'completed' | 'current' | 'upcoming';
  growthFromPrevious?: number; // % de crescimento vs mês anterior
  // Campos de transparência de dados
  source: 'planilha' | 'lançamentos' | 'nenhum';
  spreadsheetRevenue: number;
  salesRevenue: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string; // ISO date quando foi desbloqueado
  isUnlocked: boolean;
  category: 'performance' | 'consistency' | 'growth' | 'milestone';
  requirement: {
    type: 'goals_met' | 'streak' | 'growth_percent' | 'journey_complete' | 'first_goal' | 'perfect_month' | 'comeback';
    value: number;
  };
}

export interface JourneyMetrics {
  // Timeline
  currentMonth: number; // Mês atual da jornada (1-6)
  totalMonths: number;
  remainingMonths: number;
  journeyPercent: number;
  isComplete: boolean;
  
  // Performance
  monthsWithGoalMet: number;
  consecutiveGoalsMet: number; // Streak atual
  bestStreak: number;
  
  // Evolução
  growthSinceStart: number; // % de crescimento desde o início
  averageMonthlyGrowth: number;
  bestMonth: { month: string; revenue: number; growth: number } | null;
  biggestLeap: { fromMonth: string; toMonth: string; growth: number } | null;
  
  // Consistência
  consistencyScore: number; // 0-100
  varianceCoefficient: number;
  
  // Projeção
  projectedEndResult: number;
  projectedTotalGrowth: number;
  probabilityOfSuccess: number; // % de chance de terminar acima da meta
  
  // Milestones detalhados
  milestones: MonthlyMilestone[];
}

export interface CelebrationEvent {
  id: string;
  type: 'goal_met' | 'streak' | 'achievement' | 'journey_complete' | 'record';
  title: string;
  description: string;
  celebratedAt: string;
  dismissed: boolean;
}

export const ACHIEVEMENTS_CONFIG: Achievement[] = [
  {
    id: 'first_goal',
    name: 'Primeira Conquista',
    description: 'Bateu a meta pela primeira vez na mentoria',
    icon: 'trophy',
    isUnlocked: false,
    category: 'milestone',
    requirement: { type: 'goals_met', value: 1 },
  },
  {
    id: 'hat_trick',
    name: 'Hat-Trick',
    description: 'Bateu a meta 3 meses consecutivos',
    icon: 'flame',
    isUnlocked: false,
    category: 'consistency',
    requirement: { type: 'streak', value: 3 },
  },
  {
    id: 'growth_25',
    name: 'Acelerador',
    description: 'Cresceu 25% ou mais em um único mês',
    icon: 'rocket',
    isUnlocked: false,
    category: 'growth',
    requirement: { type: 'growth_percent', value: 25 },
  },
  {
    id: 'growth_50',
    name: 'Turbinado',
    description: 'Cresceu 50% ou mais comparado ao início',
    icon: 'zap',
    isUnlocked: false,
    category: 'growth',
    requirement: { type: 'growth_percent', value: 50 },
  },
  {
    id: 'perfect_month',
    name: 'Mês Perfeito',
    description: 'Atingiu 120% ou mais da meta',
    icon: 'star',
    isUnlocked: false,
    category: 'performance',
    requirement: { type: 'perfect_month', value: 120 },
  },
  {
    id: 'comeback',
    name: 'Virada de Jogo',
    description: 'Bateu a meta após um mês abaixo',
    icon: 'refresh-cw',
    isUnlocked: false,
    category: 'performance',
    requirement: { type: 'comeback', value: 1 },
  },
  {
    id: 'consistency_king',
    name: 'Rei da Consistência',
    description: 'Manteve variação menor que 15% entre meses',
    icon: 'target',
    isUnlocked: false,
    category: 'consistency',
    requirement: { type: 'streak', value: 4 },
  },
  {
    id: 'journey_complete',
    name: 'Jornada Completa',
    description: 'Completou os 6 meses de mentoria',
    icon: 'award',
    isUnlocked: false,
    category: 'milestone',
    requirement: { type: 'journey_complete', value: 6 },
  },
  {
    id: 'all_goals',
    name: 'Invicto',
    description: 'Bateu todas as metas da mentoria',
    icon: 'crown',
    isUnlocked: false,
    category: 'milestone',
    requirement: { type: 'goals_met', value: 6 },
  },
];
