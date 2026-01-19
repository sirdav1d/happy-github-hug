-- Create annual_goals table to store annual goals by year
CREATE TABLE public.annual_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  annual_goal DECIMAL(15,2) NOT NULL DEFAULT 0,
  monthly_distribution JSONB DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Enable RLS
ALTER TABLE public.annual_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own annual goals" 
ON public.annual_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own annual goals" 
ON public.annual_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annual goals" 
ON public.annual_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annual goals" 
ON public.annual_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_annual_goals_updated_at
BEFORE UPDATE ON public.annual_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.annual_goals IS 'Stores annual sales goals by year for each user, used to calculate monthly targets in the dashboard';