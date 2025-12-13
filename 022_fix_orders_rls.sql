/*
 * Migration: Fix RLS policies for orders and profiles
 * Description: Ensures kasir users can view all orders and related profile information
 */

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Update helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('master_admin', 'normal_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_kasir()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'kasir'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff update orders" ON public.orders;
DROP POLICY IF EXISTS "Kasir create orders" ON public.orders;

-- Create policies for profiles table using simple function-based approach to avoid recursion
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Create a comprehensive function that checks staff status without recursion
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('master_admin', 'normal_admin', 'kasir')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use the function to avoid recursion in the policy
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (is_staff());

-- Create policies for orders table
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff view all orders" ON public.orders
  FOR SELECT USING (is_staff());

-- Additional policy to allow staff to update orders if needed
CREATE POLICY "Staff update orders" ON public.orders
  FOR UPDATE USING (is_staff());

-- Ensure proper access for kasir to create POS orders
CREATE POLICY "Kasir create orders" ON public.orders
  FOR INSERT WITH CHECK (is_kasir());

-- Ensure proper access for order_items (if needed)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy for order items that follows the orders
DROP POLICY IF EXISTS "Staff view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;

CREATE POLICY "Staff view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (is_staff())
    )
  );

CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND auth.uid() = orders.user_id
    )
  );