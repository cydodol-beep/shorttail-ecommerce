'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Tag, Percent, Truck, Gift, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Promotion } from '@/store/promotions-store';

function formatDiscount(promo: Promotion): string {
  switch (promo.discount_type) {
    case 'percentage':
      return `${promo.discount_value}% OFF`;
    case 'fixed_amount':
      return `Rp ${new Intl.NumberFormat('id-ID').format(promo.discount_value)} OFF`;
    case 'buy_x_get_y':
      return `Buy ${promo.buy_quantity} Get ${promo.get_quantity} FREE`;
    case 'buy_more_save_more':
      return 'Buy More Save More';
    case 'free_shipping':
      return 'FREE SHIPPING';
    default:
      return 'Special Offer';
  }
}

function getPromoIcon(type: string) {
  switch (type) {
    case 'percentage':
    case 'fixed_amount':
      return <Percent className="h-5 w-5" />;
    case 'buy_x_get_y':
    case 'buy_more_save_more':
      return <Gift className="h-5 w-5" />;
    case 'free_shipping':
      return <Truck className="h-5 w-5" />;
    default:
      return <Tag className="h-5 w-5" />;
  }
}

function getPromoColor(index: number): string {
  const colors = [
    'from-primary to-primary/80',
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
  ];
  return colors[index % colors.length];
}

export function PromoBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchActivePromotions = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('promotions')
      .select('id, code, description, discount_type, discount_value, min_purchase_amount, start_date, end_date, is_active, free_shipping, buy_quantity, get_quantity')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching promotions:', error);
      setLoading(false);
      return;
    }

    const activePromos = (data || []).map((promo: any) => ({
      id: promo.id,
      code: promo.code,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: parseFloat(promo.discount_value) || 0,
      min_purchase_amount: promo.min_purchase_amount ? parseFloat(promo.min_purchase_amount) : undefined,
      start_date: promo.start_date,
      end_date: promo.end_date,
      is_active: promo.is_active,
      free_shipping: promo.free_shipping || false,
      buy_quantity: promo.buy_quantity,
      get_quantity: promo.get_quantity,
    })) as Promotion[];

    setPromotions(activePromos);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivePromotions();
  }, [fetchActivePromotions]);

  // Auto-rotate promotions
  useEffect(() => {
    if (promotions.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promotions.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  if (loading || promotions.length === 0) {
    return null;
  }

  const currentPromo = promotions[currentIndex];

  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        <div className={`relative bg-gradient-to-r ${getPromoColor(currentIndex)} rounded-2xl overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative px-6 py-6 lg:py-8 flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left Content */}
            <div className="flex items-center gap-4 text-white">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                {getPromoIcon(currentPromo.discount_type)}
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold">
                  {formatDiscount(currentPromo)}
                </h3>
                <p className="text-white/90 text-sm lg:text-base">
                  {currentPromo.description || `Use code: ${currentPromo.code}`}
                </p>
                {currentPromo.min_purchase_amount && (
                  <p className="text-white/75 text-xs lg:text-sm mt-1">
                    Min. purchase Rp {new Intl.NumberFormat('id-ID').format(currentPromo.min_purchase_amount)}
                  </p>
                )}
              </div>
            </div>

            {/* Right Content */}
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-white text-xs uppercase tracking-wide">Code</p>
                <p className="text-white font-bold text-lg">{currentPromo.code}</p>
              </div>
              <Link href="/products">
                <Button
                  variant="secondary"
                  className="bg-white text-brown-900 hover:bg-white/90"
                >
                  Shop Now
                </Button>
              </Link>
            </div>

            {/* Navigation Arrows */}
            {promotions.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  aria-label="Previous promotion"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  aria-label="Next promotion"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {promotions.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              {promotions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                  aria-label={`Go to promotion ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
