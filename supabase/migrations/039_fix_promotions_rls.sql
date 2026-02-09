-- Fix promotions RLS policies to allow admins to view all promotions
-- Also add missing created_at and updated_at columns

-- Add timestamp columns if they don't exist
ALTER TABLE public.promotions 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop existing policies
DROP POLICY IF EXISTS "Public view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins manage promotions" ON public.promotions;

-- Create new policies with proper separation
-- 1. Public can view active promotions
CREATE POLICY "Public view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true);

-- 2. Admins can view ALL promotions (both active and inactive)
CREATE POLICY "Admins view all promotions" ON public.promotions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- 3. Admins can insert promotions
CREATE POLICY "Admins insert promotions" ON public.promotions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- 4. Admins can update promotions
CREATE POLICY "Admins update promotions" ON public.promotions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- 5. Admins can delete promotions
CREATE POLICY "Admins delete promotions" ON public.promotions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_promotions_updated_at ON public.promotions;
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
