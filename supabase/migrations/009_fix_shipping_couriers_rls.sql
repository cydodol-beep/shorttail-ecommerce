-- Fix shipping_couriers RLS policies to use correct enum values

-- Drop existing policies
DROP POLICY IF EXISTS "Public view active couriers" ON public.shipping_couriers;
DROP POLICY IF EXISTS "Admins manage couriers" ON public.shipping_couriers;

-- Create new policies with proper separation
-- 1. Public can view active couriers
CREATE POLICY "Public view active couriers" ON public.shipping_couriers
  FOR SELECT USING (is_active = true);

-- 2. Admins can view ALL couriers (both active and inactive)
CREATE POLICY "Admins view all couriers" ON public.shipping_couriers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- 3. Admins can insert couriers
CREATE POLICY "Admins insert couriers" ON public.shipping_couriers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- 4. Admins can update couriers
CREATE POLICY "Admins update couriers" ON public.shipping_couriers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- 5. Admins can delete couriers
CREATE POLICY "Admins delete couriers" ON public.shipping_couriers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );
