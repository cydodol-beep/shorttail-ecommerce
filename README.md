# ShortTail.id - Premium Pet Shop E-Commerce Platform

A sophisticated e-commerce platform for pet supplies built with Next.js 16 and Supabase, featuring Role-Based Access Control (RBAC), Point of Sale (POS) system, and gamification features.

## 🏗️ Architecture Overview

ShortTail.id is a comprehensive e-commerce solution built using a modern tech stack that includes:

- **Frontend**:  16 with App Router and TurbopackNext.js
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Styling**: Tailwind CSS 4 with custom "Brownish" theme
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: Zustand (with persist middleware)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React

### System Components

The platform consists of five main user interfaces:

1. **Public Storefront**: Product browsing, cart, and checkout
2. **Admin Dashboard**: Complete store management (products, orders, users, promotions, about page)
3. **Kasir/POS System**: In-store point of sale with real-time inventory
4. **User Dashboard**: Customer account management (profile, pets, orders, wishlist)
5. **About Us Page**: Company information, team, milestones, testimonials, and core values

### Key Technical Features

- **Server Components**: Efficient data fetching and rendering
- **Client Components**: Interactive UI elements and real-time features
- **API Routes**: Server-side operations to bypass RLS performance issues
- **Middleware**: Session management and route protection
- **Caching**: Smart caching strategy with 5-minute TTLs
- **Zustand Stores**: Global state management with built-in caching
- **Real-time**: Supabase Realtime for notifications

### Performance Optimizations
- **Parallel Data Fetching**: Implemented parallel queries for About Us page content (sections, values, team members, milestones, testimonials) using `Promise.allSettled()` to reduce load times
- **Caching Layer**: Added intelligent caching for About Us page data with 5-minute TTL to reduce database calls
- **Retry Logic**: Implemented automatic retry mechanism with exponential backoff for failed requests
- **Loading States**: Enhanced user experience with proper loading indicators during data fetch operations
- **Optimistic Updates**: Improved perceived performance by showing cached data immediately while fetching fresh data in background
- **Error Resilience**: Implemented graceful degradation so the page renders even when some data fetches fail
- **Memory Management**: Optimized cache invalidation to prevent memory leaks during long sessions
- **Viewport Optimization**: Used intersection observer for lazy loading and optimized rendering
- **Resource Optimization**: Added proper resource cleanup to prevent memory accumulation

## 🆕 Recent Updates (January 2, 2026)

### POS Promotion Selection System 🎫
- **Enhanced Kasir/POS Checkout with Promotion Support**:
  - **Promotion Filtering**: Only promotions with `available_for_pos = true` are displayed in POS checkout
  - **Single Promotion Policy**: Promotions do NOT stack - only one promotion can be applied per order
  - **Smart Auto-Apply**: System automatically finds and applies the best promotion (highest discount) on page load
  - **Manual Selection Override**: Users can manually select a different promotion, which locks in their choice
  - **Promo Code Input**: Staff can enter promo codes manually to apply specific promotions
  - **Skip Promotions Option**: Checkbox to skip all promotions if customer doesn't want any discount

- **Technical Implementation**:
  - **State Management**: Added `manualPromoSelection` state to track user's manual selection
  - **Auto-Apply Logic**: `useEffect` automatically applies best promotion unless user has manually selected one
  - **Selection Priority**: Manual selection takes precedence over auto-apply algorithm
  - **Reset Behavior**: Manual selection resets when cart is cleared, promo is removed, or order is completed

- **Promotion Features in POS**:
  - Displays all available promotions with discount type (percentage/fixed) and value
  - Shows eligibility status based on minimum purchase requirements
  - Visual indicators for ineligible promotions (opacity, disabled state)
  - Applied promotion shows discount amount in order summary
  - One-click promotion application with toast notifications

---

## 🆕 Recent Updates (January 1, 2026)

### Dynamic Advertisement Pop-up System 📢
- **Complete Advertisement Management System**:
  - **Database Schema**: New `advertisements` table with fields for title, image URL, redirect link, alt text, active status, display order, and date scheduling
  - **Admin Panel**: Full CRUD interface at `/admin/advertisements` for managing pop-up advertisements
  - **Image Processing**: Automatic image resizing to 400×400px and conversion to WebP format for optimal performance
  - **Carousel Support**: Multiple advertisements display in a carousel with auto-slide (5-second interval)
  - **Smart Scheduling**: Optional start/end dates for time-limited campaigns
  - **"Don't Show Again" Feature**: 48-hour localStorage persistence when users opt out
  - **Responsive Design**: Popup adapts to all screen sizes with smooth Framer Motion animations

- **Technical Implementation**:
  - **Migration**: `029_advertisements.sql` - Table schema with RLS policies for public read and admin management
  - **API Endpoint**: `/api/active-ads` - Fetches active advertisements filtered by date range
  - **Admin Route**: `/admin/advertisements` - Management interface with image upload, toggle active, and scheduling
  - **Component**: `AdvertisementPopup` - Client-side carousel with localStorage integration
  - **Sidebar Update**: Added "Advertisements" menu item with Megaphone icon in admin sidebar

- **Features**:
  - Toggle ads on/off with a switch
  - Set display order for carousel sequence
  - Schedule ads with start and end dates
  - Clickable images that redirect to specified links
  - Automatic popup delay (1.5 seconds after page load)
  - Navigation arrows and dot indicators for multiple ads
  - Close button with optional "Don't show for 48 hours" checkbox

### UI/UX Improvements 🎨
- **About Page Hero Section**: Fixed logo and content alignment, created responsive layouts for mobile/desktop
- **Category Section**: Complete UI redesign with gradients, animations, and professional styling
- **Flash Sale Component**: Modified to auto-hide when no active promotions available
- **Recommended Products**: New component integrated into dashboard pets page

---

## 🆕 Recent Updates (December 12, 2025)

### Profile & Province Integration Enhancement 💼
- **Fixed Profile Data Loading & Saving Issues**:
  - Resolved timeout errors when fetching user profiles (Operation timed out after 15000ms)
  - Fixed missing profile data in dashboard settings page
  - Implemented proper column mapping for address and province fields in profiles table
  - Enhanced profile fetching query to include all necessary address fields including province IDs
  - Fixed province selection saving to correctly store `province_id` and `recipient_province_id` in database
  - Integrated provinces table to enable dropdown selection of provinces/states in user settings
  - Established proper foreign key relationships between profiles table and provinces table
  - Added error handling for province-related operations to prevent system failures
  - Improved user experience by ensuring all saved address data properly displays in settings form

## 🆕 Recent Updates (December 8, 2025)

### Bug Fixes 🐛
- **Fixed Session Timeout Causing Database Operations to Hang**:
  - Users could browse for 3+ minutes and then experience hanging when saving/editing data
  - **Root Cause**: Missing Next.js middleware file and incorrect session refresh method
  - **Fixes Applied**:
    - Created `src/middleware.ts` to enable session refresh on every request
    - Changed `getSession()` to `getUser()` in middleware for proper token validation and refresh
    - Added proactive session refresh every 2 minutes in `useAuth` hook
    - Added proper handling for `TOKEN_REFRESHED`, `SIGNED_OUT`, `SIGNED_IN`, and other auth events
  - Sessions now stay alive during long browsing sessions without hanging

---

## Recent Updates (December 7, 2025)

### Bug Fixes 🐛
- **Fixed Admin Users Page Crash**:
  - Added `super_user` role to `ROLE_CONFIG` in admin users page
  - Previously caused "Cannot read properties of undefined (reading 'icon')" error
  - Super users now display correctly with purple badge and Award icon

---

## Recent Updates (December 13, 2025)

### Fixed Orders Display for Kasir Users 💼
- **All Orders Now Visible in Kasir Orders Page**:
  - Fixed Row Level Security (RLS) policies to ensure kasir users can see all orders (both POS and marketplace)
  - Created database migration `022_fix_orders_rls.sql` to properly configure RLS policies
  - Updated API route `/api/orders/kasir` to properly authenticate kasir users and bypass RLS for data fetching
  - Applied correct column names in queries (`user_email` instead of `email`) to prevent "column does not exist" errors
  - Implemented proper session handling in API routes for reliable authentication
  - Ensured RLS policies prevent recursion issues that were causing infinite loops

### Enhanced Packing List Generation 📋
- **Complete Recipient Information for All Order Sources**:
  - Fixed packing list generator to properly display recipient data from marketplace orders
  - Updated packing list to read recipient information from `shipping_address_snapshot` for marketplace orders
  - Added support for multiple data sources for courier name display
  - Implemented fallback mechanisms to retrieve recipient name, phone, email, address, and province from various fields
  - Courier name now displays with 30px font size as requested
  - Proper handling of both direct fields (for POS orders) and snapshot data (for marketplace orders)

### Database Migration & RLS Fixes 🗃️
- **Created Migration File `022_fix_orders_rls.sql`**:
  - Properly configured RLS policies for profiles and orders tables
  - Fixed recursive RLS policy issue that was causing infinite loops
  - Ensured staff users (admin, kasir) can access all necessary data
  - Corrected column name references in policies to use proper field names
- **API Route Improvements**:
  - Enhanced `/api/orders/kasir` authentication handling
  - Fixed 401 unauthorized errors in kasir API routes
  - Improved session management for server-side API requests

## Recent Updates (December 6, 2025)

### Performance Optimization 🚀
- **Fixed Critical Performance Issues**:
  - Eliminated infinite loop in landing sections hook (60% faster page loads)
  - Optimized database queries with specific column selection (70% less data transfer)
  - Added 10+ database indexes for 3-10x faster queries
  - Implemented request debouncing to reduce redundant fetches by 70%
  - Added 5-second timeout protection to prevent hanging requests
  - Improved cache validation logic (80% better cache hit rate)
- **Performance Improvements**:
  - Page load time: 3-5s → 1-2s (60% faster)
  - Database queries: 10-15 → 4-6 (60% fewer)
  - Cache hit rate: 20% → 80% (4x better)
- **See `PERFORMANCE_FIXES.md` for detailed technical breakdown**

### Landing Page Enhancements ✨
- **Editable Trust Badges in Hero Section**:
  - Admin can now edit trust badge text via Landing Page management
  - Automatic icon detection based on keywords (English & Indonesian)
  - Supports 13+ icons: Truck, Shield, Clock, Gift, Award, Heart, Star, Check, Zap, Package, Phone, Mail, Headphones
  - Add up to 6 custom trust badges
  - Auto-assigns color variations (green, blue, orange, purple, pink, yellow)
  - Intelligent keyword matching (e.g., "Fast Delivery" → Truck icon, "Secure Payment" → Shield)
- **Improved Mobile Responsiveness**:
  - Optimized hero section for all screen sizes
  - Better touch targets and spacing
  - Responsive trust badge layout

### Database Optimizations 📊
- **New Migration**: `021_additional_performance_indexes.sql`
  - Composite indexes for frequently filtered columns
  - Partial indexes for status-based queries (pending, delivered orders)
  - Analyzed tables for query planner optimization
  - Faster promotions, products, and order queries

## Tech Stack

- **Framework**: Next.js 16.0.5 (App Router with Turbopack)
- **Language**: TypeScript 5
- **Database & Auth**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS 4 with custom "Brownish" theme
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: Zustand (with persist middleware)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Features

### SEO & Performance Optimization ⚡
- **Comprehensive SEO Implementation**:
  - Dynamic meta tags with Open Graph and Twitter Cards
  - JSON-LD structured data (PetStore + WebSite schemas)
  - XML sitemap generation (`/sitemap.xml`)
  - Robots.txt configuration (`/robots.txt`)
  - Canonical URLs and proper indexing directives
  - Search engine verification codes support
- **Mobile-First Responsive Design**:
  - Optimized for all screen sizes (320px - 3840px)
  - Touch-friendly UI with 44px minimum touch targets
  - Responsive typography and spacing
  - Adaptive layouts per breakpoint (sm/md/lg/xl)
- **Performance Features**:
  - Lazy loading for product images
  - Priority loading for hero images
  - Image optimization with Next.js Image
  - Code splitting and tree shaking
  - Optimized bundle sizes
- **Documentation**:
  - See `SEO_OPTIMIZATION.md` for detailed guide
  - See `OPTIMIZATION_SUMMARY.md` for implementation summary
  - See `BEFORE_AFTER.md` for visual comparison
  - See `CHECKLIST.md` for deployment tasks

### Authentication & Authorization

The platform implements a comprehensive authentication and authorization system:

#### Authentication Methods
- **Phone Number Authentication**: Primary authentication method using Indonesian format (08xx or +62xx)
- **Email Authentication**: Optional for order notifications
- **Password-based Login**: With automatic phone number formatting to E.164 format
- **OTP Support**: Available as an alternative authentication method

#### Role-Based Access Control (RBAC)

The system has 5 distinct roles with different permission levels:

- **`master_admin`**: Full system access including all management functions
- **`normal_admin`**: Product, order, user, and promotion management
- **`kasir`**: POS system access and assigned order processing
- **`super_user`**: Special admin role with additional permissions
- **`normal_user`**: Customer access to storefront and personal dashboard

#### User Registration Flow
- New users register with phone number and password
- **Admin Approval System**: Self-registered users require admin approval before login
- Admin-created users are auto-approved
- Profile creation happens automatically after registration
- Referral system with unique code generation

#### Session Management
- Next.js middleware handles session refresh on every request
- Automatic session refresh every 2 minutes in `useAuth` hook
- Proper handling for `TOKEN_REFRESHED`, `SIGNED_OUT`, `SIGNED_IN` events
- Session persistence across application lifecycle

#### Protected Routes
- Middleware-based route protection
- Role-based access to different sections:
  - `/admin` - Admin dashboard (master_admin, normal_admin)
  - `/kasir` - POS system (kasir role)
  - `/dashboard` - User dashboard (normal_user and others)
  - `/api/admin` - Admin APIs (master_admin, normal_admin)
  - `/api/kasir` - POS APIs (kasir role)

### Storefront (Public)
- Homepage with hero section, featured products, and categories
- Product catalog with category filtering and search
- Product detail pages with variant selection
- Shopping cart (persisted via Zustand + localStorage)
- Checkout flow

### Admin Dashboard (`/admin`)
- **Dashboard Overview** (`/admin`):
  - **Comprehensive Statistics** - 8 real-time metric cards:
    - Total Revenue (from delivered orders) → Links to delivered orders
    - Total Orders (with pending count) → Links to orders page
    - Total Products (with low stock count) → Links to products page
    - Total Users (normal users) → Links to users page
    - Categories count → Links to categories page
    - Promotions (with active count) → Links to promotions page
    - Reviews (with pending count) → Links to reviews moderation
    - Notifications (with unread count) → Links to notifications page
  - **Recent Orders Section**:
    - Last 5 orders with ID, date/time, amount, and color-coded status badges
    - Clickable orders linking to order management
  - **Pending Actions Section**:
    - Pending Orders (yellow badge) → Direct link to pending orders
    - Low Stock Items (blue badge) → Products with stock < 10
    - Pending Reviews (purple badge) → Reviews awaiting moderation
    - Unread Notifications (red badge) → New system notifications
  - **Quick Actions Section**:
    - Add Product, Manage Categories, Create Promotion, Shipping Rates
  - **UI Features**:
    - Color-coded metric cards with unique icons
    - Hover effects on all clickable elements
    - Responsive grid layout (mobile to desktop)
    - Loading skeleton states
    - Real-time data with parallel queries
- **Product Management**:
  - CRUD operations for products
  - Variant support (size, flavor, etc.)
  - Excel import/export for bulk operations
  - Image upload support
- **Category Management**: CRUD with sort order and images
- **Order Management**:
  - View all orders with status filtering
  - Order status updates (pending → paid → packed → shipped → delivered)
  - Order details modal with items and shipping info
  - Search and filter capabilities
- **User Management**:
  - CRUD operations for users
  - Role assignment (master_admin, normal_admin, kasir, normal_user)
  - Password management (create/reset)
  - Recipient shipping information management
- **Promotions Management** (`/admin/promotions`):
  - **5 Promotion Types**:
    - **Percentage Off**: e.g., 20% discount
    - **Fixed Amount Off**: e.g., IDR 50,000 off
    - **Buy X Get Y**: e.g., Buy 2 Get 1 Free
    - **Buy More Save More**: Tiered volume discounts (e.g., 2+=5%, 5+=10%, 10+=15%)
    - **Free Shipping**: Standalone or combined with other discounts
  - **Product Selection**:
    - Apply to all products or specific products
    - Multi-select checkbox list with product search
    - Category-based targeting support
  - **Advanced Features**:
    - Free shipping toggle (can combine with any discount type)
    - Unlimited discount tiers for Buy More Save More
    - Usage limits per user (max_uses_per_user)
    - Usage tracking in promotion_usage table
    - Minimum purchase amount requirements
    - Validity periods (start/end dates)
    - Active/inactive status toggle
  - **UI Features**:
    - Stats dashboard (total, active, currently valid, inactive)
    - Visual status indicators (scheduled, expired, active)
    - Features badges (Free Ship, X Products)
    - Type-specific form fields with validation
- **Reviews Management** (`/admin/reviews`):
  - View all product reviews with moderation queue
  - Approve/reject reviews before they appear publicly
  - Delete inappropriate reviews
  - Rating filter (1-5 stars)
  - Status filter (approved/pending)
  - User and product information display
  - View full review details in modal
  - Stats dashboard (total, approved, pending, average rating)
  - Search by user, product, or comment text
- **Notifications Management** (`/admin/notifications`):
  - View all system and user notifications
  - Create system-wide announcements (visible to all admins)
  - Mark notifications as read (individual or bulk)
  - Delete notifications with confirmation
  - Filter by status (all, read, unread)
  - Filter by type (all, system, user notifications)
  - Search by title, message, or user
  - View full notification details in modal
  - Stats dashboard (total, unread, system, user)
  - Action links support for navigation
- **Landing Page Management** (`/admin/landing-page`):
  - **Dynamic Section Control**: Show/hide and customize all homepage sections
  - **Managed Sections**:
    - **Hero Section**: Title, subtitle, trust badges (editable text with auto-icon detection)
    - **Promo Banner**: Auto-rotation settings, rotation interval
    - **Benefits Section**: General settings
    - **Categories Section**: Title, subtitle
    - **Flash Sale**: Title, countdown toggle
    - **Featured Products**: Title, subtitle, product limit (default: 8)
    - **New Arrivals**: Title, subtitle, product limit
    - **Testimonials**: Title, subtitle
    - **Newsletter**: Title, subtitle
    - **Footer**: Social links, categories, support, legal toggles
  - **Trust Badges Editor** (Hero Section):
    - Add/edit/remove up to 6 trust badges
    - Automatic icon detection from text keywords
    - Supports English & Indonesian keywords
    - 13+ available icons (truck, shield, clock, gift, award, etc.)
    - Auto-color assignment for visual variety
  - **UI Features**:
    - Toggle visibility for each section
    - Real-time preview of changes
    - Settings saved to database (30-second cache)
    - Responsive card-based layout
- **Promotions Management**: Managed via `/admin/promotions` (appears in Promo Banner when active)
- **Store Settings**:
  - General store info (name, logo, contact)
  - HTML/emoji support for store description
  - Shipping configuration (free shipping threshold, COD)
  - Payment settings (bank transfer, e-wallet)
  - Loyalty program settings (points per rupiah, tier thresholds)
  - Notification preferences
- **Social Media Links**: Manage footer social links

### Kasir/POS Dashboard (`/kasir`)
- **POS Interface** (`/kasir`):
  - Point of Sale interface for in-store transactions
  - Database-driven category filtering
  - Product grid with variant support
  - Variant selection dialog for multi-variant products
  - Visual indicators (Package icon badge for variant products)
  - Stock management (filters out-of-stock items)
  - Quick add to cart functionality
  - Real-time cart management with quantity controls
  - Checkout flow with cash/card payment options
  - Cash change calculation
  - Order creation with variant tracking
  - Stock updates on successful sale
- **Orders Management** (`/kasir/orders`):
  - View all POS and assigned marketplace orders
  - **Statistics Dashboard**:
    - Today's orders count
    - Today's revenue (paid + delivered orders)
    - My POS orders count
    - Pending orders count
  - **Order Filtering**:
    - Search by Order ID, customer email, or name
    - Filter by status (pending, paid, packed, shipped, delivered, cancelled, returned)
    - Filter by source (POS vs Marketplace)
  - **Order Details View**:
    - Complete order information (ID, date, customer, cashier)
    - Order items list with variant details
    - Shipping address (for marketplace orders)
    - Order summary (subtotal, shipping, discount, total)
    - Status update capability
  - **Access Control**:
    - View all POS orders
    - View marketplace orders assigned to kasir
  - **UI Features**:
    - Color-coded status badges
    - Responsive table layout
    - Modal dialog for order details
    - Real-time order updates

### User Dashboard (`/dashboard`)
- **Dashboard Overview**: 
  - Profile summary with avatar and membership tier
  - Membership progress tracker
  - Points balance display
  - Quick action cards (Orders, Pets, Wishlist, Settings)
  - Recent orders section with status badges
  - Pet profiles overview
- **User Settings** (`/dashboard/settings`):
  - **Profile Tab**:
    - Personal information (name, email, phone)
    - Personal address management
    - Avatar upload with WebP conversion and optimization
    - Image resizing (max 400x400) with aspect ratio preservation
    - Base64 WebP storage (no external storage required)
    - File validation (type and max 2MB size)
    - Real-time profile updates
  - **Shipping Tab**:
    - Recipient shipping address
    - "Same as personal address" auto-fill toggle
    - Separate recipient name and address fields
    - Save shipping preferences
  - **Security Tab**:
    - Change password functionality
    - Password validation (min 6 characters)
    - Secure password update via Supabase Auth
  - **Profile Sidebar**:
    - Avatar display and upload
    - Membership tier badge with color coding
    - Points balance with progress to next tier
    - Referral code with copy-to-clipboard
    - Referral link generator
  - **UI Features**:
    - Tabbed interface for organized settings
    - Loading states and form validation
    - Toast notifications for all actions
    - Responsive design (mobile to desktop)
- **Pet Profiles** (`/dashboard/pets`):
  - Add/manage pet information (type, name, birthday, weight, microchip ID)
  - Photo upload with WebP conversion
  - Image resizing (max 600x600) with aspect ratio preservation
  - Visual image preview with remove option
  - Pet type selection (dog, cat, bird, fish, hamster, rabbit, other)
  - Gender selection and weight tracking
- Order history

### Gamification & Loyalty System
- **Points Accumulation**: Earn points on purchases (configurable rate: X points per Rp Y spent)
- **5 Membership Tiers** with progressive benefits:
  - Newborn (0 points) - Default tier for new users
  - Transitional (500+ points) - Unlock exclusive offers
  - Juvenile (2,000+ points) - Priority customer support
  - Adolescence (5,000+ points) - Early access to sales
  - Adulthood (10,000+ points) - VIP treatment and special discounts
- **Tier Visualization**: Visual progress bar with trophy icons showing achievement status
- **Referral System**: Unique referral codes with bonus points for both referrer and referee
- **Loyalty Program Configuration**: Admin-configurable settings in store settings:
  - Points earned per amount spent
  - Minimum points for redemption
  - Point value in currency
  - Referral bonus amounts
  - Tier thresholds for each membership level
- **Points Management**: Track points balance in user profiles, use for rewards
- **Tier Benefits**: Visual indicators and special privileges based on membership tier

### Real-time Notifications
- Supabase Realtime subscriptions
- Bell icon with unread count
- Toast notifications for new alerts

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & Register pages
│   │   ├── login/
│   │   └── register/
│   ├── (main)/           # Public storefront
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── products/
│   ├── (protected)/      # Authenticated routes
│   │   ├── admin/        # Admin panel
│   │   │   ├── categories/
│   │   │   ├── products/
│   │   │   └── settings/
│   │   ├── dashboard/    # User dashboard
│   │   │   └── pets/
│   │   └── kasir/        # POS system
│   └── api/              # API routes
├── components/
│   ├── admin/            # Admin-specific components
│   ├── home/             # Homepage components
│   ├── layout/           # Header, Footer
│   └── ui/               # shadcn/ui components
│       ├── store-logo.tsx   # Reusable store logo component
├── hooks/                # Custom React hooks
│   ├── use-auth.ts
│   ├── use-categories.ts
│   ├── use-notifications-admin.ts
│   ├── use-reviews.ts
│   ├── use-social-media.ts
│   └── use-store-settings.ts
├── lib/
│   ├── supabase/         # Supabase client (singleton)
│   ├── excel-utils.ts    # Excel import/export
│   ├── image-utils.ts    # Image optimization (WebP conversion, resizing)
│   ├── invoice-generator.ts    # JPEG invoice generation with recipient info and logo
│   ├── packing-list-generator.ts  # PDF packing list generation with recipient info and logo
│   └── utils.ts          # Utility functions

### Invoice & Packing List Generation

- **Invoice Generation** (`src/lib/invoice-generator.ts`):
  - Generates JPEG invoices with store logo
  - Includes comprehensive order details
  - Displays recipient information in two-column format (Name, Address, City, Province, Postal Code, Phone)
  - Shows order information (Order #, Date, Status, Source)
  - Includes itemized order breakdown with pricing
  - Professional layout matching brand colors

- **Packing List Generation** (`src/lib/packing-list-generator.ts`):
  - Generates PDF packing lists with store logo
  - Features recipient information in structured format
  - Two-column layout for recipient info and order details
  - Properly handles marketplace orders with shipping address snapshot
  - Includes courier information and shipping details
  - Optimized for printing with appropriate margins and font sizes

- **Recipient Information Handling**:
  - Supports both POS and marketplace orders
  - Retrieves data from direct fields (POS) or shipping_address_snapshot (marketplace)
  - Two-column layout with proper labels
  - Handles missing data gracefully
├── store/                # Zustand stores (global state with caching)
│   ├── cart-store.ts                # Shopping cart (persisted)
│   ├── notifications-admin-store.ts # Admin notification management
│   ├── reviews-store.ts             # Reviews moderation
│   ├── categories-store.ts          # Categories cache
│   ├── store-settings-store.ts      # Store settings cache (0ms for dev)
│   └── social-media-store.ts        # Social links cache
├── types/
│   └── database.ts       # TypeScript types
└── middleware.ts         # Route protection
```

## Database Schema

The database schema is located in `supabase/migrations/` and consists of the following core tables:

### User Management Tables
| Table | Description |
|-------|-------------|
| `profiles` | User profiles extending auth.users with role, tier, points, referral system |
| `pets` | User pet information with type, name, birthday, weight, microchip ID |
| `social_media_links` | Footer social links with platform, URL, and display order |

### Product Management Tables
| Table | Description |
|-------|-------------|
| `products` | Product catalog with name, description, pricing, stock, variants, categories |
| `product_variants` | Product variants with size, flavor, price adjustments, and individual stock |
| `categories` | Product categories with hierarchical structure support |
| `wishlists` | User saved products for later purchase |

### About Page Management Tables
| Table | Description |
|-------|-------------|
| `about_page_sections` | Settings and content for different sections of the About Us page |
| `about_values` | Company values and principles displayed on the About page |
| `about_team_members` | Team member profiles and information for the Meet Our Team section |
| `about_milestones` | Timeline of company achievements and milestones |
| `about_testimonials` | Customer testimonials and reviews displayed on About page |

### Order Management Tables
| Table | Description |
|-------|-------------|
| `orders` | Order records with user, status, amounts, shipping, and payment information |
| `order_items` | Individual items within orders with product and variant references |
| `shipping_couriers` | Available shipping options with logos, costs, and delivery times |
| `shipping_rates` | Province-specific shipping rates for cost calculation |
| `provinces` | Indonesian provinces for shipping destination management |

### Promotion & Marketing Tables
| Table | Description |
|-------|-------------|
| `promotions` | Discount codes and campaigns with various discount types |
| `promotion_tiers` | Tiered discount configurations for "Buy More Save More" promotions |
| `promotion_usage` | Tracking of promotion usage per user and order |
| `reviews` | Product reviews with rating and approval status |
| `notifications` | System and user notifications with read/unread status |

### Configuration Tables
| Table | Description |
|-------|-------------|
| `store_settings` | Global store configuration (name, description, logo, shipping, payment, loyalty) |
| `landing_page_sections` | Configurable homepage sections with settings and visibility flags |

### Enums & Types
- `app_role`: Values include 'master_admin', 'normal_admin', 'kasir', 'super_user', 'normal_user'
- `membership_tier`: Values include 'Newborn', 'Transitional', 'Juvenile', 'Adolescence', 'Adulthood'
- `order_status`: Values include 'pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'
- `order_source`: Values include 'marketplace', 'pos'

### Row Level Security (RLS)

The database implements comprehensive Row Level Security policies:
- **Profiles**: Users can view/update own profile; staff can view all; admins can update all
- **Products**: Public can view; only admins can manage
- **Orders**: Users can view own orders; staff can view all
- **Reviews**: Public can view approved; users can create their own; admins can manage all
- **Promotions**: Public can view active; only admins can manage
- **Wishlists**: Users can manage only their own
- And many more detailed policies per table

### Performance Optimizations

The schema includes numerous performance optimizations:
- Multiple composite and single-column indexes
- 5-minute caching strategy for frequently accessed data
- Database functions for shipping calculations
- Optimized query patterns with proper index usage
- Realtime subscriptions for notifications
- Database triggers for automatically updating timestamps

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project (with Phone Auth enabled)

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Database Setup

1. Create a new Supabase project
2. Run migrations in order from `supabase/migrations/` (001 through 025)
   - **Latest**: `025_populate_user_names_in_orders.sql` - Populate user and cashier names in existing orders
   - Key migrations include:
     - `001_initial_schema.sql` - Core database schema
     - `010_province_based_shipping.sql` - Province-based shipping infrastructure
     - `012_enhanced_promotions.sql` - Enhanced promotions with tiers and usage tracking
     - `017_wishlist.sql` - Wishlist functionality
     - `020_landing_page_settings.sql` - Landing page section configuration
     - `021_additional_performance_indexes.sql` - Performance optimization indexes
     - `022_order_notification_triggers.sql` - Order status change notifications
     - `024_add_user_cashier_names_to_orders.sql` - User and cashier name tracking in orders
3. Enable Phone Authentication in Supabase Auth settings
4. Configure RLS policies (included in migrations)
5. **(Optional)** Run `ANALYZE` on tables after initial data import for optimal query planning

> **Note**: Migration 021 adds critical performance indexes. Run all migrations to ensure complete functionality.

### Middleware & Session Management

The application uses Next.js middleware for session management and route protection:

- **Authentication Middleware** (`src/middleware.ts`):
  - Handles session refresh on every request
  - Changes `getSession()` to `getUser()` for proper token validation and refresh
  - Proactive session refresh every 2 minutes to prevent timeout issues
  - Handles auth events: `TOKEN_REFRESHED`, `SIGNED_OUT`, `SIGNED_IN`, etc.
  - Protects routes based on user authentication and roles

- **Route Protection**:
  - Public routes: Accessible to all users
  - Authenticated routes: Require login (e.g., `/dashboard`, `/cart`, `/checkout`)
  - Role-based routes: Require specific roles (e.g., `/admin` for admins, `/kasir` for kasir)

- **Session Management Features**:
  - Session persistence across app lifecycle
  - Automatic refresh to prevent timeout issues during long browsing sessions
  - Proper cleanup on sign out
  - Global scope handling for complete session termination

### Promotion Validation (Checkout Integration)

Use the `validate_promotion_code()` RPC function in your checkout flow:

```typescript
const { data, error } = await supabase.rpc('validate_promotion_code', {
  p_code: 'SUMMER2025',
  p_user_id: userId,
  p_product_ids: cartProductIds, // UUID[]
  p_subtotal: cartSubtotal
});

// Returns:
// {
//   is_valid: boolean,
//   discount_amount: number,
//   free_shipping: boolean,
//   message: string
// }
```

This function automatically:
- Validates promotion code and active status
- Checks date validity (start_date, end_date)
- Verifies minimum purchase requirements
- Checks per-user usage limits
- Validates product applicability (all products, specific products, or specific categories)
- Calculates appropriate discount based on type (percentage, fixed, buy X get Y, etc.)
- Handles complex "Buy More Save More" tier calculations

## API Routes

Server-side API routes for complex operations that bypass client-side RLS performance issues:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/settings` | POST | Update store settings (handles large data) |
| `/api/users/create` | POST | Create new user with password and role assignment |
| `/api/users/update` | POST | Update user profile and role |
| `/api/users/approve` | POST | Admin endpoint to approve pending users |
| `/api/users/delete` | DELETE | Admin endpoint to delete users (auth + profile) |
| `/api/auth/register` | POST | Server-side registration with auto email confirmation |
| `/api/auth/lookup-email` | POST | Find auth email by phone number |
| `/api/products/create` | POST | Create new product with variants |
| `/api/products/update` | POST | Update product and variants (handles multiple variants efficiently) |
| `/api/orders/kasir` | GET | Fetch orders for kasir users with proper authentication |
| `/api/kasir/orders/[id]` | PUT | Update order status for kasir users |

**Why Server-Side APIs?**
- **Bypasses Client-Side RLS Performance Issues**: Avoids complex RLS policy evaluation overhead
- **Handles Large Data Payloads**: Prevents timeouts when processing large amounts of data
- **Efficient Multi-Operation Processing**: Performs multiple database operations in single requests
- **Better Security**: Sensitive operations can be properly validated server-side
- **Improved Error Handling**: Centralized error handling and logging
- **Admin Operations**: Certain admin functions require service role access that bypasses RLS

## Design System

### Theme Colors (Brownish)
- Primary: `#a0938e` (warm brown)
- Brown scale: 50-900 for backgrounds and text
- Secondary: `#fdf8f6` (light cream)

### Typography
- Font: Geist (via next/font)
- Rounded corners: `xl` (1rem), `2xl` (1.5rem)

## Architecture

### State Management & Caching

The application uses a sophisticated Zustand-based state management system with smart caching to optimize performance:

| Store | Purpose | Cache Duration |
|-------|---------|----------------|
| `cart-store` | Shopping cart | Persistent (localStorage) |
| `categories-store` | Product categories | 5 minutes |
| `orders-store` | Order management | 5 minutes |
| `users-store` | User management | 5 minutes |
| `products-store` | Product data | 5 minutes |
| `promotions-store` | Discount codes and promotions | 5 minutes |
| `reviews-store` | Product reviews moderation | 5 minutes |
| `shipping-couriers-store` | Shipping options | 5 minutes |
| `store-settings-store` | Store configuration | 0ms (dev) / 5 minutes (prod) |
| `social-media-store` | Social media links | 5 minutes |
| `pets-store` | User's pets | 5 minutes |
| `notification-store` | Notifications | Session |
| `wishlist-store` | User wishlist | 5 minutes |
| `ABOUT_PAGE_CACHE` | About Us page content | 5 minutes in-memory cache |

#### Caching Strategy

**Key features:**
- **Singleton Supabase client** - Prevents memory leaks from multiple client instances
- **Request deduplication** - Concurrent requests are merged into one
- **Smart caching** - Data is cached and only re-fetched when stale
- **Global state sharing** - All components access the same cached data
- **Automatic cache invalidation** - After mutations, relevant caches are cleared
- **Stable selectors** - Prevent unnecessary re-renders with proper memoization

#### Cache Implementation Details

- **In-memory caching** with automatic TTL (Time To Live) expiration
- **Request deduplication** - Multiple concurrent requests for the same resource are merged into a single request
- **Conditional fetching** - Data is only fetched when the cache is stale or empty
- **Cache warming** - Critical data is pre-loaded when the application starts
- **Cache persistence** - Shopping cart data is persisted in localStorage to survive page reloads
- **Cache partitioning** - Different resources have separate cache instances
- **Parallel data fetching** - For related data sets (e.g., About Us page content) to reduce load times
- **Retry mechanisms** - Automatic retry with exponential backoff for failed requests
- **Optimistic loading** - Immediate UI updates with background data fetching
- **Performance monitoring** - Loading indicators and performance metrics for user experience

#### Store Architecture

All stores follow the same pattern:
- **State** - Contains the cached data and loading states
- **Getters** - Retrieval functions with caching logic
- **Setters** - Update functions with cache invalidation
- **Actions** - Business logic functions that coordinate state changes

Example of a typical store implementation pattern:
```
// Store structure
{
  data: T[] | null,           // Cached data
  loading: boolean,           // Loading state
  error: string | null,       // Error state
  lastFetch: number,          // Timestamp of last fetch
  fetch: () => Promise<void>, // Fetch function with caching
  invalidate: () => void,     // Clear cache
}
```

### Hooks Architecture

Hooks in `/src/hooks/` are thin wrappers around Zustand stores that provide:

- **Type safety** through TypeScript interfaces
- **Automatic cleanup** and cache invalidation
- **Consistent API** across all components
- **Loading state management**
- **Error handling** and propagation

Special optimizations for About Us page:
- **Parallel data fetching** - Multiple content sections are fetched simultaneously for faster loading
- **Retry mechanisms** - Failed requests are automatically retried with exponential backoff
- **Optimistic updates** - Cached data is shown immediately while fresh data loads in background
- **Error resilience** - Page continues to render even if some content fetches fail

Example:
```typescript
// Example: useCategories hook
export function useCategories() {
  const { categories, loading, fetchCategories, getActiveCategories } = useCategoriesStore();

  useEffect(() => {
    fetchCategories(); // Only fetches if cache is stale
  }, [fetchCategories]);

  return { categories, loading, getActiveCategories };
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Deployment

Deploy on Vercel for optimal Next.js support:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or use any Node.js hosting platform that supports Next.js 16.

## Development Workflow & Best Practices

### State Management Guidelines

When working with Zustand stores and caching:

- Always use the existing store pattern with caching and request deduplication
- Implement proper cache invalidation after mutations
- Use stable selectors to prevent unnecessary re-renders
- Follow the store structure pattern with state, getters, setters, and actions
- Use appropriate cache TTLs (typically 5 minutes for most data, 0ms in dev for store settings)

### Database & Supabase Best Practices

- Use the service role key for administrative operations in API routes
- Implement Row Level Security for all tables
- Create proper indexes for frequently queried columns
- Use stored procedures/functions for complex operations
- Follow the enum pattern for role/status fields to maintain consistency
- Implement proper error handling and validation

### Component Architecture

- Use client components (`'use client'`) for interactive UI elements
- Use server components for data fetching and rendering where possible
- Implement proper type safety with TypeScript interfaces
- Follow the pattern of hooks wrapping stores for consistent data access
- Use shadcn/ui and Radix UI primitives for consistent design
- Implement responsive design with Tailwind CSS

### Performance Optimization

- Leverage the caching system to avoid unnecessary database queries
- Use proper image optimization with WebP format
- Implement virtualization for large lists
- Optimize database queries with proper indexing
- Use efficient SVG icons from Lucide React
- Implement proper loading states and skeleton screens

### Testing & Quality Assurance

- Test all user flows (public, admin, kasir, and user dashboard)
- Verify role-based access controls
- Test the caching system and ensure data consistency
- Validate all form submissions with proper error handling
- Test the mobile responsiveness of all pages
- Verify image upload and optimization functionality

## Recent Updates

### December 2, 2025

**🎨 User Dashboard & Image Optimization**

- **User Settings Page** (`/dashboard/settings`)
  - **Complete Profile Management**:
    - 3-tab interface: Profile, Shipping, Security
    - Left sidebar with avatar, membership tier, points balance, and referral code
  - **Profile Tab**:
    - Update personal information (name, email, phone number)
    - Personal address management (address, city, province, postal code)
    - Real-time form updates with validation
  - **Shipping Tab**:
    - Dedicated recipient shipping address fields
    - "Same as personal address" auto-fill checkbox
    - Separate recipient name for gift deliveries
    - Save shipping preferences for checkout
  - **Security Tab**:
    - Change password functionality
    - Password validation (minimum 6 characters)
    - Confirm password matching
    - Secure updates via Supabase Auth
  - **Profile Sidebar Features**:
    - Avatar upload with click to upload
    - WebP conversion with Canvas API (quality 0.8)
    - Image resizing to max 400x400 (maintains aspect ratio)
    - Image validation (file type and max 2MB size)
    - Base64 WebP encoding for storage (no bucket configuration needed)
    - Membership tier badge with color coding (Newborn to Adulthood)
    - Points balance with "points to next tier" indicator
    - Referral code display with copy-to-clipboard button
    - Auto-generated referral link (shorttail.id/ref/CODE)
  - **UI/UX Features**:
    - Tabbed interface for organized settings
    - Loading states for all async operations
    - Toast notifications (success/error feedback)
    - Responsive design (mobile-first to desktop)
    - Form validation with helpful error messages
    - Avatar preview before upload
    - Disabled state for "same as personal" fields

- **Pet Profile Management** (`/dashboard/pets/new`)
  - **Photo Upload with WebP Conversion**:
    - File upload with drag-and-drop or click interface
    - Automatic WebP conversion using Canvas API (quality 0.8)
    - Image resizing to max 600x600 pixels (maintains aspect ratio)
    - File validation (image types only, max 2MB)
    - Base64 WebP encoding for database storage
    - Real-time image preview before submission
    - Remove image option with X button
  - **Pet Information Form**:
    - Pet name and type selection (7 types: dog, cat, bird, fish, hamster, rabbit, other)
    - Optional birthday date picker
    - Gender selection (male/female)
    - Weight tracking in kilograms
    - Microchip ID field for identification
  - **UI Features**:
    - Visual upload area with icon and instructions
    - Loading spinner during image processing
    - Image preview with responsive sizing
    - Toast notifications for upload status
    - Form validation with error messages

**🔧 Technical Improvements**

- **WebP Image Optimization**:
  - Implemented Canvas API for client-side image conversion
  - Avatar images: resized to 400x400 with 0.8 quality
  - Pet photos: resized to 600x600 with 0.8 quality
  - Automatic aspect ratio preservation during resize
  - Base64 WebP encoding eliminates need for storage buckets
  - Reduced bandwidth and storage requirements
  - Better performance and faster page loads
  - Consistent image format across all user-uploaded images
  - File type validation (image types only) with max 2MB size limit
  - Real-time image preview before upload/submit

- **Image Storage Architecture**:
  - Migrated from Supabase Storage to base64 data URLs
  - No bucket configuration required
  - Simplified deployment and maintenance
  - Direct database storage for all images (avatars, pet photos)
  - Eliminated external storage dependencies
  - Automatic WebP conversion using Canvas API
  - Quality optimization with configurable quality settings (0.8 default)

- **Image Utility Functions**:
  - Located in `src/lib/image-utils.ts`
  - Handle image conversion, resizing, and optimization
  - Preserve aspect ratios during resizing operations
  - Convert to WebP format for smaller file sizes
  - Validate file types and sizes before processing

### December 2, 2025

**🎨 Membership Tier Progress Visualization**

- **Dashboard Membership Progress** (`/dashboard`)
  - **Visual Tier System**:
    - Horizontal progress bar with tier-colored fill based on current tier
    - 5 tier circle markers positioned along progress bar
    - Trophy icons displayed in achieved tier circles
    - Ring highlight (ring-2 ring-primary) around current tier
    - Empty circles for locked/future tiers
  - **Tier Information Display**:
    - Tier names color-coded by achievement status
    - Point requirements shown under each tier marker
    - Centered progress text: "X points needed to reach [Next Tier]"
    - Responsive 20% width columns for 5 tier positions
  - **Visual Design**:
    - Color scheme matching membership tiers:
      - Newborn: gray-500
      - Transitional: green-500
      - Juvenile: blue-500
      - Adolescence: purple-500
      - Adulthood: yellow-500
    - Smooth transitions (duration-500) on all elements
    - Rounded full progress bar with brown-100 background track

- **Settings Membership Progress** (`/dashboard/settings`)
  - Identical tier progress visualization as dashboard
  - Integrated into Profile tab under membership information
  - Same interactive design with trophy icons and ring highlights
  - Consistent color coding and responsive layout
  - Real-time progress tracking based on points balance

**🛒 Enhanced Kasir/POS System**

- **POS Interface Improvements** (`/kasir`)
  - **Database-Driven Categories**:
    - Dynamic category loading from database (replaces hardcoded categories)
    - Categories match admin panel settings exactly
    - Horizontal scrollable category tabs
    - "All Products" option plus all active categories
  - **Product Variants Support**:
    - Products with variants show Package icon badge overlay
    - Clicking variant products opens variant selection dialog
    - Variant dialog shows all available variants in 2-column grid
    - Each variant displays:
      - Variant-specific or product fallback image
      - Variant name and unit label
      - Calculated price (base + adjustment)
      - Stock quantity with color-coded badge
      - Disabled state for out-of-stock variants
  - **Enhanced Product Display**:
    - Total stock calculation (sum of variant stocks for multi-variant products)
    - "X variants" badge for products with multiple options
    - "Base price + variants" indicator
    - Hover effects with border color transitions
    - Product images with fallback to paw icon
  - **Cart Management with Variants**:
    - Separate cart items for each product-variant combination
    - Display format: "Product Name - Variant Name"
    - Variant unit label shown as badge
    - Correct price tracking per variant (base + adjustment)
    - Stock validation per variant
    - Proper variant_id storage in order items
  - **Stock Filtering & Management**:
    - Filters out products/variants with zero stock
    - Products shown only if base stock > 0 OR any variant has stock > 0
    - Stock updates correctly for both products and variants on checkout
    - Real-time stock display in product cards

- **Kasir Orders Management** (`/kasir/orders`) - NEW PAGE
  - **Statistics Dashboard**:
    - Today's Orders: Count of orders created today
    - Today's Revenue: Sum of paid/delivered orders (IDR formatted)
    - My POS Orders: Total POS orders by this kasir
    - Pending Orders: Count awaiting action
  - **Advanced Filtering System**:
    - Search by Order ID, customer email, or customer name
    - Status filter dropdown (all, pending, paid, packed, shipped, delivered, cancelled, returned)
    - Source filter (all, POS, marketplace)
    - Real-time filtering with multiple criteria
  - **Access Control**:
    - View all POS orders (walk-in sales)
    - View marketplace orders where kasir is assigned
    - Prevents access to orders outside scope
  - **Orders Table Display**:
    - Order ID (shortened to 8 chars for readability)
    - Date & Time (Indonesian locale formatting)
    - Customer info (name + email, "Walk-in Customer" for null)
    - Source badge (POS in primary, Marketplace outlined)
    - Items count
    - Total amount (IDR currency)
    - Color-coded status badges with icons:
      - Pending: yellow with Clock icon
      - Paid: blue with DollarSign icon
      - Packed: purple with Package icon
      - Shipped: indigo with Truck icon
      - Delivered: green with CheckCircle icon
      - Cancelled: red with XCircle icon
      - Returned: gray with XCircle icon
    - View details action button
  - **Order Details Modal**:
    - Complete order information grid (ID, source, customer, cashier)
    - Status update dropdown with real-time save
    - Order items breakdown with variant information
    - Shipping address display (marketplace orders only)
    - Order summary section:
      - Subtotal
      - Shipping fee (if applicable)
      - Discount amount (if applicable)
      - Bold total in primary color
    - Scrollable content for long orders
  - **Data Integration**:
    - Uses existing orders-store with 2-minute cache
    - Automatic refresh after status updates
    - Real-time data synchronization
    - Proper variant tracking in order items
  - **UI/UX Features**:
    - Responsive design (mobile to desktop)
    - Loading states with spinner
    - Empty states with helpful icons/messages
    - Toast notifications for all actions
    - Consistent with kasir layout theme

**📝 Documentation Updates**

- Updated Kasir/POS Dashboard section in README with comprehensive feature list
- Documented POS interface enhancements (categories, variants, stock management)
- Documented new Kasir Orders Management page with all features
- Added Technical Improvements section for Kasir system
- Organized Recent Updates with December 2, 2025 section

### December 1, 2025

**🎉 Enhanced Promotions System**

- **Advanced Promotion Types** (`/admin/promotions`)
  - **Percentage Off**: Standard percentage discount (e.g., 20% off)
  - **Fixed Amount Off**: Fixed discount amount (e.g., IDR 50,000 off)
  - **Buy X Get Y**: "Buy 2 Get 1 Free" type promotions
  - **Buy More Save More**: Create tiered volume discounts
    - Unlimited discount tiers (e.g., Buy 2+ get 5%, 5+ get 10%, 10+ get 15%)
    - Visual tiers manager with add/remove controls
    - Min quantity and discount percentage per tier
  - **Free Shipping**: New standalone promotion type
    - Can be combined with any other discount type
    - Set minimum purchase thresholds
    - Free shipping toggle for all promotion types
  - **Product-Specific Discounts**:
    - "Applies To" selector: All Products, Specific Products, or Specific Categories
    - Multi-select checkbox list for product/category selection
    - Shows product names and SKUs
    - Selected product/category count indicator

- **Promotion Configuration Options**:
  - **Validity Periods**: Set start and end dates for promotions
  - **Minimum Purchase Amounts**: Require minimum spend for discount eligibility
  - **Usage Tracking & Limits**:
    - Max uses per user configuration
    - Automatic usage tracking in `promotion_usage` table
    - Per-user and total usage counters
  - **Product Targeting**: Apply to all products, specific products, or specific categories

- **Database Implementation**:
  - `promotions` table with fields for all promotion types
  - `promotion_tiers` table for "Buy More Save More" configurations
  - `promotion_usage` table for tracking usage per user and order
  - `validate_promotion_code()` RPC function for checkout validation

- **Checkout Integration**:
  - Use the `validate_promotion_code()` RPC function in checkout flow
  - Validates code, checks user limits, verifies product applicability
  - Automatically calculates appropriate discount based on promotion type
  - Returns discount amount, free shipping status, and validation message

- **Enhanced UI**:
  - Type-specific form sections (conditional rendering)
  - Features badges in table view (Free Ship, X Products)
  - Improved validation for each promotion type
  - Visual tier configuration interface
  - Stats dashboard (total, active, currently valid, inactive)
  - Color-coded status indicators (scheduled, expired, active)

- **Province-Based Shipping Rates** (`/admin/shipping`)
  - **Courier Management**:
    - Base cost configuration per courier
    - Logo upload with WebP conversion
    - Active/inactive status toggle
    - Estimated delivery days
  - **Provincial Rate Differentiation**:
    - 38 Indonesian provinces pre-loaded
    - Province-specific rates per courier
    - "Manage Rates" dialog for each courier
    - Fallback to base cost if no provincial rate set
  - **Performance Optimizations**:
    - Indexed shipping_rates table for fast queries
    - RPC functions: `get_couriers_for_province()`, `calculate_shipping_cost()`
    - 5-minute cache with smart invalidation

**🔧 Database Migrations**

- `010_province_based_shipping.sql`: 
  - Created `provinces` table (38 Indonesian provinces)
  - Created `shipping_rates` table (courier × province rates)
  - Added RPC functions for shipping calculations
- `011_shipping_indexes.sql`:
  - Performance indexes on shipping tables
  - Optimized courier and rate queries
- `012_enhanced_promotions.sql`:
  - Extended `promotions` table with new columns:
    - `applies_to`: Product targeting (all_products, specific_products, categories)
    - `product_ids`: UUID array for product selection
    - `category_ids`: UUID array for category targeting
    - `free_shipping`: Boolean for free shipping flag
    - `buy_quantity`, `get_quantity`: Buy X Get Y configuration
    - `max_uses_per_user`: Usage limit per user
    - `total_uses`: Total usage counter
  - Created `promotion_tiers` table for Buy More Save More
  - Created `promotion_usage` table for tracking
  - Added `validate_promotion_code()` RPC function for checkout validation
  - Updated discount_type constraint: Added 'buy_more_save_more', 'free_shipping'

**🎉 Admin Panel Enhancements**


- **Enhanced Admin Dashboard** (`/admin`)
  - **Comprehensive Statistics Dashboard**:
    - 8 real-time metric cards (Revenue, Orders, Products, Users, Categories, Promotions, Reviews, Notifications)
    - Each card shows main metric + relevant count (e.g., pending orders, low stock, unread)
    - Color-coded icons with unique background colors
    - All cards clickable with direct navigation to respective pages
  - **Recent Orders Section**:
    - Last 5 orders with shortened IDs, timestamps, amounts
    - Color-coded status badges (pending=yellow, paid=blue, packed=purple, shipped=orange, delivered=green)
    - Indonesian date/time formatting
    - Clickable rows linking to order management
  - **Pending Actions Dashboard**:
    - 4 action cards for items needing attention
    - Real-time counts from database (Pending Orders, Low Stock, Pending Reviews, Unread Notifications)
    - Direct links with query parameters (e.g., `/admin/orders?status=pending`)
    - Color-coded by urgency (yellow, blue, purple, red)
  - **Quick Actions Section**:
    - 4 common administrative tasks with icon buttons
    - Add Product, Manage Categories, Create Promotion, Shipping Rates
    - Direct navigation to action pages
  - **Performance & UX**:
    - 14 parallel database queries for comprehensive stats
    - Professional loading skeleton states
    - Responsive grid (1 col mobile → 4 cols desktop)
    - Hover effects and transitions on all interactive elements

- **Notifications Management Panel** (`/admin/notifications`)
  - View all system and user notifications in one dashboard
  - Create system-wide announcements (visible to all admins with user_id NULL)
  - Mark notifications as read (individual or bulk "Mark All as Read")
  - Delete notifications with confirmation dialog
  - Filter by status (all, read, unread)
  - Filter by type (all, system notifications, user notifications)
  - Search by title, message, or user information
  - View full notification details in modal with action links
  - Stats cards: total, unread, system notifications, user notifications
  - Real-time data with 5-minute cache
  - Type badges and status badges for visual clarity

- **Reviews Management Panel** (`/admin/reviews`)
  - Product review moderation queue and approval workflow
  - Approve/reject reviews before they appear publicly on product pages
  - Delete inappropriate or spam reviews
  - Filter by status (approved, pending)
  - Filter by rating (1-5 stars)
  - View full review details including user, product, rating, and comment
  - Stats cards: total reviews, approved, pending, average rating
  - Search by user name, product name, or comment text
  - Visual star rating display component
  - Real-time data with 5-minute cache

- **Orders Management Panel** (`/admin/orders`)
  - Complete CRUD interface for order management
  - Status workflow management (pending → paid → packed → shipped → delivered)
  - Order details modal with items breakdown and shipping information
  - Stats cards showing order counts by status
  - Search and filter functionality
  - Real-time data with 5-minute cache

- **Users Management Panel** (`/admin/users`)
  - Full user CRUD operations with role management
  - Password management (create new users with passwords, reset existing passwords)
  - Recipient shipping information fields:
    - Recipient name, phone, address, city, region, postal code
    - "Same as user info" toggle for auto-fill convenience
  - User search and role-based filtering
  - Avatar display and user stats

**🔧 Technical Improvements**

- **Kasir/POS System Enhancements** (`/kasir`):
  - **Enhanced POS Interface**:
    - Database-driven categories (replaces hardcoded categories)
    - Product variants support with selection dialog
    - Visual variant indicators (Package icon badge)
    - Variant selection modal with grid layout
    - Price display: base price + variant adjustments
    - Stock filtering: shows products/variants with stock > 0
    - Enhanced cart management with variant tracking
    - Separate cart items for each product-variant combination
  - **Orders Management Page** (`/kasir/orders`):
    - Complete orders dashboard for kasir role
    - View all POS orders and assigned marketplace orders
    - Statistics cards: Today's orders, revenue, my POS orders, pending
    - Triple filtering: Search, status filter, source filter
    - Order details modal with full information
    - Status update capability (pending → delivered workflow)
    - Color-coded status badges with icons
    - Order items display with variant information
    - Shipping address view for marketplace orders
    - Real-time data with 2-minute cache via orders-store

- **Server-Side API Routes**: Created `/api/settings`, `/api/users/create`, and `/api/users/update` for complex operations that bypass client-side RLS performance issues
- **Database Migrations**:
  - `007_add_recipient_phone.sql`: Added recipient phone number field to profiles
  - `008_fix_promotions_rls.sql`: Fixed promotions RLS policies and added timestamp columns
  - `009_fix_shipping_couriers_rls.sql`: Fixed shipping couriers RLS enum values
  - `010_province_based_shipping.sql`: Province-based shipping infrastructure
  - `011_shipping_indexes.sql`: Performance indexes for shipping queries
  - `012_enhanced_promotions.sql`: Enhanced promotions with tiers and usage tracking
- **Performance Optimizations**:
  - Singleton Supabase client pattern prevents memory leaks
  - Smart caching with 5-minute TTL across all admin stores
  - Stable selector functions prevent unnecessary re-renders
  - Indexed shipping and promotion tables for fast queries
- **HTML/Emoji Support**: Store description now supports rich text and emojis
- **Authentication Improvements**: Fixed sign-out flow with proper cookie cleanup and call ordering
- **Middleware Migration**: Updated from deprecated `next/server` patterns to Next.js 16 compatible proxy.ts

**🐛 Bug Fixes**

- Fixed COD toggle not saving (typo: `enableCod` → `enableCOD`)
- Fixed settings save timeout with long text by moving to server-side API
- Fixed cart storage migration errors with proper migrate function
- Fixed promotions RLS policies to use correct enum values (`master_admin`, `normal_admin`)
- Added missing `created_at` and `updated_at` columns to promotions table
- Fixed shipping couriers slow query response with performance indexes
- Fixed middleware deprecation warnings (Next.js 16 compatibility)
- **Fixed Store Logo Display Issue**:
  - Replaced all paw print brand icons with actual store logo from database
  - Fixed incorrect property paths: `settings.store.storeLogo` → `settings.storeLogo`
  - Created reusable `StoreLogo` component with base64 WebP support
  - Updated all brand locations: Header, Footer, Admin Sidebar, Kasir Layout, Login/Register pages
  - Added logo to generated documents (Invoice JPEG, Packing List PDF)
  - Disabled cache for immediate logo updates (CACHE_DURATION = 0ms)
  - Enhanced admin settings sync with auto-refresh
- **Fixed Next.js 16 Runtime Errors**:
  - Removed all `export const dynamic = 'force-dynamic'` statements (incompatible with Next.js 16)
  - Added `'use client'` directive to pages using client-side features
  - Converted home page and main layout to client components
  - Cleared `.next` build cache to resolve stale component issues
- **Fixed Category Filter on Products Page**:
  - Updated category filtering to use `category_id` (UUID) instead of deprecated `category` (text) field
  - Added categories table join to product query
  - Implemented slug-to-ID lookup using `getCategoryBySlug()` hook
  - Category filter now properly filters products by selected category
- **Fixed Product Management Performance Issues**:
  - **Admin Products List**: Fixed category display to show actual category names from database instead of slugs
  - **Product Update Hanging**: Resolved timeout issues when updating products with multiple variants
    - Removed slow `supabase.auth.getSession()` call that was causing hangs
    - Created server-side API route `/api/products/update` to bypass client-side RLS performance issues
    - Implemented individual variant insertion to prevent batch timeout issues
    - Added proper SKU trimming and null handling for variant fields
  - **Product Creation Hanging**: Fixed timeout issues when creating new products
    - Created server-side API route `/api/products/create` for better performance
    - Updated form schema to use `category_id` instead of deprecated `category` text field
    - Category selector now uses UUID values instead of slugs
  - Both create and update operations now support multiple variants (3-4+) without hanging

**📚 Documentation**

- Created `ENHANCED_PROMOTIONS_GUIDE.md`: Complete guide for using the enhanced promotions system
  - Setup instructions with migration steps
  - Examples for each promotion type
  - Testing checklist
  - Troubleshooting guide
  - Best practices and future feature ideas

---

## Recent Updates

### December 6, 2025

**🏠 Landing Page Section Settings**

- **Dynamic Landing Page Configuration** (`landing_page_sections` table):
  - **Admin-Controlled Sections**: Show/hide and customize any landing page section
  - **10 Configurable Sections**:
    - Hero Section (title, subtitle, trust badges toggle)
    - Promo Banner (auto-rotate, rotation interval)
    - Benefits Section
    - Categories Section (title, subtitle)
    - Flash Sale (title, countdown toggle)
    - Best Sellers (title, subtitle, product limit)
    - New Arrivals (title, subtitle, product limit)
    - Testimonials (title, subtitle)
    - Newsletter (title, subtitle)
    - Footer (social links, categories, support, legal toggles)
  - **Customizable Settings**: Each section has JSONB settings for section-specific options
  - **Sort Order**: Drag-and-drop reordering support via sort_order field
  - **Visibility Toggle**: Show/hide sections without deleting configuration

- **Database Migration** (`020_landing_page_settings.sql`):
  - Created `landing_page_sections` table with:
    - `section_key`: Unique identifier (hero, promo_banner, etc.)
    - `section_name`: Display name for admin UI
    - `is_visible`: Boolean to show/hide section
    - `sort_order`: Integer for section ordering
    - `settings`: JSONB for section-specific configuration
  - Pre-populated with 10 default sections and settings
  - RLS policies: Public read, admin-only write
  - Indexes on section_key and sort_order for performance

**📱 Phone Number Login System**

- **Phone-Based Authentication**:
  - Login page now uses phone number instead of email
  - Phone input with Indonesian format validation (08xx or +62xx)
  - Automatic phone number formatting to E.164 format (+62xxx)
  - Phone icon in input field with format helper text

- **Registration Changes** (`/register`):
  - Phone number is now the primary required field
  - Email is optional (for order notifications only)
  - Phone-to-email workaround for Supabase auth (no SMS provider needed)
  - Format: `+628123456789` → `628123456789@phone.local`

- **Login Flow** (`/login`):
  - Looks up user by phone number in profiles table
  - Supports multiple phone formats (08xx, 62xx, +62xx)
  - Falls back to phone-to-email format for new registrations
  - Works with both old (email-based) and new (phone-based) users

- **New API Endpoints**:
  - `POST /api/auth/lookup-email` - Finds auth email by phone number
  - Uses admin client to look up user's actual auth email from profiles

- **Auth Hook Updates** (`use-auth.ts`):
  - Added `signInWithPhone(phone, password)` for password-based phone login
  - Renamed OTP method to `signInWithPhoneOtp()`
  - Enhanced `signOut()` with global scope and proper cookie clearing

- **Sign Out Fix** (Admin Sidebar):
  - Added 100ms delay for cookie clearing
  - Changed to `window.location.replace()` for cleaner redirect
  - Server-side signout called first with credentials included

**🔐 Admin Approval System for User Registration**

- **User Registration Workflow**:
  - New users register with phone number and password but require admin approval before login
  - Added `is_approved` boolean field to profiles table (defaults to false for self-registered users)
  - Admin-created users are auto-approved (is_approved = true)
  - Login page checks approval status and blocks unapproved users with clear message
  - Server-side registration API bypasses Supabase email verification

- **Admin User Management** (`/admin/users`):
  - **CRUD Operations**: Full create, read, update, delete functionality for user accounts
  - **Role Assignment**: Assign roles (master_admin, normal_admin, kasir, normal_user) to users
  - **Password Management**: Create new users with passwords and reset existing passwords
  - **Recipient Information**: Manage recipient shipping information fields
  - **Status Column**: Shows "Approved" (green badge) or "Pending" (yellow badge with clock icon)
  - **Approve Button**: CheckCircle icon button for pending users
  - **Delete Button**: Red trash icon with confirmation dialog
  - **Prevents Self-Deletion**: Validation prevents users from deleting their own accounts
  - **User Search**: Search and filter functionality for managing large user bases

- **New API Endpoints**:
  - `POST /api/auth/register` - Server-side registration with auto email confirmation
  - `POST /api/users/approve` - Admin endpoint to approve pending users
  - `DELETE /api/users/delete` - Admin endpoint to delete users (auth + profile)
  - `POST /api/users/create` - Create new users with role assignment
  - `POST /api/users/update` - Update user profile and role

- **Admin Client** (`src/lib/supabase/admin.ts`):
  - Singleton admin client using `SUPABASE_SERVICE_ROLE_KEY`
  - Required for admin operations (create, delete, approve users)
  - Bypasses RLS for administrative tasks
  - Service role access for operations that regular RLS policies would block

**❤️ Wishlist Feature**

- **Wishlist Page** (`/dashboard/wishlist`):
  - Grid layout displaying saved products
  - Product image, name, price display
  - Add to cart functionality
  - Remove from wishlist with confirmation dialog
  - Empty state with heart icon

- **Database**:
  - `wishlists` table with user_id, product_id, created_at
  - Unique constraint on (user_id, product_id)
  - RLS policies for view/add/remove own wishlist
  - Indexes on user_id and product_id for performance

- **State Management** (`src/store/wishlist-store.ts`):
  - 5-minute cache with smart invalidation
  - Functions: fetchWishlist, addToWishlist, removeFromWishlist, isInWishlist

**⭐ Product Reviews with Purchase Verification**

- **Purchase Verification Logic**:
  - Only users who have purchased the product can submit reviews
  - Checks orders with qualifying statuses: paid, packed, shipped, or delivered
  - Prevents duplicate reviews (one review per user per product)
  - Verifies purchase history before allowing review submission

- **Product Page Reviews Tab** (`/products/[id]`):
  - **Dynamic States Based on User Context**:
    - Not logged in: "Login to Review" button with redirect to login page
    - Hasn't purchased: "Purchase to Review" message with shopping bag icon
    - Already reviewed: "Thank you for your review!" message with option to edit
    - Can review: Star rating input + comment form with validation
  - **Star Rating Display**: Shows actual average rating from approved reviews
  - **Reviews List**: Displays user avatars, star ratings, comments, and timestamps
  - **Admin Moderation**: Reviews require admin approval before appearing publicly
  - **Review Forms**: User-friendly interface with star rating and comment text area

- **Reviews Store Enhancements** (`src/store/reviews-store.ts`):
  - `checkUserPurchased(userId, productId)` - Verifies purchase via orders with qualifying statuses
  - `checkUserReviewed(userId, productId)` - Checks if user has already reviewed the product
  - `submitReview(userId, productId, data)` - Creates review with is_approved: false for admin review
  - `fetchProductReviews(productId)` - Fetches approved reviews for display
  - `updateReview(reviewId, data)` - Allows users to edit their submitted reviews
  - `deleteReview(reviewId)` - Allows users to delete their reviews (with admin permission)

- **Reviews Management** (`/admin/reviews`):
  - **Moderation Interface**: Review approval/rejection workflow
  - **Filtering Options**: Filter by rating (1-5 stars), status (approved/pending), and search
  - **Review Details**: View full review information including user, product, rating, and comment
  - **Bulk Operations**: Approve/reject multiple reviews at once

**🐾 Pet Profile Editing**

- **Edit Pet Page** (`/dashboard/pets/[id]/edit`):
  - Full CRUD for pet information
  - Form pre-populated with existing pet data
  - Image upload with WebP conversion
  - Delete pet with confirmation dialog
  - Redirects to pets list after save/delete

**🎨 UI Improvements**

- **Compact Pet Cards** (`/dashboard/pets`):
  - Reduced padding, font sizes, and image dimensions
  - More pets visible on screen
  - Maintained readability with smaller footprint

**📦 Database Migrations**

- `016_add_user_approval.sql`:
  - Added `is_approved` boolean to profiles (default: false)
  - Updated `handle_new_user()` function for new registrations
  - Set existing users to approved

- `017_wishlist.sql`:
  - Created wishlists table with RLS policies
  - Added indexes for performance

- `018_reviews_insert_policy.sql`:
  - RLS policies for user review submission
  - Policies for viewing own reviews
  - Admin management policies

**🔧 Technical Improvements**

- Fixed PawPrint import error in dashboard page
- Added ShoppingBag icon import for purchase verification UI
- All admin API routes use service_role key for proper permissions

---

### December 5, 2025

**🎨 POS (Kasir) Mobile Responsiveness Improvements**

- **Mobile Layout Optimization** (`/kasir`):
  - Adjusted height distribution: Products grid (40%), Current Order section (60%) on mobile
  - Fixed cart items not displaying on mobile devices
  - Replaced ScrollArea with native overflow-auto for better mobile compatibility
  - Removed conflicting flex-col layout that prevented proper rendering
  - Added explicit width constraints (w-full) to ensure full-width display

- **Compact Mobile UI** (`/kasir`):
  - Reduced all padding, gaps, and font sizes specifically for mobile
  - Header: Smaller padding (py-1.5 vs py-4), text-xs vs text-base
  - Cart items: Compact spacing (gap-1.5 vs gap-2), smaller fonts (text-[10px] vs text-sm)
  - Buttons: Smaller sizes (h-5×w-5 vs h-6×w-6 for quantity controls)
  - Footer: Reduced spacing (gap-1.5 vs gap-3), smaller text (text-[10px] vs text-xs)
  - Checkout button: Smaller height (h-8 vs h-10)
  - All desktop sizes preserved with lg: breakpoints

- **Product Grid Enhancement** (`/kasir`):
  - Increased product density: 3 columns on mobile (was 2), 4 on medium (was 3), 5 on XL (was 4)
  - Smaller product cards: Reduced padding (p-1.5 vs p-2), gaps (gap-1.5 vs gap-2)
  - Compact text: Product names (text-[10px] vs text-xs), prices (text-[10px] vs text-xs)
  - Smaller images and badges for better space utilization
  - Shortened text: "variants" → "var" to save space

- **Category Filter Fix** (`/kasir`):
  - Added horizontal scrolling with orientation="horizontal" prop
  - Updated ScrollArea component to accept and pass orientation to ScrollBar
  - Added overflow-hidden container and min-w-max to flex wrapper
  - Categories now scroll horizontally on mobile without wrapping

- **Code Cleanup**:
  - Removed debug console.log statements from store-settings-store.ts
  - Removed shipping calculation console.logs from kasir/page.tsx
  - Kept error/warning logs for debugging actual issues

**🔧 Technical Fixes**

- **Supabase Client Configuration**:
  - Added global headers configuration for better CORS compatibility
  - Implemented Content-Type: application/json header
  - Resolved browser cache-related CORS issues

- **Development Environment**:
  - Fixed multiple dev server instances conflict
  - Properly terminated conflicting processes (port 3000/3001)
  - Verified Supabase connectivity and accessibility

**📱 Mobile Device Testing Notes**

- All cart functionality now works properly on mobile devices
- Items added to cart are visible and scrollable
- Totals, discounts, and checkout button properly displayed
- Category filters work with horizontal scrolling
- Compact UI maximizes screen space while maintaining readability

---

## 🆕 Recent Updates (December 14, 2025)

### Enhanced Invoice and Packing List Display 📄
- **Improved Recipient Information Layout**:
  - Implemented two-column format for better organization
  - Left column now contains recipient information with proper labels (Name, Address, City, Province, Postal Code, Phone Number)
  - Right column contains order information (Order #, Date, Status, Source)
  - Replaced email address with phone number as requested
  - Added structured labels for all recipient fields for better clarity
  - Properly retrieves recipient information from both direct fields and shipping_address_snapshot for marketplace orders

- **Invoice Generator Enhancements** (`src/lib/invoice-generator.ts`):
  - Changed "Bill To" section to "Recipient Information"
  - Added proper field labels (Name:, Address:, City:, Province:, Postal Code:, Phone Number:)
  - Implemented logic to fetch recipient information from shipping_address_snapshot for marketplace orders
  - Removed direct reference to non-existent recipient fields to fix TypeScript compilation errors
  - Maintained two-column layout with recipient info on left and invoice details on right

- **Packing List Generator Improvements** (`src/lib/packing-list-generator.ts`):
  - Completely restructured recipient section into professional two-column layout
  - Widened left column and positioned it closer to the left margin (X position changed from 40 to 20)
  - Increased address field width from 70 to 100 units for better readability
  - Implemented proper alignment between left and right columns
  - Added headers for both columns ("Recipient Information" and "Order Information")
  - Used separate Y position counters for each column to ensure proper vertical alignment
  - Fixed variable naming conflicts that were causing build errors
  - Added comprehensive logic to fetch recipient information from shipping_address_snapshot

### Technical Fixes 🔧
- **Fixed TypeScript Compilation Errors**:
  - Resolved property 'recipient_city' and similar field errors in invoice generator
  - Updated code to use fields that exist in the Order type definition
  - Fetched recipient fields from shipping_address_snapshot instead of non-existent direct fields

- **Improved Data Flow**:
  - Updated API routes and stores to properly include customer_notes in all order retrieval paths
  - Ensured customer notes are displayed in both generated invoice (JPEG) and packing list (PDF)
  - Fixed variable names conflicts in packing list generator to prevent build errors

- **Customer Name Display Improvements**:
  - Added user_name and cashier_name columns to the orders table to store customer names at time of order creation
  - Updated checkout process to store the real customer name when creating marketplace orders
  - Updated POS process to store the cashier's name when creating POS orders
  - Modified the kasir orders table to display real customer names instead of 'Online Customer'
  - Created database migrations (024 and 025) to add columns and populate existing orders

---

## 🆕 Recent Updates (December 16, 2025)

### Customer Name Display Enhancement 🧑‍💼
- **Fixed User Name Visibility in Admin Orders Table**:
  - **Issue**: Admin users previously saw "Customer" placeholder instead of actual user names for marketplace orders
  - **Root Cause**: The orders store was not fetching user names from profiles table for admin users, only for kasir users
  - **Solution**: Updated `src/store/orders-store.ts` to fetch user profile data (user_name, user_email) for all orders when accessed by admin users
  - **Implementation Details**:
    - Added profile lookup for all user IDs in the fetched orders
    - Created a map of user ID to profile information for efficient access
    - Modified order processing to populate user_name field from profile data
    - Maintained backward compatibility with existing order data
  - **Result**: Admin users now see actual customer names in the orders table instead of generic "Customer" placeholder
  - **Impact**: Improved order management with clear visibility of which users made each order

---

## 🆕 Recent Updates (December 20, 2025)

### Enhanced Session Management & Timeout Handling 🔄
- **Fixed Session Timeout Issues During Long Browsing Sessions**:
  - **Issue**: Users experienced hanging or disconnection after browsing for extended periods (3+ minutes)
  - **Root Cause**: Session tokens expiring during long browsing sessions without proper refresh mechanism
  - **Solution**: Enhanced session management with proactive refresh and proper sign-out handling
  - **Key Improvements**:
    - Implemented proactive session refresh every 2 minutes to keep sessions alive
    - Added automatic refresh when tokens approach expiration (within 5 minutes)
    - Improved error handling for session refresh failures
    - Added proper user sign-out when session becomes invalid/expired
    - Enhanced timeout protection (increased to 15 seconds) to prevent hanging requests
  - **Implementation Details**:
    - Updated `src/hooks/use-auth.ts` with enhanced session refresh logic
    - Added `checkAndRefreshSession` function that runs every 2 minutes
    - Implemented proper sign-out when session refresh fails or token expires
    - Added additional checks for already expired tokens to enforce proper logout
    - Improved error handling to catch and handle session-related exceptions
  - **Result**: Users can now browse for extended periods without experiencing session timeouts
  - **Impact**: Improved user experience with seamless session continuation during long browsing sessions

### Database Migration for Tier Updates with RLS Bypass 🗃️
- **Fixed Membership Tier Display Issues Despite Sufficient Points**:
  - **Issue**: Users with sufficient points for higher tiers were not seeing their tiers updated in the UI
  - **Root Cause**: Row Level Security (RLS) policies restricting tier updates to admin users only, preventing automatic tier updates
  - **Solution**: Updated database trigger functions with SECURITY DEFINER to bypass RLS for tier updates
  - **Key Improvements**:
    - Added `SECURITY DEFINER` to `update_membership_tier()` function in `supabase/migrations/022_order_notification_triggers.sql`
    - Changed trigger from BEFORE UPDATE to AFTER UPDATE for proper execution flow
    - Implemented direct UPDATE statements within the function to bypass RLS restrictions
    - Added batch update process to fix all existing incorrect user tiers
    - Maintained tier calculation logic based on store settings thresholds
  - **Implementation Details**:
    - Function now runs with service role privileges to update tier column
    - Direct UPDATE to profiles table bypasses RLS policies
    - Batch update process retroactively fixes all users with incorrect tiers
    - Automatic tier updates continue to work for future point increases
  - **Result**: User tiers now properly update when they reach required point thresholds
  - **Impact**: Accurate membership tier display reflecting actual user point balances

---

## 📱 Mobile Responsiveness Improvements (December 21, 2025)

### Enhanced Game Page Layout for Mobile Devices 🎮
- **Fixed Game Container Visibility and Playability on Small Screens**:
  - **Issue**: Game play container was too small and partially hidden on mobile devices, making it difficult for users to play
  - **Root Cause**: Fixed height values and improper responsive layout causing overflow and unusable game area
  - **Solution**: Implemented responsive layout adjustments to ensure full game visibility across all devices
  - **Key Improvements**:
    - Adjusted game container heights with responsive breakpoints (500px on small screens, scaling up to 700px on larger screens)
    - Changed layout from fixed height to adaptive height using percentage-based divisions (70% game, 30% leaderboard on mobile)
    - Implemented flexbox layout that stacks vertically on mobile and horizontally on desktop
    - Added proper overflow handling to prevent content clipping
    - Maintained visual consistency with appropriate border sizing on both layouts
  - **Implementation Details**:
    - Modified `src/app/game/page.tsx` with responsive height classes (`h-[500px] sm:h-[600px] md:h-[720px] lg:h-[700px]`)
    - Updated container flex properties to properly allocate space between game and leaderboard
    - Changed from fixed pixel heights to percentage-based heights for better adaptability
    - Added proper border separation that adapts between mobile (horizontal) and desktop (vertical) views
  - **Result**: Game and leaderboard are now fully visible and usable on mobile devices
  - **Impact**: Improved mobile gaming experience with properly sized game area and accessible leaderboard

---

## 🔄 Recent Updates (December 21, 2025)

### News Ticker Animation Enhancement 🎢
- **Increased Animation Speed for Better User Experience**:
  - **Issue**: News ticker animation was moving too slowly at 60 seconds per cycle
  - **Solution**: Reduced animation duration from 60s to 20s for faster movement
  - **Implementation**: Updated `marquee-slow` animation in `src/app/globals.css` from 60s to 20s
  - **Improvement**: News ticker now cycles 3x faster, making it more engaging and readable

### Enhanced Buy-X-Get-Y Promotion Display 🛍️
- **Improved Buy-X-Get-Y Promotion Information in News Ticker**:
  - **Issue**: Buy-x-get-y promotions weren't displaying clear details about quantities
  - **Solution**: Enhanced display to show both buy quantity and get quantity explicitly
  - **Implementation**: Updated `useActivePromotions` hook to format buy_x_get_y promotions as "BUY [X] GET [Y] FREE"
  - **Key Improvement**: Now clearly shows how many items to buy and how many to get free
  - **Result**: Users can now easily understand buy-x-get-y promotions at a glance

---

## 🔄 Recent Updates (December 25, 2025)

### News Ticker Enhancement 📺
- **Updated News Ticker Messages & Display Format**:
  - **Issue**: News ticker was showing multiple separate promotional messages with limited display
  - **Solution**: Improved ticker to display all active promotions continuously with star separators
  - **Implementation Details**:
    - Combined all active promotions into a single continuous display
    - Added star icons (⭐) as separators between each promotional message
    - Changed default welcome message from generic greeting to "✨ Welcome to ShortTail.id - Healthy Treats for every Anabul! ✨"
    - Messages now flow in one continuous line instead of separate items
    - Maintained marquee animation for continuous scrolling experience
  - **Result**: News ticker now shows all active promotions plus welcome message in one seamless flow with better visual appeal

### Game Integration & Enhancement 🎮
- **Integrated New "PawPlay Zone" Game**:
  - **Issue**: Game page had placeholder content instead of actual gameplay
  - **Solution**: Implemented complete "PawPlay Zone" game with full functionality
  - **Implementation Details**:
    - Added new game components from gamePPzone folder
    - Created database migration (`026_add_player_stats_table.sql`) for game data persistence
    - Implemented game state synchronization with Supabase database
    - Added XP progression system with level-ups and rewards
    - Created virtual pet care mechanics (feeding, petting)
    - Implemented leaderboard functionality with top players display
    - Added sound effects and background music using Web Audio API
    - Created database synchronization for level progression rewards
  - **Special Feature**: Implemented bonus points system where users earn +20 points to their profile every 5 levels in the game
  - **Result**: Fully functional pet game experience with persistent data and rewards integrated into loyalty program

### Game UI Improvements 🎨
- **Enhanced Game Visual Elements**:
  - **Issue**: Original game had generic color scheme not matching brand colors
  - **Solution**: Updated game UI elements to use accent colors and brand-appropriate styling
  - **Implementation Details**:
    - Changed XP progress bar color to accent color (#ff911d)
    - Updated XP text display to appear directly on the progress bar
    - Modified secondary button color to match accent color (#ff911d)
    - Updated styling to match overall site's color scheme
  - **Result**: Game UI now visually integrates better with the overall site design

---

## Recent Updates (January 8, 2026)

### Enhanced User Navigation & Logout Functionality 🚪
- **Implemented Clear Logout Interface**:
  - **Issue**: Users were confused about how to logout from the application
  - **Solution**: Added a dropdown menu to the user profile in the desktop header
  - **Implementation Details**:
    - When logged in, user icon shows avatar and name with dropdown arrow
    - Dropdown contains: Dashboard, Settings, and Logout options
    - Logout button clearly marked with red color and logout icon
    - Mobile menu also updated to show "Dashboard" and "Logout" for logged-in users
    - Uses same signOut function as existing authentication system
  - **Result**: Users now have a clear, intuitive way to logout from the application

### Avatar Display Improvements & Image Upload 🖼️
- **Enhanced Avatar Validation & Upload Functionality**:
  - **Issue**: User avatars weren't displaying properly after refresh and required manual data URL creation
  - **Solution**: Added comprehensive validation and automated image conversion/upload functionality
  - **Implementation Details**:
    - Added specific WebP data URL validation function (`isValidWebPDataUrl`)
    - Implemented size validation to prevent excessively large data URLs (8MB limit)
    - Added detailed debugging logs to identify avatar loading issues
    - Updated avatar display across all pages (dashboard, admin, kasir, settings)
    - Added onLoad and onError handlers for comprehensive error tracking
    - Created new API route (`/api/avatar/update`) using service role to bypass RLS policies
    - Enhanced profile fetch operations to ensure avatar URL is properly retrieved
    - Added image conversion utility to automatically convert uploaded images to WebP format
    - Implemented file upload interface for easy avatar management in profile settings
  - **Result**: Avatars now display consistently and users can easily upload images that are automatically converted and validated

### Comprehensive Debugging Implementation 🔧
- **Added Detailed Error Logging**:
  - **Issue**: Difficult to diagnose avatar and image-related issues
  - **Solution**: Implemented comprehensive logging for avatar and image operations
  - **Implementation Details**:
    - Added logging for avatar URL validation with length and prefix information
    - Added logging when profiles are fetched and refetched
    - Added logging for avatar and image load and error events
    - Added verification steps in the avatar update API route
    - Enhanced error messages with detailed information about failure points
  - **Result**: Developers can now easily identify where avatar and image issues occur in the process

---

## Recent Updates (January 8, 2026)

### Hero Section Image Upload Enhancement 🖼️
- **Added WebP Image Upload for Hero Section**:
  - **Issue**: Admins couldn't upload custom hero section images directly from admin panel
  - **Solution**: Enhanced admin panel's Landing Page Management section with image upload functionality
  - **Implementation Details**:
    - Added dedicated upload component in "Landing Page Management" → "Hero Section"
    - Supports direct file upload with automatic conversion to WebP format
    - Validates file type (accepts all common image formats but converts to WebP)
    - Enforces 5MB size limit for performance
    - Converts images to WebP format with quality setting of 0.8 and max dimensions of 1920x1080
    - Integrates with existing "Hero Images" settings array in database
    - Provides visual feedback and error handling for invalid files
    - Added conversion utility function (`convertImageToWebP`) for automatic format conversion
    - Properly handles image data as data URLs for storage in database
  - **Result**: Administrators can now easily upload custom hero images that are automatically converted and optimized for the website

---

## Recent Updates (December 26, 2025)

### Enhanced Hero Section with Auto-Rotating Product Teaser 🛍️
- **Implemented Dynamic Floating Product Teaser Card**:
  - **Issue**: Hero section had static product teaser that didn't showcase real products from the store
  - **Solution**: Created auto-rotating product teaser that displays random products from the shop
  - **Implementation Details**:
    - Added client-side component for hero section to handle dynamic product loading
    - Fetches random active products that have images from database
    - Auto-rotates displayed product every 10 seconds with smooth animations
    - Shows product image, name, and formatted price
    - Includes loading state with skeleton elements
    - Added error handling for missing product images
    - Product images link to individual product pages
    - "Add to Cart" button links to cart with product pre-added
    - Proper state management for current product in rotation
    - Separated component structure to maintain server/client component compatibility
  - **Result**: Hero section now showcases real products from the store with engaging auto-rotation

### Admin-Configurable Hero Section Elements 🎨
- **Made "50% OFF" and "Vet Approved" Badges Editable**:
  - **Issue**: Discount and vet approved badges in hero section were hardcoded and not editable in admin panel
  - **Solution**: Added configurable fields in admin panel for these elements
  - **Implementation Details**:
    - Added "Discount Value" field to set percentage (defaults to "50%")
    - Added "Discount Label" field to set label (defaults to "OFF")
    - Added "Badge Text" field for vet approved text (defaults to "Vet Approved")
    - Updated frontpage to use admin settings with fallbacks to original values
    - Added new properties to HeroSectionSettings interface for TypeScript support
  - **Result**: Administrators can now customize these hero section elements through the admin panel

### Resized Hero Section Elements by 10% 🔍
- **Reduced Hero Section Size for Better Layout**:
  - **Issue**: Hero section elements were too large for some screen sizes
  - **Solution**: Reduced all elements in the hero section by 10% to improve layout
  - **Implementation Details**:
    - Main container: `w-[340px] md:w-[450px]` → `w-[306px] md:w-[405px]`
    - Main pet image border: `border-[8px]` → `border-[7px]`
    - Secondary image: `w-40 h-40 md:w-48 md:h-48` → `w-36 h-36 md:w-43 md:h-43`
    - Secondary image border: `border-[6px]` → `border-[5px]`
    - Product teaser card: `max-w-[160px]` → `max-w-[144px]`
    - Discount badge: `w-20 h-20` → `w-18 h-18`
    - Adjusted text sizes and margins throughout the hero section
    - Reduced various spacing elements (gaps, margins, padding) to maintain proportional relationships
  - **Result**: More balanced hero section that looks better on different screen sizes

### Enhanced Hero Section with Secondary Image Upload 🖼️
- **Added Secondary Image Upload Functionality**:
  - **Issue**: Only primary hero image could be uploaded via admin panel
  - **Solution**: Added separate upload functionality for secondary hero image
  - **Implementation Details**:
    - Added "Upload Secondary Hero Image" button in admin panel
    - Accepts JPEG, PNG, TIF, and WebP formats
    - Converts non-WebP images to WebP format with quality 0.8 and max dimensions of 1920x1080
    - Maintains existing functionality for primary image
    - Properly updates image URLs in the appropriate array position (secondary image updates index 1)
    - Includes file size validation (5MB limit) and format validation
  - **Result**: Admins can now easily upload both primary and secondary hero images through the admin panel

---

## 🔄 Recent Updates (January 9, 2026)

### Header Navigation Improvements 🎛️
- **Removed Mobile Menu Button from Header**:
  - **Issue**: Unnecessary menu button appearing on mobile devices that might confuse users
  - **Solution**: Removed the hamburger menu button from the header for a cleaner navigation experience
  - **Implementation Details**:
    - Removed the mobile menu toggle button from `src/components/layout/header.tsx`
    - Deleted the mobile menu dropdown that appeared when clicking the button
    - Removed related state (`isMobileMenuOpen`) and functions (`toggleMobileMenu`)
    - Updated search functionality to remove references to mobile menu state
    - Maintained other header functionality (search, user profile, cart, etc.)
  - **Result**: Cleaner, simplified header navigation without the extra menu button
  - **Impact**: Streamlined user experience with reduced navigation elements while maintaining core functionality

### Dashboard Recent Orders Section Enhancements 🛍️
- **Improved Mobile Responsiveness and Layout**:
  - **Issue**: Recent orders section in user dashboard wasn't optimized for mobile devices
  - **Solution**: Enhanced the layout and styling to be fully responsive and visually appealing on mobile
  - **Implementation Details**:
    - Reorganized layout to stack content vertically on small screens
    - Added proper spacing with `gap-3` for adequate space between elements
    - Made order ID truncate on small screens to prevent overflow with `truncate` class
    - Added `min-w-0` to prevent flex items from overflowing
    - Used `flex-wrap` for better arrangement of order ID and status badge
    - Made action buttons stack vertically on mobile with `flex flex-col sm:flex-row`
    - Added vertical spacing for action buttons on mobile with `space-y-2 sm:space-y-0`
    - Made buttons full width on mobile with `w-full sm:w-auto` and auto width on desktop
    - Increased button height for better touch targets on mobile (`h-9` vs `h-8`)
    - Added border to each order card for better visual separation
    - Improved time display with better separation of date and time
    - Added separator bullet (•) between date and time on larger screens
    - Increased price font size for better visibility (`text-lg`)
  - **Result**: Recent orders section now displays properly and attractively on all device sizes
  - **Impact**: Better user experience on mobile devices with properly sized touch targets and organized layout

### Game Daily Bonus & Quest Reset Logic Improvements ⏱️
- **Fixed Time-Based Reset System**:
  - **Issue**: Daily bonus and quest reset logic wasn't properly calculating 24-hour intervals
  - **Solution**: Updated the logic to use proper time intervals instead of just comparing date strings
  - **Implementation Details**:
    - Updated `checkDailyBonus` function in `src/store/gamePPzone/useGameStore.ts` to calculate hours since last login
    - Updated `checkDailyQuestsReset` function to calculate hours since last reset
    - Changed from comparing date strings (`toDateString()`) to using time calculations
    - Implemented proper 24-hour (86400000 milliseconds) interval checks
    - Added fallback for new users with no previous login/reset data
    - Store date/time values as ISO strings for accuracy and consistency
    - Check if at least 24 hours have passed since the last action
  - **Result**: Daily bonuses and quests now reset properly after 24 hours from the last login/reset
  - **Impact**: Consistent behavior regardless of when users play the game each day

### Game Mobile Touch Handling & Collision Detection Enhancement 📱
- **Fixed Mobile Game Interaction Issues**:
  - **Issue**: Character wasn't properly collecting items on mobile devices, items would fall through even when character was in the right position
  - **Solution**: Improved collision detection and touch handling for mobile devices
  - **Implementation Details**:
    - Increased collision width from `DOG_SIZE / 1.5` to `DOG_SIZE * 1.2` for better touch accuracy
    - Expanded Y-axis collision range from `80-95` to `78-97` for more forgiving catches
    - Added `preventDefault()` to touch events to prevent scrolling while dragging
    - Added `touch-pan-x` class to allow horizontal touch panning
    - Improved touch coordinate calculation for smooth and accurate movement tracking
    - Added proper boundary checks for touch movements
  - **Result**: Character now properly catches items when in the right position on mobile devices
  - **Impact**: Better game experience on mobile devices with accurate collision detection

### Header News Ticker Improvements 📺
- **Made News Ticker Sticky**:
  - **Issue**: News ticker was scrolling off the screen as users scrolled down the page
  - **Solution**: Implemented sticky positioning for the news ticker at the top of the page
  - **Implementation Details**:
    - Added `sticky` and `top-0` classes to news ticker container
    - Increased z-index to `z-50` to ensure it appears above other content
    - Positioned main header below the news ticker using `top-[28px]`
    - Added comment to clarify the positioning logic
  - **Result**: News ticker remains visible at the top of the page as users scroll
  - **Impact**: Improved visibility of promotions and announcements for better user engagement

---

## 🔄 Recent Updates (February 2, 2026)

### About Us Page Performance & UI Enhancements 🚀
- **Optimized About Us Page Data Loading**:
  - **Issue**: Slow initial load times requiring refresh to see content
  - **Solution**: Implemented parallel data fetching and caching for faster loading
  - **Implementation Details**:
    - Converted sequential data fetching to parallel using `Promise.allSettled()`
    - Added in-memory caching system with 5-minute TTL for about page data
    - Implemented retry logic for failed requests with exponential backoff
    - Added loading states with visual indicators during data fetch
    - Improved error handling to prevent blank screens on partial failures
  - **Result**: Dramatically reduced load times with cached data for returning users
  - **Impact**: Users see content immediately instead of waiting for multiple refreshes

- **Fixed Critical JSX Structure Issue**:
  - **Issue**: Page failed to build due to missing `</main>` closing tag causing parsing errors
  - **Root Cause**: Invalid JSX structure with unclosed HTML element
  - **Solution**: Added missing `</main>` tag to properly close the main content area
  - **Implementation Details**:
    - Identified missing closing tag between conditional content and Footer component
    - Corrected JSX structure to maintain proper element hierarchy
    - Ensured all opening tags have corresponding closing tags
    - Verified proper nesting of conditional rendering elements
  - **Result**: Page now builds successfully without parsing errors
  - **Impact**: Eliminates the need for manual refresh to view content

- **Enhanced Conditional Rendering**:
  - **Issue**: Multiple content blocks needed proper wrapper for conditional rendering
  - **Solution**: Implemented proper JSX fragment structure within conditional expressions
  - **Implementation Details**:
    - Added wrapper div to group multiple elements within conditional blocks
    - Ensured conditional expressions return single valid JSX elements
    - Maintained all performance optimizations with proper structural integrity
  - **Result**: Clean, valid JSX that renders all content sections properly
  - **Impact**: Improved stability and correct rendering of all about page sections

- **Enhanced Team Section Visual Design**:
  - **Issue**: Team section needed professional upgrade to represent team members
  - **Solution**: Redesigned team section with 5x better professional appearance
  - **Implementation Details**:
    - Increased profile image size to 160px for better visibility
    - Added animated hover effects with smooth transitions
    - Implemented proper spacing and typography hierarchy
    - Removed social media integration to streamline the design
    - Created responsive layout that works on all device sizes
    - Added decorative elements and gradient overlays
    - Maintained the 3-color rule (teal, cream, accent orange)
  - **Result**: Professional and visually appealing team representation
  - **Impact**: Builds trust and credibility with visitors through professional team presentation

- **Improved Timeline Section Design**:
  - **Issue**: Timeline section lacked modern design and responsive behavior
  - **Solution**: Implemented modern, responsive timeline with scrolling animations
  - **Implementation Details**:
    - Added alternating background colors (white and teal)
    - Implemented animated background elements with subtle movement
    - Created mobile view as stacked layout with vertical connectors
    - Added year badges in colorful circles with white text for better visibility
    - Implemented smooth gradient lines connecting milestones
    - Improved desktop view with alternating left/right card layout
    - Added scroll-triggered animations for all milestones
    - Used enhanced viewport detection for better performance
    - Added staggered delays for sequential appearance
    - Ensured responsive design maintains readability on all screens
  - **Result**: Modern, engaging timeline with smooth animations
  - **Impact**: Engaging user experience with smooth animations as users scroll down

---

## 🔄 Recent Updates (February 1, 2026)

### Admin Panel About Page Management Improvements 🛠️
- **Improved Admin Panel Organization and Mobile Responsiveness**:
  - **Issue**: About Us page management in admin panel was disorganized and not optimized for mobile devices
  - **Solution**: Restructured the admin interface with tab-based navigation and responsive design
  - **Implementation Details**:
    - Implemented tab-based navigation system to organize different content types (Sections, Values, Team, Milestones, Testimonials)
    - Added responsive grid layouts that adapt to different screen sizes
    - Created mobile-friendly touch targets with appropriate sizing
    - Improved visual hierarchy and spacing for better usability
    - Added proper loading states and error handling
    - Implemented cache invalidation after operations to ensure UI sync
    - Used consistent styling with the teal, cream, and accent color scheme
    - Added icons to each tab section for better visual recognition
    - Created separate modals for editing each content type
    - Improved data fetching and display across all content sections
  - **Result**: Admin panel now has organized, tab-based navigation with mobile-responsive design
  - **Impact**: Better user experience for managing About Us page content across all device sizes

- **Enhanced About Us Page Content Management**:
  - **Issue**: Different content types were displayed together without clear separation
  - **Solution**: Separated content management into distinct tab sections
  - **Implementation Details**:
    - Created dedicated sections for Page Sections, Core Values, Team Members, Milestones, and Testimonials
    - Added appropriate forms and UI for each content type
    - Implemented proper validation and error handling for all operations
    - Made sure each section loads data independently
    - Added proper refresh mechanisms after each CRUD operation
  - **Result**: Content management is now organized into logical sections
  - **Impact**: Admins can manage specific content types individually without confusion

---

## 🔄 Recent Updates (January 9, 2026)

### Promotions Management Sync & Mobile Touch Handling Improvements 🛒
- **Fixed Promotions Management Database Synchronization**:
  - **Issue**: Admin panel promotions management was not properly syncing with database, causing discrepancies between admin panel and actual promotional displays on the frontpage
  - **Solution**: Enhanced data synchronization mechanisms to ensure real-time updates between admin panel and database
  - **Implementation Details**:
    - Updated promotions store with proper cache invalidation after CRUD operations
    - Added manual refresh mechanisms after create/update/delete operations
    - Implemented proper error handling to prevent synchronization failures
    - Fixed type mismatches in the promotions table component that were causing data display issues
    - Implemented proper cache invalidation after operations to ensure data freshness
    - Added better error checking and reporting to alert admin users of sync issues
  - **Result**: Promotions management now properly reflects database state in real-time
  - **Impact**: Admin users can now reliably manage promotions knowing changes are immediately reflected in the system

- **Improved Mobile Touch Handling for Game Elements**:
  - **Issue**: Items in the Treat Catcher game were falling through the character on mobile devices despite being in the right position
  - **Solution**: Enhanced collision detection algorithms with more forgiving collision boundaries for touch interfaces
  - **Implementation Details**:
    - Increased collision detection area slightly to make it more forgiving on touch interfaces
    - Implemented more precise collision detection calculations that account for touch imprecision
    - Updated touch event handling to ensure proper positional accuracy
    - Added more responsive feedback when items are caught to improve user experience
  - **Result**: Items now properly collide with the character when in range on mobile devices
  - **Impact**: Better gameplay experience on mobile devices with accurate collection of items

---

## 🔄 Recent Updates (February 29, 2026)

### Enhanced Kasir/POS Mobile Responsiveness & UI Improvements 📱
- **Full Mobile Screen Order View**: When viewing current order on mobile devices, the panel now takes up the entire screen for better visibility of order items
- **Compact Item Layout**: Made order item cards more compact with smaller images (12x12), reduced padding, and smaller text sizes for better mobile screen utilization
- **Proper Scrolling**: Implemented proper scrollable area for cart items allowing users to scroll through all items without obstructing the fixed order summary
- **Fixed Bottom Order Summary**: Order summary and checkout button remain fixed at the bottom of the screen for easy access during scrolling
- **Improved Touch Targets**: Maintained appropriate touch targets on all interactive elements (quantity controls, delete buttons) while maximizing visible content
- **Item Count Notification**: Enhanced mobile floating cart icon with proper badge notification showing total item count
- **Enhanced Mobile Header**: Added item count to the mobile order panel header for better context

### UI/UX Improvements 🎨
- **Removed Unnecessary Toggle Button**: Eliminated redundant "Toggle Current Order" button from kasir page header for cleaner navigation
- **Better Mobile Layout**: Improved the mobile layout with proper flexbox structure separating header, scrollable content, and fixed footer
- **More Efficient Space Usage**: Optimized space usage on mobile devices to show more items at once while maintaining functionality

### Enhanced Promotions Control for POS System 💰
- **Promotion Toggle Feature**: Added toggle button to enable/disable automatic promotion application for specific orders
- **Desktop Implementation**: Added "Auto Promo" toggle button in the order header (labeled "Promotions Off" when disabled)
- **Mobile Implementation**: Added compact "On/Off" toggle button in the mobile order header
- **Visual Indicators**: Clear visual feedback with orange "Promotions Disabled" notice when promotions are turned off
- **Smart Logic**: When disabled, no promotions are automatically applied; when enabled, the system applies the best available promotion
- **Order Specific**: Toggle only affects the current order and resets for new orders
- **User Control**: Cashiers can now manually control when to apply promotions for specific customer requests

### Enhanced Product View Options for POS System 🛍️
- **View Mode Toggle**: Added toggle buttons to switch between grid view and list view for products
- **Grid View**: The default view showing products in a grid with images and key information
- **List View**: Alternative view showing products in a compact list format with more items visible at once
- **Responsive Design**: Both views are optimized for different screen sizes and use cases
- **Visual Consistency**: Maintains the same stock, variant, and pricing information in both views
- **User-Friendly**: Cashiers can choose the view that works best for their workflow and screen size

### Enhanced Grid View for Desktop Mode 💻
- **Visual Improvements**: Enhanced grid view with better hover effects and visual styling
- **Improved Spacing**: Better spacing and padding for optimal display on desktop screens
- **Refined Typography**: More readable text sizing and line heights for product information
- **Better Badge Styling**: Improved badges for stock and variant information with proper contrast
- **Variant Icon Fix**: Fixed variant indicator positioning to properly fit within product cards
- **Responsive Consistency**: Maintained consistency between desktop and mobile experiences

### Custom Order ID Format for POS and Marketplace Orders 📦
- **POS Order IDs**: POS orders now use format 'POSST' + date (YYYYMMDD) + sequence number (e.g., POSST202601150001)
- **Marketplace Order IDs**: Marketplace orders now use format 'MKSTP' + date (YYYYMMDD) + sequence number (e.g., MKSTP202601150001)
- **Sequential Numbering**: Each day starts with 0001 sequence number and increments for each new order
- **Differentiation**: Easy visual differentiation between POS and marketplace orders for admin team
- **Consistent Format**: Both POS and marketplace orders follow the same date-based sequential format
- **Database Integration**: Custom order IDs are stored in the database with proper uniqueness constraints

### Enhanced Notification System with Role-Based Functionality 🔔
- **Automatic Notifications**: System automatically generates notifications for key events (new orders, user registrations, reviews)
- **User Role Handling**: Different notification types based on user roles (admin, kasir, regular users)
- **Real-time Updates**: Real-time notification delivery with appropriate badge counts
- **Process Notifications**: Automatic notifications for order checkout (marketplace/POS), new user registration, and review submissions
- **Manual Notifications**: Admin panel functionality to create custom notifications for specific users or system-wide
- **Notification Pages**: Dedicated notification pages for users to manage their notifications
- **Quick Access**: Notification bell in header with quick access to notifications
- **Filtering & Search**: Advanced filtering and search capabilities for notification management
- **Database Triggers**: Automated database triggers for creating notifications on system events
- **User Dashboard Integration**: Notifications linked in user dashboard with appropriate UI elements
- **Fixes**: Added missing Bell icon import to dashboard page and implemented formatDate function in notifications page

---

## 🔄 Recent Updates (December 31, 2025)

### About Us Page Hero Section Enhancements 🎨
- **Restructured Hero Layout**: Changed from single column to responsive two-column layout on desktop
- **Store Logo Positioning**: Moved store logo to left column with dedicated container
- **Content Organization**: Title and description now in right column with proper container
- **Responsive Design**: Columns stack vertically on mobile devices for better mobile experience
- **Visual Improvements**: Enhanced spacing, typography, and element positioning for better visual hierarchy
- **Container Separation**: Store logo, title, and content now have separate containers for better organization
- **Improved Structure**: Clean and organized layout that maintains visual appeal across all device sizes

---

## 🔄 Recent Updates (January 1, 2026)

### User Dashboard Layout Restructuring 🎨
- **Quick Action Cards Positioning**: Moved dashboard quick action cards (Orders, My Pets, Wishlist, Notifications, Game) to appear just below the header navigation in a single responsive row
- **Removed Dashboard Title & Subtitle**: Eliminated the "Dashboard" heading and "Welcome back" subtitle for cleaner interface
- **Two-Column Content Layout**: Organized remaining dashboard content sections in a two-column layout below the quick action cards
- **Section Rearrangement**: Reordered dashboard sections for better user flow:
  - Left Column: Profile Card → Membership Progress → Referral Program
  - Right Column: My Pets → Recent Orders
- **Improved User Experience**: Enhanced layout hierarchy to prioritize most important user information and actions

### Admin Panel Enhancement - Temporary Customer Data Management 🛠️
- **New Admin Section**: Added 'Temp Customer Data' section to admin panel sidebar
- **CRUD Operations**: Full Create, Read, Update, and Delete functionality for temp_custdata table
- **Bulk Import Feature**: CSV import functionality with validation for required fields
- **Bulk Export Feature**: CSV export functionality with formatted date columns
- **Search Capability**: Added search functionality to filter records by various fields
- **API Endpoints**: Created secure API routes for import/export operations with proper authentication and authorization
- **User Interface**: Clean, responsive UI with form validation and user feedback through toast notifications

---

## License

Private project - All rights reserved.
