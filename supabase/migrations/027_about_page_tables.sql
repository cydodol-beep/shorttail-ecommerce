/**
 * About Page Tables
 * Creates all necessary tables for the dynamic About Us page
 */

-- About Page Sections Table
CREATE TABLE public.about_page_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE, -- Unique identifier for the section (e.g. 'hero', 'mission', 'values', etc.)
  title TEXT,
  subtitle TEXT,
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}', -- Additional settings for the section
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Values/Principles Table
CREATE TABLE public.about_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon identifier (e.g. 'heart', 'shield', 'leaf', etc.)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE public.about_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  social_links JSONB DEFAULT '{}', -- Links to social media profiles
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones/Achievements Table
CREATE TABLE public.about_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon identifier for the milestone
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Testimonials Table
CREATE TABLE public.about_testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_role TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  customer_image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
-- Enable RLS
ALTER TABLE public.about_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_testimonials ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Anyone can view about page sections" ON public.about_page_sections FOR SELECT USING (true);
CREATE POLICY "Anyone can view company values" ON public.about_values FOR SELECT USING (true);
CREATE POLICY "Anyone can view team members" ON public.about_team_members FOR SELECT USING (true);
CREATE POLICY "Anyone can view milestones" ON public.about_milestones FOR SELECT USING (true);
CREATE POLICY "Anyone can view testimonials" ON public.about_testimonials FOR SELECT USING (true);

-- Only authenticated users can manage (admin functions)
CREATE POLICY "Admin can manage about page sections" ON public.about_page_sections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master_admin', 'normal_admin')
  )
);

CREATE POLICY "Admin can manage company values" ON public.about_values FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master_admin', 'normal_admin')
  )
);

CREATE POLICY "Admin can manage team members" ON public.about_team_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master_admin', 'normal_admin')
  )
);

CREATE POLICY "Admin can manage milestones" ON public.about_milestones FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master_admin', 'normal_admin')
  )
);

CREATE POLICY "Admin can manage testimonials" ON public.about_testimonials FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master_admin', 'normal_admin')
  )
);

-- Insert default sections for the about page
INSERT INTO public.about_page_sections (section_key, title, subtitle, content, is_active, sort_order) VALUES
  ('hero', 'About ShortTail.id', 'Premium Pet Care Solutions', 'Founded in 2020 with a passion for pet wellness. We''re dedicated to connecting pet parents with the highest quality products and expert knowledge.', true, 1),
  ('mission', 'Our Mission', '', 'To enhance the lives of pets and their families through premium products, expert advice, and compassionate service.', true, 2),
  ('values', 'Our Core Values', '', 'Discover the principles that guide everything we do.', true, 3),
  ('team', 'Meet Our Team', '', 'The passionate individuals dedicated to pet wellness.', true, 4),
  ('milestones', 'Our Journey', '', 'Key moments that shaped our company.', true, 5),
  ('testimonials', 'What Our Pet Parents Say', '', 'Hear from those who trust us with their companions.', true, 6);

-- Insert default company values
INSERT INTO public.about_values (title, description, icon, sort_order, is_active) VALUES
  ('Quality First', 'We source only the highest quality products from trusted manufacturers', 'Shield', 1, true),
  ('Pet-Centric Approach', 'Every decision we make puts the wellbeing of pets first', 'Heart', 2, true),
  ('Expert Knowledge', 'Our team consists of passionate pet experts ready to help', 'Star', 3, true),
  ('Community Focused', 'Building connections between pet parents and creating supportive communities', 'Users', 4, true);

-- Insert sample team members
INSERT INTO public.about_team_members (name, role, bio, sort_order, is_active) VALUES
  ('Siti Rahayu', 'Founder & CEO', 'Veterinary professional with 10+ years in pet care industry. Passionate about bringing premium products to Indonesian pet parents.', 1, true),
  ('Ahmad Prasetyo', 'Head of Operations', 'Supply chain expert focused on quality assurance and sustainable sourcing practices.', 2, true),
  ('Dewi Kartika', 'Pet Nutrition Specialist', 'Animal nutritionist dedicated to helping pet parents make informed dietary choices.', 3, true);

-- Insert sample milestones
INSERT INTO public.about_milestones (year, title, description, icon) VALUES
  (2020, 'Company Founded', 'ShortTail.id launched with a vision to bring premium pet care to Indonesia', 'Award'),
  (2021, 'First Store Opening', 'Opened our flagship physical store in Jakarta', 'Building2'),
  (2022, '10,000 Happy Pets', 'Reached 10,000 pets served with premium care products', 'PawPrint'),
  (2023, 'Mobile App Launched', 'Launched our mobile app for convenient pet care access', 'Smartphone'),
  (2024, '100,000 Customers', 'Served 100,000+ pet parents across Indonesia', 'Users'),
  (2025, 'Sustainability Initiative', 'Launched eco-friendly packaging for all products', 'Leaf');

-- Insert sample testimonials
INSERT INTO public.about_testimonials (customer_name, customer_role, testimonial_text, rating, is_verified) VALUES
  ('Budi Santoso', 'Dog Parent', 'ShortTail.id has transformed how I care for my Golden Retriever. The premium food has made his coat shinier and his energy levels amazing!', 5, true),
  ('Ani Lestari', 'Cat Parent', 'Their cat toys are exceptional quality. My cats actually play with them instead of ignoring them like toys from other shops!', 5, true),
  ('Rizki Pratama', 'Pet Shop Owner', 'As a retailer, I''m impressed with ShortTail.id''s product quality and customer service. They''re my go-to supplier.', 5, true);