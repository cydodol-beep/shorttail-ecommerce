'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PawPrint, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import type { Product, ProductVariant } from '@/types/database';

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

interface RecommendedProductsProps {
  /** Pet types to filter products by (e.g., ['Dog', 'Cat']) */
  petTypes?: string[];
  /** Title for the section */
  title?: string;
  /** Subtitle for the section */
  subtitle?: string;
  /** Maximum number of products to show */
  limit?: number;
  /** Custom class name for the section */
  className?: string;
}

export function RecommendedProducts({
  petTypes = [],
  title = 'Recommended Products',
  subtitle = 'Products we think your pets will love',
  limit = 8,
  className = '',
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<(Product & { product_variants?: ProductVariant[]; categories?: { name: string; slug: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  const fetchRecommendedProducts = useCallback(async () => {
    const supabase = createClient();
    
    // Build query to fetch products
    let query = supabase
      .from('products')
      .select('id, name, main_image_url, base_price, stock_quantity, has_variants, condition, category_id, product_variants(id, price_adjustment, stock_quantity), categories(name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // If we have pet types, try to filter by category name containing pet type
    // This is a simple approach - products with category names like "Dog Food", "Cat Toys" etc.
    if (petTypes.length > 0) {
      // Fetch more products to filter client-side based on pet types
      query = query.limit(50);
    } else {
      query = query.limit(limit * 2); // Fetch extra to filter out of stock
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recommended products:', error);
      setLoading(false);
      return;
    }

    let filteredProducts = data || [];

    // Filter products by pet types if specified
    if (petTypes.length > 0) {
      const petTypesLower = petTypes.map(pt => pt.toLowerCase());
      filteredProducts = filteredProducts.filter((product: any) => {
        const categoryName = product.categories?.name?.toLowerCase() || '';
        const productName = product.name?.toLowerCase() || '';
        
        // Check if category or product name contains any of the pet types
        return petTypesLower.some(petType => 
          categoryName.includes(petType) || 
          productName.includes(petType)
        );
      });
    }

    // Filter products that have stock
    const productsWithStock = filteredProducts.filter((product: Product & { product_variants?: ProductVariant[] }) => {
      if (product.has_variants && product.product_variants) {
        return product.product_variants.some((v: ProductVariant) => v.stock_quantity > 0);
      }
      return product.stock_quantity > 0;
    }).slice(0, limit);

    // If no products found with pet type filter, fall back to general products
    if (productsWithStock.length === 0 && petTypes.length > 0) {
      const { data: fallbackData } = await supabase
        .from('products')
        .select('id, name, main_image_url, base_price, stock_quantity, has_variants, condition, category_id, product_variants(id, price_adjustment, stock_quantity), categories(name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      const fallbackWithStock = (fallbackData || []).filter((product: Product & { product_variants?: ProductVariant[] }) => {
        if (product.has_variants && product.product_variants) {
          return product.product_variants.some((v: ProductVariant) => v.stock_quantity > 0);
        }
        return product.stock_quantity > 0;
      }).slice(0, limit);

      setProducts(fallbackWithStock);
    } else {
      setProducts(productsWithStock);
    }

    setLoading(false);
  }, [petTypes, limit]);

  useEffect(() => {
    fetchRecommendedProducts();
  }, [fetchRecommendedProducts]);

  const handleAddToCart = (product: Product) => {
    // For products with variants, redirect to product page
    if (product.has_variants) {
      window.location.href = `/products/${product.id}`;
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  const getProductPrice = (product: Product & { product_variants?: ProductVariant[] }) => {
    if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
      const prices = product.product_variants.map(v => v.price_adjustment || 0);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return { min, max, isRange: min !== max };
    }
    return { min: product.base_price, max: product.base_price, isRange: false };
  };

  if (loading) {
    return (
      <section className={`py-8 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brown-900">{title}</h2>
            <p className="text-brown-600 text-sm">{subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-brown-200">
              <CardContent className="p-3">
                <Skeleton className="aspect-square rounded-lg mb-3" />
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-5 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <section className={`py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brown-900">{title}</h2>
            <p className="text-brown-600 text-sm">{subtitle}</p>
          </div>
        </div>
        <Link href="/products">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const priceInfo = getProductPrice(product);
          return (
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
                    {product.condition === 'secondhand' && (
                      <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-xs">
                        Pre-owned
                      </Badge>
                    )}
                  </div>
                  {/* Category badge */}
                  {product.categories?.name && (
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {product.categories.name}
                    </Badge>
                  )}
                  <h3 className="font-medium text-brown-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <p className="font-bold text-primary text-sm">
                    {priceInfo.isRange
                      ? formatPriceRange(priceInfo.min, priceInfo.max, true)
                      : formatPrice(priceInfo.min)}
                  </p>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 text-xs"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  {product.has_variants ? 'View Options' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile View All Button */}
      <div className="mt-6 text-center sm:hidden">
        <Link href="/products">
          <Button variant="outline" size="sm">
            View All Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
