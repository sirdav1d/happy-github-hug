import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Shield, TrendingDown, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DISCScores } from '@/types/behavioral';

interface StressIndicatorProps {
  natural: DISCScores;
  adapted: DISCScores;
  salespersonName: string;
  className?: string;
}

interface StressAnalysis {
  level: 'baixo' | 'moderado' | 'alto' | 'critico';
  score: number;
  maxDivergence: number;
  divergentDimension: keyof DISCScores;
  interpretation: string;
  recommendation: string;
}

const DIMENSION_LABELS: Record<keyof DISCScores, string> = {
  d: 'Dominância',
  i: 'Influência',
  s: 'Estabilidade',
  c: 'Conformidade'
};

function analyzeStress(natural: DISCScores, adapted: DISCScores): StressAnalysis {
  // Calcular divergência em cada dimensão
  const divergences: Record<keyof DISCScores, number> = {
    d: Math.abs(natural.d - adapted.d),
    i: Math.abs(natural.i - adapted.i),
    s: Math.abs(natural.s - adapted.s),
    c: Math.abs(natural.c - adapted.c)
  };

  // Encontrar maior divergência
  const entries = Object.entries(divergences) as [keyof DISCScores, number][];
  const maxEntry = entries.reduce((max, entry) => 
    entry[1] > max[1] ? entry : max, entries[0]
  );

  const maxDivergence = maxEntry[1];
  const divergentDimension = maxEntry[0];

  // Calcular score geral de stress (média ponderada das divergências)
  const avgDivergence = (divergences.d + divergences.i + divergences.s + divergences.c) / 4;
  const stressScore = Math.round((avgDivergence / 100) * 100);

  // Determinar nível
  let level: StressAnalysis['level'];
  let interpretation: string;
  let recommendation: string;

  if (maxDivergence >= 30) {
    level = 'critico';
    interpretation = `Alta adaptação forçada em ${DIMENSION_LABELS[divergentDimension]}. O vendedor está agindo muito diferente de seu perfil natural, o que pode levar a esgotamento.`;
    recommendation = 'Conversa urgente recomendada. Avalie se o ambiente ou as demandas estão adequados ao perfil.';
  } else if (maxDivergence >= 20) {
    level = 'alto';
    interpretation = `Adaptação significativa detectada em ${DIMENSION_LABELS[divergentDimension]}. Esforço considerável para se adequar ao ambiente.`;
    recommendation = 'Monitorar de perto e oferecer suporte. Verificar se as demandas do cargo são realistas.';
  } else if (maxDivergence >= 12) {
    level = 'moderado';
    interpretation = `Adaptação moderada em ${DIMENSION_LABELS[divergentDimension]}. Ajustes comportamentais dentro do esperado.`;
    recommendation = 'Situação normal. Manter acompanhamento regular nas FIVIs.';
  } else {
    level = 'baixo';
    interpretation = 'Perfil natural e adaptado muito próximos. O vendedor está em ambiente compatível com seu perfil.';
    recommendation = 'Excelente fit! Manter as condições atuais e aproveitar o alto alinhamento.';
  }

  return {
    level,
    score: stressScore,
    maxDivergence,
    divergentDimension,
    interpretation,
    recommendation
  };
}

const LEVEL_CONFIG: Record<StressAnalysis['level'], {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof AlertTriangle;
}> = {
  baixo: {
    label: 'Baixo',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    icon: Shield
  },
  moderado: {
    label: 'Moderado',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    icon: Activity
  },
  alto: {
    label: 'Alto',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    icon: TrendingDown
  },
  critico: {
    label: 'Crítico',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
    icon: AlertTriangle
  }
};

export function StressIndicator({ natural, adapted, salespersonName, className }: StressIndicatorProps) {
  const analysis = analyzeStress(natural, adapted);
  const config = LEVEL_CONFIG[analysis.level];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <Card className={cn("border", config.bgColor)}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Índice de Stress</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Compara o perfil DISC Natural (quem a pessoa é) com o Adaptado (como ela está agindo).
                          Alta divergência indica esforço de adaptação excessivo, que pode levar ao burnout.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">{salespersonName}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn("font-bold", config.color, config.bgColor)}>
              {config.label}
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {/* Divergence Bars */}
            <div className="space-y-2">
              {(Object.entries(DIMENSION_LABELS) as [keyof DISCScores, string][]).map(([key, label]) => {
                const divergence = Math.abs(natural[key] - adapted[key]);
                const isMax = key === analysis.divergentDimension;
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn(
                        "font-medium",
                        isMax ? config.color : "text-muted-foreground"
                      )}>
                        {label}
                      </span>
                      <span className={cn(
                        isMax ? config.color : "text-muted-foreground"
                      )}>
                        {natural[key]} → {adapted[key]} ({divergence > 0 ? `+${divergence}` : divergence})
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(divergence * 2.5, 100)}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className={cn(
                          "h-full rounded-full",
                          divergence >= 30 ? "bg-rose-500" :
                          divergence >= 20 ? "bg-orange-500" :
                          divergence >= 12 ? "bg-amber-500" :
                          "bg-emerald-500"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interpretation */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <p className="text-xs text-foreground mb-2">{analysis.interpretation}</p>
              <p className="text-xs text-muted-foreground italic">💡 {analysis.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default StressIndicator;
