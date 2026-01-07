export type LeadStatus = 
  | 'prospeccao' 
  | 'abordagem' 
  | 'apresentacao' 
  | 'followup' 
  | 'negociacao' 
  | 'fechado_ganho' 
  | 'fechado_perdido'
  | 'pos_vendas';

export interface Lead {
  id: string;
  user_id: string;
  client_name: string;
  email?: string | null;
  phone?: string | null;
  status: LeadStatus;
  prospecting_date: string;
  approach_date?: string | null;
  presentation_date?: string | null;
  followup_date?: string | null;
  negotiation_date?: string | null;
  closing_date?: string | null;
  post_sale_date?: string | null;
  next_contact_date?: string | null;
  next_contact_notes?: string | null;
  salesperson_id?: string | null;
  salesperson_name?: string | null;
  estimated_value?: number | null;
  lead_source?: string | null;
  comments?: string | null;
  converted_sale_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadFormData {
  client_name: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  salesperson_id?: string;
  salesperson_name?: string;
  estimated_value?: number;
  lead_source?: string;
  next_contact_date?: string;
  next_contact_notes?: string;
  comments?: string;
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  order: number;
}> = {
  prospeccao: { label: 'Prospecção', color: 'text-indigo-500', bgColor: 'bg-indigo-500', order: 1 },
  abordagem: { label: 'Qualificação', color: 'text-violet-500', bgColor: 'bg-violet-500', order: 2 },
  apresentacao: { label: 'Apresentação', color: 'text-purple-500', bgColor: 'bg-purple-500', order: 3 },
  followup: { label: 'Follow-up', color: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500', order: 4 },
  negociacao: { label: 'Negociação', color: 'text-pink-500', bgColor: 'bg-pink-500', order: 5 },
  fechado_ganho: { label: 'Fechamento', color: 'text-emerald-500', bgColor: 'bg-emerald-500', order: 6 },
  fechado_perdido: { label: 'Perdido', color: 'text-red-500', bgColor: 'bg-red-500', order: 7 },
  pos_vendas: { label: 'Pós-vendas', color: 'text-teal-500', bgColor: 'bg-teal-500', order: 8 }
};

// Etapas ativas do funil (para exibição no Kanban)
export const ACTIVE_PIPELINE_STAGES: LeadStatus[] = [
  'prospeccao', 'abordagem', 'apresentacao', 'followup', 'negociacao'
];

// Todas as etapas do funil (espelho da pirâmide - 7 colunas)
export const ALL_PIPELINE_STAGES: LeadStatus[] = [
  'prospeccao', 'abordagem', 'apresentacao', 'followup', 'negociacao', 'fechado_ganho', 'pos_vendas'
];

// Todas as etapas incluindo perdidos (8 colunas para Kanban com toggle)
export const FULL_PIPELINE_STAGES: LeadStatus[] = [
  'prospeccao', 'abordagem', 'apresentacao', 'followup', 'negociacao', 'fechado_ganho', 'pos_vendas', 'fechado_perdido'
];

// Etapas de fechamento
export const CLOSED_STAGES: LeadStatus[] = [
  'fechado_ganho', 'fechado_perdido'
];

// Mapeamento de status para campo de data
export const STATUS_DATE_FIELD: Record<LeadStatus, string> = {
  prospeccao: 'prospecting_date',
  abordagem: 'approach_date',
  apresentacao: 'presentation_date',
  followup: 'followup_date',
  negociacao: 'negotiation_date',
  fechado_ganho: 'closing_date',
  fechado_perdido: 'closing_date',
  pos_vendas: 'post_sale_date'
};
