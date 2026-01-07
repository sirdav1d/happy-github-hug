-- Add entry_type column to track how each sale was entered
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS entry_type text DEFAULT 'individual';

-- Add comment for documentation
COMMENT ON COLUMN public.sales.entry_type IS 'Type of entry: individual, batch_weekly, batch_monthly, import';