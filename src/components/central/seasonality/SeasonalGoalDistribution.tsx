import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import InfoTooltip from "../InfoTooltip";

interface SeasonalityMonth {
  month: string;
  avgRevenue: number;
  index: number;
  isStrong: boolean;
  variation: number;
}

interface SeasonalGoalDistributionProps {
  seasonalityData: SeasonalityMonth[];
  annualGoal: number;
}

const SeasonalGoalDistribution = ({ seasonalityData, annualGoal }: SeasonalGoalDistributionProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompact = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value}`;
  };

  // Calculate total index weight
  const totalIndexWeight = seasonalityData.reduce((sum, m) => sum + m.index, 0);
  
  // Distribute annual goal based on seasonal indices
  const monthlyGoals = seasonalityData.map(month => ({
    ...month,
    seasonalGoal: totalIndexWeight > 0 ? (month.index / totalIndexWeight) * annualGoal : annualGoal / 12,
    equalGoal: annualGoal / 12,
  }));

  const maxGoal = Math.max(...monthlyGoals.map(m => m.seasonalGoal));

  if (annualGoal <= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Meta Sazonal Distribuída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Configure uma meta anual para ver a distribuição sazonal recomendada.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Meta Sazonal Distribuída
            <InfoTooltip 
              text="Distribui sua meta anual por mês de acordo com o padrão de sazonalidade. Meses mais fortes recebem metas maiores, tornando os objetivos mais realistas." 
              maxWidth={320} 
            />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Meta anual de {formatCurrency(annualGoal)} distribuída conforme sazonalidade
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {monthlyGoals.map((month, idx) => (
              <motion.div
                key={month.month}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + idx * 0.03 }}
                className="p-3 rounded-lg bg-muted/30 relative overflow-hidden"
              >
                {/* Background bar */}
                <div 
                  className="absolute inset-0 bg-primary/10"
                  style={{ 
                    clipPath: `inset(${100 - (month.seasonalGoal / maxGoal) * 100}% 0 0 0)` 
                  }}
                />
                
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-foreground">{month.month}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${month.index >= 1 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                      {month.index.toFixed(2)}x
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatCompact(month.seasonalGoal)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">vs igualitária:</span>
                    <span className={`text-xs font-medium ${month.seasonalGoal >= month.equalGoal ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {month.seasonalGoal >= month.equalGoal ? '+' : ''}{((month.seasonalGoal - month.equalGoal) / month.equalGoal * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/20" />
                <span className="text-muted-foreground">Meta sazonal (baseada no histórico)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted" />
                <span className="text-muted-foreground">Meta igualitária: {formatCompact(annualGoal / 12)}/mês</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SeasonalGoalDistribution;
