
-- Criar enum para canal de venda
CREATE TYPE public.sale_channel AS ENUM ('online', 'presencial');

-- Criar enum para origem do lead
CREATE TYPE public.lead_source AS ENUM ('indicacao', 'redes_sociais', 'google', 'evento', 'cold_call', 'parceiro', 'outro');

-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  first_purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vendas
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  salesperson_id TEXT NOT NULL,
  salesperson_name TEXT NOT NULL,
  channel sale_channel NOT NULL DEFAULT 'presencial',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT,
  is_new_client BOOLEAN NOT NULL DEFAULT false,
  acquisition_cost DECIMAL(12, 2) DEFAULT 0,
  lead_source lead_source,
  product_service TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clients
CREATE POLICY "Users can view their own clients"
ON public.clients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
ON public.clients FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clients FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clients FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para sales
CREATE POLICY "Users can view their own sales"
ON public.sales FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
ON public.sales FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
ON public.sales FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
ON public.sales FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para consultores verem dados dos convidados (clients)
CREATE POLICY "Consultants can view invited users clients"
ON public.clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = clients.user_id AND i.created_by = auth.uid()
  )
);

-- Políticas para consultores verem dados dos convidados (sales)
CREATE POLICY "Consultants can view invited users sales"
ON public.sales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = sales.user_id AND i.created_by = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_salesperson_id ON public.sales(salesperson_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
