import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import { Lead, LeadStatus, ALL_PIPELINE_STAGES, FULL_PIPELINE_STAGES, LEAD_STATUS_CONFIG } from '@/types/leads';
import LeadCard from './LeadCard';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PipelineKanbanProps {
  leadsByStatus: Record<LeadStatus, Lead[]>;
  onLeadClick: (lead: Lead) => void;
  onMoveStage: (id: string, newStatus: LeadStatus) => Promise<boolean>;
  filterStatus?: string | null;
  showLostColumn?: boolean;
  onToggleLostColumn?: (show: boolean) => void;
}

interface DroppableColumnProps {
  status: LeadStatus;
  children: React.ReactNode;
  isOver: boolean;
}

const DroppableColumn = ({ status, children, isOver }: DroppableColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  const config = LEAD_STATUS_CONFIG[status];

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-h-[400px] bg-muted/30 rounded-b-xl border border-t-0 border-border p-1.5 space-y-1.5 overflow-y-auto transition-all duration-200 ${
        isOver ? `ring-2 ring-offset-2 ${config.color.replace('text-', 'ring-')} bg-opacity-50` : ''
      }`}
    >
      {children}
    </div>
  );
};

const PipelineKanban = ({ 
  leadsByStatus, 
  onLeadClick, 
  onMoveStage,
  filterStatus,
  showLostColumn = false,
  onToggleLostColumn
}: PipelineKanbanProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [localShowLost, setLocalShowLost] = useState(showLostColumn);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const handleToggleLost = (checked: boolean) => {
    setLocalShowLost(checked);
    onToggleLostColumn?.(checked);
  };

  const baseStages = localShowLost ? FULL_PIPELINE_STAGES : ALL_PIPELINE_STAGES;
  const stagesToShow = filterStatus 
    ? baseStages.filter(s => s === filterStatus)
    : baseStages;
  
  const lostCount = (leadsByStatus['fechado_perdido'] || []).length;

  // Find active lead for drag overlay
  const activeLead = activeId 
    ? Object.values(leadsByStatus).flat().find(l => l.id === activeId) 
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: any) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    // Find current status
    const currentStatus = Object.entries(leadsByStatus).find(([_, leads]) =>
      leads.some(l => l.id === leadId)
    )?.[0] as LeadStatus | undefined;

    if (currentStatus && currentStatus !== newStatus) {
      const success = await onMoveStage(leadId, newStatus);
      if (success) {
        const config = LEAD_STATUS_CONFIG[newStatus];
        toast.success(`Lead movido para ${config.label}`);
      }
    }
  };

  const gridCols = localShowLost ? 'xl:grid-cols-8' : 'xl:grid-cols-7';

  return (
    <div className="space-y-3">
      {/* Toggle para mostrar perdidos */}
      <div className="flex items-center justify-end gap-2">
        <Switch 
          id="show-lost" 
          checked={localShowLost} 
          onCheckedChange={handleToggleLost}
        />
        <Label htmlFor="show-lost" className="text-sm text-muted-foreground cursor-pointer">
          Mostrar Perdidos {lostCount > 0 && `(${lostCount})`}
        </Label>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gridCols} gap-3 overflow-x-auto`}>
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

              {/* Corpo da Coluna - Droppable */}
              <DroppableColumn status={status} isOver={overId === status}>
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
                      isDragging={activeId === lead.id}
                    />
                  ))
                )}
              </DroppableColumn>
            </motion.div>
          );
        })}
      </div>

        {/* Drag Overlay - Shows card being dragged */}
        <DragOverlay>
          {activeLead ? (
            <div className="rotate-3 scale-105">
              <LeadCard
                lead={activeLead}
                onClick={() => {}}
                index={0}
                isDragging={false}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default PipelineKanban;
