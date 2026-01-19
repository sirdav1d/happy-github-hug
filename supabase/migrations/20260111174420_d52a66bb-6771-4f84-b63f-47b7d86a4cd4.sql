-- Add RLS policies for consultants to manage video_library

-- Policy for consultants to insert videos
CREATE POLICY "Consultants can insert videos" 
ON public.video_library 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'consultant'
  )
);

-- Policy for consultants to update videos
CREATE POLICY "Consultants can update videos" 
ON public.video_library 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'consultant'
  )
);

-- Policy for consultants to delete videos
CREATE POLICY "Consultants can delete videos" 
ON public.video_library 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'consultant'
  )
);