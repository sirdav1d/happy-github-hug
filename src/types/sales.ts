export type SaleChannel = 'online' | 'presencial';

export type LeadSource = 'indicacao' | 'redes_sociais' | 'google' | 'evento' | 'cold_call' | 'parceiro' | 'outro';

export type EntryType = 'individual' | 'batch_daily' | 'batch_weekly' | 'batch_monthly' | 'import';

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
  entry_type?: EntryType | null;
  sales_count?: number;
  attendances?: number | null;
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
  entry_type?: EntryType;
  sales_count?: number;
  attendances?: number;
}

export interface BatchSaleEntry {
  salesperson_id: string;
  salesperson_name: string;
  // Daily fields
  daily_amount?: number;
  daily_sales_count?: number;
  daily_attendances?: number;
  // Weekly fields
  week1?: number;
  week1_sales_count?: number;
  week1_attendances?: number;
  week2?: number;
  week2_sales_count?: number;
  week2_attendances?: number;
  week3?: number;
  week3_sales_count?: number;
  week3_attendances?: number;
  week4?: number;
  week4_sales_count?: number;
  week4_attendances?: number;
  week5?: number;
  week5_sales_count?: number;
  week5_attendances?: number;
  // Monthly fields
  monthly?: number;
  monthly_sales_count?: number;
  monthly_attendances?: number;
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

export const ENTRY_TYPE_OPTIONS: { value: EntryType; label: string }[] = [
  { value: 'individual', label: 'Venda Individual' },
  { value: 'batch_daily', label: 'Lote Diário' },
  { value: 'batch_weekly', label: 'Lote Semanal' },
  { value: 'batch_monthly', label: 'Lote Mensal' },
  { value: 'import', label: 'Importação' },
];
