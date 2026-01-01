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
  promotion_details?: {
    code: string;
    discount_type: string;
    discount_value: number;
    buy_quantity?: number;
    get_quantity?: number;
  };
}

export function FlashSale() {
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const addItem = useCartStore((state) => state.addItem);
  
  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('flash_sale', {
    title: 'Flash Sale',
    showCountdown: true,
  });

  const fetchFlashSaleProducts = useCallback(async () => {
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      // Fetch all active promotions that are currently valid
      const { data: promoData, error: promoError } = await supabase
        .from('promotions')
        .select('id, code, product_ids, discount_type, discount_value, applies_to, start_date, end_date, min_purchase_amount, buy_quantity, get_quantity')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);

      if (promoError) {
        console.error('Error fetching promotions:', promoError);
        setProducts([]);
        setLoading(false);
        return;
      }

      if (!promoData || promoData.length === 0) {
        console.log('No active promotions found');
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log('All active promotions:', promoData);

      // Find the closest expiration date among active promotions
      let closestExpiration: Date | null = null;
      for (const promo of promoData) {
        if (promo.end_date) {
          const promoEndDate = new Date(promo.end_date);
          if (!closestExpiration || promoEndDate < closestExpiration) {
            closestExpiration = promoEndDate;
          }
        }
      }

      console.log('Flash sale promotions:', promoData);

      // Build a map of product_id -> details for specific products
      const productPromoMap = new Map<string, {
        discount_value: number;
        discount_type: string;
        code: string;
        buy_quantity?: number;
        get_quantity?: number;
      }>();

      // Track highest-value "all products" promotion
      let allProductsPromotion: {
        discount_value: number;
        discount_type: string;
        code: string;
        buy_quantity?: number;
        get_quantity?: number;
      } | null = null;

      for (const promo of promoData) {
        if (promo.applies_to === 'all_products') {
          // Use the promotion with the highest discount value for all products
          if (!allProductsPromotion || promo.discount_value > allProductsPromotion.discount_value) {
            allProductsPromotion = {
              discount_value: promo.discount_value,
              discount_type: promo.discount_type,
              code: promo.code,
              buy_quantity: promo.buy_quantity,
              get_quantity: promo.get_quantity
            };
          }
        } else if (promo.product_ids && promo.product_ids.length > 0) {
          for (const productId of promo.product_ids) {
            const existing = productPromoMap.get(productId);
            // Use the promotion with the highest discount value for each product
            if (!existing || promo.discount_value > existing.discount_value) {
              productPromoMap.set(productId, {
                discount_value: promo.discount_value,
                discount_type: promo.discount_type,
                code: promo.code,
                buy_quantity: promo.buy_quantity,
                get_quantity: promo.get_quantity
              });
            }
          }
        }
      }

      console.log('Specific product promotions map:', Object.fromEntries(productPromoMap));
      console.log('All products promotion:', allProductsPromotion);

      // Get specific product IDs with promotions
      const specificProductIds = Array.from(productPromoMap.keys());

      // Build query based on promotion types
      let query = supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(6);

      console.log('Supabase query object:', query);

      // If there are specific products with promotions, query only those
      if (specificProductIds.length > 0) {
        query = query.in('id', specificProductIds);
      } else if (!allProductsPromotion) {
        // No products to show if no specific promotions and no all-products promotions
        console.log('No specific or all-products promotions available');
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching flash sale products:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log('Fetched products for flash sale:', data?.length || 0);
      if (data) {
        console.log('Sample product data:', data[0]); // Log first product to see field names
      }

      // Apply discounts from promotions
      const productsWithDiscounts: FlashSaleProduct[] = [];

      for (const product of (data || [])) {
        // Get promotion details: specific product promotion or all-products promotion
        const specificPromo = productPromoMap.get(product.id);
        const promoDetails = specificPromo || allProductsPromotion;

        if (!promoDetails) {
          console.log(`Product ${product.id} has no applicable promotion`);
          continue; // Skip products without applicable promotions
        }

        // Determine if this is a valid promotion to display
        let isValidPromotion = true;

        if (promoDetails.discount_type === 'percentage' && promoDetails.discount_value <= 0) {
          isValidPromotion = false;
          console.log(`Percentage promotion for product ${product.id} has invalid discount value: ${promoDetails.discount_value}`);
        } else if (promoDetails.discount_type === 'fixed' && promoDetails.discount_value <= 0) {
          isValidPromotion = false;
          console.log(`Fixed discount promotion for product ${product.id} has invalid discount value: ${promoDetails.discount_value}`);
        }
        // buy_x_get_y promotions are considered valid if they have valid quantities
        else if (promoDetails.discount_type === 'buy_x_get_y' &&
                 (!promoDetails.buy_quantity || !promoDetails.get_quantity)) {
          isValidPromotion = false;
          console.log(`Buy-X-Get-Y promotion for product ${product.id} has invalid quantities`);
        }

        if (!isValidPromotion) {
          continue;
        }

        // Handle different possible price field names for flexibility
        let originalPrice = product.base_price || product.price || product.regular_price;
        if (typeof originalPrice === 'string') {
          originalPrice = parseFloat(originalPrice);
        }

        if (!originalPrice && originalPrice !== 0) {
          console.warn(`Product ${product.id} has no valid price, skipping promotion application`);
          continue;
        }

        let discountPercentage = 0;
        let discountedPrice = originalPrice;

        // Calculate based on promotion type
        if (promoDetails.discount_type === 'percentage') {
          discountPercentage = promoDetails.discount_value;
          discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));
        } else if (promoDetails.discount_type === 'fixed') {
          // For fixed discount, calculate the percentage based on original price
          const fixedDiscount = promoDetails.discount_value;
          discountPercentage = Math.round((fixedDiscount / originalPrice) * 100);
          discountedPrice = Math.max(0, originalPrice - fixedDiscount);
        } else if (promoDetails.discount_type === 'buy_x_get_y') {
          // For buy_x_get_y, we'll calculate a simple average discount percentage
          // For example: Buy 2 Get 1 Free is effectively 33% off
          const buyQty = promoDetails.buy_quantity || 1;
          const getQty = promoDetails.get_quantity || 1;
          discountPercentage = Math.round((getQty / (buyQty + getQty)) * 100);
          discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));
        }

        productsWithDiscounts.push({
          ...product,
          original_price: originalPrice,
          base_price: discountedPrice,
          discount_percentage: discountPercentage,
          promotion_details: {
            code: promoDetails.code,
            discount_type: promoDetails.discount_type,
            discount_value: promoDetails.discount_value,
            buy_quantity: promoDetails.buy_quantity,
            get_quantity: promoDetails.get_quantity,
          }
        });
      }

      console.log('Final flash sale products with discounts:', productsWithDiscounts.map(p => ({
        name: p.name,
        discount: p.discount_percentage,
        promotion_type: p.promotion_details?.discount_type
      })));

      setProducts(productsWithDiscounts);
    } catch (error) {
      console.error('Unexpected error in fetchFlashSaleProducts:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle error cases to ensure loading stops
  useEffect(() => {
    if (loading && !products.length) {
      // If loading has been true for a long time, it may indicate an issue
      const timer = setTimeout(() => {
        console.warn('FlashSale: Loading taking long time, check for errors in console');
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [loading, products.length]);

  // Countdown timer effect
  useEffect(() => {
    const fetchAndSetTimer = async () => {
      const supabase = createClient();
      const now = new Date().toISOString();

      // Fetch all active promotions that are currently valid
      const { data: promoData, error: promoError } = await supabase
        .from('promotions')
        .select('end_date')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);

      if (promoError) {
        console.error('Error fetching promotions for countdown:', promoError);
        return;
      }

      if (!promoData || promoData.length === 0) {
        return;
      }

      // Find the closest expiration date among active promotions
      let closestExpiration: Date | null = null;
      for (const promo of promoData) {
        if (promo.end_date) {
          const promoEndDate = new Date(promo.end_date);
          if (!closestExpiration || promoEndDate < closestExpiration) {
            closestExpiration = promoEndDate;
          }
        }
      }

      if (closestExpiration) {
        const updateCountdown = () => {
          const now = new Date();
          const diff = closestExpiration!.getTime() - now.getTime();

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ hours, minutes, seconds });
          } else {
            setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          }
        };

        // Update immediately and set interval
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
      }
    };

    fetchAndSetTimer();
  }, []);

  useEffect(() => {
    console.log('FlashSale component mounted, starting fetch...');
    fetchFlashSaleProducts();
  }, [fetchFlashSaleProducts]);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    console.log('FlashSale - Currently loading...');
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

  console.log('FlashSale - Products count:', products.length, 'Loading state:', loading);

  // Hide the section completely when there are no promotions available
  if (products.length === 0 && !loading) {
    console.log('FlashSale - No promotions available, hiding section');
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
                    {/* Discount Badge - Enhanced to show promotion details */}
                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500 text-xs">
                      {product.promotion_details ? (
                        product.promotion_details.discount_type === 'percentage' ? (
                          `-${product.promotion_details.discount_value}%`
                        ) : product.promotion_details.discount_type === 'fixed' ? (
                          `-${formatPrice(product.promotion_details.discount_value)}`
                        ) : product.promotion_details.discount_type === 'buy_x_get_y' ? (
                          `Buy ${product.promotion_details.buy_quantity} Get ${product.promotion_details.get_quantity} Free`
                        ) : (
                          'Special Offer'
                        )
                      ) : (
                        'Special Offer'
                      )}
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
          <Link href="/products">
          <Button
            variant="secondary"
            size="lg"
            className="bg-white text-red-500 hover:bg-white/90"
          >
            View All Deals
          </Button>
        </Link>
        </div>
      </div>
    </section>
  );
}
