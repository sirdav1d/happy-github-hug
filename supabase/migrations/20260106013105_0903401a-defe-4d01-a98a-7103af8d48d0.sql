-- Tabela para políticas de premiação configuráveis
CREATE TABLE public.premium_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Política Padrão',
  tiers JSONB NOT NULL DEFAULT '[
    {"minPercent": 100, "maxPercent": null, "reward": "Premiação Integral", "description": "+ Bônus por superação"},
    {"minPercent": 80, "maxPercent": 99, "reward": "Premiação Proporcional", "description": "Baseada no % atingido"},
    {"minPercent": 0, "maxPercent": 79, "reward": "Sem Premiação", "description": "Foco em melhoria"}
  ]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_policies ENABLE ROW LEVEL SECURITY;

-- Policies for user access
CREATE POLICY "Users can view their own premium policies"
ON public.premium_policies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own premium policies"
ON public.premium_policies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own premium policies"
ON public.premium_policies
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own premium policies"
ON public.premium_policies
FOR DELETE
USING (auth.uid() = user_id);

-- Consultants can view invited users premium policies
CREATE POLICY "Consultants can view invited users premium policies"
ON public.premium_policies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = premium_policies.user_id
    AND i.created_by = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_premium_policies_updated_at
  BEFORE UPDATE ON public.premium_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();