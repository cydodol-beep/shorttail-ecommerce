-- ==============================================================================
-- Fix Categories RLS Policy
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- Drop the restrictive public policy
DROP POLICY IF EXISTS "Public view active categories" ON public.categories;

-- Create a new policy that allows:
-- 1. Public users to view active categories
-- 2. Admins to view ALL categories (including inactive)
CREATE POLICY "View categories" ON public.categories
  FOR SELECT USING (is_active = true OR is_admin());
