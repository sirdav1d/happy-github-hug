-- Create table to track test users created by consultants
CREATE TABLE public.test_users_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  test_user_id UUID NOT NULL,
  test_user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_users_log ENABLE ROW LEVEL SECURITY;

-- Consultants can view their own test users
CREATE POLICY "Consultants can view their own test users"
ON public.test_users_log
FOR SELECT
USING (auth.uid() = created_by);

-- Consultants can insert their own test users
CREATE POLICY "Consultants can insert their own test users"
ON public.test_users_log
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Consultants can delete their own test users log
CREATE POLICY "Consultants can delete their own test users log"
ON public.test_users_log
FOR DELETE
USING (auth.uid() = created_by);

-- Add index for faster lookups
CREATE INDEX idx_test_users_log_created_by ON public.test_users_log(created_by);