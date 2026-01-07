import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Clock, Flame, TrendingUp, ArrowRight } from 'lucide-react';
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from '@/types/leads';
import { cn } from '@/lib/utils';

interface IRISPipelineInsightsProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

interface Insight {
  type: 'stalled' | 'hot' | 'opportunity' | 'warning';
  title: string;
  description: string;
  leads?: Lead[];
  priority: number;
}

const IRISPipelineInsights = ({ leads, onLeadClick }: IRISPipelineInsightsProps) => {
  const insights = useMemo(() => {
    const now = new Date();
    const results: Insight[] = [];

    // Leads parados há mais de 7 dias sem atualização
    const stalledLeads = leads.filter(lead => {
      if (['fechado_ganho', 'fechado_perdido', 'pos_vendas'].includes(lead.status)) return false;
      const updatedAt = new Date(lead.updated_at);
      const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate >= 7;
    });

    if (stalledLeads.length > 0) {
      const totalValue = stalledLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0);
      results.push({
        type: 'stalled',
        title: `${stalledLeads.length} leads parados`,
        description: `R$ ${totalValue.toLocaleString('pt-BR')} em oportunidades sem movimentação há 7+ dias. Reative o contato!`,
        leads: stalledLeads.slice(0, 3),
        priority: 1,
      });
    }

    // Leads em negociação com alto valor (hot opportunities)
    const hotLeads = leads.filter(lead => 
      lead.status === 'negociacao' && (lead.estimated_value || 0) >= 5000
    ).sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0));

    if (hotLeads.length > 0) {
      const totalValue = hotLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0);
      results.push({
        type: 'hot',
        title: `${hotLeads.length} oportunidades quentes`,
        description: `R$ ${totalValue.toLocaleString('pt-BR')} em negociações avançadas. Priorize o fechamento!`,
        leads: hotLeads.slice(0, 3),
        priority: 2,
      });
    }

    // Leads em follow-up há muito tempo
    const stuckInFollowup = leads.filter(lead => {
      if (lead.status !== 'followup') return false;
      const followupDate = lead.followup_date ? new Date(lead.followup_date) : null;
      if (!followupDate) return false;
      const daysInFollowup = Math.floor((now.getTime() - followupDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysInFollowup >= 14;
    });

    if (stuckInFollowup.length > 0) {
      results.push({
        type: 'warning',
        title: `${stuckInFollowup.length} leads presos em Follow-up`,
        description: 'Há mais de 14 dias sem avanço. Considere uma abordagem diferente ou qualifique melhor.',
        leads: stuckInFollowup.slice(0, 3),
        priority: 3,
      });
    }

    // Taxa de conversão por etapa
    const activeLeads = leads.filter(l => !['fechado_ganho', 'fechado_perdido'].includes(l.status));
    const wonLeads = leads.filter(l => l.status === 'fechado_ganho');
    const conversionRate = activeLeads.length > 0 
      ? Math.round((wonLeads.length / (activeLeads.length + wonLeads.length)) * 100) 
      : 0;

    if (conversionRate < 20 && leads.length >= 10) {
      results.push({
        type: 'opportunity',
        title: 'Taxa de conversão baixa',
        description: `Apenas ${conversionRate}% de conversão. Revise a qualificação dos leads na prospecção.`,
        priority: 4,
      });
    }

    // Leads sem valor estimado
    const leadsWithoutValue = leads.filter(l => 
      !['fechado_ganho', 'fechado_perdido'].includes(l.status) && !l.estimated_value
    );

    if (leadsWithoutValue.length >= 5) {
      results.push({
        type: 'warning',
        title: `${leadsWithoutValue.length} leads sem valor`,
        description: 'Adicione valores estimados para melhor previsibilidade do pipeline.',
        leads: leadsWithoutValue.slice(0, 3),
        priority: 5,
      });
    }

    return results.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [leads]);

  const typeConfig = {
    stalled: {
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    hot: {
      icon: Flame,
      gradient: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
    },
    opportunity: {
      icon: TrendingUp,
      gradient: 'from-cyan-500 to-blue-500',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-yellow-500 to-amber-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
    },
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/70">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-ping" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">IRIS Insights</h3>
          <p className="text-[10px] text-muted-foreground">Análise proativa do seu pipeline</p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((insight, index) => {
          const config = typeConfig[insight.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn(
                "rounded-xl border p-3 transition-all hover:shadow-md",
                config.bg,
                config.border
              )}
            >
              {/* Insight Header */}
              <div className="flex items-start gap-2 mb-2">
                <div className={cn(
                  "p-1.5 rounded-lg bg-gradient-to-br text-white flex-shrink-0",
                  config.gradient
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-foreground leading-tight">
                  {insight.title}
                </h4>
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                {insight.description}
              </p>

              {/* Lead Pills */}
              {insight.leads && insight.leads.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {insight.leads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => onLeadClick(lead)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                        "bg-background/80 border border-border/50 hover:border-primary/50",
                        "transition-colors cursor-pointer"
                      )}
                    >
                      <span className="truncate max-w-[80px]">{lead.client_name}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default IRISPipelineInsights;
