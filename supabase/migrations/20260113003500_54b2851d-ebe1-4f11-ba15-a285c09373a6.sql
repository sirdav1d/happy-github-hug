-- Allow consultants to insert FIVI sessions for their invited students
CREATE POLICY "Consultants can insert FIVI sessions for invited users"
ON public.fivi_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = user_id 
    AND i.created_by = auth.uid()
  )
);

-- Allow consultants to update FIVI sessions for their invited students  
CREATE POLICY "Consultants can update FIVI sessions for invited users"
ON public.fivi_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = fivi_sessions.user_id 
    AND i.created_by = auth.uid()
  )
);

-- Allow consultants to delete FIVI sessions for their invited students
CREATE POLICY "Consultants can delete FIVI sessions for invited users"
ON public.fivi_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM invites i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = fivi_sessions.user_id 
    AND i.created_by = auth.uid()
  )
);