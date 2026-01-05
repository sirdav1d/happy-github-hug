import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import InfoTooltip from '../InfoTooltip';

interface SparklineData {
  value: number;
}

interface MetricCardProps {
  title: string;
  value: number;
  formatter: (val: number) => string;
  subtitle?: string;
  progress?: {
    current: number;
    total: number;
    showBar?: boolean;
    showPercentageBadge?: boolean;
  };
  comparison?: {
    value: number;
    label: string;
    type: 'percentage' | 'absolute';
  };
  icon: React.ReactNode;
  variant?: 'default' | 'highlight' | 'dark';
  accentColor?: string;
  delay?: number;
  sparkline?: SparklineData[];
  tooltip?: string;
}

const AnimatedCounter = ({ 
  value, 
  formatter 
}: { 
  value: number; 
  formatter: (v: number) => string;
}) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime = performance.now();
    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / 1500, 1);
      setCount(value * (1 - Math.pow(1 - progress, 4)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span>{formatter(count)}</span>;
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  formatter,
  subtitle,
  progress,
  comparison,
  icon,
  variant = 'default',
  accentColor = 'primary',
  delay = 0,
  sparkline,
  tooltip,
}) => {
  const isPositive = comparison?.value ? comparison.value >= 0 : true;
  const TrendIcon = comparison?.value 
    ? (comparison.value > 0 ? TrendingUp : comparison.value < 0 ? TrendingDown : Minus)
    : null;

  const variantStyles = {
    default: 'bg-card border-border hover:border-primary/30',
    highlight: `bg-gradient-to-br from-${accentColor}-500/10 to-transparent border-${accentColor}-500/30`,
    dark: 'bg-slate-900 border-slate-700 text-white',
  };

  const progressPercent = progress 
    ? Math.min((progress.current / progress.total) * 100, 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={`relative p-5 rounded-2xl shadow-sm border transition-all group ${variantStyles[variant]}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            {tooltip && <InfoTooltip text={tooltip} size="sm" />}
          </div>
          {subtitle && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
              {subtitle}
            </span>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${
          variant === 'dark' 
            ? 'bg-white/10 text-white' 
            : 'bg-primary/10 text-primary'
        } group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <h3 className={`text-2xl lg:text-3xl font-bold ${
        variant === 'dark' ? 'text-white' : 'text-foreground'
      } mb-2`}>
        <AnimatedCounter value={value} formatter={formatter} />
      </h3>

      {/* Comparison Badge */}
      {comparison && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            isPositive 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {TrendIcon && <TrendIcon size={12} />}
            {isPositive && comparison.value > 0 ? '+' : ''}
            {comparison.type === 'percentage' 
              ? `${comparison.value.toFixed(1)}%`
              : formatter(comparison.value)
            }
          </span>
          <span className={`text-[10px] ${
            variant === 'dark' ? 'text-slate-400' : 'text-muted-foreground'
          }`}>
            {comparison.label}
          </span>
        </div>
      )}

      {/* Progress with Percentage Badge */}
      {progress && progress.showPercentageBadge && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            progressPercent >= 100 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : progressPercent >= 80
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {progressPercent >= 100 ? (
              <><TrendingUp size={12} /> +{(progressPercent - 100).toFixed(1)}% acima</>
            ) : (
              <><TrendingDown size={12} /> -{(100 - progressPercent).toFixed(1)}% faltando</>
            )}
          </span>
          <span className={`text-[10px] ${
            variant === 'dark' ? 'text-slate-400' : 'text-muted-foreground'
          }`}>
            da meta
          </span>
        </div>
      )}

      {/* Progress Bar */}
      {progress && progress.showBar && (
        <div>
          <div className="flex justify-between text-[10px] font-medium text-muted-foreground mb-1.5">
            <span>Progresso</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className={`w-full h-2 rounded-full ${
            variant === 'dark' ? 'bg-slate-800' : 'bg-muted'
          } overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }}
              transition={{ duration: 1, delay: delay * 0.1 + 0.3 }}
              className={`h-full rounded-full ${
                progressPercent >= 100 
                  ? 'bg-emerald-500' 
                  : progressPercent >= 80 
                    ? 'bg-primary' 
                    : progressPercent >= 50 
                      ? 'bg-amber-500' 
                      : 'bg-red-500'
              }`}
            />
          </div>
        </div>
      )}

      {/* Sparkline */}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sparklineGradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                fill={`url(#sparklineGradient-${title.replace(/\s/g, '')})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default MetricCard;
