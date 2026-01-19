
-- ============================================
-- RMR AUTOMATIZADO COM IA - ESTRUTURA COMPLETA
-- ============================================

-- 1. Tabela de status de preparação da RMR
CREATE TABLE public.rmr_preparation_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rmr_id UUID REFERENCES public.rmr_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  preparation_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  is_prepared BOOLEAN NOT NULL DEFAULT false,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  generated_script_markdown TEXT,
  generated_script_pdf_url TEXT,
  slides_presentation_url TEXT,
  ai_generated_highlights JSONB,
  ai_suggested_theme TEXT,
  ai_suggested_strategies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de fases da mentoria
CREATE TABLE public.mentorship_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  consultant_id UUID,
  current_phase INTEGER NOT NULL DEFAULT 1 CHECK (current_phase IN (1, 2)),
  phase_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  phase_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Biblioteca curada de vídeos
CREATE TABLE public.video_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_name TEXT,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  description TEXT,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_used INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Sugestões de vídeos por RMR
CREATE TABLE public.rmr_video_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rmr_id UUID REFERENCES public.rmr_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  video_id UUID REFERENCES public.video_library(id) ON DELETE SET NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  suggested_by_ai BOOLEAN NOT NULL DEFAULT false,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  was_used BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Vídeos favoritos do usuário
CREATE TABLE public.user_favorite_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID REFERENCES public.video_library(id) ON DELETE SET NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  custom_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, youtube_id)
);

-- 6. Adicionar campos de vídeo na tabela rmr_meetings
ALTER TABLE public.rmr_meetings 
ADD COLUMN IF NOT EXISTS selected_video_url TEXT,
ADD COLUMN IF NOT EXISTS selected_video_title TEXT,
ADD COLUMN IF NOT EXISTS selected_video_id TEXT;

-- ============================================
-- RLS POLICIES
-- ============================================

-- rmr_preparation_status
ALTER TABLE public.rmr_preparation_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preparation status"
ON public.rmr_preparation_status FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preparation status"
ON public.rmr_preparation_status FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preparation status"
ON public.rmr_preparation_status FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preparation status"
ON public.rmr_preparation_status FOR DELETE
USING (auth.uid() = user_id);

-- mentorship_phases
ALTER TABLE public.mentorship_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own phase"
ON public.mentorship_phases FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = consultant_id);

CREATE POLICY "Users can create their own phase"
ON public.mentorship_phases FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = consultant_id);

CREATE POLICY "Consultants can update phases of their students"
ON public.mentorship_phases FOR UPDATE
USING (auth.uid() = consultant_id OR auth.uid() = user_id);

-- video_library (leitura pública para todos os usuários autenticados)
ALTER TABLE public.video_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active videos"
ON public.video_library FOR SELECT
USING (is_active = true);

-- rmr_video_suggestions
ALTER TABLE public.rmr_video_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video suggestions"
ON public.rmr_video_suggestions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video suggestions"
ON public.rmr_video_suggestions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video suggestions"
ON public.rmr_video_suggestions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video suggestions"
ON public.rmr_video_suggestions FOR DELETE
USING (auth.uid() = user_id);

-- user_favorite_videos
ALTER TABLE public.user_favorite_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorite videos"
ON public.user_favorite_videos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite videos"
ON public.user_favorite_videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite videos"
ON public.user_favorite_videos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite videos"
ON public.user_favorite_videos FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS para updated_at
-- ============================================

CREATE TRIGGER update_rmr_preparation_status_updated_at
BEFORE UPDATE ON public.rmr_preparation_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_phases_updated_at
BEFORE UPDATE ON public.mentorship_phases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_library_updated_at
BEFORE UPDATE ON public.video_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED: Biblioteca inicial de vídeos curados
-- ============================================

INSERT INTO public.video_library (youtube_url, youtube_id, title, channel_name, duration_seconds, thumbnail_url, categories, keywords, description, language) VALUES
-- Motivação Geral
('https://www.youtube.com/watch?v=u6XAPnuFjJc', 'u6XAPnuFjJc', 'Como Grandes Líderes Inspiram Ação - Simon Sinek', 'TED', 1080, 'https://img.youtube.com/vi/u6XAPnuFjJc/hqdefault.jpg', ARRAY['motivacao', 'lideranca'], ARRAY['lideranca', 'proposito', 'inspiracao', 'golden circle'], 'O famoso Golden Circle de Simon Sinek sobre como líderes inspiram através do propósito.', 'pt-BR'),
('https://www.youtube.com/watch?v=RYlCVwxoL_g', 'RYlCVwxoL_g', 'O Poder da Vulnerabilidade - Brené Brown', 'TED', 1212, 'https://img.youtube.com/vi/RYlCVwxoL_g/hqdefault.jpg', ARRAY['motivacao', 'lideranca'], ARRAY['vulnerabilidade', 'coragem', 'conexao', 'autenticidade'], 'Brené Brown fala sobre como a vulnerabilidade é a chave para conexões genuínas.', 'pt-BR'),
('https://www.youtube.com/watch?v=H14bBuluwB8', 'H14bBuluwB8', 'A Atitude Que Transforma - Leandro Karnal', 'Leandro Karnal', 900, 'https://img.youtube.com/vi/H14bBuluwB8/hqdefault.jpg', ARRAY['motivacao', 'superacao'], ARRAY['atitude', 'mudanca', 'transformacao', 'mentalidade'], 'Leandro Karnal sobre como a atitude define nossos resultados.', 'pt-BR'),

-- Superação
('https://www.youtube.com/watch?v=36m1o-tM05g', '36m1o-tM05g', 'A Vida Sem Limites - Nick Vujicic', 'Nick Vujicic', 1800, 'https://img.youtube.com/vi/36m1o-tM05g/hqdefault.jpg', ARRAY['superacao', 'motivacao'], ARRAY['superacao', 'limites', 'perseveranca', 'fe'], 'História inspiradora de Nick Vujicic sobre superar qualquer obstáculo.', 'pt-BR'),
('https://www.youtube.com/watch?v=zLYECIjmnQs', 'zLYECIjmnQs', 'Nunca Desista dos Seus Sonhos - Augusto Cury', 'Augusto Cury', 720, 'https://img.youtube.com/vi/zLYECIjmnQs/hqdefault.jpg', ARRAY['superacao', 'motivacao'], ARRAY['sonhos', 'persistencia', 'resiliencia'], 'Augusto Cury sobre a importância de nunca desistir dos sonhos.', 'pt-BR'),
('https://www.youtube.com/watch?v=mgmVOuLgFB0', 'mgmVOuLgFB0', 'O Sucesso É Construído à Noite - Flávio Augusto', 'Geração de Valor', 600, 'https://img.youtube.com/vi/mgmVOuLgFB0/hqdefault.jpg', ARRAY['superacao', 'vendas'], ARRAY['sucesso', 'dedicacao', 'trabalho', 'esforco'], 'Flávio Augusto sobre o que diferencia pessoas de sucesso.', 'pt-BR'),

-- Vendas
('https://www.youtube.com/watch?v=Unzc731iCUY', 'Unzc731iCUY', 'Como Vender Qualquer Coisa - Jordan Belfort', 'Jordan Belfort', 1500, 'https://img.youtube.com/vi/Unzc731iCUY/hqdefault.jpg', ARRAY['vendas', 'motivacao'], ARRAY['vendas', 'persuasao', 'fechamento', 'tecnicas'], 'Jordan Belfort ensina técnicas de vendas de alto impacto.', 'pt-BR'),
('https://www.youtube.com/watch?v=YS7GY5U_LMw', 'YS7GY5U_LMw', 'O Vendedor de Sonhos - Augusto Cury', 'Augusto Cury', 480, 'https://img.youtube.com/vi/YS7GY5U_LMw/hqdefault.jpg', ARRAY['vendas', 'motivacao'], ARRAY['vendas', 'sonhos', 'proposito', 'significado'], 'A importância de vender mais do que produtos - vender sonhos.', 'pt-BR'),
('https://www.youtube.com/watch?v=5p8wTOr8AbU', '5p8wTOr8AbU', 'Vendas de Alta Performance - Thiago Reis', 'Growth Machine', 900, 'https://img.youtube.com/vi/5p8wTOr8AbU/hqdefault.jpg', ARRAY['vendas'], ARRAY['vendas', 'performance', 'metas', 'resultados'], 'Estratégias para elevar a performance em vendas.', 'pt-BR'),

-- Liderança
('https://www.youtube.com/watch?v=lmyZMtPVodo', 'lmyZMtPVodo', 'Líderes Comem Por Último - Simon Sinek', 'Simon Sinek', 2700, 'https://img.youtube.com/vi/lmyZMtPVodo/hqdefault.jpg', ARRAY['lideranca', 'equipe'], ARRAY['lideranca', 'equipe', 'confianca', 'seguranca'], 'Por que os melhores líderes priorizam suas equipes.', 'pt-BR'),
('https://www.youtube.com/watch?v=ReRcHdeUG9Y', 'ReRcHdeUG9Y', 'O Jogo Infinito - Simon Sinek', 'Simon Sinek', 1800, 'https://img.youtube.com/vi/ReRcHdeUG9Y/hqdefault.jpg', ARRAY['lideranca', 'motivacao'], ARRAY['lideranca', 'visao', 'longo prazo', 'proposito'], 'A diferença entre líderes com mentalidade finita e infinita.', 'pt-BR'),
('https://www.youtube.com/watch?v=qp0HIF3SfI4', 'qp0HIF3SfI4', 'Como Ser Um Líder - Mario Sergio Cortella', 'Mario Sergio Cortella', 600, 'https://img.youtube.com/vi/qp0HIF3SfI4/hqdefault.jpg', ARRAY['lideranca'], ARRAY['lideranca', 'gestao', 'pessoas', 'inspiracao'], 'Cortella sobre os fundamentos da liderança efetiva.', 'pt-BR'),

-- Trabalho em Equipe
('https://www.youtube.com/watch?v=fUFlLKrkpvo', 'fUFlLKrkpvo', 'O Poder do Trabalho em Equipe', 'Motivação', 300, 'https://img.youtube.com/vi/fUFlLKrkpvo/hqdefault.jpg', ARRAY['equipe', 'motivacao'], ARRAY['equipe', 'colaboracao', 'uniao', 'sinergia'], 'Vídeo motivacional sobre a força do trabalho em equipe.', 'pt-BR'),
('https://www.youtube.com/watch?v=hxMCkPD2JKs', 'hxMCkPD2JKs', 'Unidos Somos Mais Fortes', 'Motivação Empresarial', 240, 'https://img.youtube.com/vi/hxMCkPD2JKs/hqdefault.jpg', ARRAY['equipe', 'superacao'], ARRAY['uniao', 'forca', 'equipe', 'cooperacao'], 'A importância da união para alcançar grandes resultados.', 'pt-BR'),

-- Foco e Produtividade
('https://www.youtube.com/watch?v=arj7oStGLkU', 'arj7oStGLkU', 'Como Ter Foco - TED Talk', 'TED', 900, 'https://img.youtube.com/vi/arj7oStGLkU/hqdefault.jpg', ARRAY['produtividade', 'motivacao'], ARRAY['foco', 'concentracao', 'produtividade', 'resultados'], 'Técnicas para manter o foco em um mundo de distrações.', 'pt-BR'),
('https://www.youtube.com/watch?v=5MgBikgcWnY', '5MgBikgcWnY', 'A Regra das 5 Horas - Aprenda Sempre', 'Motivação', 480, 'https://img.youtube.com/vi/5MgBikgcWnY/hqdefault.jpg', ARRAY['produtividade', 'superacao'], ARRAY['aprendizado', 'desenvolvimento', 'crescimento', 'habitos'], 'Por que dedicar 5 horas por semana ao aprendizado transforma carreiras.', 'pt-BR'),

-- Metas e Objetivos
('https://www.youtube.com/watch?v=TQMbvJNRpLE', 'TQMbvJNRpLE', 'Como Definir Metas - Brian Tracy', 'Brian Tracy', 600, 'https://img.youtube.com/vi/TQMbvJNRpLE/hqdefault.jpg', ARRAY['metas', 'vendas'], ARRAY['metas', 'objetivos', 'planejamento', 'sucesso'], 'Brian Tracy ensina a definir e alcançar metas ambiciosas.', 'pt-BR'),
('https://www.youtube.com/watch?v=V80-gPkpH6M', 'V80-gPkpH6M', 'Metas SMART - Como Definir Objetivos', 'Gestão', 420, 'https://img.youtube.com/vi/V80-gPkpH6M/hqdefault.jpg', ARRAY['metas', 'produtividade'], ARRAY['smart', 'metas', 'objetivos', 'metodologia'], 'A metodologia SMART para definição de metas efetivas.', 'pt-BR'),

-- Resiliência
('https://www.youtube.com/watch?v=_X0mgOOSpLU', '_X0mgOOSpLU', 'O Poder da Resiliência', 'TED', 720, 'https://img.youtube.com/vi/_X0mgOOSpLU/hqdefault.jpg', ARRAY['superacao', 'motivacao'], ARRAY['resiliencia', 'adversidade', 'forca', 'recuperacao'], 'Como desenvolver resiliência para superar adversidades.', 'pt-BR'),
('https://www.youtube.com/watch?v=iCvmsMzlF7o', 'iCvmsMzlF7o', 'Grit: O Poder da Paixão e Perseverança - Angela Duckworth', 'TED', 720, 'https://img.youtube.com/vi/iCvmsMzlF7o/hqdefault.jpg', ARRAY['superacao', 'metas'], ARRAY['grit', 'perseveranca', 'paixao', 'determinacao'], 'Angela Duckworth sobre o que realmente prediz o sucesso.', 'pt-BR'),

-- Mentalidade de Crescimento
('https://www.youtube.com/watch?v=M1CHPnZfFmU', 'M1CHPnZfFmU', 'Mentalidade de Crescimento - Carol Dweck', 'TED', 600, 'https://img.youtube.com/vi/M1CHPnZfFmU/hqdefault.jpg', ARRAY['motivacao', 'superacao'], ARRAY['mindset', 'crescimento', 'aprendizado', 'desenvolvimento'], 'Carol Dweck sobre a mentalidade que diferencia vencedores.', 'pt-BR'),
('https://www.youtube.com/watch?v=pN34FNbOKXc', 'pN34FNbOKXc', 'Faça Acontecer - Sheryl Sandberg', 'TED', 900, 'https://img.youtube.com/vi/pN34FNbOKXc/hqdefault.jpg', ARRAY['lideranca', 'motivacao'], ARRAY['lideranca', 'iniciativa', 'acao', 'empoderamento'], 'Sheryl Sandberg sobre tomar iniciativa e fazer acontecer.', 'pt-BR'),

-- Motivação Rápida (vídeos curtos para início de reunião)
('https://www.youtube.com/watch?v=ZXsQAXx_ao0', 'ZXsQAXx_ao0', 'Motivação Matinal - 3 Minutos Para Mudar Seu Dia', 'Motivação Diária', 180, 'https://img.youtube.com/vi/ZXsQAXx_ao0/hqdefault.jpg', ARRAY['motivacao'], ARRAY['motivacao', 'energia', 'disposicao', 'atitude'], 'Vídeo curto e energético para começar o dia.', 'pt-BR'),
('https://www.youtube.com/watch?v=LehNm4VVqJI', 'LehNm4VVqJI', 'Você Consegue - Vídeo Motivacional', 'Motivação', 240, 'https://img.youtube.com/vi/LehNm4VVqJI/hqdefault.jpg', ARRAY['motivacao', 'superacao'], ARRAY['voce consegue', 'forca', 'determinacao'], 'Mensagem de incentivo para momentos de dúvida.', 'pt-BR'),
('https://www.youtube.com/watch?v=DlabNfXluqg', 'DlabNfXluqg', 'Levante e Lute', 'Motivação Extrema', 300, 'https://img.youtube.com/vi/DlabNfXluqg/hqdefault.jpg', ARRAY['superacao', 'motivacao'], ARRAY['luta', 'persistencia', 'nao desistir'], 'Vídeo motivacional sobre nunca desistir.', 'pt-BR');
