import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Calendar, BarChart3, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyData } from "@/types";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";

interface SeasonalityViewProps {
  historicalData: MonthlyData[];
  currentYearData: MonthlyData[];
  selectedMonth?: string; // Ex: "Dez-25"
}

const SeasonalityView = ({ historicalData, currentYearData, selectedMonth }: SeasonalityViewProps) => {
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

  const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Get all unique years from historical data
  const allYears = [...new Set(historicalData.map(d => d.year))].sort();
  const currentYear = currentYearData[0]?.year || new Date().getFullYear();

  // Calculate seasonal pattern: average revenue per month across ALL historical years
  const seasonalPattern = monthOrder.map(month => {
    const allMonthData = historicalData.filter(d => d.month === month);
    const avgRevenue = allMonthData.length > 0
      ? allMonthData.reduce((sum, d) => sum + d.revenue, 0) / allMonthData.length
      : 0;
    
    return {
      month,
      avgRevenue,
      yearsCount: allMonthData.length,
    };
  });

  // Calculate global average for seasonality index
  const globalAvgRevenue = seasonalPattern.reduce((sum, m) => sum + m.avgRevenue, 0) / 
    seasonalPattern.filter(m => m.avgRevenue > 0).length || 1;

  // Calculate seasonality index for each month
  const seasonalityData = seasonalPattern.map(m => ({
    ...m,
    index: m.avgRevenue > 0 ? (m.avgRevenue / globalAvgRevenue) : 0,
    isStrong: m.avgRevenue > globalAvgRevenue,
    variation: ((m.avgRevenue - globalAvgRevenue) / globalAvgRevenue) * 100,
  }));

  // Best and worst months based on historical average
  const monthsWithData = seasonalityData.filter(m => m.avgRevenue > 0);
  const strongestMonth = monthsWithData.length > 0
    ? monthsWithData.reduce((prev, curr) => curr.index > prev.index ? curr : prev)
    : null;
  const weakestMonth = monthsWithData.length > 0
    ? monthsWithData.reduce((prev, curr) => curr.index < prev.index ? curr : prev)
    : null;

  // Parse selectedMonth (e.g., "Dez-25") to determine cut-off
  const parseSelectedMonth = (selected: string | undefined) => {
    if (!selected) return null;
    const [monthAbbr, yearShort] = selected.split('-');
    const monthIndex = monthOrder.indexOf(monthAbbr);
    if (monthIndex === -1 || !yearShort) return null;
    const year = 2000 + parseInt(yearShort);
    return { monthIndex, year };
  };

  // Forecast: project remaining months based on seasonality pattern
  const parsedSelected = parseSelectedMonth(selectedMonth);
  const currentDataYear = currentYearData[0]?.year || new Date().getFullYear();

  let lastCompletedMonthIndex = -1;
  if (parsedSelected) {
    if (parsedSelected.year > currentDataYear) {
      // Selected month is from a future year, all months of currentYearData are complete
      lastCompletedMonthIndex = 11;
    } else if (parsedSelected.year === currentDataYear) {
      // Same year: use selected month as cut-off
      lastCompletedMonthIndex = parsedSelected.monthIndex;
    } else {
      // Selected month is from a past year, no months of currentYearData are complete
      lastCompletedMonthIndex = -1;
    }
  } else {
    // Fallback: use revenue > 0 logic
    const fallbackCompleted = currentYearData.filter(d => d.revenue > 0);
    lastCompletedMonthIndex = fallbackCompleted.length > 0
      ? monthOrder.indexOf(fallbackCompleted[fallbackCompleted.length - 1].month)
      : -1;
  }
  
  const completedMonths = currentYearData.filter((_, idx) => idx <= lastCompletedMonthIndex);

  // Detect if current year is complete (all 12 months realized)
  const isCurrentYearComplete = lastCompletedMonthIndex === 11;
  const projectionYear = isCurrentYearComplete ? currentDataYear + 1 : currentDataYear;

  // Calculate expected annual revenue based on completed months and their seasonal weights
  const completedSeasonalWeight = completedMonths.reduce((sum, d) => {
    const seasonalIndex = seasonalityData.find(s => s.month === d.month)?.index || 1;
    return sum + seasonalIndex;
  }, 0);

  const completedRevenue = completedMonths.reduce((sum, d) => sum + d.revenue, 0);

  // Extrapolate annual revenue: if completed months represent X% of seasonal weight,
  // total revenue would be proportionally larger
  const expectedAnnualRevenue = completedSeasonalWeight > 0
    ? (completedRevenue / completedSeasonalWeight) * 12
    : globalAvgRevenue * 12;

  // Expected monthly base revenue
  const expectedMonthlyBase = expectedAnnualRevenue / 12;

  // Forecast data: actual + projected using TRUE seasonality
  const forecastData = monthOrder.map((month, index) => {
    const current = currentYearData.find(d => d.month === month);
    const seasonal = seasonalityData.find(s => s.month === month);
    const isCompleted = index <= lastCompletedMonthIndex;
    
    // When current year is complete, project ALL months for next year
    const shouldShowProjection = isCurrentYearComplete ? true : !isCompleted;
    
    // TRUE SEASONALITY: distribute expected revenue using seasonal index
    const projectedValue = shouldShowProjection && seasonal 
      ? expectedMonthlyBase * seasonal.index 
      : null;
    
    return {
      month,
      actual: current?.revenue || 0,
      historicalAvg: seasonal?.avgRevenue || 0,
      projected: projectedValue,
      isCompleted: isCurrentYearComplete ? false : isCompleted,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl p-4 shadow-xl min-w-[180px]">
          <p className="font-bold text-foreground mb-2 pb-2 border-b border-border">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-sm py-1">
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          {data?.index && (
            <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-border">
              <span className="text-muted-foreground">Índice Sazonal:</span>
              <span className={`font-bold ${data.index >= 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {data.index.toFixed(2)}x
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anos Históricos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {allYears.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {allYears[0]} a {allYears[allYears.length - 1] || currentYear}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Mensal Histórica
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCompact(globalAvgRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em {allYears.length} anos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {strongestMonth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mês Mais Forte
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {strongestMonth.month}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Índice: {strongestMonth.index.toFixed(2)}x (+{strongestMonth.variation.toFixed(0)}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {weakestMonth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mês Mais Fraco
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {weakestMonth.month}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Índice: {weakestMonth.index.toFixed(2)}x ({weakestMonth.variation.toFixed(0)}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Forecast Based on Seasonality - Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Previsão Baseada em Sazonalidade
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Projeção baseada no padrão sazonal histórico — Receita anual esperada: {formatCurrency(expectedAnnualRevenue)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecastData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={formatCompact}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={globalAvgRevenue} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="6 3" 
                    strokeWidth={1}
                    opacity={0.6}
                    label={{ 
                      value: 'Média Global', 
                      position: 'right',
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 10
                    }}
                  />
                  <Bar 
                    dataKey="actual" 
                    name={`Realizado ${currentYear}`}
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={35}
                  />
                  <Bar 
                    dataKey="projected" 
                    name={`Projeção ${projectionYear}`}
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={35}
                    opacity={0.7}
                  />
                  <Bar 
                    dataKey="historicalAvg" 
                    name="Média Histórica"
                    fill="hsl(var(--muted-foreground))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={35}
                    opacity={0.4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary" />
                <span className="text-xs font-medium text-muted-foreground">Realizado {currentYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500 opacity-70" />
                <span className="text-xs font-medium text-muted-foreground">Projeção {projectionYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted-foreground opacity-40" />
                <span className="text-xs font-medium text-muted-foreground">Média Histórica</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SeasonalityView;
