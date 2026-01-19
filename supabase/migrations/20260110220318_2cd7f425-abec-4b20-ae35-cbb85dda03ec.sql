-- Add script version control fields to rmr_preparation_status
ALTER TABLE public.rmr_preparation_status 
ADD COLUMN IF NOT EXISTS script_month INTEGER,
ADD COLUMN IF NOT EXISTS script_year INTEGER,
ADD COLUMN IF NOT EXISTS script_generated_at TIMESTAMP WITH TIME ZONE;