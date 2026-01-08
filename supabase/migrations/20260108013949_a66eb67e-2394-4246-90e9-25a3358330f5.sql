-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Policy: Anyone can view logos (public bucket)
CREATE POLICY "Public can view logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Policy: Authenticated users can upload their own logos
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add logo_url column to whitelabel_settings
ALTER TABLE public.whitelabel_settings
ADD COLUMN logo_url TEXT;