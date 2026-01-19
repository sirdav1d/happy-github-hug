import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, Receipt, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown, ArrowRight, Info } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MonthlyMilestone } from '@/types/mentorship';

interface JourneyMonthDetailModalProps {
  milestone: MonthlyMilestone | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSales?: (month: number, year: number) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const JourneyMonthDetailModal: React.FC<JourneyMonthDetailModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onNavigateToSales,
}) => {
  if (!milestone) return null;

  const statusConfig = {
    completed: {
      label: 'Concluído',
      icon: milestone.goalMet ? CheckCircle2 : XCircle,
      color: milestone.goalMet ? 'text-emerald-500' : 'text-amber-500',
      bg: milestone.goalMet ? 'bg-emerald-500/10' : 'bg-amber-500/10',
    },
    current: {
      label: 'Mês Atual',
      icon: Clock,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    upcoming: {
      label: 'Futuro',
      icon: Clock,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
  };

  const status = statusConfig[milestone.status];
  const StatusIcon = status.icon;

  const sourceConfig = {
    planilha: {
      label: 'Planilha',
      icon: FileSpreadsheet,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      description: 'Dados importados via planilha Excel',
    },
    lançamentos: {
      label: 'Lançamentos',
      icon: Receipt,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      description: 'Vendas registradas manualmente no sistema',
    },
    nenhum: {
      label: 'Sem dados',
      icon: Info,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      description: 'Nenhum dado disponível para este mês',
    },
  };

  // Determinar cenário de exibição
  const hasSpreadsheet = milestone.spreadsheetRevenue > 0;
  const hasSales = milestone.salesRevenue > 0;
  const hasBothSources = hasSpreadsheet && hasSales;
  const hasAnySource = hasSpreadsheet || hasSales;

  // Determinar a fonte usada para exibição simples
  const getSourceLabel = () => {
    if (milestone.source === 'planilha') return 'Planilha importada';
    if (milestone.source === 'lançamentos') return 'Lançamentos de venda';
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header com gradiente */}
        <div className={`relative p-6 pt-10 ${status.bg}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${status.bg} ${status.color}`}>
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {milestone.calendarMonth}/{milestone.year}
              </h2>
              <p className="text-sm text-muted-foreground">
                {milestone.monthName} da Jornada
              </p>
            </div>
          </div>

          <Badge 
            variant="secondary" 
            className={`mt-4 ${status.color} ${status.bg} border-0`}
          >
            {status.label}
            {milestone.status === 'completed' && (
              milestone.goalMet ? ' • Meta batida!' : ' • Abaixo da meta'
            )}
          </Badge>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Faturamento vs Meta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Faturamento</span>
              <span className="text-xl font-bold">{formatCurrency(milestone.revenue)}</span>
            </div>
            
            <Progress 
              value={Math.min(milestone.progressPercent, 100)} 
              className="h-3"
            />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Meta: {formatCurrency(milestone.goal)}
              </span>
              <span className={`font-semibold ${
                milestone.progressPercent >= 100 
                  ? 'text-emerald-500' 
                  : milestone.progressPercent >= 80 
                    ? 'text-amber-500' 
                    : 'text-red-500'
              }`}>
                {milestone.progressPercent.toFixed(1)}%
              </span>
            </div>

            {/* Crescimento */}
            {milestone.growthFromPrevious !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                {milestone.growthFromPrevious >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={milestone.growthFromPrevious >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {milestone.growthFromPrevious >= 0 ? '+' : ''}{milestone.growthFromPrevious.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            )}

            {/* Fonte dos dados - Exibição simples quando só há uma fonte */}
            {hasAnySource && !hasBothSources && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
                {milestone.source === 'planilha' ? (
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                ) : (
                  <Receipt className="w-4 h-4 text-emerald-500" />
                )}
                <span>Fonte: {getSourceLabel()}</span>
              </div>
            )}
          </div>

          {/* Origem dos Dados - Apenas quando há AMBAS as fontes */}
          {hasBothSources && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Comparação de fontes</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                {/* Valor da Planilha */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Planilha importada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(milestone.spreadsheetRevenue)}</span>
                    {milestone.source === 'planilha' && (
                      <Badge variant="secondary" className="text-[10px] h-5 bg-blue-500/20 text-blue-600">
                        ✓ usado
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Valor dos Lançamentos */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">Lançamentos de venda</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(milestone.salesRevenue)}</span>
                    {milestone.source === 'lançamentos' && (
                      <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-500/20 text-emerald-600">
                        ✓ usado
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Explicação */}
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  💡 Usamos o <strong>maior valor</strong> entre as fontes.
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          {onNavigateToSales && milestone.status !== 'upcoming' && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onNavigateToSales(
                new Date(`${milestone.year}-${milestone.calendarMonth}-01`).getMonth() + 1,
                milestone.year
              )}
            >
              Ver Lançamentos do Mês
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyMonthDetailModal;
