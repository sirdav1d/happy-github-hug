-- Add recording and notes fields to fivi_sessions table
ALTER TABLE public.fivi_sessions 
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS meeting_notes TEXT;