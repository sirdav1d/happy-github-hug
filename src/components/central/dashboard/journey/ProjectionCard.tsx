import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Sparkles, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { JourneyMetrics } from '@/types/mentorship';
import { Progress } from '@/components/ui/progress';
import InfoTooltip from '../../InfoTooltip';

interface ProjectionCardProps {
  metrics: JourneyMetrics;
}

const ProjectionCard: React.FC<ProjectionCardProps> = ({ metrics }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const firstMonth = metrics.milestones.find(m => m.revenue > 0);
  const latestMonth = [...metrics.milestones].reverse().find(m => m.status !== 'upcoming' && m.revenue > 0);
  
  // Determinar status da projeção
  const getProjectionStatus = () => {
    if (metrics.probabilityOfSuccess >= 80) {
      return {
        label: 'Excelente',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        icon: CheckCircle,
        message: 'Continue assim! Você está no caminho certo para uma jornada de sucesso.',
      };
    }
    if (metrics.probabilityOfSuccess >= 50) {
      return {
        label: 'Bom',
        color: 'text-primary',
        bg: 'bg-primary/10',
        borderColor: 'border-primary/30',
        icon: TrendingUp,
        message: 'Você está progredindo! Foque em consistência para melhorar ainda mais.',
      };
    }
    return {
      label: 'Atenção',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      icon: AlertTriangle,
      message: 'Foque em bater a meta este mês para melhorar sua trajetória.',
    };
  };

  const status = getProjectionStatus();
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`p-4 rounded-xl ${status.bg} border ${status.borderColor}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className={`w-5 h-5 ${status.color}`} />
        <h3 className="font-semibold">Projeção da Jornada</h3>
        <InfoTooltip 
          text="Estimativa do seu resultado ao final dos 6 meses, calculada com base no seu histórico de performance e tendência de crescimento."
          size="sm"
        />
        <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-4">
        {/* Evolução Visual */}
        <div className="flex items-center gap-3">
          {/* Início */}
          <div className="flex-1 p-3 rounded-lg bg-background/50 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Início</p>
            <p className="text-sm font-bold">{firstMonth ? formatCurrency(firstMonth.revenue) : '—'}</p>
            <p className="text-[10px] text-muted-foreground">{firstMonth?.calendarMonth || '—'}</p>
          </div>
          
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          
          {/* Atual */}
          <div className="flex-1 p-3 rounded-lg bg-primary/10 text-center border border-primary/20">
            <p className="text-[10px] uppercase tracking-wider text-primary mb-1">Atual</p>
            <p className="text-sm font-bold text-primary">{latestMonth ? formatCurrency(latestMonth.revenue) : '—'}</p>
            <p className="text-[10px] text-muted-foreground">{latestMonth?.calendarMonth || '—'}</p>
          </div>
          
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          
          {/* Projeção */}
          <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 text-center border border-emerald-500/20">
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Projeção</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.projectedEndResult)}
            </p>
            <p className="text-[10px] text-muted-foreground">Mês 6</p>
          </div>
        </div>

        {/* Probabilidade de Sucesso */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Probabilidade de Sucesso
              <InfoTooltip 
                text="Estimativa baseada na taxa de metas batidas e tendência de crescimento. Considera: metas batidas × peso + crescimento positivo × peso + consistência × peso."
                size="sm"
              />
            </span>
            <span className={`text-sm font-bold ${status.color}`}>
              {metrics.probabilityOfSuccess.toFixed(0)}%
            </span>
          </div>
          <Progress value={metrics.probabilityOfSuccess} className="h-2" />
        </div>

        {/* Crescimento Projetado */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm">Crescimento Total Projetado</span>
            <InfoTooltip 
              text="Variação percentual projetada do início ao fim da jornada. Fórmula: (Faturamento Projetado Mês 6 - Faturamento Mês 1) ÷ Faturamento Mês 1 × 100"
              size="sm"
            />
          </div>
          <span className={`text-lg font-bold ${
            metrics.projectedTotalGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {metrics.projectedTotalGrowth >= 0 ? '+' : ''}{metrics.projectedTotalGrowth.toFixed(0)}%
          </span>
        </div>

        {/* Mensagem de Status */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-background/30">
          <StatusIcon className={`w-4 h-4 ${status.color} flex-shrink-0 mt-0.5`} />
          <p className="text-xs text-muted-foreground">{status.message}</p>
        </div>

        {/* Meses Restantes */}
        {metrics.remainingMonths > 0 && (
          <div className="text-center pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              <Target className="w-3 h-3 inline mr-1" />
              {metrics.remainingMonths} {metrics.remainingMonths === 1 ? 'mês restante' : 'meses restantes'} na jornada
            </p>
          </div>
        )}

        {metrics.isComplete && (
          <div className="text-center pt-2 border-t border-border/50">
            <p className="text-xs text-emerald-500 font-medium">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Jornada Concluída!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectionCard;
