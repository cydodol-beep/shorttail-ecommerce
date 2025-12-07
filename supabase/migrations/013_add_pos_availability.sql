-- Add POS availability flag to promotions
-- This allows admins to control which promotions are available for POS transactions

ALTER TABLE public.promotions 
  ADD COLUMN IF NOT EXISTS available_for_pos BOOLEAN DEFAULT TRUE;

-- Add comment to explain the column
COMMENT ON COLUMN public.promotions.available_for_pos IS 'Controls whether this promotion can be used in POS (kasir) transactions. True = available for both marketplace and POS, False = marketplace only';
