'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PawPrint, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/ui/product-card';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { useLandingSections } from '@/hooks/use-landing-sections';
import type { Product, ProductVariant } from '@/types/database';

export function FeaturedProducts() {
  const [products, setProducts] = useState<(Product & { product_variants?: ProductVariant[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  
  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('featured_products', {
    title: 'Best Sellers',
    subtitle: 'Our most popular items',
    limit: 8,
  });

  const fetchFeaturedProducts = useCallback(async () => {
    const supabase = createClient();
    
    // Fetch active products with only needed columns for better performance
    const { data, error } = await supabase
      .from('products')
      .select('id, name, main_image_url, base_price, stock_quantity, has_variants, condition, product_variants(price_adjustment, stock_quantity)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20); // Fetch more to filter out of stock items

    if (error) {
      console.error('Error fetching featured products:', error);
      setLoading(false);
      return;
    }

    // Filter products that have stock (either direct stock or variant stock)
    const productsWithStock = (data || []).filter((product: Product & { product_variants?: ProductVariant[] }) => {
      if (product.has_variants && product.product_variants) {
        // For variant products, check if any variant has stock
        return product.product_variants.some((v: ProductVariant) => v.stock_quantity > 0);
      }
      // For simple products, check direct stock
      return product.stock_quantity > 0;
    }).slice(0, settings.limit); // Limit to configured number of products

    setProducts(productsWithStock);
    setLoading(false);
  }, [settings.limit]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-brown-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
            <div className="flex items-center gap-3 justify-center sm:justify-start mb-4 sm:mb-0">
              <div className="p-2 bg-orange-100 rounded-xl">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brown-900">{settings.title}</h2>
                <p className="text-brown-600 text-xs sm:text-sm">{settings.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-3 sm:p-4">
                  <Skeleton className="aspect-square rounded-lg mb-3" />
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
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
    return (
      <section className="py-12 sm:py-16 bg-brown-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-2 bg-orange-100 rounded-xl">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brown-900">{settings.title}</h2>
                <p className="text-brown-600 text-xs sm:text-sm">{settings.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="text-center py-8 sm:py-12 max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-brown-100 rounded-full flex items-center justify-center">
              <PawPrint className="h-8 w-8 sm:h-10 sm:w-10 text-brown-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">No products yet</h3>
            <p className="text-sm text-brown-600">Check back soon for our featured products</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-brown-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <div className="flex items-center gap-3 justify-center sm:justify-start mb-4 sm:mb-0">
            <div className="p-2 bg-orange-100 rounded-xl">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brown-900">{settings.title}</h2>
              <p className="text-brown-600 text-xs sm:text-sm">{settings.subtitle}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/products">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              rank={index}
            />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-6 sm:mt-8 sm:hidden">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/products">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
