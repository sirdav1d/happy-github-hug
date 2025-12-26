-- Adicionar novas colunas à tabela dashboard_data para suportar o sistema de upload atualizado
ALTER TABLE public.dashboard_data 
ADD COLUMN IF NOT EXISTS mentorship_start_date DATE,
ADD COLUMN IF NOT EXISTS selected_month TEXT,
ADD COLUMN IF NOT EXISTS last_upload_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS years_available INTEGER[] DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN public.dashboard_data.mentorship_start_date IS 'Data de início da mentoria do cliente';
COMMENT ON COLUMN public.dashboard_data.selected_month IS 'Último mês selecionado no upload (ex: Out-25)';
COMMENT ON COLUMN public.dashboard_data.last_upload_date IS 'Data/hora do último upload de planilha';
COMMENT ON COLUMN public.dashboard_data.years_available IS 'Anos disponíveis na planilha do cliente';