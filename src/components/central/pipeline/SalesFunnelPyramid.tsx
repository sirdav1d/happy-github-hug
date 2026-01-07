import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadStatus, LEAD_STATUS_CONFIG, ACTIVE_PIPELINE_STAGES } from '@/types/leads';
import InfoTooltip from '@/components/central/InfoTooltip';

interface FunnelMetric {
  status: LeadStatus;
  count: number;
  value: number;
  conversionRate: number;
}

interface SalesFunnelPyramidProps {
  metrics: FunnelMetric[];
  totalValue: number;
  totalLeads: number;
  onStageClick?: (status: string) => void;
  activeStage?: string | null;
}

const SalesFunnelPyramid = ({ 
  metrics, 
  totalValue, 
  totalLeads,
  onStageClick,
  activeStage
}: SalesFunnelPyramidProps) => {
  // Configuração de larguras para o funil (7 etapas)
  const widthPercentages = [100, 87, 74, 61, 48, 35, 25];
  
  // Cores do funil (7 etapas)
  const funnelColors = [
    'from-indigo-500 to-indigo-600',     // Prospecção
    'from-violet-500 to-violet-600',     // Abordagem
    'from-purple-500 to-purple-600',     // Apresentação
    'from-fuchsia-500 to-fuchsia-600',   // Follow-up
    'from-pink-500 to-pink-600',         // Negociação
    'from-emerald-500 to-emerald-600',   // Fechado Ganho
    'from-teal-500 to-teal-600'          // Pós-vendas
  ];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  // Calcular taxa de conversão total
  const firstStageCount = metrics[0]?.count || 0;
  const closedWonCount = metrics.find(m => m.status === 'fechado_ganho')?.count || 0;
  const totalConversionRate = firstStageCount > 0 ? (closedWonCount / firstStageCount) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            Funil de Vendas
            <InfoTooltip 
              text="Visualize a jornada dos leads através do funil. Clique em um estágio para filtrar o Kanban abaixo."
              maxWidth={280}
            />
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">{totalLeads} leads</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pipeline:</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(totalValue)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="flex flex-col items-center gap-1">
          {metrics.slice(0, 7).map((metric, index) => {
            const config = LEAD_STATUS_CONFIG[metric.status];
            const width = widthPercentages[index];
            const isActive = activeStage === metric.status;
            const isLowConversion = metric.conversionRate < 50 && index > 0;
            
            return (
              <motion.div
                key={metric.status}
                className="relative cursor-pointer group"
                style={{ width: `${width}%` }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onStageClick?.(metric.status)}
              >
                {/* Trapézio do funil */}
                <div 
                  className={`
                    relative h-14 flex items-center justify-center rounded-lg
                    bg-gradient-to-r ${funnelColors[index]}
                    transition-all duration-300
                    ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-background shadow-lg' : ''}
                    ${!isActive ? 'opacity-90 hover:opacity-100' : ''}
                  `}
                  style={{
                    clipPath: index < 6 
                      ? 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)'
                      : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                  }}
                >
                  {/* Conteúdo */}
                  <div className="flex items-center gap-4 text-white z-10">
                    <span className="font-semibold text-sm uppercase tracking-wide">
                      {config.label}
                    </span>
                    <div className="flex items-center gap-3 text-white/90">
                      <span className="text-sm font-medium">
                        {metric.count} {metric.count === 1 ? 'lead' : 'leads'}
                      </span>
                      <span className="text-xs opacity-75">|</span>
                      <span className="text-sm">
                        {formatCurrency(metric.value)}
                      </span>
                      {index > 0 && (
                        <>
                          <span className="text-xs opacity-75">|</span>
                          <span className={`text-xs flex items-center gap-1 ${isLowConversion ? 'text-yellow-200' : ''}`}>
                            {isLowConversion ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <TrendingUp className="h-3 w-3" />
                            )}
                            {metric.conversionRate.toFixed(0)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seta de conversão entre estágios */}
                {index < 6 && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-muted-foreground/20" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Métricas resumidas */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Taxa de Conversão Total</p>
            <p className={`text-lg font-bold ${totalConversionRate >= 10 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {totalConversionRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">Prospecção → Ganho</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Valor Médio por Lead</p>
            <p className="text-lg font-bold text-foreground">
              {totalLeads > 0 ? formatCurrency(totalValue / totalLeads) : 'R$ 0'}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Leads Ganhos (30d)</p>
            <p className="text-lg font-bold text-emerald-500">
              {closedWonCount}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesFunnelPyramid;
