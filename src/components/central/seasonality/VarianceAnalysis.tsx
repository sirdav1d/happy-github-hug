import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertCircle, CheckCircle } from "lucide-react";
import { MonthlyData } from "@/types";
import InfoTooltip from "../InfoTooltip";

interface VarianceAnalysisProps {
  historicalData: MonthlyData[];
  monthOrder: string[];
}

const VarianceAnalysis = ({ historicalData, monthOrder }: VarianceAnalysisProps) => {
  // Calculate variance (standard deviation) for each month
  const varianceData = monthOrder.map(month => {
    const monthRevenues = historicalData
      .filter(d => d.month === month)
      .map(d => d.revenue);
    
    if (monthRevenues.length < 2) {
      return { month, variance: 0, cv: 0, predictability: "unknown" as const, count: monthRevenues.length };
    }

    const mean = monthRevenues.reduce((a, b) => a + b, 0) / monthRevenues.length;
    const squaredDiffs = monthRevenues.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    // Coefficient of variation (CV) - normalized measure
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    // Classify predictability
    let predictability: "high" | "medium" | "low" | "unknown";
    if (cv < 15) predictability = "high";
    else if (cv < 30) predictability = "medium";
    else predictability = "low";

    return { month, variance: stdDev, cv, predictability, count: monthRevenues.length, mean };
  });

  const getPredictabilityColor = (pred: string) => {
    switch (pred) {
      case "high": return { text: "text-emerald-500", bg: "bg-emerald-500", label: "Alta" };
      case "medium": return { text: "text-amber-500", bg: "bg-amber-500", label: "Média" };
      case "low": return { text: "text-red-400", bg: "bg-red-400", label: "Baixa" };
      default: return { text: "text-muted-foreground", bg: "bg-muted", label: "N/A" };
    }
  };

  const highPredictability = varianceData.filter(m => m.predictability === "high");
  const lowPredictability = varianceData.filter(m => m.predictability === "low");

  // Overall predictability score
  const avgCV = varianceData.filter(m => m.cv > 0).reduce((sum, m) => sum + m.cv, 0) / 
    varianceData.filter(m => m.cv > 0).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Análise de Variância
            <InfoTooltip 
              text="Mostra quão previsível é a receita de cada mês baseado na variação histórica. Meses com alta previsibilidade têm desempenho consistente, enquanto meses com baixa previsibilidade são mais voláteis." 
              maxWidth={340} 
            />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Previsibilidade geral: {avgCV < 15 ? "Alta" : avgCV < 30 ? "Média" : "Baixa"} (CV médio: {avgCV.toFixed(1)}%)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
            {varianceData.map((month, idx) => {
              const pred = getPredictabilityColor(month.predictability);
              return (
                <motion.div
                  key={month.month}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.65 + idx * 0.02 }}
                  className="p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-foreground">{month.month}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${pred.bg}/20 ${pred.text}`}>
                      {pred.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, 100 - month.cv)}%` }}
                      transition={{ delay: 0.7 + idx * 0.02, duration: 0.4 }}
                      className={`h-full ${pred.bg}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CV: {month.cv.toFixed(1)}%
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="p-3 rounded-lg bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-foreground">Meses Mais Previsíveis</span>
              </div>
              {highPredictability.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {highPredictability.map(m => (
                    <span key={m.month} className="px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-500">
                      {m.month}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum mês com alta previsibilidade</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Metas nesses meses têm maior probabilidade de serem atingidas.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-red-400/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="font-medium text-foreground">Meses Mais Voláteis</span>
              </div>
              {lowPredictability.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {lowPredictability.map(m => (
                    <span key={m.month} className="px-2 py-1 text-xs rounded bg-red-400/20 text-red-400">
                      {m.month}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum mês com alta volatilidade</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Considere metas mais flexíveis e planos de contingência.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VarianceAnalysis;
