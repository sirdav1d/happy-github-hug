-- Allow consultants to search profiles by email (for linking existing students)
CREATE POLICY "Consultants can search profiles by email"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'consultant'
  )
);