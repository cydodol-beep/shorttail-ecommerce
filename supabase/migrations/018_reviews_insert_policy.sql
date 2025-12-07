-- Allow users to insert reviews for products
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own reviews (even if not approved)
CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins manage reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('master_admin', 'normal_admin')
    )
  );
