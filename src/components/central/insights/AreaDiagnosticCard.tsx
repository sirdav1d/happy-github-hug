import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AreaScore } from '@/hooks/useIRISCommandCenter';

interface AreaDiagnosticCardProps {
  area: 'vendas' | 'pipeline' | 'equipe' | 'eficiencia';
  data: AreaScore;
  onClick?: () => void;
  delay?: number;
}

const areaConfig = {
  vendas: {
    label: 'Vendas',
    icon: DollarSign,
    gradient: 'from-emerald-500 to-teal-500',
  },
  pipeline: {
    label: 'Pipeline',
    icon: Target,
    gradient: 'from-blue-500 to-indigo-500',
  },
  equipe: {
    label: 'Equipe',
    icon: Users,
    gradient: 'from-violet-500 to-purple-500',
  },
  eficiencia: {
    label: 'Eficiência',
    icon: BarChart3,
    gradient: 'from-amber-500 to-orange-500',
  },
};

const statusColors = {
  excellent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  good: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  critical: 'text-red-500 bg-red-500/10 border-red-500/20',
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const AreaDiagnosticCard = ({ area, data, onClick, delay = 0 }: AreaDiagnosticCardProps) => {
  const config = areaConfig[area];
  const Icon = config.icon;
  const TrendIcon = trendIcons[data.trend];
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (data.score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 border",
          statusColors[data.status],
          "hover:shadow-lg"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Icon and info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "p-1.5 rounded-lg bg-gradient-to-br",
                  config.gradient
                )}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-foreground">{config.label}</span>
                <TrendIcon className={cn(
                  "h-3.5 w-3.5",
                  data.trend === 'up' && 'text-emerald-500',
                  data.trend === 'down' && 'text-red-500',
                  data.trend === 'stable' && 'text-muted-foreground'
                )} />
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {data.mainInsight}
              </p>
            </div>

            {/* Right: Mini score */}
            <div className="relative flex-shrink-0">
              <svg width="50" height="50" className="transform -rotate-90">
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted/20"
                />
                <motion.circle
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  className={statusColors[data.status].split(' ')[0]}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut", delay: delay + 0.3 }}
                  style={{ strokeDasharray: circumference }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-sm font-bold", statusColors[data.status].split(' ')[0])}>
                  {data.score}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AreaDiagnosticCard;
