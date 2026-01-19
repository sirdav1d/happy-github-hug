-- Remove the problematic recursive policy
DROP POLICY IF EXISTS "Consultants can search profiles by email" ON public.profiles;

-- Create a security definer function to check if user is consultant
-- This avoids the infinite recursion by running with elevated privileges
CREATE OR REPLACE FUNCTION public.is_consultant(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role = 'consultant'
  )
$$;

-- Create safe policy for consultants to search profiles
CREATE POLICY "Consultants can search profiles by email"
ON public.profiles
FOR SELECT
USING (
  public.is_consultant(auth.uid())
);