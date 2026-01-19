-- Perfil comportamental do vendedor
CREATE TABLE public.behavioral_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- DISC Natural (0-100 para cada dimensão)
  disc_d_natural INTEGER CHECK (disc_d_natural >= 0 AND disc_d_natural <= 100),
  disc_i_natural INTEGER CHECK (disc_i_natural >= 0 AND disc_i_natural <= 100),
  disc_s_natural INTEGER CHECK (disc_s_natural >= 0 AND disc_s_natural <= 100),
  disc_c_natural INTEGER CHECK (disc_c_natural >= 0 AND disc_c_natural <= 100),
  
  -- DISC Adaptado (0-100 para cada dimensão)
  disc_d_adapted INTEGER CHECK (disc_d_adapted >= 0 AND disc_d_adapted <= 100),
  disc_i_adapted INTEGER CHECK (disc_i_adapted >= 0 AND disc_i_adapted <= 100),
  disc_s_adapted INTEGER CHECK (disc_s_adapted >= 0 AND disc_s_adapted <= 100),
  disc_c_adapted INTEGER CHECK (disc_c_adapted >= 0 AND disc_c_adapted <= 100),
  
  -- Values - 7 motivadores (0-100)
  value_aesthetic INTEGER CHECK (value_aesthetic >= 0 AND value_aesthetic <= 100),
  value_economic INTEGER CHECK (value_economic >= 0 AND value_economic <= 100),
  value_individualist INTEGER CHECK (value_individualist >= 0 AND value_individualist <= 100),
  value_political INTEGER CHECK (value_political >= 0 AND value_political <= 100),
  value_altruistic INTEGER CHECK (value_altruistic >= 0 AND value_altruistic <= 100),
  value_regulatory INTEGER CHECK (value_regulatory >= 0 AND value_regulatory <= 100),
  value_theoretical INTEGER CHECK (value_theoretical >= 0 AND value_theoretical <= 100),
  
  -- Atributos comportamentais (0.0-10.0)
  attr_empathy DECIMAL(3,1) CHECK (attr_empathy >= 0 AND attr_empathy <= 10),
  attr_practical_thinking DECIMAL(3,1) CHECK (attr_practical_thinking >= 0 AND attr_practical_thinking <= 10),
  attr_systems_judgment DECIMAL(3,1) CHECK (attr_systems_judgment >= 0 AND attr_systems_judgment <= 10),
  attr_self_esteem DECIMAL(3,1) CHECK (attr_self_esteem >= 0 AND attr_self_esteem <= 10),
  attr_role_awareness DECIMAL(3,1) CHECK (attr_role_awareness >= 0 AND attr_role_awareness <= 10),
  attr_self_direction DECIMAL(3,1) CHECK (attr_self_direction >= 0 AND attr_self_direction <= 10),
  
  -- Metadados
  source TEXT NOT NULL DEFAULT 'questionnaire' CHECK (source IN ('questionnaire', 'conversation', 'innermetrix_pdf', 'manual', 'hybrid')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100) DEFAULT 0,
  ai_summary TEXT,
  strengths TEXT[],
  development_areas TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Respostas do questionário DISC/Values
CREATE TABLE public.behavioral_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.behavioral_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  questionnaire_type TEXT NOT NULL CHECK (questionnaire_type IN ('disc', 'values')),
  question_id TEXT NOT NULL,
  response_value JSONB NOT NULL,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessões de conversa comportamental gravada
CREATE TABLE public.behavioral_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.behavioral_profiles(id) ON DELETE SET NULL,
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  audio_file_path TEXT,
  transcription TEXT,
  ai_analysis JSONB,
  ai_disc_scores JSONB,
  ai_values_scores JSONB,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Configuração do módulo por empresa
CREATE TABLE public.behavioral_module_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  show_in_team_view BOOLEAN NOT NULL DEFAULT true,
  show_in_fivi BOOLEAN NOT NULL DEFAULT true,
  show_in_rmr BOOLEAN NOT NULL DEFAULT true,
  allow_self_assessment BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_behavioral_profiles_user_id ON public.behavioral_profiles(user_id);
CREATE INDEX idx_behavioral_profiles_salesperson_id ON public.behavioral_profiles(salesperson_id);
CREATE INDEX idx_behavioral_questionnaire_responses_profile_id ON public.behavioral_questionnaire_responses(profile_id);
CREATE INDEX idx_behavioral_conversations_user_id ON public.behavioral_conversations(user_id);
CREATE INDEX idx_behavioral_conversations_salesperson_id ON public.behavioral_conversations(salesperson_id);

-- Enable RLS
ALTER TABLE public.behavioral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_module_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for behavioral_profiles
CREATE POLICY "Users can view their own behavioral profiles"
ON public.behavioral_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavioral profiles"
ON public.behavioral_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavioral profiles"
ON public.behavioral_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own behavioral profiles"
ON public.behavioral_profiles FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users behavioral profiles"
ON public.behavioral_profiles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM invites i
  JOIN profiles p ON p.email = i.email
  WHERE p.id = behavioral_profiles.user_id AND i.created_by = auth.uid()
));

-- RLS Policies for behavioral_questionnaire_responses
CREATE POLICY "Users can view their own questionnaire responses"
ON public.behavioral_questionnaire_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questionnaire responses"
ON public.behavioral_questionnaire_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questionnaire responses"
ON public.behavioral_questionnaire_responses FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for behavioral_conversations
CREATE POLICY "Users can view their own behavioral conversations"
ON public.behavioral_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavioral conversations"
ON public.behavioral_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavioral conversations"
ON public.behavioral_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own behavioral conversations"
ON public.behavioral_conversations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users behavioral conversations"
ON public.behavioral_conversations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM invites i
  JOIN profiles p ON p.email = i.email
  WHERE p.id = behavioral_conversations.user_id AND i.created_by = auth.uid()
));

-- RLS Policies for behavioral_module_config
CREATE POLICY "Users can view their own module config"
ON public.behavioral_module_config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module config"
ON public.behavioral_module_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module config"
ON public.behavioral_module_config FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_behavioral_profiles_updated_at
BEFORE UPDATE ON public.behavioral_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_behavioral_module_config_updated_at
BEFORE UPDATE ON public.behavioral_module_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();