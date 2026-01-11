# ShortTail.id - Pet Shop E-Commerce Platform

## System Overview

ShortTail.id is a comprehensive e-commerce platform for pet supplies built with Next.js 16 and Supabase. The platform features a marketplace for customers, POS system for in-store sales, admin dashboard, and various gamification features.

## Technology Stack

- **Frontend**: Next.js 16 with App Router and Turbopack
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Styling**: Tailwind CSS 4 with custom "Brownish" theme
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: Zustand (with persist middleware)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Core System Components

### 1. Authentication & Authorization

#### Authentication Methods
- Primary: Phone number authentication (Indonesian format: 08xx or +62xx)
- Optional: Email for order notifications
- Password-based login with automatic phone number formatting
- OTP support as alternative method

#### Role-Based Access Control (RBAC)
- `master_admin`: Full system access
- `normal_admin`: Product, order, user, and promotion management
- `kasir`: POS system access and assigned order processing
- `super_user`: Special admin role
- `normal_user`: Customer access

#### Session Management
- Next.js middleware handles session refresh
- Proactive refresh every 2 minutes
- Token validation and handling for `TOKEN_REFRESHED`, `SIGNED_OUT`, `SIGNED_IN` events

### 2. Core Modules

#### Public Storefront
- Homepage redirects to `/about` page
- Product catalog with filtering and search
- Shopping cart with persistence
- Checkout flow with shipping calculation

#### Admin Dashboard (`/admin`)
- Dashboard overview with 8 real-time metric cards
- Product management (CRUD with variants support)
- Category management
- Order management (status updates)
- User management (role assignment, password management)
- Promotions management (5 promotion types)
- Reviews moderation panel
- Notifications management
- Landing page customization
- Shipping configuration

#### POS/Kasir System (`/kasir`)
- Point of sale interface for in-store transactions
- Product grid with category filtering
- Product variants support
- Cart management and checkout
- Order history and status tracking

#### User Dashboard (`/dashboard`)
- Profile management
- Pet profiles
- Order history
- Wishlist management
- Referral program
- Loyalty points and membership tiers

### 3. Database Schema

#### User Management Tables
- `profiles` - User profiles extending auth.users with role, tier, points, referral system
- `pets` - User pet information (type, name, birthday, weight, microchip ID)
- `social_media_links` - Footer social links with platform, URL, sort order
- `temp_custdata` - Imported customer data from CSV files

#### Product Management Tables
- `products` - Product catalog with name, description, pricing, stock, variants, categories
- `product_variants` - Product variants with size, flavor, price adjustments, individual stock
- `categories` - Product categories with hierarchical structure support
- `wishlists` - User saved products for later purchase

#### About Page Management Tables
- `about_page_sections` - Settings and content for different sections of the About Us page
- `about_values` - Company values and principles
- `about_team_members` - Team member profiles and information
- `about_milestones` - Timeline of company achievements
- `about_testimonials` - Customer testimonials and reviews

#### Order Management Tables
- `orders` - Order records with user, status, amounts, shipping, payment information
- `order_items` - Individual items within orders with product and variant references
- `shipping_couriers` - Available shipping options with logos, costs, delivery times
- `shipping_rates` - Province-specific shipping rates
- `provinces` - Indonesian provinces for shipping destination management

#### Promotion & Marketing Tables
- `promotions` - Discount codes and campaigns with various discount types
- `promotion_tiers` - Tiered discount configurations
- `promotion_usage` - Tracking of promotion usage per user and order
- `reviews` - Product reviews with rating and approval status
- `notifications` - System and user notifications with read/unread status

#### Configuration Tables
- `store_settings` - Global store configuration (name, description, logo, shipping, payment, loyalty)
- `landing_page_sections` - Configurable homepage sections with visibility flags

#### Enums & Types
- `app_role`: 'master_admin', 'normal_admin', 'kasir', 'super_user', 'normal_user'
- `membership_tier`: 'Newborn', 'Transitional', 'Juvenile', 'Adolescence', 'Adulthood'
- `order_status`: 'pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'
- `order_source`: 'marketplace', 'pos'

### 4. Key Features

#### Shipping System
- RajaOngkir Komerce API integration
- Province-based shipping rates
- Weight-based shipping multipliers
- Multiple courier options (JNE, POS, TIKI)
- Configurable shipping origin in store settings

#### Promotions System
- 5 promotion types:
  - Percentage Off
  - Fixed Amount Off
  - Buy X Get Y
  - Buy More Save More (tiered discounts)
  - Free Shipping
- Product/category targeting
- Usage limits per user
- Minimum purchase requirements
- Scheduled validity periods

#### Loyalty & Gamification
- Points accumulation (configurable rate)
- 5 Membership tiers with progressive benefits
- Referral system with bonus points
- Pet game integration with XP progression
- Daily bonus and quest systems

#### Invoice & Packing Lists
- JPEG invoice generation with recipient information
- PDF packing list generation
- Store logo integration
- Proper formatting for printing

#### Real-time Notifications
- Supabase Realtime subscriptions
- Bell icon with unread count
- Toast notifications for alerts

### 5. State Management & Caching

The application uses sophisticated Zustand-based caching with 5-minute TTLs:

- `cart-store` - Persistent with localStorage
- `categories-store` - 5-minute cache
- `orders-store` - 5-minute cache
- `users-store` - 5-minute cache
- `products-store` - 5-minute cache
- `promotions-store` - 5-minute cache
- `store-settings-store` - 5-minute cache
- `ABOUT_PAGE_CACHE` - 5-minute in-memory cache

### 6. API Routes

Server-side routes to bypass RLS performance issues:
- `/api/settings` - Update store settings
- `/api/users/create` - Create users with roles
- `/api/products/create` - Create products efficiently
- `/api/orders/kasir` - Fetch orders for kasir users
- `/api/shipping/rajaongkir` - Shipping calculations
- `/api/auth/register` - Server-side registration
- `/api/admin/import-temp-custdata` - CSV import
- `/api/admin/export-temp-custdata` - CSV export

### 7. Performance Optimizations

- Database indexes for frequently queried columns
- Parallel data fetching with `Promise.allSettled()`
- Request deduplication
- Smart caching with TTL expiration
- Image optimization (WebP format with Canvas API)
- Lazy loading for images and components

### 8. Mobile Responsiveness

- Responsive design for all screen sizes
- Touch-friendly UI with 44px minimum touch targets
- Optimized POS interface for mobile
- Mobile-optimized checkout flow

### 9. Security Implementation

- Complete Row Level Security (RLS) policies per table
- Protected routes with middleware
- Secure handling of API keys (server-side only)
- Proper session management
- Input validation and sanitization

### 10. Database Functions & Triggers

- `validate_promotion_code()` - Validates promotions with all business rules
- `notify_staff_of_order_change()` - Creates notifications on order status changes
- `update_membership_tier()` - Automatically updates user tier based on points
- Various shipping calculation functions
- Custom order ID generation functions (POSST and MKSTP prefixes)

This comprehensive system provides a complete e-commerce solution for pet supplies with advanced features for inventory management, customer relationship management, marketing automation, and omnichannel sales.