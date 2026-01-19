
-- ============================================
-- FASE 1: Gestão de Vendedores e Regras de Metas
-- ============================================

-- 1.1 Criar enum para tipos de regra de meta
CREATE TYPE public.goal_rule_type AS ENUM ('percentage', 'fixed', 'manual');

-- 1.2 Criar enum para referência base da meta
CREATE TYPE public.goal_base_reference AS ENUM ('previous_year_same_month', 'previous_month', 'team_average', 'manual');

-- 1.3 Criar enum para estratégia de novos vendedores
CREATE TYPE public.new_hire_strategy AS ENUM ('team_average', 'fixed_rampup', 'manual', 'no_goal');

-- 1.4 Criar enum para status do vendedor
CREATE TYPE public.salesperson_status AS ENUM ('active', 'inactive', 'on_leave');

-- 1.5 Criar enum para motivo de desligamento
CREATE TYPE public.termination_reason AS ENUM ('dismissal', 'resignation', 'retirement', 'contract_end', 'other');

-- 1.6 Criar enum para tipos de evento de vendedor
CREATE TYPE public.salesperson_event_type AS ENUM ('hired', 'terminated', 'promoted', 'goal_changed', 'leave_started', 'leave_ended', 'status_changed');

-- ============================================
-- 2. Tabela de Regras de Metas
-- ============================================
CREATE TABLE public.goal_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type public.goal_rule_type NOT NULL DEFAULT 'percentage',
  base_reference public.goal_base_reference NOT NULL DEFAULT 'previous_year_same_month',
  percentage_value NUMERIC NOT NULL DEFAULT 15,
  fixed_value NUMERIC,
  is_default BOOLEAN NOT NULL DEFAULT false,
  new_hire_strategy public.new_hire_strategy NOT NULL DEFAULT 'team_average',
  rampup_months INTEGER DEFAULT 3,
  rampup_start_percent NUMERIC DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_goal_rules_updated_at
  BEFORE UPDATE ON public.goal_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_goal_rules_user_id ON public.goal_rules(user_id);
CREATE INDEX idx_goal_rules_is_default ON public.goal_rules(user_id, is_default) WHERE is_default = true;

-- RLS
ALTER TABLE public.goal_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goal rules"
  ON public.goal_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal rules"
  ON public.goal_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal rules"
  ON public.goal_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal rules"
  ON public.goal_rules FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users goal rules"
  ON public.goal_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invites i
      JOIN profiles p ON p.email = i.email
      WHERE p.id = goal_rules.user_id AND i.created_by = auth.uid()
    )
  );

-- ============================================
-- 3. Tabela de Vendedores (normalizada)
-- ============================================
CREATE TABLE public.salespeople (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_id TEXT, -- ID do JSONB antigo para migração
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  hire_date DATE NOT NULL,
  termination_date DATE,
  termination_reason public.termination_reason,
  termination_notes TEXT,
  status public.salesperson_status NOT NULL DEFAULT 'active',
  goal_rule_id UUID REFERENCES public.goal_rules(id) ON DELETE SET NULL,
  goal_override_value NUMERIC, -- Valor fixo se aplicável
  goal_override_percent NUMERIC, -- Percentual personalizado
  channel_preference TEXT DEFAULT 'presencial', -- online, presencial, ambos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_salespeople_updated_at
  BEFORE UPDATE ON public.salespeople
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_salespeople_user_id ON public.salespeople(user_id);
CREATE INDEX idx_salespeople_status ON public.salespeople(user_id, status);
CREATE INDEX idx_salespeople_legacy_id ON public.salespeople(user_id, legacy_id);
CREATE INDEX idx_salespeople_hire_date ON public.salespeople(hire_date);

-- RLS
ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own salespeople"
  ON public.salespeople FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own salespeople"
  ON public.salespeople FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salespeople"
  ON public.salespeople FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salespeople"
  ON public.salespeople FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users salespeople"
  ON public.salespeople FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invites i
      JOIN profiles p ON p.email = i.email
      WHERE p.id = salespeople.user_id AND i.created_by = auth.uid()
    )
  );

-- ============================================
-- 4. Tabela de Eventos de Vendedor (histórico)
-- ============================================
CREATE TABLE public.salesperson_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type public.salesperson_event_type NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_salesperson_events_salesperson_id ON public.salesperson_events(salesperson_id);
CREATE INDEX idx_salesperson_events_user_id ON public.salesperson_events(user_id);
CREATE INDEX idx_salesperson_events_event_date ON public.salesperson_events(event_date);
CREATE INDEX idx_salesperson_events_event_type ON public.salesperson_events(event_type);

-- RLS
ALTER TABLE public.salesperson_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own salesperson events"
  ON public.salesperson_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own salesperson events"
  ON public.salesperson_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salesperson events"
  ON public.salesperson_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salesperson events"
  ON public.salesperson_events FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view invited users salesperson events"
  ON public.salesperson_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invites i
      JOIN profiles p ON p.email = i.email
      WHERE p.id = salesperson_events.user_id AND i.created_by = auth.uid()
    )
  );

-- ============================================
-- 5. Função para garantir apenas uma regra default por usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_single_default_goal_rule()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.goal_rules
    SET is_default = false
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_goal_rule_trigger
  BEFORE INSERT OR UPDATE ON public.goal_rules
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_goal_rule();

-- ============================================
-- 6. Função para registrar eventos automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.log_salesperson_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Registrar mudança de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.salesperson_events (
      salesperson_id, user_id, event_type, event_date, title, description, details, created_by
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'status_changed',
      CURRENT_DATE,
      CASE NEW.status
        WHEN 'active' THEN 'Status alterado para Ativo'
        WHEN 'inactive' THEN 'Status alterado para Inativo'
        WHEN 'on_leave' THEN 'Status alterado para Afastado'
      END,
      NULL,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
      auth.uid()
    );
  END IF;

  -- Registrar desligamento
  IF OLD.termination_date IS NULL AND NEW.termination_date IS NOT NULL THEN
    INSERT INTO public.salesperson_events (
      salesperson_id, user_id, event_type, event_date, title, description, details, created_by
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'terminated',
      NEW.termination_date,
      'Desligamento registrado',
      NEW.termination_notes,
      jsonb_build_object('reason', NEW.termination_reason),
      auth.uid()
    );
  END IF;

  -- Registrar mudança de regra de meta
  IF OLD.goal_rule_id IS DISTINCT FROM NEW.goal_rule_id 
     OR OLD.goal_override_value IS DISTINCT FROM NEW.goal_override_value
     OR OLD.goal_override_percent IS DISTINCT FROM NEW.goal_override_percent THEN
    INSERT INTO public.salesperson_events (
      salesperson_id, user_id, event_type, event_date, title, description, details, created_by
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'goal_changed',
      CURRENT_DATE,
      'Regra de meta alterada',
      NULL,
      jsonb_build_object(
        'old_goal_rule_id', OLD.goal_rule_id,
        'new_goal_rule_id', NEW.goal_rule_id,
        'old_override_value', OLD.goal_override_value,
        'new_override_value', NEW.goal_override_value,
        'old_override_percent', OLD.goal_override_percent,
        'new_override_percent', NEW.goal_override_percent
      ),
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER log_salesperson_changes
  AFTER UPDATE ON public.salespeople
  FOR EACH ROW
  EXECUTE FUNCTION public.log_salesperson_status_change();

-- Trigger para registrar admissão
CREATE OR REPLACE FUNCTION public.log_salesperson_hired()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.salesperson_events (
    salesperson_id, user_id, event_type, event_date, title, description, created_by
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'hired',
    NEW.hire_date,
    'Vendedor admitido',
    'Novo membro da equipe',
    auth.uid()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_salesperson_hired_trigger
  AFTER INSERT ON public.salespeople
  FOR EACH ROW
  EXECUTE FUNCTION public.log_salesperson_hired();
