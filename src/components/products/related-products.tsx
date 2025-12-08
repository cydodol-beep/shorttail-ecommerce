'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRelatedProducts } from '@/hooks/use-related-products';
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

interface RelatedProductsProps {
  productId: string;
  title?: string;
  limit?: number;
}

export function RelatedProducts({
  productId,
  title = 'You Might Also Like',
  limit = 5,
}: RelatedProductsProps) {
  const { relatedProducts, loading } = useRelatedProducts(productId, limit);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (product: any) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-xl font-bold text-brown-900 mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
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

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-brown-900">{title}</h2>
        {relatedProducts.some((p) => p.is_manual) && (
          <span className="text-xs text-brown-500 bg-primary/10 px-2 py-1 rounded">
            Handpicked for you
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {relatedProducts.map((product) => (
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
                  {product.is_manual && (
                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
                      ⭐ Recommended
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
                {product.stock_quantity !== undefined && product.stock_quantity !== null && (
                  <p className="text-xs mt-1">
                    {product.stock_quantity > 0 ? (
                      product.stock_quantity < 5 ? (
                        <span className="text-orange-600 font-medium">
                          Only {product.stock_quantity} left
                        </span>
                      ) : (
                        <span className="text-green-600">
                          {product.stock_quantity} in stock
                        </span>
                      )
                    ) : (
                      <span className="text-red-600 font-medium">
                        Out of stock
                      </span>
                    )}
                  </p>
                )}
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => handleAddToCart(product)}
                disabled={product.stock_quantity === 0}
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
