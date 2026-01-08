
-- Criar tabela para dados demo de estudantes (sem FK para auth.users)
CREATE TABLE IF NOT EXISTS demo_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  segment TEXT,
  annual_goal NUMERIC DEFAULT 0,
  annual_realized NUMERIC DEFAULT 0,
  team_size INTEGER DEFAULT 0,
  monthly_data JSONB DEFAULT '[]'::jsonb,
  kpis JSONB DEFAULT '{}'::jsonb,
  team JSONB DEFAULT '[]'::jsonb,
  mentorship_start_date DATE,
  last_upload_date TIMESTAMP WITH TIME ZONE,
  alerts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para demo_students
ALTER TABLE demo_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view their own demo students"
  ON demo_students FOR SELECT
  USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can insert their own demo students"
  ON demo_students FOR INSERT
  WITH CHECK (auth.uid() = consultant_id);

CREATE POLICY "Consultants can update their own demo students"
  ON demo_students FOR UPDATE
  USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can delete their own demo students"
  ON demo_students FOR DELETE
  USING (auth.uid() = consultant_id);

-- Trigger para updated_at
CREATE TRIGGER update_demo_students_updated_at
  BEFORE UPDATE ON demo_students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados demo vinculados ao consultor existente
INSERT INTO demo_students (consultant_id, email, company_name, segment, annual_goal, annual_realized, team_size, monthly_data, kpis, team, mentorship_start_date, last_upload_date, alerts)
SELECT 
  consultant_id,
  email,
  company_name,
  segment,
  annual_goal,
  annual_realized,
  team_size,
  monthly_data,
  kpis,
  team,
  mentorship_start_date,
  last_upload_date,
  alerts
FROM (
  SELECT 
    (SELECT id FROM profiles WHERE role = 'consultant' LIMIT 1) as consultant_id,
    'demo1@empresa.demo' as email,
    'Tech Solutions [DEMO]' as company_name,
    'Tecnologia' as segment,
    1200000 as annual_goal,
    1080000 as annual_realized,
    5 as team_size,
    '[{"month": 1, "revenue": 95000, "goal": 100000}, {"month": 2, "revenue": 102000, "goal": 100000}, {"month": 3, "revenue": 98000, "goal": 100000}, {"month": 4, "revenue": 105000, "goal": 100000}, {"month": 5, "revenue": 110000, "goal": 100000}, {"month": 6, "revenue": 95000, "goal": 100000}, {"month": 7, "revenue": 108000, "goal": 100000}, {"month": 8, "revenue": 112000, "goal": 100000}, {"month": 9, "revenue": 98000, "goal": 100000}, {"month": 10, "revenue": 105000, "goal": 100000}, {"month": 11, "revenue": 85000, "goal": 100000}, {"month": 12, "revenue": 77000, "goal": 100000}]'::jsonb as monthly_data,
    '{"averageTicket": 2500, "cac": 180, "ltv": 10000, "conversionRate": 32}'::jsonb as kpis,
    '[{"id": "v1", "name": "Carlos Silva"}, {"id": "v2", "name": "Ana Santos"}, {"id": "v3", "name": "Pedro Costa"}, {"id": "v4", "name": "Julia Lima"}, {"id": "v5", "name": "Roberto Alves"}]'::jsonb as team,
    '2024-03-15'::date as mentorship_start_date,
    NOW() - INTERVAL '2 days' as last_upload_date,
    '[]'::jsonb as alerts
  UNION ALL SELECT (SELECT id FROM profiles WHERE role = 'consultant' LIMIT 1), 'demo2@empresa.demo', 'Moda Express [DEMO]', 'Varejo', 800000, 480000, 3,
    '[{"month": 1, "revenue": 42000, "goal": 66000}, {"month": 2, "revenue": 45000, "goal": 66000}, {"month": 3, "revenue": 38000, "goal": 66000}, {"month": 4, "revenue": 52000, "goal": 66000}, {"month": 5, "revenue": 48000, "goal": 66000}, {"month": 6, "revenue": 55000, "goal": 66000}, {"month": 7, "revenue": 40000, "goal": 66000}, {"month": 8, "revenue": 35000, "goal": 66000}, {"month": 9, "revenue": 42000, "goal": 66000}, {"month": 10, "revenue": 38000, "goal": 66000}, {"month": 11, "revenue": 25000, "goal": 66000}, {"month": 12, "revenue": 20000, "goal": 66000}]'::jsonb,
    '{"averageTicket": 350, "cac": 85, "ltv": 1400, "conversionRate": 18}'::jsonb,
    '[{"id": "v1", "name": "Fernanda Rocha"}, {"id": "v2", "name": "Marcos Paulo"}, {"id": "v3", "name": "Letícia Dias"}]'::jsonb,
    '2024-06-01'::date, NOW() - INTERVAL '5 days', '[{"type": "warning", "message": "Abaixo da meta há 3 meses"}]'::jsonb
  UNION ALL SELECT (SELECT id FROM profiles WHERE role = 'consultant' LIMIT 1), 'demo3@empresa.demo', 'Auto Peças Centro [DEMO]', 'Automotivo', 600000, 510000, 4,
    '[{"month": 1, "revenue": 44000, "goal": 50000}, {"month": 2, "revenue": 46000, "goal": 50000}, {"month": 3, "revenue": 42000, "goal": 50000}, {"month": 4, "revenue": 48000, "goal": 50000}, {"month": 5, "revenue": 45000, "goal": 50000}, {"month": 6, "revenue": 41000, "goal": 50000}, {"month": 7, "revenue": 47000, "goal": 50000}, {"month": 8, "revenue": 43000, "goal": 50000}, {"month": 9, "revenue": 40000, "goal": 50000}, {"month": 10, "revenue": 38000, "goal": 50000}, {"month": 11, "revenue": 36000, "goal": 50000}, {"month": 12, "revenue": 40000, "goal": 50000}]'::jsonb,
    '{"averageTicket": 890, "cac": 120, "ltv": 3560, "conversionRate": 25}'::jsonb,
    '[{"id": "v1", "name": "Ricardo Mendes"}, {"id": "v2", "name": "Thiago Nunes"}, {"id": "v3", "name": "Camila Freitas"}, {"id": "v4", "name": "Bruno Oliveira"}]'::jsonb,
    '2024-04-20'::date, NOW() - INTERVAL '1 day', '[]'::jsonb
  UNION ALL SELECT (SELECT id FROM profiles WHERE role = 'consultant' LIMIT 1), 'demo4@empresa.demo', 'Sabor & Arte [DEMO]', 'Alimentação', 400000, 180000, 2,
    '[{"month": 1, "revenue": 18000, "goal": 33000}, {"month": 2, "revenue": 15000, "goal": 33000}, {"month": 3, "revenue": 12000, "goal": 33000}, {"month": 4, "revenue": 16000, "goal": 33000}, {"month": 5, "revenue": 14000, "goal": 33000}, {"month": 6, "revenue": 18000, "goal": 33000}, {"month": 7, "revenue": 20000, "goal": 33000}, {"month": 8, "revenue": 17000, "goal": 33000}, {"month": 9, "revenue": 15000, "goal": 33000}, {"month": 10, "revenue": 13000, "goal": 33000}, {"month": 11, "revenue": 11000, "goal": 33000}, {"month": 12, "revenue": 11000, "goal": 33000}]'::jsonb,
    '{"averageTicket": 185, "cac": 65, "ltv": 740, "conversionRate": 12}'::jsonb,
    '[{"id": "v1", "name": "Patrícia Souza"}, {"id": "v2", "name": "Gabriel Martins"}]'::jsonb,
    '2024-08-10'::date, NOW() - INTERVAL '10 days', '[{"type": "danger", "message": "Em risco - progresso abaixo de 50%"}, {"type": "warning", "message": "Sem upload há mais de 7 dias"}]'::jsonb
  UNION ALL SELECT (SELECT id FROM profiles WHERE role = 'consultant' LIMIT 1), 'demo5@empresa.demo', 'Constrular [DEMO]', 'Construção', 1500000, 1425000, 6,
    '[{"month": 1, "revenue": 125000, "goal": 125000}, {"month": 2, "revenue": 132000, "goal": 125000}, {"month": 3, "revenue": 128000, "goal": 125000}, {"month": 4, "revenue": 135000, "goal": 125000}, {"month": 5, "revenue": 118000, "goal": 125000}, {"month": 6, "revenue": 122000, "goal": 125000}, {"month": 7, "revenue": 130000, "goal": 125000}, {"month": 8, "revenue": 125000, "goal": 125000}, {"month": 9, "revenue": 115000, "goal": 125000}, {"month": 10, "revenue": 108000, "goal": 125000}, {"month": 11, "revenue": 95000, "goal": 125000}, {"month": 12, "revenue": 92000, "goal": 125000}]'::jsonb,
    '{"averageTicket": 4200, "cac": 350, "ltv": 16800, "conversionRate": 38}'::jsonb,
    '[{"id": "v1", "name": "Eduardo Ferreira"}, {"id": "v2", "name": "Luciana Gomes"}, {"id": "v3", "name": "André Ribeiro"}, {"id": "v4", "name": "Vanessa Castro"}, {"id": "v5", "name": "Felipe Cardoso"}, {"id": "v6", "name": "Mariana Torres"}]'::jsonb,
    '2024-02-01'::date, NOW() - INTERVAL '1 day', '[]'::jsonb
) demo_data
WHERE consultant_id IS NOT NULL;

-- Criar tabela para sessões de mentoria demo
CREATE TABLE IF NOT EXISTS demo_mentoring_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID NOT NULL,
  student_email TEXT NOT NULL,
  student_company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled',
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para demo_mentoring_sessions
ALTER TABLE demo_mentoring_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view their own demo sessions"
  ON demo_mentoring_sessions FOR SELECT
  USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can insert their own demo sessions"
  ON demo_mentoring_sessions FOR INSERT
  WITH CHECK (auth.uid() = consultant_id);

CREATE POLICY "Consultants can update their own demo sessions"
  ON demo_mentoring_sessions FOR UPDATE
  USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can delete their own demo sessions"
  ON demo_mentoring_sessions FOR DELETE
  USING (auth.uid() = consultant_id);

-- Trigger para updated_at
CREATE TRIGGER update_demo_mentoring_sessions_updated_at
  BEFORE UPDATE ON demo_mentoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir sessões de mentoria demo
INSERT INTO demo_mentoring_sessions (consultant_id, student_email, student_company, title, description, scheduled_at, duration_minutes, status, meeting_link, notes)
SELECT 
  (SELECT id FROM profiles WHERE role = 'consultant' LIMIT 1),
  student_email,
  student_company,
  title,
  description,
  scheduled_at,
  duration_minutes,
  status,
  meeting_link,
  notes
FROM (
  SELECT 'demo1@empresa.demo' as student_email, 'Tech Solutions [DEMO]' as student_company, 'Revisão de Metas Mensais [DEMO]' as title, 'Análise do progresso mensal e ajuste de estratégias' as description, NOW() + INTERVAL '2 hours' as scheduled_at, 60 as duration_minutes, 'scheduled' as status, 'https://meet.google.com/demo-link-1' as meeting_link, '[DEMO] Sessão de demonstração' as notes
  UNION ALL SELECT 'demo2@empresa.demo', 'Moda Express [DEMO]', 'Análise de Pipeline [DEMO]', 'Revisão do funil de vendas e oportunidades', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', 45, 'scheduled', 'https://meet.google.com/demo-link-2', '[DEMO] Sessão de demonstração'
  UNION ALL SELECT 'demo3@empresa.demo', 'Auto Peças Centro [DEMO]', 'Feedback Individual [DEMO]', 'Sessão de feedback e desenvolvimento', NOW() + INTERVAL '3 days' + INTERVAL '15 hours', 60, 'scheduled', 'https://meet.google.com/demo-link-3', '[DEMO] Sessão de demonstração'
  UNION ALL SELECT 'demo4@empresa.demo', 'Sabor & Arte [DEMO]', 'Plano de Recuperação [DEMO]', 'Estratégias para melhorar performance - URGENTE', NOW() + INTERVAL '5 days' + INTERVAL '9 hours', 90, 'scheduled', 'https://meet.google.com/demo-link-4', '[DEMO] Sessão urgente - aluno em risco'
  UNION ALL SELECT 'demo5@empresa.demo', 'Constrular [DEMO]', 'Reunião de Onboarding [DEMO]', 'Primeira reunião de integração', NOW() - INTERVAL '7 days', 60, 'completed', 'https://meet.google.com/demo-link-5', '[DEMO] Sessão concluída com sucesso'
  UNION ALL SELECT 'demo1@empresa.demo', 'Tech Solutions [DEMO]', 'Primeiro Check-in [DEMO]', 'Acompanhamento inicial do progresso', NOW() - INTERVAL '14 days', 45, 'completed', 'https://meet.google.com/demo-link-6', '[DEMO] Definidos os primeiros KPIs'
) sessions_data
WHERE (SELECT id FROM profiles WHERE role = 'consultant' LIMIT 1) IS NOT NULL;
