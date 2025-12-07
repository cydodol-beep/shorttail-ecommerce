# ShortTail.id Technical Specification

> **Last Updated**: November 2025
> 
> This document outlines the technical architecture, database schema, and development roadmap for ShortTail.id - a premium pet shop e-commerce platform.

---

## Implementation Status

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation & Authentication | ✅ Complete |
| 1 | RBAC (Role-Based Access Control) | ✅ Complete |
| 1 | Route Protection Middleware | ✅ Complete |
| 2 | Product Management (CRUD) | ✅ Complete |
| 2 | Product Variants | ✅ Complete |
| 2 | Category Management | ✅ Complete |
| 2 | Excel Import/Export | ✅ Complete |
| 2 | Store Settings | ✅ Complete |
| 3 | Product Listing & Filtering | ✅ Complete |
| 3 | Shopping Cart (Zustand) | ✅ Complete |
| 3 | Featured Products | ✅ Complete |
| 3 | Category Section | ✅ Complete |
| 4 | Kasir/POS Interface | ✅ Complete |
| 4 | Checkout Flow | ✅ Complete |
| 5 | Pet Profiles | ✅ Complete |
| 5 | User Dashboard | ✅ Complete |
| 6 | Real-time Notifications | ✅ Complete |
| - | Performance Optimization | ✅ Complete |
| - | Referral System | 🔄 Partial |
| - | Reviews & Moderation | 🔄 Partial |
| - | Payment Gateway Integration | ⏳ Pending |
| - | Invoice/Packing List PDF | ⏳ Pending |
| - | Internationalization (i18n) | ⏳ Pending |

---

## Performance Optimizations

### Problem Solved
The application experienced performance degradation (lag) when left open in the browser for extended periods. The root causes were:

1. **Multiple Supabase client instances** - Each `createClient()` call created a new instance
2. **No data caching** - Every component mount triggered fresh API calls
3. **Event listener accumulation** - Window event listeners were being registered without proper cleanup patterns

### Solution: Singleton + Cached Stores

#### 1. Singleton Supabase Client (`src/lib/supabase/client.ts`)
```typescript
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}
```

#### 2. Zustand Stores with Caching

Three new stores were created to cache frequently-accessed data:

| Store File | Data Cached | Cache TTL |
|------------|-------------|-----------|
| `categories-store.ts` | Product categories | 5 min |
| `store-settings-store.ts` | Store configuration | 5 min |
| `social-media-store.ts` | Social media links | 5 min |

**Store Pattern:**
```typescript
interface CategoriesStore {
  categories: Category[];
  loading: boolean;
  lastFetched: number | null;  // Timestamp for cache validation
  fetchCategories: () => Promise<void>;
  invalidate: () => void;      // Force refresh on next fetch
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  // ...state
  fetchCategories: async () => {
    const state = get();
    
    // Skip if already loading (request deduplication)
    if (state.loading) return;
    
    // Use cache if valid
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }
    
    // Fetch fresh data...
  },
}));
```

#### 3. Hooks as Store Wrappers

Hooks now delegate to stores instead of managing local state:

```typescript
// Before (caused memory leaks):
export function useCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    fetchCategories(); // Fetched on every mount
    window.addEventListener(...); // Accumulated listeners
  }, []);
}

// After (optimized):
export function useCategories() {
  const { categories, fetchCategories } = useCategoriesStore();
  useEffect(() => {
    fetchCategories(); // Uses cache, deduplicates requests
  }, [fetchCategories]);
  return { categories, ... };
}
```

### Benefits
- **Single API call** per data type instead of multiple per page
- **Data persists** across page navigations
- **No memory leaks** from accumulated event listeners
- **Consistent state** across all components

---

## Overview

This is a sophisticated and highly scalable e-commerce project. You have chosen a robust modern stack (Next.js + Supabase) which is perfect for this level of complexity (RBAC, POS, Gamification).
I have refined your requirements into a structured Development Roadmap and improved your Data Schema to ensure it works smoothly with Supabase's relational logic.

1. Refined Database Schema (Supabase)
Your initial schema was good, but it needs normalization to be scalable. Key Change: In Supabase, the auth.users table handles login credentials. We will create a public.profiles table to store your custom data (Phone, Points, Tier) and link them using the user_id (UUID).
A. Users & Roles (RBAC)
Table: profiles
id (UUID, PK, references auth.users.id)
phone_number (Text, Unique - Main Login Identifier)
role (Enum: 'master_admin', 'admin', 'kasir', 'user')
membership_tier (Enum: 'Newborn', 'Transitional', 'Juvenile', 'Adolescence', 'Adulthood') - Default: 'Newborn'
current_points (Integer)
referral_code (String, Unique)
referred_by (UUID, optional)
avatar_url (String)
Table: user_addresses (Separate this from users to allow multiple addresses)
id, user_id, recipient_name, address_line1, city, province, postal_code, is_default (Boolean).
B. Products & Variants
Table: products
Standard fields (name, description, category, unit_price, etc.)
is_active (Boolean - to hide/show products).
Table: product_variants
product_id (FK), variant_name, sku, price_adjustment, stock.
C. Transactions & POS
Table: orders
id, user_id, total_amount, shipping_fee, discount_applied, payment_status, order_status (Pending, Packed, Shipped, Delivered), type (Enum: 'marketplace', 'pos'), created_at.
invoice_url (JPEG path), packing_list_url (PDF path).
is_packing_list_downloaded (Boolean).
Table: order_items
order_id, product_id, variant_id, quantity, price_at_purchase.

2. Development Project Plan
We will break this down into 6 Sprints (Phases).
Phase 1: Foundation & Authentication (The Core)
Goal: Secure login and Role-Based Access Control (RBAC).
Tasks:
Next.js Setup: Initialize project with TypeScript, Tailwind, Shadcn/UI, and next-intl (for English/Indonesian support).
Supabase Auth: Configure Phone Number Auth.
Note: Supabase defaults to Email. To make Phone the primary key, we will treat the phone number as the "email" identifier internally or use a custom Auth hook.
Middleware: Create Next.js middleware to protect routes:
/admin → MasterAdmin / NormalAdmin only.
/kasir → Kasir only.
/dashboard → NormalUser only.
Database: Set up tables with Row Level Security (RLS) policies.
Phase 2: Product Management & Admin Panel
Goal: Allow Admins to populate the store and manage logic.
Tasks:
Product CRUD: Create forms for adding Products and Variants (One-to-many forms).
Marketing Engine: Build logic for "Buy More Save More" and simple Discount codes (stored in a promotions table).
Shipping Logic: Create a couriers table. Implement a function to calculate fees based on Province/City (RajaOngkir API is popular for Indonesia, or custom logic).
Import/Export: Implement xlsx library to handle Excel bulk uploads/downloads.
Phase 3: The Marketplace (User Experience)
Goal: Replicate the shorttail feel with your "Brownish" branding.
Tasks:
UI Implementation:
Use reactbits for fluid animations on product cards.
Implement the "Brownish" theme (Codes below).
Product Listing: Filter by Category, Price, and Search.
Shopping Cart: Global state (Zustand or React Context) to persist cart items.
Gamification:
Points System: Trigger: on_order_complete → Add points to user → Check if points cross threshold → Update membership_tier.
Phase 4: Transaction System & POS (Kasir)
Goal: Checkout flow and Cashier special tools.
Tasks:
User Checkout: Address selection, Courier selection, Payment Gateway integration (e.g., Midtrans or Xendit for Indonesia).
Kasir Dashboard:
Table view of incoming orders.
PDF Generation: Use react-pdf to generate the Packing List.
JPEG Generation: Use html2canvas to generate the Invoice.
POS Interface: A clean grid of products for the Kasir to tap and create offline orders.
Phase 5: User Profile & Engagement
Goal: Retention and Community.
Tasks:
Pet Profile: CRUD for user pets.
Referral System: Generate unique link shorttail.id/ref/USER123. logic: When a new user signs up via this link, credit points to the referrer.
Reviews: Allow users to post reviews (Admin must approve/moderate them before they appear).
Phase 6: Notifications & Launch
Goal: Real-time updates and Polish.
Tasks:
Notification System: Create a notifications table. Use Supabase Realtime (Websockets) to trigger the "Bell" icon update instantly without refreshing the page.
Testing: Unit tests for points calculation and tier upgrades.

3. Design System & The "shorttail" Look
To achieve the look of the reference site but with your "Brownish" branding, we need to configure tailwind.config.ts.
Theme Strategy:
Reference Vibe: Clean, grid-based, rounded corners, playful but professional.
Your Brand: Earthy, warm, premium.
Step 1: Update tailwind.config.ts Add these custom colors to your configuration.
// tailwind.config.ts
export default {
  // ...
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#a0938e', // Main brownish base
          600: '#8a7e7a',
          700: '#746966',
          800: '#5e5452', // Dark text/accents
          900: '#48403e',
        },
        primary: {
          DEFAULT: '#a0938e', // Your brand color
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#fdf8f6', // Light background for cards
          foreground: '#5e5452',
        }
      },
      borderRadius: {
        'xl': '1rem', // shorttail uses soft rounded corners
        '2xl': '1.5rem',
      }
    }
  }
}

Step 2: Recommended UI Libraries (Based on your stack)
Components: Use shadcn/ui for the building blocks (Buttons, Inputs, Dialogs).
Animations: Use framer-motion (standard in ReactBits) for the "Level Up" animations and "Add to Cart" bounces.
Icons: lucide-react is perfect. For the specific "Pet" feel, ensure you use icons like PawPrint, Bone, User, ShoppingBag.

4. Technical Implementation Logic: Notification Bell
Since you want a "One Stop Notification" system, here is the logic:
Database Table: notifications
id, user_id (Target user, or NULL for Global Admin), type (order, level_up, suggestion), message, is_read, created_at.
Supabase Realtime Hook (React):
// A simplified hook to listen for notifications
useEffect(() => {
  const channel = supabase
    .channel('realtime:public:notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        // Logic:
        // 1. If payload.new.user_id === currentUser.id -> Show User Notification
        // 2. If payload.new.user_id === NULL && currentUser.role === 'admin' -> Show Admin Notification
        toast(payload.new.message);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);

Here is the complete, optimized SQL script for your ShortTail.id Supabase project.
-- ==============================================================================
-- 1. ENUMS & TYPES
-- Define fixed values to ensure data consistency across the platform.
-- ==============================================================================

-- Role types for RBAC
CREATE TYPE app_role AS ENUM ('master_admin', 'normal_admin', 'kasir', 'normal_user');

-- Membership tiers for gamification
CREATE TYPE membership_tier AS ENUM ('Newborn', 'Transitional', 'Juvenile', 'Adolescence', 'Adulthood');

-- Order statuses
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'returned');

-- Order types (Marketplace vs POS)
CREATE TYPE order_source AS ENUM ('marketplace', 'pos');

-- ==============================================================================
-- 2. USERS & PROFILES
-- Extends the default Supabase auth.users table.
-- ==============================================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_phoneno TEXT UNIQUE NOT NULL, -- Acts as your specific functional key
  user_name TEXT,
  user_email TEXT,
  user_avatar_url TEXT,
  
  -- Role & Membership
  role app_role DEFAULT 'normal_user',
  tier membership_tier DEFAULT 'Newborn',
  points_balance INTEGER DEFAULT 0,
  
  -- Referral System
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  
  -- Address Information (Primary)
  address_line1 TEXT,
  city TEXT,
  region_state_province TEXT,
  postal_code TEXT,
  country_id INTEGER DEFAULT 62, -- Default to Indonesia ID if using standard ISO
  
  -- Recipient Info (Default for shipping)
  recipient_name TEXT,
  recipient_address_line1 TEXT,
  recipient_city TEXT,
  recipient_region TEXT,
  recipient_postal_code TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle new user signup automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_email, user_phoneno, user_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'phone', -- Assumes phone is passed in metadata
    new.raw_user_meta_data->>'full_name',
    'normal_user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 3. PETS MANAGEMENT
-- ==============================================================================

CREATE TABLE public.pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pet_type TEXT NOT NULL, -- e.g., 'Dog', 'Cat'
  pet_name TEXT NOT NULL,
  pet_birthday DATE,
  pet_gender TEXT, -- 'Male', 'Female'
  pet_weight_kg DECIMAL(5,2),
  pet_chip_id TEXT,
  pet_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. PRODUCTS & INVENTORY
-- ==============================================================================

CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category TEXT,
  base_price NUMERIC(12, 2) NOT NULL, -- Supports Rupiah large numbers
  stock_quantity INTEGER DEFAULT 0,
  condition TEXT CHECK (condition IN ('new', 'secondhand')),
  has_variants BOOLEAN DEFAULT FALSE,
  
  -- Images
  main_image_url TEXT,
  gallery_image_urls TEXT[], -- Array of strings
  
  unit_weight_grams INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE, -- Soft delete/hide
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_name TEXT NOT NULL, -- e.g., "50ml"
  sku TEXT,
  variant_image_url TEXT,
  unit_label TEXT, -- e.g., "Size", "Flavor"
  weight_grams INTEGER,
  price_adjustment NUMERIC(12, 2) DEFAULT 0, -- Add/Subtract from base price
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. MARKETING & SHIPPING
-- ==============================================================================

CREATE TABLE public.shipping_couriers (
  id SERIAL PRIMARY KEY,
  courier_name TEXT NOT NULL,
  courier_logo_url TEXT,
  base_cost NUMERIC(12, 2),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'buy_x_get_y')),
  discount_value NUMERIC(12, 2),
  min_purchase_amount NUMERIC(12, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- ==============================================================================
-- 6. ORDERS & TRANSACTIONS
-- Handles Marketplace and POS
-- ==============================================================================

CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Who bought it?
  user_id UUID REFERENCES public.profiles(id), 
  -- Who processed it? (For POS/Kasir)
  cashier_id UUID REFERENCES public.profiles(id), 
  
  source order_source DEFAULT 'marketplace',
  status order_status DEFAULT 'pending',
  
  -- Financials
  subtotal NUMERIC(12, 2) NOT NULL,
  shipping_fee NUMERIC(12, 2) DEFAULT 0,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  
  -- Shipping Info Snapshot (Store address at time of purchase)
  shipping_courier_name TEXT,
  shipping_address_snapshot JSONB, 
  
  -- Documents
  invoice_url TEXT, -- JPEG
  packing_list_url TEXT, -- PDF
  is_packing_list_downloaded BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id), -- Nullable if no variant
  quantity INTEGER NOT NULL,
  price_at_purchase NUMERIC(12, 2) NOT NULL
);

-- ==============================================================================
-- 7. NOTIFICATIONS & REVIEWS
-- ==============================================================================

CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id), -- If NULL, it's a system-wide admin alert
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_link TEXT, -- Where clicking takes the user
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE, -- Admin moderation required
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Secure the data based on roles
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check role (Simplifies policies)
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

-- --- PROFILES POLICIES ---
-- Users can see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins and Kasir can view all profiles (to manage or checkout)
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin() OR is_kasir());
  
-- Admins can update any profile (reset password/roles)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (is_admin());

-- --- PRODUCTS POLICIES ---
-- Everyone can view products (Public Storefront)
CREATE POLICY "Public view products" ON public.products
  FOR SELECT USING (true);

-- Only Admins can insert/update/delete products
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (is_admin());

-- --- ORDERS POLICIES ---
-- Users see their own orders
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Admins and Kasir see all orders
CREATE POLICY "Staff view all orders" ON public.orders
  FOR SELECT USING (is_admin() OR is_kasir());

-- Kasir can create orders (POS)
CREATE POLICY "Kasir create orders" ON public.orders
  FOR INSERT WITH CHECK (is_kasir());

-- Users can create orders (Checkout)
CREATE POLICY "Users create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- --- NOTIFICATIONS POLICIES ---
-- Users see their own notifications
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Admins see admin notifications (where user_id is NULL)
CREATE POLICY "Admins view system notifications" ON public.notifications
  FOR SELECT USING (user_id IS NULL AND is_admin());

