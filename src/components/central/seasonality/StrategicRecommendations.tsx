import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertTriangle, Calendar, Target } from "lucide-react";
import InfoTooltip from "../InfoTooltip";

interface SeasonalityMonth {
  month: string;
  avgRevenue: number;
  index: number;
  isStrong: boolean;
  variation: number;
}

interface StrategicRecommendationsProps {
  seasonalityData: SeasonalityMonth[];
  currentMonthIndex: number;
}

const StrategicRecommendations = ({ seasonalityData, currentMonthIndex }: StrategicRecommendationsProps) => {
  const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Find upcoming strong months (within next 3 months)
  const upcomingStrongMonths = [];
  for (let i = 1; i <= 3; i++) {
    const futureIdx = (currentMonthIndex + i) % 12;
    const month = seasonalityData[futureIdx];
    if (month && month.index >= 1.1) {
      upcomingStrongMonths.push({ ...month, monthsAway: i });
    }
  }

  // Find upcoming weak months
  const upcomingWeakMonths = [];
  for (let i = 1; i <= 3; i++) {
    const futureIdx = (currentMonthIndex + i) % 12;
    const month = seasonalityData[futureIdx];
    if (month && month.index < 0.9) {
      upcomingWeakMonths.push({ ...month, monthsAway: i });
    }
  }

  // Current month situation
  const currentMonth = seasonalityData[currentMonthIndex];
  const isCurrentStrong = currentMonth?.index >= 1.1;
  const isCurrentWeak = currentMonth?.index < 0.9;

  // Best quarter
  const quarters = [
    { name: "Q1", months: [0, 1, 2], avgIndex: 0 },
    { name: "Q2", months: [3, 4, 5], avgIndex: 0 },
    { name: "Q3", months: [6, 7, 8], avgIndex: 0 },
    { name: "Q4", months: [9, 10, 11], avgIndex: 0 },
  ];

  quarters.forEach(q => {
    const indices = q.months.map(i => seasonalityData[i]?.index || 0);
    q.avgIndex = indices.reduce((a, b) => a + b, 0) / indices.length;
  });

  const bestQuarter = quarters.reduce((a, b) => a.avgIndex > b.avgIndex ? a : b);
  const worstQuarter = quarters.reduce((a, b) => a.avgIndex < b.avgIndex ? a : b);

  const recommendations = [];

  // Current month recommendations
  if (isCurrentStrong) {
    recommendations.push({
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      title: "Aproveite o momento!",
      text: `${currentMonth?.month} é historicamente um dos seus meses mais fortes (${currentMonth?.index.toFixed(2)}x). Maximize esforços de venda e marketing agora.`,
    });
  } else if (isCurrentWeak) {
    recommendations.push({
      icon: AlertTriangle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      title: "Mês desafiador",
      text: `${currentMonth?.month} tende a ser mais fraco historicamente. Foque em fidelização e preparação para meses melhores.`,
    });
  }

  // Upcoming strong months
  if (upcomingStrongMonths.length > 0) {
    const upcoming = upcomingStrongMonths[0];
    const prep = upcoming.monthsAway === 1 ? "no próximo mês" : `em ${upcoming.monthsAway} meses`;
    recommendations.push({
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
      title: "Prepare-se para alta temporada",
      text: `${upcoming.month} (${prep}) é historicamente forte (+${upcoming.variation.toFixed(0)}%). Intensifique marketing e garanta estoque adequado.`,
    });
  }

  // Upcoming weak months
  if (upcomingWeakMonths.length > 0) {
    const upcoming = upcomingWeakMonths[0];
    recommendations.push({
      icon: Target,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      title: "Planeje para período mais fraco",
      text: `${upcoming.month} costuma ter queda de ${Math.abs(upcoming.variation).toFixed(0)}%. Considere promoções ou diversificação para mitigar.`,
    });
  }

  // Best quarter insight
  const currentQuarterIdx = Math.floor(currentMonthIndex / 3);
  if (quarters[currentQuarterIdx].name === bestQuarter.name) {
    recommendations.push({
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      title: "Você está no melhor trimestre!",
      text: `${bestQuarter.name} é historicamente seu trimestre mais forte. Aproveite cada oportunidade.`,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Recomendações Estratégicas
            <InfoTooltip 
              text="Insights acionáveis baseados no padrão de sazonalidade do seu negócio. Ajudam a planejar marketing, estoque e esforços de vendas." 
              maxWidth={300} 
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className={`p-2 rounded-full ${rec.bgColor} shrink-0`}>
                    <rec.icon className={`h-4 w-4 ${rec.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{rec.title}</p>
                    <p className="text-sm text-muted-foreground">{rec.text}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Adicione mais dados históricos para receber recomendações personalizadas.
              </p>
            )}

            <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-emerald-500/5">
                <p className="text-xs text-muted-foreground">Melhor Trimestre</p>
                <p className="text-lg font-bold text-emerald-500">{bestQuarter.name}</p>
                <p className="text-xs text-muted-foreground">Índice médio: {bestQuarter.avgIndex.toFixed(2)}x</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/5">
                <p className="text-xs text-muted-foreground">Trimestre Desafiador</p>
                <p className="text-lg font-bold text-amber-500">{worstQuarter.name}</p>
                <p className="text-xs text-muted-foreground">Índice médio: {worstQuarter.avgIndex.toFixed(2)}x</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StrategicRecommendations;
