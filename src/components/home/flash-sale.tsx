'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, Clock, ShoppingBag, PawPrint } from 'lucide-react';
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

function calculateDiscount(original: number, discounted: number): number {
  return Math.round(((original - discounted) / original) * 100);
}

interface FlashSaleProduct extends Product {
  product_variants?: ProductVariant[];
  original_price?: number;
  discount_percentage?: number;
}

export function FlashSale() {
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const addItem = useCartStore((state) => state.addItem);
  
  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('flash_sale', {
    title: 'Flash Sale',
    showCountdown: true,
  });

  const fetchFlashSaleProducts = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    
    // Fetch only percentage-type promotions that are currently active
    const { data: promoData } = await supabase
      .from('promotions')
      .select('product_ids, discount_type, discount_value, applies_to')
      .eq('is_active', true)
      .eq('discount_type', 'percentage')
      .lte('start_date', now)
      .gte('end_date', now);

    if (!promoData || promoData.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    // Build a map of product_id -> discount_value for specific products
    const productDiscountMap = new Map<string, number>();
    let hasAllProductsPromo = false;
    let allProductsDiscountValue = 0;

    for (const promo of promoData) {
      if (promo.applies_to === 'all_products') {
        hasAllProductsPromo = true;
        // Use the highest discount for all products
        if (promo.discount_value > allProductsDiscountValue) {
          allProductsDiscountValue = promo.discount_value;
        }
      } else if (promo.product_ids && promo.product_ids.length > 0) {
        for (const productId of promo.product_ids) {
          const existing = productDiscountMap.get(productId) || 0;
          // Use the highest discount for each product
          if (promo.discount_value > existing) {
            productDiscountMap.set(productId, promo.discount_value);
          }
        }
      }
    }

    // Get specific product IDs with promotions
    const specificProductIds = Array.from(productDiscountMap.keys());

    let query = supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(6);

    // If there are specific products with promotions, prioritize them
    if (specificProductIds.length > 0) {
      query = query.in('id', specificProductIds);
    } else if (!hasAllProductsPromo) {
      // No products to show
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching flash sale products:', error);
      setLoading(false);
      return;
    }

    // Calculate actual discounts from promotions
    const productsWithDiscounts = (data || []).map((product: FlashSaleProduct) => {
      // Get discount: specific product discount or all-products discount
      const discountPercentage = productDiscountMap.get(product.id) || allProductsDiscountValue;
      
      if (discountPercentage <= 0) {
        return null; // Skip products without percentage discount
      }
      
      // base_price is the original price, calculate the discounted price
      const discountedPrice = Math.round(product.base_price * (1 - discountPercentage / 100));
      return {
        ...product,
        original_price: product.base_price, // Original price from database
        base_price: discountedPrice, // Override with discounted price for display
        discount_percentage: discountPercentage,
      };
    }).filter(Boolean) as FlashSaleProduct[];

    setProducts(productsWithDiscounts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlashSaleProducts();
  }, [fetchFlashSaleProducts]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 }; // Reset
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-r from-red-500 to-orange-500">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-white">
              <Zap className="h-8 w-8" />
              <h2 className="text-2xl lg:text-3xl font-bold">{settings.title}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-0">
                <CardContent className="p-3">
                  <Skeleton className="aspect-square rounded-lg mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-5 w-20" />
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
    <section className="py-12 bg-gradient-to-r from-red-500 to-orange-500">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg animate-pulse">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold">{settings.title}</h2>
              <p className="text-white/80 text-sm">Limited time offers!</p>
            </div>
          </div>
          
          {/* Countdown Timer */}
          {settings.showCountdown && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Clock className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Ends in:</span>
              <div className="flex gap-1">
                <span className="bg-white text-red-500 font-bold px-2 py-1 rounded">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-white font-bold">:</span>
                <span className="bg-white text-red-500 font-bold px-2 py-1 rounded">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-white font-bold">:</span>
                <span className="bg-white text-red-500 font-bold px-2 py-1 rounded">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden"
            >
              <CardContent className="p-3">
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative aspect-square bg-brown-100 rounded-lg mb-3 overflow-hidden">
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint className="h-12 w-12 text-brown-300" />
                      </div>
                    )}
                    {/* Discount Badge */}
                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500">
                      -{product.discount_percentage}%
                    </Badge>
                  </div>
                </Link>
                
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-medium text-brown-900 text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="space-y-1">
                  <p className="font-bold text-primary text-base">
                    {formatPrice(product.base_price)}
                  </p>
                  {product.original_price && (
                    <p className="text-xs text-brown-400 line-through">
                      {formatPrice(product.original_price)}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Button 
            variant="secondary" 
            size="lg"
            className="bg-white text-red-500 hover:bg-white/90"
            asChild
          >
            <Link href="/products">View All Deals</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
