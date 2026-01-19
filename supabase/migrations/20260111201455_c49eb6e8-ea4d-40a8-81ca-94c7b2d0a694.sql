-- Drop the restrictive policy that's blocking student access
DROP POLICY IF EXISTS "Users can view their own phase" ON public.mentorship_phases;

-- Recreate as PERMISSIVE (default) so users can read their own phase
CREATE POLICY "Users can view their own phase"
ON public.mentorship_phases
FOR SELECT
USING ((auth.uid() = user_id) OR (auth.uid() = consultant_id));

-- Also fix the INSERT policy if it's restrictive
DROP POLICY IF EXISTS "Users can create their own phase" ON public.mentorship_phases;

CREATE POLICY "Users can create their own phase"
ON public.mentorship_phases
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (auth.uid() = consultant_id));

-- Also fix the UPDATE policy
DROP POLICY IF EXISTS "Consultants can update phases of their students" ON public.mentorship_phases;

CREATE POLICY "Consultants can update phases of their students"
ON public.mentorship_phases
FOR UPDATE
USING ((auth.uid() = consultant_id) OR (auth.uid() = user_id));