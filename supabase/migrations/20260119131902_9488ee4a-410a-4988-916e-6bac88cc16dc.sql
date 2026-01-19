-- Remove trigger that references non-existent 'updated_at' column
DROP TRIGGER IF EXISTS update_mentorship_phases_updated_at ON public.mentorship_phases;