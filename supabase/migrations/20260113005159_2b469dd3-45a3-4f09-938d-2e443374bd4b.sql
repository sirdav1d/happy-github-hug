-- Add sales_count and attendances columns to sales table
ALTER TABLE public.sales 
ADD COLUMN sales_count integer NOT NULL DEFAULT 1,
ADD COLUMN attendances integer NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.sales.sales_count IS 'Number of individual sales in this record (for batch entries)';
COMMENT ON COLUMN public.sales.attendances IS 'Number of customer attendances/interactions';