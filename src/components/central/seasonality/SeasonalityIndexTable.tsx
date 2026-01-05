import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3 } from "lucide-react";
import InfoTooltip from "../InfoTooltip";

interface SeasonalityMonth {
  month: string;
  avgRevenue: number;
  index: number;
  isStrong: boolean;
  variation: number;
}

interface SeasonalityIndexTableProps {
  seasonalityData: SeasonalityMonth[];
  formatCurrency: (value: number) => string;
}

const SeasonalityIndexTable = ({ seasonalityData, formatCurrency }: SeasonalityIndexTableProps) => {
  const getIndexColor = (index: number) => {
    if (index >= 1.15) return "text-emerald-500";
    if (index >= 1.0) return "text-emerald-400";
    if (index >= 0.85) return "text-amber-500";
    return "text-red-400";
  };

  const getBarColor = (index: number) => {
    if (index >= 1.15) return "bg-emerald-500";
    if (index >= 1.0) return "bg-emerald-400";
    if (index >= 0.85) return "bg-amber-500";
    return "bg-red-400";
  };

  const maxIndex = Math.max(...seasonalityData.map(m => m.index), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Índices Sazonais por Mês
            <InfoTooltip 
              text="O índice sazonal mostra a força relativa de cada mês. Valores acima de 1.0 indicam meses historicamente mais fortes que a média, e abaixo de 1.0 indicam meses mais fracos." 
              maxWidth={320} 
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Mês</TableHead>
                  <TableHead className="text-right">Média Histórica</TableHead>
                  <TableHead className="text-center w-24">Índice</TableHead>
                  <TableHead className="w-48">Força</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasonalityData.map((month, idx) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(month.avgRevenue)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${getIndexColor(month.index)}`}>
                        {month.index.toFixed(2)}x
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(month.index / maxIndex) * 100}%` }}
                            transition={{ delay: 0.4 + idx * 0.03, duration: 0.5 }}
                            className={`h-full rounded-full ${getBarColor(month.index)}`}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={month.variation >= 0 ? "text-emerald-500" : "text-red-400"}>
                        {month.variation >= 0 ? "+" : ""}{month.variation.toFixed(0)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SeasonalityIndexTable;
