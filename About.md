# ShortTail.id - Premium Pet Supplies E-Commerce Platform

## Overview

ShortTail.id is a comprehensive e-commerce platform specializing in premium pet supplies, serving the Indonesian market. Built with modern web technologies including Next.js 16, TypeScript, and Supabase, the platform offers a seamless shopping experience for pet owners looking for high-quality food, toys, accessories, and healthcare products for their beloved companions.

## Core Features

### 1. User Authentication & Management
- **Multi-channel Login**: Support for both phone number and email authentication
- **OTP Verification**: Secure SMS-based one-time password verification
- **Role-based Access Control**: Four-tier role system (master_admin, normal_admin, kasir, normal_user)
- **Password Recovery**: Comprehensive password reset functionality with email/SMS verification
- **Session Management**: Automatic session refresh and idle timeout protection

### 2. Product Catalog & Inventory
- **Product Management**: Detailed product listings with descriptions, pricing, and images
- **Product Variants**: Support for multiple variants (sizes, colors, weights) with individual pricing and stock tracking
- **Inventory Management**: Real-time stock tracking with low-stock alerts
- **Categories**: Organized product categorization system
- **Search & Filter**: Advanced filtering capabilities including price range sliders and stock availability

### 3. Shopping Experience
- **Shopping Cart**: Persistent cart functionality with real-time updates
- **Wishlist**: Save favorite products for future purchase
- **Checkout Process**: Streamlined checkout with address management
- **Order Tracking**: Complete order lifecycle management (pending, paid, packed, shipped, delivered, cancelled, returned)
- **Shipping Integration**: Multiple courier options with real-time shipping calculations

### 4. User Profiles & Pet Management
- **User Profiles**: Comprehensive user profiles with contact information and preferences
- **Pet Profiles**: Individual pet profiles linked to user accounts with breed, age, weight, and health information
- **Address Book**: Multiple shipping and billing addresses per user
- **Order History**: Complete order history with detailed tracking information

### 5. Administrative Features
- **Admin Dashboard**: Comprehensive administrative interface with role-based access
- **Product Management**: Full CRUD operations for products, variants, and categories
- **Order Management**: Complete order processing workflow with status updates
- **User Management**: User account oversight and role assignment
- **Promotion Management**: Discount code creation and campaign management
- **Traffic Analytics**: Real-time website traffic monitoring with geographic and device breakdown

### 6. Marketing & Engagement
- **Promotional System**: Flexible discount system (percentage, fixed, buy-x-get-y)
- **Membership Tiers**: Five-tier membership system (Newborn, Transitional, Juvenile, Adolescence, Adulthood)
- **Points System**: Loyalty points accumulation and redemption
- **Reviews & Ratings**: Customer review system with approval workflow
- **Referral Program**: Built-in referral code system for customer acquisition

### 7. Technical Features
- **Real-time Analytics**: Comprehensive traffic tracking with geolocation data
- **Performance Optimization**: Client-side caching, timeout handling, and request cancellation
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Accessibility**: Screen reader support and ARIA-compliant components
- **Security**: Row Level Security (RLS) policies, secure authentication, and data protection

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: Shadcn/ui with custom extensions
- **Animations**: Framer Motion for smooth transitions
- **State Management**: Zustand for client-side state
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend & Database
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **API**: RESTful API routes with server actions
- **Storage**: Supabase Storage for media files
- **Real-time**: Supabase Realtime for live updates

### Infrastructure
- **Hosting**: Vercel (frontend) with Supabase (backend)
- **CDN**: Supabase CDN for asset delivery
- **Email**: Configurable email services (Gmail SMTP or Brevo)

## Database Schema

The application utilizes a comprehensive database schema with the following key tables:

### 1. profiles
User accounts with roles, tiers, contact information, and addresses
- `id`: UUID (Primary Key, References auth.users.id, CASCADE delete)
- `user_phoneno`: TEXT (Unique, Not Null)
- `user_name`: TEXT
- `user_email`: TEXT
- `user_avatar_url`: TEXT
- `role`: app_role enum (default: 'normal_user')
- `tier`: membership_tier enum (default: 'Newborn')
- `points_balance`: INTEGER (default: 0)
- `referral_code`: TEXT (Unique)
- `referred_by`: UUID (References profiles.id)
- `address_line1`: TEXT
- `city`: TEXT
- `region_state_province`: TEXT
- `postal_code`: TEXT
- `country_id`: INTEGER (default: 62)
- `recipient_name`: TEXT
- `recipient_address_line1`: TEXT
- `recipient_city`: TEXT
- `recipient_region`: TEXT
- `recipient_postal_code`: TEXT
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 2. pets
Individual pet profiles linked to user accounts
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `owner_id`: UUID (References profiles.id, CASCADE delete, Not Null)
- `pet_type`: TEXT (Not Null)
- `pet_name`: TEXT (Not Null)
- `pet_birthday`: DATE
- `pet_gender`: TEXT
- `pet_weight_kg`: DECIMAL(5,2)
- `pet_chip_id`: TEXT
- `pet_image_url`: TEXT
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 3. products
Product catalog with descriptions, pricing, and inventory
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `name`: TEXT (Not Null)
- `description`: TEXT
- `sku`: TEXT (Unique)
- `category`: TEXT
- `base_price`: NUMERIC(12, 2) (Not Null)
- `stock_quantity`: INTEGER (default: 0)
- `condition`: TEXT (CHECK: 'new' or 'secondhand')
- `has_variants`: BOOLEAN (default: FALSE)
- `main_image_url`: TEXT
- `gallery_image_urls`: TEXT[] (array of image URLs)
- `unit_weight_grams`: INTEGER (default: 0)
- `is_active`: BOOLEAN (default: TRUE)
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 4. product_variants
Product variations with individual pricing and stock
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `product_id`: UUID (References products.id, CASCADE delete, Not Null)
- `variant_name`: TEXT (Not Null)
- `sku`: TEXT
- `variant_image_url`: TEXT
- `unit_label`: TEXT
- `weight_grams`: INTEGER
- `price_adjustment`: NUMERIC(12, 2) (default: 0)
- `stock_quantity`: INTEGER (default: 0)
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 5. orders
Order management with status tracking and shipping details
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `user_id`: UUID (References profiles.id)
- `cashier_id`: UUID (References profiles.id)
- `source`: order_source enum (default: 'marketplace')
- `status`: order_status enum (default: 'pending')
- `subtotal`: NUMERIC(12, 2) (Not Null)
- `shipping_fee`: NUMERIC(12, 2) (default: 0)
- `discount_amount`: NUMERIC(12, 2) (default: 0)
- `total_amount`: NUMERIC(12, 2) (Not Null)
- `shipping_courier_name`: TEXT
- `shipping_address_snapshot`: JSONB
- `invoice_url`: TEXT
- `packing_list_url`: TEXT
- `is_packing_list_downloaded`: BOOLEAN (default: FALSE)
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 6. order_items
Individual items within orders
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `order_id`: UUID (References orders.id, CASCADE delete)
- `product_id`: UUID (References products.id)
- `variant_id`: UUID (References product_variants.id)
- `quantity`: INTEGER (Not Null)
- `price_at_purchase`: NUMERIC(12, 2) (Not Null)

### 7. promotions
Discount codes and promotional campaigns
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `code`: TEXT (Unique, Not Null)
- `description`: TEXT
- `discount_type`: TEXT (CHECK: 'percentage', 'fixed', 'buy_x_get_y')
- `discount_value`: NUMERIC(12, 2)
- `min_purchase_amount`: NUMERIC(12, 2)
- `start_date`: TIMESTAMPTZ
- `end_date`: TIMESTAMPTZ
- `is_active`: BOOLEAN (default: TRUE)

### 8. shipping_couriers
Shipping carrier information
- `id`: SERIAL (Primary Key)
- `courier_name`: TEXT (Not Null)
- `courier_logo_url`: TEXT
- `base_cost`: NUMERIC(12, 2)
- `is_active`: BOOLEAN (default: TRUE)

### 9. reviews
Product reviews with ratings and approval status
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `user_id`: UUID (References profiles.id)
- `product_id`: UUID (References products.id)
- `rating`: INTEGER (CHECK: 1-5)
- `comment`: TEXT
- `is_approved`: BOOLEAN (default: FALSE)
- `created_at`: TIMESTAMPTZ (default: NOW())

### 10. notifications
User notification system
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `user_id`: UUID (References profiles.id)
- `title`: TEXT (Not Null)
- `message`: TEXT (Not Null)
- `is_read`: BOOLEAN (default: FALSE)
- `action_link`: TEXT
- `created_at`: TIMESTAMPTZ (default: NOW())

### 11. traffic_logs
Website traffic tracking with geolocation data
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `ip_address`: INET (Not Null)
- `user_agent`: TEXT
- `page_url`: TEXT
- `referrer`: TEXT
- `user_id`: UUID (References profiles.id)
- `country_code`: TEXT
- `city`: TEXT
- `latitude`: NUMERIC(8, 5)
- `longitude`: NUMERIC(8, 5)
- `created_at`: TIMESTAMPTZ (default: NOW())

### 12. about_page_sections
Dynamic content for the about page
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `section_key`: TEXT (Not Null, e.g., 'hero', 'mission', 'values', 'team', 'milestones', 'testimonials', 'cta')
- `title`: TEXT
- `subtitle`: TEXT
- `content`: TEXT
- `is_active`: BOOLEAN (default: TRUE)
- `sort_order`: INTEGER (default: 0)
- `settings`: JSONB
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 13. about_values
Values section for the about page
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `title`: TEXT (Not Null)
- `description`: TEXT (Not Null)
- `icon`: TEXT (Not Null)
- `sort_order`: INTEGER (default: 0)
- `is_active`: BOOLEAN (default: TRUE)
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 14. about_team_members
Team member information for the about page
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `name`: TEXT (Not Null)
- `role`: TEXT (Not Null)
- `bio`: TEXT (Not Null)
- `image_url`: TEXT
- `sort_order`: INTEGER (default: 0)
- `is_active`: BOOLEAN (default: TRUE)
- `social_links`: JSONB
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 15. about_milestones
Company milestones for the about page
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `year`: INTEGER (Not Null)
- `title`: TEXT (Not Null)
- `description`: TEXT (Not Null)
- `icon`: TEXT (Not Null)
- `is_featured`: BOOLEAN (default: FALSE)
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 16. about_testimonials
Customer testimonials for the about page
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `customer_name`: TEXT (Not Null)
- `customer_role`: TEXT (Not Null)
- `testimonial_text`: TEXT (Not Null)
- `rating`: INTEGER (Not Null)
- `customer_image_url`: TEXT
- `is_verified`: BOOLEAN (default: FALSE)
- `is_featured`: BOOLEAN (default: FALSE)
- `created_at`: TIMESTAMPTZ (default: NOW())
- `updated_at`: TIMESTAMPTZ (default: NOW())

### 17. wishlist
User product wishlists
- `id`: UUID (Primary Key, default: gen_random_uuid())
- `user_id`: UUID (References profiles.id, CASCADE delete, Not Null)
- `product_id`: UUID (References products.id, CASCADE delete, Not Null)
- `created_at`: TIMESTAMPTZ (default: NOW())

### Custom Enum Types
The database also includes several custom enum types:
- `app_role`: ENUM ('master_admin', 'normal_admin', 'kasir', 'normal_user')
- `membership_tier`: ENUM ('Newborn', 'Transitional', 'Juvenile', 'Adolescence', 'Adulthood')
- `order_status`: ENUM ('pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')
- `order_source`: ENUM ('marketplace', 'pos')

## Security Measures

- **Row Level Security (RLS)**: Database-level security ensuring users only access authorized data
- **Role-based Access Control**: Middleware-enforced access restrictions
- **Session Management**: Automatic token refresh and secure session handling
- **Input Validation**: Comprehensive server and client-side validation
- **Rate Limiting**: Protection against abuse and automated attacks

## Recent Enhancements

### Traffic Analytics System
- Comprehensive traffic tracking with hourly, daily, monthly, and yearly reports
- Geographic distribution visualization
- Device type analysis (mobile, tablet, desktop)
- Top pages reporting
- Admin dashboard with interactive charts

### Enhanced User Experience
- Improved mobile touch handling for game elements
- Better form validation and error messaging
- Optimized loading states and performance
- Enhanced password reset flow with improved session handling

### Performance & Reliability
- Increased timeout values for better network resilience
- Improved session management consistency
- Enhanced error handling with detailed logging
- Optimized database queries with proper indexing

## Business Model

ShortTail.id operates as a premium pet supplies e-commerce platform focusing on:
- High-quality products from trusted manufacturers
- Excellent customer service and support
- Competitive pricing with promotional campaigns
- Membership benefits and loyalty programs
- Nationwide shipping coverage in Indonesia

## Target Market

The platform serves Indonesian pet owners seeking:
- Premium pet food and nutrition products
- Quality toys and accessories
- Healthcare and grooming products
- Expert advice and recommendations
- Convenient online shopping experience

## Future Roadmap

Planned enhancements include:
- Mobile application development
- Advanced recommendation engine
- Enhanced social features for pet communities
- Expanded product categories
- International shipping capabilities
- Advanced analytics and business intelligence tools

## Contact & Support

For customer support, inquiries, or feedback, users can contact the ShortTail.id team through the platform's integrated support system or via the contact information provided on the website.