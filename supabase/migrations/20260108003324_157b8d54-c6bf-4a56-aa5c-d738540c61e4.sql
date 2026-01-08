-- Remover política permissiva e criar uma mais segura
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Criar política que permite inserção apenas via service role (edge functions)
-- ou o próprio usuário inserindo suas notificações
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);