-- Create storage bucket for FIVI audio recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('fivi-recordings', 'fivi-recordings', false, 52428800);

-- RLS policies for the bucket
CREATE POLICY "Users can upload their own FIVI recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fivi-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own FIVI recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fivi-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own FIVI recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fivi-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add audio_file_path column to fivi_sessions
ALTER TABLE public.fivi_sessions
ADD COLUMN audio_file_path TEXT;