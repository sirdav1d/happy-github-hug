-- Add slides tracking fields to rmr_meetings
ALTER TABLE public.rmr_meetings
ADD COLUMN slides_generated_at timestamptz,
ADD COLUMN slides_version integer DEFAULT 0;