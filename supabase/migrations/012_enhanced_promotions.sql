-- Enhance promotions system with product-specific discounts and free shipping

-- 1. Add new discount types and free shipping support
ALTER TABLE public.promotions 
  ADD COLUMN IF NOT EXISTS applies_to TEXT CHECK (applies_to IN ('all_products', 'specific_products', 'categories')) DEFAULT 'all_products',
  ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS buy_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS get_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER,
  ADD COLUMN IF NOT EXISTS total_uses INTEGER DEFAULT 0;

-- Update discount_type check constraint to include new types
ALTER TABLE public.promotions 
  DROP CONSTRAINT IF EXISTS promotions_discount_type_check;

ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_discount_type_check 
  CHECK (discount_type IN ('percentage', 'fixed', 'buy_x_get_y', 'buy_more_save_more', 'free_shipping'));

-- 2. Create buy more save more tiers table
CREATE TABLE IF NOT EXISTS public.promotion_tiers (
  id SERIAL PRIMARY KEY,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,
  discount_percentage NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create promotion usage tracking
CREATE TABLE IF NOT EXISTS public.promotion_usage (
  id SERIAL PRIMARY KEY,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promotion_id, order_id)
);

-- Enable RLS
ALTER TABLE public.promotion_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;

-- Promotion tiers policies
CREATE POLICY "Public view promotion tiers" ON public.promotion_tiers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.promotions
      WHERE promotions.id = promotion_tiers.promotion_id
      AND promotions.is_active = true
    )
  );

CREATE POLICY "Admins manage promotion tiers" ON public.promotion_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- Promotion usage policies
CREATE POLICY "Users view own promotion usage" ON public.promotion_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all promotion usage" ON public.promotion_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

CREATE POLICY "System create promotion usage" ON public.promotion_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to validate promotion code
CREATE OR REPLACE FUNCTION validate_promotion_code(
  p_code TEXT,
  p_user_id UUID,
  p_product_ids UUID[],
  p_subtotal NUMERIC
) RETURNS TABLE (
  is_valid BOOLEAN,
  discount_amount NUMERIC,
  free_shipping BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_promotion public.promotions;
  v_usage_count INTEGER;
  v_discount NUMERIC := 0;
BEGIN
  -- Get promotion
  SELECT * INTO v_promotion
  FROM public.promotions
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW());

  -- Check if promotion exists
  IF v_promotion.id IS NULL THEN
    RETURN QUERY SELECT false, 0::NUMERIC, false, 'Invalid or expired promotion code';
    RETURN;
  END IF;

  -- Check minimum purchase
  IF v_promotion.min_purchase_amount IS NOT NULL AND p_subtotal < v_promotion.min_purchase_amount THEN
    RETURN QUERY SELECT false, 0::NUMERIC, false, 'Minimum purchase amount not met';
    RETURN;
  END IF;

  -- Check usage limit per user
  IF v_promotion.max_uses_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.promotion_usage
    WHERE promotion_id = v_promotion.id
      AND user_id = p_user_id;
    
    IF v_usage_count >= v_promotion.max_uses_per_user THEN
      RETURN QUERY SELECT false, 0::NUMERIC, false, 'Promotion usage limit reached';
      RETURN;
    END IF;
  END IF;

  -- Check product applicability
  IF v_promotion.applies_to = 'specific_products' THEN
    IF NOT (p_product_ids && v_promotion.product_ids) THEN
      RETURN QUERY SELECT false, 0::NUMERIC, false, 'Promotion not applicable to selected products';
      RETURN;
    END IF;
  END IF;

  -- Calculate discount
  IF v_promotion.discount_type = 'percentage' THEN
    v_discount := p_subtotal * (v_promotion.discount_value / 100);
  ELSIF v_promotion.discount_type = 'fixed' THEN
    v_discount := v_promotion.discount_value;
  END IF;

  -- Return result
  RETURN QUERY SELECT 
    true, 
    v_discount, 
    v_promotion.free_shipping,
    'Promotion applied successfully';
END;
$$ LANGUAGE plpgsql;
