-- Add gamma_api_key to profiles for user-specific Gamma integration
ALTER TABLE public.profiles
ADD COLUMN gamma_api_key text;

-- Add gamma-related fields to rmr_meetings for storing generation results
ALTER TABLE public.rmr_meetings
ADD COLUMN gamma_generation_id text,
ADD COLUMN gamma_url text,
ADD COLUMN gamma_pptx_url text;