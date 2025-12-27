import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIInsights {
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  mainInsight: string;
  actionItem: string;
  salesNeeded: number;
  dailyTarget: number;
}

interface PulseCardProps {
  insights: AIInsights | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const statusConfig = {
  excellent: {
    gradient: 'from-emerald-600 via-green-600 to-teal-600',
    glow: 'shadow-emerald-500/30',
    icon: TrendingUp,
    label: 'Excelente',
    pulseColor: 'bg-emerald-400',
  },
  good: {
    gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
    glow: 'shadow-cyan-500/30',
    icon: TrendingUp,
    label: 'Bom',
    pulseColor: 'bg-cyan-400',
  },
  warning: {
    gradient: 'from-amber-600 via-orange-600 to-yellow-600',
    glow: 'shadow-amber-500/30',
    icon: Minus,
    label: 'Atenção',
    pulseColor: 'bg-amber-400',
  },
  critical: {
    gradient: 'from-red-600 via-rose-600 to-pink-600',
    glow: 'shadow-red-500/30',
    icon: TrendingDown,
    label: 'Crítico',
    pulseColor: 'bg-red-400',
  },
};

const PulseCard: React.FC<PulseCardProps> = ({ insights, isLoading, onRefresh }) => {
  const status = insights?.healthStatus || 'good';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${config.gradient} text-white shadow-2xl ${config.glow} min-h-[200px]`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="w-5 h-5" />
              <span className={`absolute -top-1 -right-1 w-2 h-2 ${config.pulseColor} rounded-full animate-ping`} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-90">Pulse do Negócio</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <>
            {/* Health Score */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="opacity-20"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 176' }}
                    animate={{ strokeDasharray: `${(insights?.healthScore || 0) * 1.76} 176` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black">{insights?.healthScore || 0}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm font-bold">{config.label}</span>
                </div>
                <p className="text-xs opacity-80 mt-0.5">Score de Saúde</p>
              </div>
            </div>

            {/* Main Insight */}
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed opacity-95">
                {insights?.mainInsight || 'Carregando insights...'}
              </p>
            </div>

            {/* Action Item */}
            {insights?.actionItem && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-xs font-medium opacity-80">
                  💡 {insights.actionItem}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default PulseCard;
