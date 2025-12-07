-- ==============================================================================
-- Categories Table
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- Categories Table
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to products table (category_id references categories)
ALTER TABLE public.products 
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (is_admin());

-- Updated_at trigger
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON public.categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, slug, description, sort_order, is_active) VALUES
  ('Dog Food', 'dog-food', 'Food and treats for dogs', 1, true),
  ('Cat Food', 'cat-food', 'Food and treats for cats', 2, true),
  ('Toys', 'toys', 'Toys and entertainment for pets', 3, true),
  ('Accessories', 'accessories', 'Collars, leashes, and more', 4, true),
  ('Grooming', 'grooming', 'Grooming supplies and tools', 5, true),
  ('Health & Wellness', 'health', 'Vitamins, supplements, and health products', 6, true);

-- Migrate existing products: Update category_id based on category text field
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category = c.slug;

-- Optional: After migration is complete and verified, you can drop the old category column
-- ALTER TABLE public.products DROP COLUMN category;
