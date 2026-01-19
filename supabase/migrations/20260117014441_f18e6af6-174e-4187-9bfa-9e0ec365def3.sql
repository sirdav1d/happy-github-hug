-- NotebookLM Enterprise Integration
-- Adiciona campos para armazenar credenciais GCP e artefatos NotebookLM

-- Adicionar campos na tabela profiles para credenciais do usuário
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notebooklm_gcp_project_id TEXT,
ADD COLUMN IF NOT EXISTS notebooklm_gcp_location TEXT DEFAULT 'us-central1',
ADD COLUMN IF NOT EXISTS notebooklm_service_account_json TEXT,
ADD COLUMN IF NOT EXISTS notebooklm_connected_at TIMESTAMPTZ;

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.notebooklm_gcp_project_id IS 'Google Cloud Project ID do usuário para NotebookLM Enterprise';
COMMENT ON COLUMN public.profiles.notebooklm_gcp_location IS 'Região do GCP (default: us-central1)';
COMMENT ON COLUMN public.profiles.notebooklm_service_account_json IS 'Service Account JSON (criptografado) para autenticação no GCP';
COMMENT ON COLUMN public.profiles.notebooklm_connected_at IS 'Timestamp de quando o NotebookLM foi conectado';

-- Adicionar campos na tabela rmr_meetings para artefatos NotebookLM
ALTER TABLE public.rmr_meetings
ADD COLUMN IF NOT EXISTS notebooklm_notebook_id TEXT,
ADD COLUMN IF NOT EXISTS notebooklm_audio_url TEXT,
ADD COLUMN IF NOT EXISTS notebooklm_briefing_url TEXT,
ADD COLUMN IF NOT EXISTS notebooklm_faq_json JSONB,
ADD COLUMN IF NOT EXISTS notebooklm_generated_at TIMESTAMPTZ;

-- Comentários explicativos
COMMENT ON COLUMN public.rmr_meetings.notebooklm_notebook_id IS 'ID do notebook criado no NotebookLM Enterprise';
COMMENT ON COLUMN public.rmr_meetings.notebooklm_audio_url IS 'URL do podcast/audio overview gerado';
COMMENT ON COLUMN public.rmr_meetings.notebooklm_briefing_url IS 'URL do briefing PDF gerado';
COMMENT ON COLUMN public.rmr_meetings.notebooklm_faq_json IS 'FAQ estruturado em JSON gerado pelo NotebookLM';
COMMENT ON COLUMN public.rmr_meetings.notebooklm_generated_at IS 'Timestamp de quando os artefatos foram gerados';