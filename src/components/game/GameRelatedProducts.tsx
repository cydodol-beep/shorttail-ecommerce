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

interface Product {
  id: string;
  name: string;
  main_image_url?: string;
  base_price: number;
  min_variant_price?: number;
  max_variant_price?: number;
  has_variants?: boolean;
  stock_quantity?: number;
  total_variant_stock?: number;
  max_variant_stock?: number;
  is_manual?: boolean;
}

export function GameRelatedProducts({
  title = 'Pet Supplies & Toys',
  limit = 6,
}: {
  title?: string;
  limit?: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            main_image_url,
            base_price,
            has_variants,
            stock_quantity,
            product_variants!inner(
              stock_quantity
            )
          `)
          .eq('is_active', true)
          .limit(limit)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          // Process the data to match the expected structure
          const processedProducts = data.map((product: any) => {
            // Calculate total variant stock if the product has variants
            const variantStocks = product.product_variants?.map((v: any) => v.stock_quantity) || [];
            const totalVariantStock = variantStocks.reduce((sum: number, qty: number) => sum + qty, 0);
            const maxVariantStock = Math.max(...variantStocks, 0);

            return {
              ...product,
              total_variant_stock: totalVariantStock,
              max_variant_stock: maxVariantStock,
              min_variant_price: product.base_price, // Simplified for this example
              max_variant_price: product.base_price, // Simplified for this example
            };
          });
          
          setProducts(processedProducts);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  const handleAddToCart = (product: Product) => {
    // Create a proper product object to match the store interface
    const fullProduct: any = {
      ...product,
      name: product.name,
      base_price: product.base_price,
      main_image_url: product.main_image_url,
    };

    addItem(fullProduct);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-xl font-bold text-brown-900 mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                  {formatPrice(product.base_price)}
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