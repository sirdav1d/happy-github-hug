export type SaleChannel = 'online' | 'presencial';

export type LeadSource = 'indicacao' | 'redes_sociais' | 'google' | 'evento' | 'cold_call' | 'parceiro' | 'outro';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  first_purchase_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  sale_date: string;
  amount: number;
  salesperson_id: string;
  salesperson_name: string;
  channel: SaleChannel;
  client_id?: string | null;
  client_name?: string | null;
  is_new_client: boolean;
  acquisition_cost: number;
  lead_source?: LeadSource | null;
  product_service?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleFormData {
  sale_date: string;
  amount: number;
  salesperson_id: string;
  salesperson_name: string;
  channel: SaleChannel;
  client_id?: string;
  client_name?: string;
  is_new_client: boolean;
  acquisition_cost: number;
  lead_source?: LeadSource;
  product_service?: string;
  notes?: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export const LEAD_SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'indicacao', label: 'Indicação' },
  { value: 'redes_sociais', label: 'Redes Sociais' },
  { value: 'google', label: 'Google / Busca' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'outro', label: 'Outro' },
];

export const CHANNEL_OPTIONS: { value: SaleChannel; label: string }[] = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'online', label: 'Online' },
];
