-- Landing Page Section Settings
-- Allows admin to show/hide and customize landing page sections

CREATE TABLE IF NOT EXISTS landing_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  section_name TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default sections
INSERT INTO landing_page_sections (section_key, section_name, is_visible, sort_order, settings) VALUES
  ('hero', 'Hero Section', true, 1, '{"title": "Everything Your Pet Needs & Loves", "subtitle": "", "showTrustBadges": true, "trustBadges": [{"text": "Fast Delivery", "icon": "truck"}, {"text": "Secure Payment", "icon": "shield"}, {"text": "24/7 Support", "icon": "clock"}]}'),
  ('promo_banner', 'Promo Banner', true, 2, '{"autoRotate": true, "rotateInterval": 5000}'),
  ('benefits', 'Benefits Section', true, 3, '{"benefits": [{"icon": "truck", "title": "Fast Delivery", "description": "2-3 days delivery", "color": "bg-green-100 text-green-600"}, {"icon": "shield", "title": "Secure Payment", "description": "Protected transactions", "color": "bg-blue-100 text-blue-600"}, {"icon": "card", "title": "Multiple Payment", "description": "Various methods", "color": "bg-purple-100 text-purple-600"}, {"icon": "headphones", "title": "24/7 Support", "description": "Ready to help anytime", "color": "bg-orange-100 text-orange-600"}, {"icon": "rotate", "title": "Easy Returns", "description": "7-day return policy", "color": "bg-red-100 text-red-600"}, {"icon": "award", "title": "Quality Guarantee", "description": "100% authentic products", "color": "bg-yellow-100 text-yellow-600"}]}'),
  ('categories', 'Categories Section', true, 4, '{"title": "Shop by Category", "subtitle": "Find what you need easily"}'),
  ('flash_sale', 'Flash Sale', true, 5, '{"title": "Flash Sale", "showCountdown": true}'),
  ('featured_products', 'Best Sellers', true, 6, '{"title": "Best Sellers", "subtitle": "Our most popular items", "limit": 8}'),
  ('new_arrivals', 'New Arrivals', true, 7, '{"title": "New Arrivals", "subtitle": "Fresh products just for you", "limit": 8}'),
  ('testimonials', 'Testimonials', true, 8, '{"title": "What Our Customers Say", "subtitle": "Real reviews from real pet owners"}'),
  ('newsletter', 'Newsletter', true, 9, '{"title": "Subscribe to Our Newsletter", "subtitle": "Get the latest updates on new products, exclusive offers, and pet care tips."}'),
  ('footer', 'Footer', true, 10, '{"showSocialLinks": true, "showCategories": true, "showSupport": true, "showLegal": true}')
ON CONFLICT (section_key) DO NOTHING;

-- Enable RLS
ALTER TABLE landing_page_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view landing page sections"
  ON landing_page_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can update landing page sections"
  ON landing_page_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

CREATE POLICY "Admins can insert landing page sections"
  ON landing_page_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_landing_sections_key ON landing_page_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_landing_sections_order ON landing_page_sections(sort_order);
