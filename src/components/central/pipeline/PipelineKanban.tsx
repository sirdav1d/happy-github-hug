import { motion } from 'framer-motion';
import { Lead, LeadStatus, ALL_PIPELINE_STAGES, LEAD_STATUS_CONFIG } from '@/types/leads';
import LeadCard from './LeadCard';

interface PipelineKanbanProps {
  leadsByStatus: Record<LeadStatus, Lead[]>;
  onLeadClick: (lead: Lead) => void;
  onMoveStage: (id: string, newStatus: LeadStatus) => Promise<boolean>;
  filterStatus?: string | null;
}

const PipelineKanban = ({ 
  leadsByStatus, 
  onLeadClick, 
  onMoveStage,
  filterStatus 
}: PipelineKanbanProps) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const stagesToShow = filterStatus 
    ? ALL_PIPELINE_STAGES.filter(s => s === filterStatus)
    : ALL_PIPELINE_STAGES;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto">
      {stagesToShow.map((status, columnIndex) => {
        const config = LEAD_STATUS_CONFIG[status];
        const stageLeads = leadsByStatus[status] || [];
        const stageValue = stageLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columnIndex * 0.05, duration: 0.3 }}
            className="flex flex-col min-w-0"
          >
            {/* Header da Coluna */}
            <div className={`rounded-t-xl p-2 ${config.bgColor}/10 border border-b-0 border-border`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold text-xs ${config.color} truncate`}>
                  {config.label}
                </h3>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${config.bgColor}/20 ${config.color} flex-shrink-0`}>
                  {stageLeads.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {formatCurrency(stageValue)}
              </p>
            </div>

            {/* Corpo da Coluna */}
            <div 
              className="flex-1 min-h-[400px] bg-muted/30 rounded-b-xl border border-t-0 border-border p-1.5 space-y-1.5 overflow-y-auto"
            >
              {stageLeads.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-muted-foreground/50 text-center">
                    Sem leads
                  </p>
                </div>
              ) : (
                stageLeads.map((lead, index) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => onLeadClick(lead)}
                    index={index}
                  />
                ))
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PipelineKanban;
