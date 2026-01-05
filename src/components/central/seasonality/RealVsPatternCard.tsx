import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import InfoTooltip from "../InfoTooltip";

interface RealVsPatternCardProps {
  currentYearRevenue: number;
  expectedByPattern: number;
  completedMonthsCount: number;
}

const RealVsPatternCard = ({ currentYearRevenue, expectedByPattern, completedMonthsCount }: RealVsPatternCardProps) => {
  const difference = currentYearRevenue - expectedByPattern;
  const percentDiff = expectedByPattern > 0 ? (difference / expectedByPattern) * 100 : 0;
  const isAbove = difference > 0;
  const isOnTrack = Math.abs(percentDiff) < 5;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompact = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className={`border-2 ${isOnTrack ? 'border-primary/30' : isAbove ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            Real vs Padrão Histórico
            <InfoTooltip 
              text="Compara o desempenho real do ano atual com o que seria esperado baseado no padrão sazonal histórico para os meses já completados." 
              maxWidth={300} 
            />
          </CardTitle>
          <Activity className={`h-5 w-5 ${isOnTrack ? 'text-primary' : isAbove ? 'text-emerald-500' : 'text-amber-500'}`} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {isOnTrack ? (
                <div className="p-2 rounded-full bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              ) : isAbove ? (
                <div className="p-2 rounded-full bg-emerald-500/10">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-amber-500/10">
                  <TrendingDown className="h-6 w-6 text-amber-500" />
                </div>
              )}
              <div>
                <span className={`text-2xl font-bold ${isOnTrack ? 'text-primary' : isAbove ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isAbove ? "+" : ""}{percentDiff.toFixed(1)}%
                </span>
                <p className="text-sm text-muted-foreground">
                  {isOnTrack ? "Dentro do esperado" : isAbove ? "Acima do padrão" : "Abaixo do padrão"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Realizado até agora</p>
                <p className="text-lg font-semibold text-foreground">{formatCompact(currentYearRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Esperado pelo padrão</p>
                <p className="text-lg font-semibold text-muted-foreground">{formatCompact(expectedByPattern)}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                {isAbove 
                  ? `Você está ${formatCompact(difference)} à frente do padrão histórico para ${completedMonthsCount} meses.`
                  : `Você está ${formatCompact(Math.abs(difference))} atrás do padrão histórico para ${completedMonthsCount} meses.`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RealVsPatternCard;
