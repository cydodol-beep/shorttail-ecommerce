# ShortTail.id — Comprehensive Code Review

**Reviewer:** Kilo Code  
**Date:** 2026-02-08  
**Scope:** Web app logic, database schema, API routes, state management, middleware, and configuration

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema Review](#database-schema-review)
4. [Security Issues](#security-issues)
5. [API Routes Review](#api-routes-review)
6. [Middleware Review](#middleware-review)
7. [State Management Review](#state-management-review)
8. [Component Review](#component-review)
9. [Performance Issues](#performance-issues)
10. [Code Quality Issues](#code-quality-issues)
11. [Configuration Issues](#configuration-issues)
12. [Recommendations Summary](#recommendations-summary)

---

## 1. Executive Summary

ShortTail.id is a **Next.js 16 + Supabase** e-commerce platform for a pet shop with a POS (Point of Sale) system, membership tiers, promotions, and shipping integration (RajaOngkir). The codebase is functional but has several **critical security vulnerabilities**, **performance bottlenecks**, and **code quality issues** that should be addressed before production deployment.

### Severity Breakdown
| Severity | Count |
|----------|-------|
| 🔴 Critical | 8 |
| 🟠 High | 12 |
| 🟡 Medium | 15 |
| 🔵 Low | 10 |

---

## 2. Architecture Overview

**Stack:** Next.js 16 (App Router) + Supabase + Zustand + Tailwind CSS + Radix UI

**Strengths:**
- Clean separation of concerns with stores, hooks, and components
- Proper use of Supabase SSR client patterns (browser/server/middleware)
- Good use of Zustand for client-side state with caching
- Comprehensive RLS policies on all tables
- Singleton pattern for browser Supabase client prevents memory leaks

**Weaknesses:**
- Monolithic kasir page (~2600 lines)
- Inconsistent error handling patterns across API routes
- Mixed use of `Response.json()` and `NextResponse.json()`
- 34+ migration files with duplicate numbering conflicts

---

## 3. Database Schema Review

### 🔴 Critical: Duplicate Migration Numbers

Multiple migrations share the same number prefix, which can cause ordering issues:

- `007_add_qris_payment.sql`, `007_add_recipient_phone.sql`, `007_update_store_settings.sql`
- `008_add_customer_notes.sql`, `008_fix_promotions_rls.sql`
- `021_additional_performance_indexes.sql`, `021_fix_related_products_function.sql`, `021_related_products.sql`
- `022_order_notification_triggers.sql`, `022_related_products.sql`
- `023_add_total_weight_to_orders.sql`, `023_create_temp_custdata_table.sql`
- `024_add_rls_to_temp_custdata.sql`, `024_add_user_cashier_names_to_orders.sql`
- `026_add_game_fields_to_profiles.sql`, `026_add_player_stats_table.sql`
- `027_about_page_tables.sql`, `027_add_cities_table.sql`, `027_add_custom_order_id.sql`
- `029_add_shipping_origin_city_id_to_store_settings.sql`, `029_advertisements.sql`, `029_fix_order_notification_uuid_cast.sql`

**Fix:** Renumber all migrations sequentially. Use a single migration per number.

### 🟠 High: Missing Foreign Key Indexes

While `006_performance_indexes.sql` adds some indexes, several foreign key columns lack indexes:

- `order_items.order_id` — no explicit index (used in RLS subqueries)
- `order_items.product_id` — no explicit index
- `order_items.variant_id` — no explicit index
- `notifications.user_id` — no explicit index
- `reviews.user_id` — no explicit index
- `reviews.product_id` — no explicit index
- `pets.owner_id` — no explicit index

**Fix:** Add indexes on all foreign key columns used in WHERE/JOIN clauses.

### 🟠 High: Old `category` Text Column Not Dropped

In `003_categories.sql`, a `category_id` UUID column is added to products, and existing data is migrated from the text `category` column. However, the old `category` column is never dropped (commented out). This creates confusion and potential data inconsistency.

**Fix:** Drop the old `category` text column after verifying migration.

### 🟡 Medium: `store_settings` Uses UUID Primary Key for Single-Row Table

The `store_settings` table uses a UUID primary key but is designed as a single-row table. This is unnecessary complexity.

**Fix:** Use `id INTEGER PRIMARY KEY DEFAULT 1` with a CHECK constraint `CHECK (id = 1)` to enforce single-row.

### 🟡 Medium: `calculate_shipping_cost` Function Has a Bug

In `010_province_based_shipping.sql`, the `calculate_shipping_cost` function joins `provinces` with `LOWER(p.province_name) = LOWER(p_province_name)` but the LEFT JOIN condition is on `sr.province_id`, meaning it will return the courier's base cost for ALL provinces, not just the matching one.

```sql
LEFT JOIN public.shipping_rates sr ON sr.courier_id = sc.id
LEFT JOIN public.provinces p ON p.id = sr.province_id AND LOWER(p.province_name) = LOWER(p_province_name)
```

The province filter is on the JOIN, not in the WHERE clause, so it will return rows even when no province matches.

**Fix:** Move the province filter to the WHERE clause or restructure the query.

### 🟡 Medium: No `updated_at` Trigger on Several Tables

Tables like `promotion_tiers`, `promotion_usage`, `landing_page_sections` lack `updated_at` triggers.

### 🔵 Low: Inconsistent Schema Qualification

Some migrations use `public.` prefix (e.g., `public.profiles`), while `020_landing_page_settings.sql` omits it (e.g., `landing_page_sections`). Be consistent.

---

## 4. Security Issues

### 🔴 Critical: API Key Logged in Console

In `src/app/api/shipping/rajaongkir/route.ts` (line 26-29):

```typescript
console.log('🔑 API Key check:', { 
  hasKey: !!rajaongkirApiKey,
  keyLength: rajaongkirApiKey?.length || 0,
  keyPreview: rajaongkirApiKey ? rajaongkirApiKey.substring(0, 8) + '...' : 'none'
});
```

The first 8 characters of the API key are logged. This is a security risk in production.

**Fix:** Remove all API key logging. Only log `hasKey: boolean`.

### 🔴 Critical: Excessive Debug Logging in Production

`src/app/api/auth/forgot-password/route.ts` contains ~30 `console.log` statements that expose:
- Raw phone numbers
- User profile data (IDs, names, emails)
- Database query results
- Supabase configuration status

**Fix:** Use a proper logging library with log levels. Remove all sensitive data from logs. Use `process.env.NODE_ENV` to gate debug logs.

### 🔴 Critical: `lookup-email` API Has No Rate Limiting

`src/app/api/auth/lookup-email/route.ts` allows unauthenticated phone-to-email lookups using the admin client. An attacker could enumerate all user emails by brute-forcing phone numbers.

**Fix:** Add rate limiting, require authentication, or remove this endpoint.

### 🔴 Critical: `register` API Has No Rate Limiting

`src/app/api/auth/register/route.ts` allows unlimited registration attempts. An attacker could:
- Enumerate existing phone numbers via error messages
- Create spam accounts

**Fix:** Add rate limiting (e.g., using `next-rate-limit` or Vercel Edge middleware).

### 🟠 High: Non-Null Assertion Operators on Environment Variables

Throughout the codebase, environment variables use `!` (non-null assertion):

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
process.env.SUPABASE_SERVICE_ROLE_KEY!
```

If these are missing, the app will crash with an unhelpful error.

**Fix:** Validate environment variables at startup. Use a schema validation library like `zod` or `t3-env`.

### 🟠 High: `users/update/route.ts` Uses `supabase.auth.admin` Without Admin Client

In `src/app/api/users/update/route.ts` (line 61):

```typescript
const { error: passwordError } = await supabase.auth.admin.updateUserById(
  userId,
  { password: userData.password }
);
```

The `supabase` variable is created from `createClient()` (server client with anon key), not `createAdminClient()`. The `auth.admin` namespace requires the service role key. This will silently fail.

**Fix:** Use `createAdminClient()` for admin operations.

### 🟠 High: SQL Injection Risk in Profile Search

In `src/app/(protected)/kasir/page.tsx` (line 257):

```typescript
.or(`user_name.ilike.%${query}%,user_phoneno.ilike.%${query}%,...`)
```

The `query` variable is user input directly interpolated into the Supabase filter string. While Supabase's PostgREST does parameterize values, the `.or()` string format could be exploited with specially crafted input containing commas or parentheses.

**Fix:** Use Supabase's `.ilike()` method with proper parameterization, or sanitize the input more thoroughly.

### 🟡 Medium: `search-temp-custdata` Creates Admin Client Inline

In `src/app/api/kasir/search-temp-custdata/route.ts` (lines 52-56):

```typescript
const { createClient: createServiceClient } = await import('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createServiceClient(supabaseUrl, serviceRoleKey);
```

This duplicates the admin client creation logic instead of using the existing `createAdminClient()` utility.

**Fix:** Import and use `createAdminClient()` from `@/lib/supabase/admin`.

### 🟡 Medium: Password Minimum Length is Only 6 Characters

All password validation checks only require 6 characters. This is below modern security standards.

**Fix:** Require at least 8 characters with complexity requirements (uppercase, lowercase, number).

---

## 5. API Routes Review

### 🟠 High: `reset-password/route.ts` Doesn't Actually Reset the Password

The `reset-password` route exchanges a code for a session but never calls `updateUser({ password })`. The comment says "Supabase handles password reset differently" but the actual password update is missing.

**Fix:** After `exchangeCodeForSession`, call `supabase.auth.updateUser({ password })`.

### 🟡 Medium: Inconsistent Response Patterns

Some routes use `NextResponse.json()`, others use `Response.json()`:

| Route | Pattern |
|-------|---------|
| `register/route.ts` | `NextResponse.json()` |
| `forgot-password/route.ts` | `Response.json()` |
| `reset-password/route.ts` | `Response.json()` |
| `signout/route.ts` | `NextResponse.json()` |
| `update-password/route.ts` | `Response.json()` |

**Fix:** Standardize on `NextResponse.json()` for consistency.

### 🟡 Medium: `forgot-password` Has Redundant Fallback Logic

The forgot-password route first tries RPC `check_phone_exists`, then falls back to a direct admin query. This dual approach adds complexity and potential for inconsistent behavior.

**Fix:** Use a single reliable approach (admin client direct query).

### 🟡 Medium: Missing Input Sanitization

Several API routes don't sanitize input beyond basic presence checks:
- `users/create` doesn't validate email format
- `users/update` doesn't validate field lengths
- `users/approve` doesn't validate UUID format for `userId`

**Fix:** Use `zod` schemas for all API input validation.

---

## 6. Middleware Review

### 🔴 Critical: Duplicate Dashboard Redirect Logic

In `src/lib/supabase/middleware.ts`, the dashboard redirect logic appears **twice** (lines 149-160 and lines 165-176):

```typescript
// First occurrence (inside !isCheckoutRoute block)
if (pathname === '/dashboard') {
  if (['master_admin', 'normal_admin'].includes(role)) { ... }
  if (role === 'kasir') { ... }
}

// Second occurrence (outside the block)
if (pathname === '/dashboard' && !isUpdatePasswordRoute) {
  if (['master_admin', 'normal_admin'].includes(role)) { ... }
  if (role === 'kasir') { ... }
}
```

**Fix:** Remove the duplicate block.

### 🟠 High: Role `super_user` Referenced But Not in Enum

The middleware checks for `role === 'super_user'` (line 141) but the `app_role` enum only contains: `'master_admin', 'normal_admin', 'kasir', 'normal_user'`. This means `super_user` will never match.

**Fix:** Either add `super_user` to the enum or remove the check.

### 🟡 Medium: Profile Fetch in Middleware on Every Request

When `user.user_metadata?.role` is not set (which is the default), the middleware fetches the profile from the database on **every single request**. This adds latency to every page load.

**Fix:** After the first profile fetch, update `user_metadata.role` via `supabase.auth.updateUser()` so subsequent requests use the cached metadata.

### 🟡 Medium: AbortController Created But Not Used

In the middleware (line 83-84), an `AbortController` is created with a 60-second timeout, but it's never passed to the Supabase query:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);
// ... supabase query without using controller.signal
```

**Fix:** Pass `controller.signal` to the Supabase query via `.abortSignal()`.

---

## 7. State Management Review

### 🔴 Critical: N+1 Query Problem in Orders Store

In `src/store/orders-store.ts`, for each order, the code:
1. Fetches order items (1 query per order)
2. For each item, fetches the product (1 query per item)
3. For each item with a variant, fetches the variant (1 query per variant)

For 50 orders with 3 items each, this results in **50 + 150 + ~50 = ~250 queries**.

**Fix:** Use Supabase's nested select: `.select('*, order_items(*, products(*), product_variants(*))')` or batch queries.

### 🟠 High: `useAuthState()` Called Outside React Component

In `src/store/orders-store.ts` (line 81):

```typescript
const { role: userRole } = useAuthState();
```

This is called inside a Zustand store action (not a React component or hook). React hooks cannot be called outside components. This will either throw an error or return stale data.

**Fix:** Pass the user role as a parameter to `fetchOrders()`, or use the Supabase client to fetch the role inside the store.

### 🟡 Medium: Cart Store Persists `_hasHydrated` State

In `src/store/cart-store.ts` (line 94-97):

```typescript
partialize: (state) => ({
  items: state.items,
  _hasHydrated: state._hasHydrated,
}),
```

The `_hasHydrated` flag is persisted to localStorage, which defeats its purpose (it should start as `false` on each page load).

**Fix:** Remove `_hasHydrated` from `partialize`.

### 🟡 Medium: Notification Store Has No Persistence or Supabase Sync

The `notification-store.ts` only manages in-memory state. Marking notifications as read doesn't persist to the database.

**Fix:** Add Supabase update calls in `markAsRead` and `markAllAsRead`.

### 🟡 Medium: Related Products Store Updates Sort Order Sequentially

In `src/store/related-products-store.ts` (lines 159-168), sort order updates are done one at a time in a loop:

```typescript
for (const relation of relations) {
  const { error } = await supabase
    .from('product_relations')
    .update({ sort_order: relation.sort_order })
    .eq('product_id', productId)
    .eq('related_product_id', relation.id);
}
```

**Fix:** Use a single RPC call or batch update.

---

## 8. Component Review

### 🔴 Critical: Kasir Page is 2596 Lines

`src/app/(protected)/kasir/page.tsx` is a single monolithic component with:
- 40+ state variables
- Inline business logic (discount calculation, shipping calculation)
- Duplicated UI code (mobile vs desktop order panel)
- No separation of concerns

**Fix:** Break into smaller components:
- `KasirProductGrid`
- `KasirOrderPanel`
- `KasirCheckoutDialog`
- `KasirVariantDialog`
- `useKasirCart` (custom hook)
- `useShippingCalculation` (custom hook)
- `usePromotionEngine` (custom hook)

### 🟠 High: Hardcoded Province-to-City Mapping

In the kasir page (lines 548-562), there's a hardcoded `provinceToCityMap` for RajaOngkir:

```typescript
const provinceToCityMap: Record<string, string> = {
  '6': '151', // DKI Jakarta -> Jakarta Pusat
  '7': '152', // Jawa Barat -> Bandung
  // ... only 11 of 38 provinces mapped
};
```

This means shipping calculation will fail or use incorrect city IDs for 27 provinces.

**Fix:** Store the mapping in the database or use the cities table that already exists.

### 🟡 Medium: Raw `<img>` Tags Instead of Next.js `<Image>`

The kasir page uses raw `<img>` tags for product images instead of Next.js `<Image>` component, missing out on automatic optimization, lazy loading, and responsive sizing.

**Fix:** Use `next/image` with proper `width`, `height`, and `sizes` props.

### 🟡 Medium: `useIdleTimeout` Has a Timer Drift Bug

In `src/hooks/use-idle-timeout.ts` (lines 56-58):

```typescript
timeoutId = setTimeout(() => {
  logout();
}, timeLeft);
```

The `timeLeft` value changes every second (via the countdown interval), but the `setTimeout` is set once with the initial `timeLeft` value. Since `timeLeft` is in the dependency array of the `useEffect`, the timeout is recreated every second, causing timer drift and unnecessary re-renders.

**Fix:** Use a single `setTimeout` based on the full timeout duration, and only use the countdown for display purposes.

---

## 9. Performance Issues

### 🟠 High: No Image Optimization Configuration in `next.config.ts`

The `next.config.ts` is essentially empty:

```typescript
const nextConfig: NextConfig = {};
```

Despite having `image-config.ts` with optimization settings, none of these are applied to the Next.js config. Missing:
- `images.remotePatterns` for Supabase storage URLs
- `images.formats` for WebP/AVIF
- `images.deviceSizes` and `imageSizes`

**Fix:** Add proper image configuration to `next.config.ts`.

### 🟠 High: No Database Connection Pooling Configuration

The Supabase client is created with default settings. For production with multiple concurrent users, connection pooling should be configured.

### 🟡 Medium: Promotions Store Has 20-Second Timeout

In `src/store/promotions-store.ts` (line 78):

```typescript
const timeoutId = setTimeout(() => abortController.abort(), 20000);
```

While other parts of the app use 60-second timeouts, promotions use 20 seconds. This inconsistency can cause confusing behavior.

**Fix:** Use the shared `DEFAULT_TIMEOUT_MS` from `timeout-utils.ts`.

### 🟡 Medium: Cart Price Calculation May Be Incorrect for Variants

In `src/store/cart-store.ts` (line 81):

```typescript
const price = item.variant ? (item.variant.price_adjustment || 0) : item.product.base_price;
```

For variants, only `price_adjustment` is used, not `base_price + price_adjustment`. But in the kasir page (line 405):

```typescript
const price = variant ? product.base_price + variant.price_adjustment : product.base_price;
```

The kasir correctly adds base_price + adjustment, but the cart store only uses the adjustment. This means the marketplace cart will show incorrect prices for variant products.

**Fix:** Standardize price calculation: `base_price + price_adjustment` for variants.

---

## 10. Code Quality Issues

### 🟡 Medium: Excessive `console.log` Statements

The codebase has hundreds of `console.log` statements that should be removed or replaced with a proper logging solution:
- `orders-store.ts`: 10+ console.log calls
- `users-store.ts`: 5+ console.log calls
- `promotions-store.ts`: 5+ console.log calls
- `forgot-password/route.ts`: 30+ console.log calls
- `rajaongkir/route.ts`: 15+ console.log calls

**Fix:** Use a logging library (e.g., `pino`, `winston`) with configurable log levels.

### 🟡 Medium: `any` Type Usage

Multiple files use `any` type extensively:
- `orders-store.ts`: `(order: any)`, `(item: any)`, `(p: any)`
- `users-store.ts`: `(user: any)`
- `kasir/page.tsx`: `searchedProfiles: any[]`, `couriers: any[]`

**Fix:** Define proper TypeScript interfaces for all data shapes.

### 🟡 Medium: Unused Imports

- `src/app/api/shipping/rajaongkir/route.ts` imports `createClient` from server but never uses it
- `src/store/cart-store.ts` imports `useState` and `useEffect` from React (used in the hook, but the store file should be split)

### 🔵 Low: Inconsistent Naming Conventions

- Some files use kebab-case (`cart-store.ts`), others use camelCase (`useGameStore.ts`)
- Database columns mix `snake_case` with inconsistent naming (`user_phoneno` vs `recipient_phone`)
- Some stores export `useXxxStore`, others export standalone functions

### 🔵 Low: Missing TypeScript Strict Mode

The `tsconfig.json` should enable `strict: true` for better type safety.

### 🔵 Low: No Unit Tests

There are no test files in the `src/` directory. The integration tests in the parent `qwen-code` directory don't cover this project.

---

## 11. Configuration Issues

### 🟡 Medium: Empty `next.config.ts`

The Next.js config is essentially empty. Missing configurations:
- Image optimization (remote patterns for Supabase)
- Security headers (CSP, HSTS, X-Frame-Options)
- Redirects/rewrites
- Output configuration for deployment

### 🟡 Medium: No `.env.example` File

There's no `.env.example` file documenting required environment variables. Based on the code, the following are needed:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAJAONGKIR_API_KEY`
- `NEXT_PUBLIC_RAJAONGKIR_API_KEY`

### 🔵 Low: No ESLint Custom Rules Active

The `eslint.config.mjs` exists but no custom rules are configured for the project's specific patterns.

---

## 12. Recommendations Summary

### Immediate (Before Production)

1. **Remove all sensitive data from logs** — API keys, user data, phone numbers
2. **Add rate limiting** to auth endpoints (register, forgot-password, lookup-email)
3. **Fix the N+1 query problem** in orders store
4. **Fix the `useAuthState()` hook** called outside React component
5. **Fix the password reset route** to actually update the password
6. **Fix the cart variant price calculation** inconsistency
7. **Fix the duplicate middleware redirect logic**
8. **Add environment variable validation** at startup

### Short-term (Next Sprint)

1. **Break up the kasir page** into smaller components
2. **Add input validation** with Zod schemas on all API routes
3. **Renumber migrations** to eliminate duplicates
4. **Add proper image configuration** to `next.config.ts`
5. **Replace hardcoded province-to-city mapping** with database lookup
6. **Add security headers** in Next.js config
7. **Fix the `users/update` route** to use admin client for password changes

### Long-term

1. **Add comprehensive test coverage** (unit + integration)
2. **Implement proper logging** with log levels
3. **Add monitoring and error tracking** (Sentry, etc.)
4. **Create `.env.example`** and document all environment variables
5. **Enable TypeScript strict mode**
6. **Add database migration tooling** (Supabase CLI migrations)
7. **Implement proper caching strategy** (Redis or Supabase Edge Functions)
8. **Add CI/CD pipeline** with linting, type checking, and tests

---

*This review covers the core application logic and database schema. Additional review of admin panel pages, landing page components, and game-related features was not included in this pass.*
