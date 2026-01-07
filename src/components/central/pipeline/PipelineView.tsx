import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeads } from '@/hooks/useLeads';
import { Salesperson } from '@/types';
import InfoTooltip from '@/components/central/InfoTooltip';
import SalesFunnelPyramid from './SalesFunnelPyramid';
import PipelineKanban from './PipelineKanban';
import PipelineList from './PipelineList';
import ContactAlerts from './ContactAlerts';
import LeadForm from './LeadForm';
import LeadDetailModal from './LeadDetailModal';
import { Lead } from '@/types/leads';

interface PipelineViewProps {
  team: Salesperson[];
}

const PipelineView = ({ team }: PipelineViewProps) => {
  const {
    leads,
    isLoading,
    leadsByStatus,
    todayContacts,
    overdueContacts,
    funnelMetrics,
    totalPipelineValue,
    totalActiveLeads,
    lostLeadsCount,
    lossRate,
    createLead,
    updateLead,
    moveToStage,
    deleteLead
  } = useLeads();

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handlePyramidClick = (status: string) => {
    setFilterStatus(filterStatus === status ? null : status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-primary animate-pulse font-mono tracking-widest">
          Carregando pipeline...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Filter className="h-6 w-6 text-blue-500" />
            </div>
            Pipeline de Vendas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e oportunidades de venda
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InfoTooltip 
            text="O Pipeline permite acompanhar leads desde a prospecção até o fechamento. Arraste cards entre colunas para mover leads no funil."
            maxWidth={320}
          />
          <Button onClick={() => setShowLeadForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Alertas de Contato */}
      <ContactAlerts 
        todayContacts={todayContacts}
        overdueContacts={overdueContacts}
        onLeadClick={handleLeadClick}
      />

      {/* Pirâmide do Funil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SalesFunnelPyramid 
          metrics={funnelMetrics}
          totalValue={totalPipelineValue}
          totalLeads={totalActiveLeads}
          onStageClick={handlePyramidClick}
          activeStage={filterStatus}
          lostLeadsCount={lostLeadsCount}
          lossRate={lossRate}
        />
      </motion.div>

      {/* Kanban / Lista */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <PipelineKanban 
            leadsByStatus={leadsByStatus}
            onLeadClick={handleLeadClick}
            onMoveStage={moveToStage}
            filterStatus={filterStatus}
          />
        </TabsContent>

        <TabsContent value="list">
          <PipelineList 
            leads={leads}
            onLeadClick={handleLeadClick}
            onMoveStage={moveToStage}
            onDelete={deleteLead}
            team={team}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Novo Lead */}
      <LeadForm 
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSubmit={createLead}
        team={team}
      />

      {/* Modal de Detalhes do Lead */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLead}
          onDelete={deleteLead}
          onMoveStage={moveToStage}
          team={team}
        />
      )}
    </div>
  );
};

export default PipelineView;
