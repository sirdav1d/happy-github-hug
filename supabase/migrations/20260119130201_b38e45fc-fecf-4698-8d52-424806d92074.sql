-- Add behavioral module access control column to mentorship_phases
ALTER TABLE public.mentorship_phases 
ADD COLUMN IF NOT EXISTS behavioral_module_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.mentorship_phases.behavioral_module_enabled 
IS 'Controla se o aluno tem acesso ao módulo de Análise Comportamental';