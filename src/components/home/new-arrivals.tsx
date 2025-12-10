'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, PawPrint, Star, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { useLandingSections } from '@/hooks/use-landing-sections';
import type { Product, ProductVariant } from '@/types/database';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

export function NewArrivals() {
  const [products, setProducts] = useState<(Product & { product_variants?: ProductVariant[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  
  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('new_arrivals', {
    title: 'New Arrivals',
    subtitle: 'Fresh products just for you',
    limit: 8,
  });

  const fetchNewArrivals = useCallback(async () => {
    const supabase = createClient();
    
    // Fetch newest products from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(settings.limit);

    if (error) {
      console.error('Error fetching new arrivals:', error);
      setLoading(false);
      return;
    }

    // Filter products with stock
    const productsWithStock = (data || []).filter((product: Product & { product_variants?: ProductVariant[] }) => {
      if (product.has_variants && product.product_variants) {
        return product.product_variants.some((v: ProductVariant) => v.stock_quantity > 0);
      }
      return product.stock_quantity > 0;
    });

    setProducts(productsWithStock);
    setLoading(false);
  }, [settings.limit]);

  useEffect(() => {
    fetchNewArrivals();
  }, [fetchNewArrivals]);

  const getProductPrice = (product: Product & { product_variants?: ProductVariant[] }) => {
    if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
      const prices = product.product_variants.map(v => product.base_price + (v.price_adjustment || 0));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return { min, max, isRange: min !== max };
    }
    return { min: product.base_price, max: product.base_price, isRange: false };
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-brown-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-primary" />
              <h2 className="text-2xl lg:text-3xl font-bold text-brown-900">New Arrivals</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-brown-200">
                <CardContent className="p-4">
                  <Skeleton className="aspect-square rounded-lg mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-5 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-brown-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-brown-900">{settings.title}</h2>
              <p className="text-brown-600 text-sm">{settings.subtitle}</p>
            </div>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/products?sort=newest">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => {
            const priceInfo = getProductPrice(product);
            
            return (
              <Card 
                key={product.id} 
                className="group hover:shadow-xl transition-all duration-300 border-brown-200 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-brown-100 overflow-hidden">
                    <Link href={`/products/${product.id}`} className="block w-full h-full">
                      {product.main_image_url ? (
                        <img
                          src={product.main_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PawPrint className="h-16 w-16 text-brown-300" />
                        </div>
                      )}
                    </Link>
                    {/* NEW Badge */}
                    <Badge className="absolute top-3 left-3 bg-primary hover:bg-primary z-10">
                      NEW
                    </Badge>
                    {/* Quick Add Overlay - different behavior for products with variants */}
                    {!product.has_variants && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                        <Button
                          size="sm"
                          className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    )}
                    {product.has_variants && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                        <Button
                          size="sm"
                          className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                          onClick={() => window.location.href = `/products/${product.id}`}
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Choose Options
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-brown-500 ml-1">(5.0)</span>
                    </div>
                    
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-brown-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {priceInfo.isRange ? (
                          <p className="font-bold text-primary">
                            {formatPrice(priceInfo.min)}
                          </p>
                        ) : (
                          <p className="font-bold text-primary">
                            {formatPrice(priceInfo.min)}
                          </p>
                        )}
                      </div>
                      {product.has_variants && (
                        <Badge variant="secondary" className="text-xs">
                          {product.product_variants?.length} variants
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-8 sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/products?sort=newest">
              View All New Arrivals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
