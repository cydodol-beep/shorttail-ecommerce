'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, Clock, ShoppingCart, Heart, Star, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cart-store';
import { createClient } from '@/lib/supabase/client';
import { useLandingSections } from '@/hooks/use-landing-sections';
import type { Product } from '@/types/database';

interface Promotion {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
  discount_value: number;
  min_purchase_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  applies_to: 'all_products' | 'specific_products';
  product_ids?: string[];
  category_ids?: string[];
  buy_quantity?: number;
  get_quantity?: number;
  max_uses_per_user?: number;
  total_uses?: number;
  available_for_pos?: boolean;
}

interface FlashSaleProduct extends Product {
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  promotion_details?: {
    code: string;
    discount_type: string;
    discount_value: number;
    start_date?: string;
    end_date?: string;
  };
}

export function FlashSales({ className = '' }: { className?: string }) {
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const { addItem } = useCartStore();

  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('flash_sales', {
    title: 'Flash Sale',
    showCountdown: true,
  });

  const fetchPromotionalProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const now = new Date().toISOString();

      // Fetch all active promotions that are currently valid
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select(`
          id,
          code,
          description,
          discount_type,
          discount_value,
          min_purchase_amount,
          start_date,
          end_date,
          is_active,
          applies_to,
          product_ids,
          category_ids,
          buy_quantity,
          get_quantity,
          max_uses_per_user,
          total_uses,
          available_for_pos
        `)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });

      if (promotionsError) {
        console.error('Error fetching promotions:', promotionsError);
        setError('Failed to fetch promotions');
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log('Fetched active promotions:', promotionsData);

      if (!promotionsData || promotionsData.length === 0) {
        console.log('No active promotions found');
        setProducts([]);
        setLoading(false);
        return;
      }

      // Identify products with specific promotions and all-products promotions
      const specificProductIds: string[] = [];
      let allProductsPromotion: Promotion | null = null;

      for (const promo of promotionsData) {
        if (promo.applies_to === 'specific_products' && promo.product_ids && promo.product_ids.length > 0) {
          specificProductIds.push(...promo.product_ids);
        } else if (promo.applies_to === 'all_products') {
          // Use the promotion with the highest discount value for all products
          if (!allProductsPromotion || promo.discount_value > allProductsPromotion.discount_value) {
            allProductsPromotion = promo;
          }
        }
      }

      // Build a map of specific product promotions for quick lookup
      const specificProductPromotions = new Map<string, Promotion>();
      for (const promo of promotionsData) {
        if (promo.applies_to === 'specific_products' && promo.product_ids) {
          for (const productId of promo.product_ids) {
            const existingPromo = specificProductPromotions.get(productId);
            // Use the promotion with the highest discount value for each product
            if (!existingPromo || promo.discount_value > existingPromo.discount_value) {
              specificProductPromotions.set(productId, promo);
            }
          }
        }
      }

      // Build query based on promotion types
      let query = supabase
        .from('products')
        .select('id, name, description, base_price, main_image_url, is_active, stock_quantity, created_at, updated_at')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(6);

      // If there are specific products with promotions, query only those
      if (specificProductIds.length > 0) {
        query = query.in('id', Array.from(new Set(specificProductIds)));
      } 
      // If no specific products but there's an all-products promotion, fetch all products
      else if (allProductsPromotion) {
        // Proceed with the general query (all active products)
      }
      // If no specific products and no all-products promotion, no products to show
      else {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) {
        console.error('Error fetching products for flash sale:', productsError);
        setError('Failed to fetch products');
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log('Fetched products for flash sale:', productsData?.length || 0);

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Apply promotions to products
      const promotionalProducts: FlashSaleProduct[] = [];

      for (const product of productsData) {
        // Get applicable promotion: specific product promotion or all-products promotion
        const applicablePromotion = specificProductPromotions.get(product.id) || allProductsPromotion;

        if (!applicablePromotion) {
          // Skip products without applicable promotions
          continue;
        }

        // Calculate discounted price based on promotion type
        let discountPercentage = 0;
        let salePrice = product.base_price;

        if (applicablePromotion.discount_type === 'percentage') {
          discountPercentage = applicablePromotion.discount_value;
          salePrice = product.base_price * (1 - applicablePromotion.discount_value / 100);
        } else if (applicablePromotion.discount_type === 'fixed') {
          // For fixed discount, calculate the percentage based on original price
          const fixedDiscount = applicablePromotion.discount_value;
          discountPercentage = Math.round((fixedDiscount / product.base_price) * 100);
          salePrice = Math.max(0, product.base_price - fixedDiscount);
        } else if (applicablePromotion.discount_type === 'buy_x_get_y') {
          // For buy_x_get_y promotions, calculate effective discount percentage
          const buyQty = applicablePromotion.buy_quantity || 1;
          const getQty = applicablePromotion.get_quantity || 1;
          discountPercentage = Math.round((getQty / (buyQty + getQty)) * 100);
          salePrice = product.base_price * (1 - discountPercentage / 100);
        }
        // Note: free_shipping promotions don't affect product price directly

        promotionalProducts.push({
          ...product,
          original_price: product.base_price,
          sale_price: salePrice,
          discount_percentage: discountPercentage,
          promotion_details: {
            code: applicablePromotion.code,
            discount_type: applicablePromotion.discount_type,
            discount_value: applicablePromotion.discount_value,
            start_date: applicablePromotion.start_date,
            end_date: applicablePromotion.end_date,
          },
        });
      }

      console.log('Final promotional products:', promotionalProducts.map(p => ({ 
        name: p.name, 
        discount: p.discount_percentage,
        promotion_code: p.promotion_details?.code 
      })));

      setProducts(promotionalProducts);
    } catch (err) {
      console.error('Unexpected error in fetchPromotionalProducts:', err);
      setError('An unexpected error occurred');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotionalProducts();

    // Refresh promotions every 5 minutes
    const interval = setInterval(fetchPromotionalProducts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPromotionalProducts]);

  // Countdown timer effect - for demo purposes, counting down to end of day
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  // Add to cart handler - uses the cart store's addItem interface
  const handleAddToCart = (product: FlashSaleProduct) => {
    const { addItem } = useCartStore();
    addItem(product, undefined, 1); // Pass the full product object, no variant, quantity of 1
  };

  if (loading) {
    return (
      <section className={`py-12 bg-gradient-to-r from-red-500 to-orange-500 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">{settings.title}</h2>
                <p className="text-white/80 text-sm">Limited time offers!</p>
              </div>
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
    return (
      <section className={`py-12 bg-gradient-to-r from-red-500 to-orange-500 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">{settings.title}</h2>
                <p className="text-white/80 text-sm">Limited time offers!</p>
              </div>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
              <Zap className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Flash Sales Available</h3>
            <p className="text-white/80">Check back later for exciting deals and promotions!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-12 bg-gradient-to-r from-red-500 to-orange-500 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg">
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
                <span className="bg-white text-red-500 font-bold px-2 py-1 rounded text-sm min-w-[40px] text-center">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-white font-bold text-sm">:</span>
                <span className="bg-white text-red-500 font-bold px-2 py-1 rounded text-sm min-w-[40px] text-center">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-white font-bold text-sm">:</span>
                <span className="bg-white text-red-500 font-bold px-2 py-1 rounded text-sm min-w-[40px] text-center">
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
                <Link href={`/products/${product.id}`}>
                  <div className="relative aspect-square bg-brown-100 rounded-lg mb-3 overflow-hidden">
                    {product.main_image_url ? (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // Set a default image if the product image fails to load
                          target.src = "/placeholder-product.jpg"; // Replace with actual placeholder
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brown-200">
                        <div className="text-center p-4">
                          <div className="bg-brown-300 p-3 rounded-full inline-block mb-2">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-brown-600 text-xs">No Image</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500 text-white">
                      -{Math.round(product.discount_percentage)}%
                    </Badge>
                    
                    {/* Favorite Button */}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 h-8 w-8"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>

                <Link href={`/products/${product.id}`}>
                  <h3 className="font-medium text-brown-900 text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-1 mb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-3 h-3 ${star <= 4 ? 'text-amber-500 fill-amber-500' : 'text-amber-200'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-xs text-brown-500">(128)</span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-base">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(product.sale_price)}
                    </span>
                    <span className="text-xs text-brown-400 line-through">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(product.original_price)}
                    </span>
                  </div>
                  
                  {product.promotion_details && (
                    <Badge variant="outline" className="text-xs border-red-200 text-red-700 w-fit">
                      {product.promotion_details.code}
                    </Badge>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/products">
            <Button variant="secondary" size="lg" className="bg-white text-red-500 hover:bg-white/90">
              View All Deals
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}