'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import type { RelatedProduct } from '@/store/related-products-store';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatPriceRange(minPrice: number, maxPrice: number, hasVariants: boolean): string {
  if (!hasVariants || minPrice === maxPrice) {
    return formatPrice(minPrice);
  }
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}

interface CartRelatedProductsProps {
  title?: string;
  limit?: number;
}

// Alternative approach: Get related products for each cart item and combine
async function getRelatedProductsMulti(cartProductIds: string[], limit: number): Promise<RelatedProduct[]> {
  if (cartProductIds.length === 0) return [];

  const supabase = createClient();
  const allRelatedProducts: RelatedProduct[] = [];

  // Fetch related products for each item in the cart
  const fetchPromises = cartProductIds.map(async (productId) => {
    const { data, error } = await supabase
      .rpc('get_related_products', {
        p_product_id: productId,
        p_limit: 3 // Fetch up to 3 related products for each cart item
      });

    if (error) {
      console.error('Error fetching related products for product:', productId, error);
      return [];
    }

    return (data || []) as RelatedProduct[];
  });

  const results = await Promise.all(fetchPromises);

  // Flatten results and deduplicate
  for (const result of results) {
    allRelatedProducts.push(...result);
  }

  // Remove duplicates based on ID
  const uniqueProducts = Array.from(
    new Map(allRelatedProducts.map(item => [item.id, item])).values()
  );

  // Shuffle results and return limited number
  return shuffleArray(uniqueProducts).slice(0, limit);
}

// Function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function CartRelatedProducts({
  title = 'You May Also Like',
  limit = 5,
}: CartRelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { items } = useCartStore();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (items.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Get unique product IDs from cart (excluding variants for diversity)
        const productIds = Array.from(
          new Set(items.map(item => item.product.id))
        );
        
        // Fetch related products for all items in cart
        const relatedProducts = await getRelatedProductsMulti(productIds, limit);
        setProducts(relatedProducts);
      } catch (error) {
        console.error('Error fetching cart related products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [items, limit]);

  const handleAddToCart = (product: any) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-xl font-bold text-brown-900 mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="border-brown-200">
              <CardContent className="p-3">
                <Skeleton className="aspect-square rounded-lg mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <h2 className="text-xl font-bold text-brown-900 mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className="group hover:shadow-lg transition-all duration-300 border-brown-200 overflow-hidden"
          >
            <CardContent className="p-3">
              <Link href={`/products/${product.id}`} className="block">
                <div className="relative aspect-square bg-brown-100 rounded-lg mb-3 overflow-hidden">
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PawPrint className="h-10 w-10 text-brown-300" />
                    </div>
                  )}
                </div>
              </Link>

              <Link href={`/products/${product.id}`}>
                <h3 className="font-medium text-brown-900 text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>

              <div className="mb-3">
                <p className="font-bold text-primary text-base">
                  {formatPriceRange(
                    product.min_variant_price || product.base_price,
                    product.max_variant_price || product.base_price,
                    product.has_variants || false
                  )}
                </p>

                {/* Stock quantity and low stock warning */}
                {(() => {
                  // Use variant stock if product has variants, otherwise use base stock
                  const effectiveStock = product.has_variants
                    ? (product.total_variant_stock || 0)
                    : (product.stock_quantity !== undefined && product.stock_quantity !== null ? product.stock_quantity : 0);

                  // For display purposes, show the highest variant stock for low stock warnings
                  const displayStock = product.has_variants
                    ? (product.max_variant_stock || 0)
                    : effectiveStock;

                  return (
                    <p className="text-xs mt-1">
                      {effectiveStock > 0 ? (
                        displayStock < 5 ? (
                          <span className="text-orange-600 font-medium">
                            Only {displayStock} left
                          </span>
                        ) : (
                          <span className="text-green-600">
                            In stock
                          </span>
                        )
                      ) : (
                        <span className="text-red-600 font-medium">
                          Out of stock
                        </span>
                      )}
                    </p>
                  );
                })()}
              </div>

              {/* Different button behavior for products with variants */}
              {!product.has_variants && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add'}
                </Button>
              )}
              {product.has_variants && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => window.location.href = `/products/${product.id}`}
                  disabled={(product.total_variant_stock || 0) === 0}
                >
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  {(product.total_variant_stock || 0) === 0 ? 'Out of Stock' : 'Choose Options'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}