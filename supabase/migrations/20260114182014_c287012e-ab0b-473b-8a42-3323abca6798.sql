-- Função para deletar usuário e todos os dados vinculados
-- Apenas consultores podem executar
CREATE OR REPLACE FUNCTION public.delete_user_and_all_data(target_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  deleted_counts JSONB := '{}'::JSONB;
  row_count INT;
BEGIN
  -- Verificar se executor é consultor
  IF NOT public.is_consultant(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas consultores podem deletar usuários';
  END IF;
  
  -- Buscar user_id pelo email
  SELECT id INTO target_user_id 
  FROM public.profiles 
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', target_email;
  END IF;
  
  -- Prevenir auto-deleção
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Não é possível deletar o próprio usuário';
  END IF;
  
  -- 1. Deletar salesperson_events (depende de salespeople)
  DELETE FROM public.salesperson_events WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('salesperson_events', row_count);
  
  -- 2. Deletar pgv_entries (depende de pgv_weeks)
  DELETE FROM public.pgv_entries WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('pgv_entries', row_count);
  
  -- 3. Deletar rmr_preparation_status (depende de rmr_meetings)
  DELETE FROM public.rmr_preparation_status WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('rmr_preparation_status', row_count);
  
  -- 4. Deletar rmr_video_suggestions (depende de rmr_meetings)
  DELETE FROM public.rmr_video_suggestions WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('rmr_video_suggestions', row_count);
  
  -- 5. Deletar fivi_sessions
  DELETE FROM public.fivi_sessions WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('fivi_sessions', row_count);
  
  -- 6. Deletar salespeople
  DELETE FROM public.salespeople WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('salespeople', row_count);
  
  -- 7. Deletar pgv_weeks
  DELETE FROM public.pgv_weeks WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('pgv_weeks', row_count);
  
  -- 8. Deletar rmr_meetings
  DELETE FROM public.rmr_meetings WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('rmr_meetings', row_count);
  
  -- 9. Deletar sales
  DELETE FROM public.sales WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('sales', row_count);
  
  -- 10. Deletar leads
  DELETE FROM public.leads WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('leads', row_count);
  
  -- 11. Deletar clients
  DELETE FROM public.clients WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('clients', row_count);
  
  -- 12. Deletar annual_goals
  DELETE FROM public.annual_goals WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('annual_goals', row_count);
  
  -- 13. Deletar goal_rules
  DELETE FROM public.goal_rules WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('goal_rules', row_count);
  
  -- 14. Deletar premium_policies
  DELETE FROM public.premium_policies WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('premium_policies', row_count);
  
  -- 15. Deletar user_favorite_videos
  DELETE FROM public.user_favorite_videos WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('user_favorite_videos', row_count);
  
  -- 16. Deletar notifications
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('notifications', row_count);
  
  -- 17. Deletar mentorship_phases
  DELETE FROM public.mentorship_phases WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('mentorship_phases', row_count);
  
  -- 18. Deletar mentoring_sessions (como student)
  DELETE FROM public.mentoring_sessions WHERE student_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('mentoring_sessions', row_count);
  
  -- 19. Deletar dashboard_data
  DELETE FROM public.dashboard_data WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('dashboard_data', row_count);
  
  -- 20. Deletar activity_logs
  DELETE FROM public.activity_logs WHERE user_id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('activity_logs', row_count);
  
  -- 21. Atualizar invites (não deletar, apenas limpar referência)
  UPDATE public.invites SET registered_uid = NULL, status = 'pending' WHERE registered_uid = target_user_id;
  
  -- 22. Deletar profile
  DELETE FROM public.profiles WHERE id = target_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('profiles', row_count);
  
  -- Retornar resumo (a deleção de auth.users será feita via edge function)
  RETURN jsonb_build_object(
    'success', true,
    'deleted_email', target_email,
    'deleted_user_id', target_user_id,
    'counts', deleted_counts
  );
END;
$$;