# Enhanced Promotions System - Implementation Guide

## 📋 Overview
The enhanced promotions system adds powerful marketing features to your e-commerce platform:
- **Product Selection**: Target specific products instead of store-wide discounts
- **Buy More Save More**: Volume discount tiers (e.g., buy 3+ get 10% off, 5+ get 15% off)
- **Free Shipping**: Offer free shipping as a standalone promotion or combined with discounts
- **Buy X Get Y**: Classic promotional offers (e.g., Buy 2 Get 1 Free)
- **Usage Limits**: Control how many times each user can use a promotion

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Open the file: `supabase/migrations/012_enhanced_promotions.sql`
4. Copy all contents and paste into Supabase SQL Editor
5. Click **Run** to execute the migration

This migration will:
- Add new columns to `promotions` table (applies_to, product_ids, free_shipping, etc.)
- Create `promotion_tiers` table for buy-more-save-more functionality
- Create `promotion_usage` table for tracking user limits
- Add the `validate_promotion_code()` function for checkout validation
- Set up proper RLS policies

### Step 2: Verify the Installation

After running the migration, verify it worked:

```sql
-- Check promotions table has new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'promotions' 
  AND column_name IN ('applies_to', 'product_ids', 'free_shipping', 'buy_quantity', 'get_quantity', 'max_uses_per_user');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('promotion_tiers', 'promotion_usage');
```

You should see all the columns and tables listed.

### Step 3: Test the Features

1. Navigate to `http://localhost:3000/admin/promotions`
2. Click **Add Promotion**
3. Try creating each type of promotion:

## 🎯 Promotion Types & Examples

### 1. Percentage Off
**Use Case**: General discount on purchase
- Discount Type: `Percentage Off (%)`
- Discount Value: `20` (for 20% off)
- Applies To: `All Products` or `Specific Products`
- Optional: Add free shipping toggle

**Example**: "20% off all products + free shipping"

### 2. Fixed Amount Off
**Use Case**: Fixed rupiah discount
- Discount Type: `Fixed Amount Off (IDR)`
- Discount Value: `50000` (Rp 50,000 off)
- Min Purchase: `200000` (minimum Rp 200,000 purchase)

**Example**: "Rp 50,000 off on orders above Rp 200,000"

### 3. Buy X Get Y
**Use Case**: Classic promotional offer
- Discount Type: `Buy X Get Y`
- Buy Quantity: `2`
- Get Quantity: `1`
- Applies To: Select specific products

**Example**: "Buy 2 Get 1 Free on selected pet toys"

### 4. Buy More Save More (Tiered Discounts)
**Use Case**: Volume discounts
- Discount Type: `Buy More Save More (Tiered)`
- Click **Add Tier** for each tier:
  - Tier 1: Min Quantity `2`, Discount `5%`
  - Tier 2: Min Quantity `5`, Discount `10%`
  - Tier 3: Min Quantity `10`, Discount `15%`

**Example**: "Buy 2+ get 5% off, 5+ get 10% off, 10+ get 15% off"

### 5. Free Shipping Only
**Use Case**: Free shipping promotion
- Discount Type: `Free Shipping Only`
- No discount value needed
- Optional: Set minimum purchase amount

**Example**: "Free shipping on all orders above Rp 100,000"

## 🎨 UI Features

### Product Selection
When "Applies To" is set to "Specific Products":
- Checkbox list appears with all active products
- Shows product name and SKU
- Can select multiple products
- Shows count of selected products

### Free Shipping Toggle
Available for all promotion types:
- Can combine percentage/fixed discounts with free shipping
- Example: "15% off + Free Shipping"

### Tiers Manager (Buy More Save More)
- Add/remove tier buttons
- Each tier has Min Quantity and Discount %
- Automatically suggests next tier values
- Example tier structure visible in UI

### Features Badge Display
In the promotions table, you'll see:
- 🚚 **Free Ship** badge if free shipping enabled
- 📦 **X Products** badge if specific products selected

## 🔧 Technical Details

### Database Schema

**promotions table** (new columns):
```sql
applies_to TEXT CHECK (applies_to IN ('all_products', 'specific_products', 'categories'))
product_ids UUID[]
category_ids UUID[]
free_shipping BOOLEAN
buy_quantity INTEGER
get_quantity INTEGER
max_uses_per_user INTEGER
total_uses INTEGER
```

**promotion_tiers table**:
```sql
id SERIAL PRIMARY KEY
promotion_id UUID REFERENCES promotions(id)
min_quantity INTEGER
discount_percentage NUMERIC(5,2)
created_at TIMESTAMPTZ
```

**promotion_usage table**:
```sql
id SERIAL PRIMARY KEY
promotion_id UUID REFERENCES promotions(id)
user_id UUID REFERENCES profiles(id)
order_id UUID REFERENCES orders(id)
used_at TIMESTAMPTZ
```

### Validation Function

Use `validate_promotion_code()` in your checkout flow:

```sql
SELECT * FROM validate_promotion_code(
  'SUMMER2025',           -- promotion code
  '123e4567-...',         -- user_id
  ARRAY['product-id-1'],  -- product_ids in cart
  250000                  -- subtotal
);

-- Returns:
-- is_valid: true/false
-- discount_amount: calculated discount
-- free_shipping: true/false
-- message: validation message
```

## 📊 Usage Tracking

The system automatically tracks:
- How many times each user has used a promotion
- Which orders used which promotions
- Total usage count per promotion

This enables:
- Per-user limits (max_uses_per_user)
- Analytics on promotion performance
- Prevention of abuse

## 🔐 Security & RLS Policies

All new tables have Row Level Security enabled:

**promotion_tiers**:
- Public can view tiers for active promotions
- Admins can manage all tiers

**promotion_usage**:
- Users can view their own usage
- Admins can view all usage
- System can create usage records

## 🎯 Best Practices

1. **Start/End Dates**: Always set validity periods to auto-enable/disable promotions
2. **Min Purchase**: Set minimum purchase amounts to protect margins
3. **Usage Limits**: Use max_uses_per_user for exclusive/limited promotions
4. **Product Selection**: Use specific products for seasonal or overstocked items
5. **Free Shipping**: Combine with minimum purchase to increase average order value
6. **Tiers**: Make tier gaps meaningful (e.g., 2, 5, 10 not 2, 3, 4)

## 🧪 Testing Checklist

- [ ] Create percentage discount (all products)
- [ ] Create fixed discount (specific products)
- [ ] Create Buy X Get Y (select 2-3 products)
- [ ] Create Buy More Save More with 3 tiers
- [ ] Create Free Shipping promotion
- [ ] Combine discount + free shipping
- [ ] Test minimum purchase validation
- [ ] Edit existing promotion
- [ ] Delete promotion
- [ ] Check RLS (try accessing as normal user)

## 🐛 Troubleshooting

### Migration Errors
**Error**: "column already exists"
- Some columns may already exist from previous attempts
- The migration uses `ADD COLUMN IF NOT EXISTS` so it's safe to re-run

**Error**: "constraint already exists"
- The migration drops existing constraints before recreating
- Check Supabase logs for specific constraint errors

### UI Errors
**Products not loading**
- Check browser console for errors
- Verify products table has `is_active = true` records
- Check RLS policies on products table

**Tiers not saving**
- Check browser console for errors
- Verify promotion_tiers table was created
- Check Supabase RLS policies

### Validation Issues
**Promotion not applying**
- Check start_date/end_date validity
- Verify is_active = true
- Check minimum purchase amount
- Verify product selection matches cart items

## 🔄 Next Steps

After implementing the enhanced promotions:

1. **Checkout Integration**: Use `validate_promotion_code()` in checkout flow
2. **Analytics Dashboard**: Track promotion performance
3. **Email Marketing**: Send promotion codes to customers
4. **Category Support**: Extend to support category-based promotions
5. **Automatic Discounts**: Add auto-apply for qualifying orders

## 📚 Related Files

- Migration: `supabase/migrations/012_enhanced_promotions.sql`
- UI Component: `src/app/(protected)/admin/promotions/page.tsx`
- Store: `src/store/promotions-store.ts`
- Hook: `src/hooks/use-promotions.ts`
- Types: Defined in promotions-store.ts

## 💡 Feature Ideas

Future enhancements you could add:
- **First Purchase Discount**: Auto-apply for new customers
- **Abandoned Cart Recovery**: Send promo code after cart abandonment
- **Referral Codes**: Generate unique codes for customer referrals
- **Combo Deals**: Bundle promotions (e.g., product A + B = discount)
- **Flash Sales**: Time-limited automatic discounts
- **Loyalty Tiers**: Different discount levels based on customer status

---

✅ **All features are now implemented and ready to use!**

Visit `http://localhost:3000/admin/promotions` to start creating advanced promotional campaigns.
