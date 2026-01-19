-- Add Attribute Index columns to behavioral_profiles table
-- These store the 6 dimensions of the Innermetrix Attribute Index (scale 0-10)

ALTER TABLE public.behavioral_profiles 
ADD COLUMN IF NOT EXISTS attr_empathy numeric(4,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attr_practical_thinking numeric(4,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attr_systems_judgment numeric(4,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attr_self_esteem numeric(4,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attr_role_awareness numeric(4,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attr_self_direction numeric(4,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.behavioral_profiles.attr_empathy IS 'Attribute Index: Empathy score (0-10 scale)';
COMMENT ON COLUMN public.behavioral_profiles.attr_practical_thinking IS 'Attribute Index: Practical Thinking score (0-10 scale)';
COMMENT ON COLUMN public.behavioral_profiles.attr_systems_judgment IS 'Attribute Index: Systems Judgment score (0-10 scale)';
COMMENT ON COLUMN public.behavioral_profiles.attr_self_esteem IS 'Attribute Index: Self-Esteem score (0-10 scale)';
COMMENT ON COLUMN public.behavioral_profiles.attr_role_awareness IS 'Attribute Index: Role Awareness score (0-10 scale)';
COMMENT ON COLUMN public.behavioral_profiles.attr_self_direction IS 'Attribute Index: Self-Direction score (0-10 scale)';