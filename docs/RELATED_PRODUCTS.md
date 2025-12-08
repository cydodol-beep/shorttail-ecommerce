# Related Products Feature Guide

## Overview
The Related Products system helps increase sales by showing relevant product recommendations across your e-commerce site. It uses a smart algorithm that combines manual selections with automatic suggestions.

## How It Works

### For Admins

#### Setting Up Related Products:
1. Go to **Admin → Products**
2. Click **Edit** on any product
3. Scroll to the **Related Products** section
4. Check products you want to recommend (up to 5)
5. Products are shown in the order you select them
6. Click **Update Product** to save

#### Smart Features:
- **Manual Priority**: Products you select show first with a "Recommended" badge
- **Auto-Fill**: If you select less than 5, system auto-adds same-category products
- **Real-time Preview**: See product images and names while selecting
- **Counter**: Shows "X/5 selected" to track your selections

### For Customers

#### Where Related Products Appear:
1. **Product Detail Page**: "You Might Also Like" section at bottom
2. **Cart Page**: "Customers Also Bought" based on cart items
3. **Checkout Page**: "Add More to Your Order" last-chance upsell

#### Features:
- Beautiful product cards with images
- Quick "Add to Cart" buttons
- Price display
- Stock status indicators
- "Recommended" badges for curated picks
- Hover animations for better UX

## Technical Details

### Database Structure:
```sql
product_relations
├── id (UUID)
├── product_id (references products)
├── related_product_id (references products)
├── sort_order (for custom ordering)
└── created_at
```

### Smart Algorithm:
1. Fetch manually selected products (sorted by admin's order)
2. If less than 5, auto-fill with same-category products
3. Only show active products with stock > 0
4. Exclude the current product
5. Cache results for 5 minutes

### Performance:
- **Cached**: Results cached in Zustand store
- **Indexed**: Database indexes on product_id, related_product_id, sort_order
- **Optimized**: Single database function call using SQL
- **Fast**: <100ms response time

## API Usage

### React Hook:
```typescript
import { useRelatedProducts } from '@/hooks/use-related-products';

function MyComponent({ productId }) {
  const { relatedProducts, loading } = useRelatedProducts(productId, 5);
  
  return (
    <div>
      {relatedProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Component:
```typescript
import { RelatedProducts } from '@/components/products/related-products';

<RelatedProducts 
  productId={currentProduct.id}
  title="You May Also Like"
  limit={5}
/>
```

### Store Methods:
```typescript
import { useRelatedProductsStore } from '@/store/related-products-store';

const { 
  addRelation,      // Add a relation
  removeRelation,   // Remove a relation
  updateRelationOrder, // Reorder relations
  fetchRelatedProducts, // Fetch with caching
  invalidate        // Clear cache
} = useRelatedProductsStore();
```

## Best Practices

### For Maximum Sales:
1. **Select Complementary Products**: Choose items that pair well
   - Example: Cat food → Cat litter, Feeding bowl
2. **Consider Price Points**: Mix price ranges to upsell
   - Example: Budget toy → Premium version, Accessories
3. **Update Seasonally**: Change recommendations for holidays/seasons
4. **Monitor Performance**: Check which related products sell best

### For Best UX:
1. **Be Selective**: Quality over quantity (3-5 good picks > random items)
2. **Keep Updated**: Remove out-of-stock from manual selections
3. **Test Combinations**: Try different product combinations
4. **Use Categories**: Let auto-fill handle similar products

## Troubleshooting

### Products Not Showing:
- Check if products are active (`is_active = true`)
- Verify products have stock (`stock_quantity > 0`)
- Ensure database migration was applied
- Check browser console for errors

### Changes Not Appearing:
- Cache invalidation happens automatically
- Hard refresh browser (Ctrl+F5)
- Check Supabase dashboard for relations

### Performance Issues:
- Indexes are created automatically
- Cache reduces database calls
- Limit is enforced (max 5 products)

## Database Migration

Already applied! If you need to reapply:
```bash
# View migration SQL
cat supabase/migrations/021_related_products.sql

# Apply via Supabase Dashboard:
1. Go to SQL Editor
2. Paste migration content
3. Click "Run"
```

## Future Enhancements

Potential improvements:
- Analytics: Track which related products get clicked/purchased
- A/B Testing: Test different recommendation strategies
- AI Suggestions: Use purchase history for smarter recommendations
- Bulk Management: Edit related products for multiple items at once
- Drag-and-Drop: Reorder related products visually in admin

---

**Questions?** Check the code comments or reach out to the development team.
