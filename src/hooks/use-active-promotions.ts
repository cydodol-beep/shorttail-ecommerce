import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Promotion } from '@/types/database';

// Extended promotion type with formatted data
interface ActivePromotion extends Promotion {
  formattedDiscount: string;
  formattedPeriod: string;
}

export function useActivePromotions() {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch active promotions that are currently valid
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .lte('start_date', new Date().toISOString())  // start_date <= current date
          .gte('end_date', new Date().toISOString())    // end_date >= current date
          .order('start_date', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        // Format promotions with additional display information
        const formattedPromotions = (data || []).map((promo: Promotion) => {
          // Format discount value based on type
          let formattedDiscount = '';
          if (promo.discount_type === 'percentage') {
            formattedDiscount = `${promo.discount_value}% OFF`;
          } else if (promo.discount_type === 'fixed') {
            formattedDiscount = `${new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            }).format(Number(promo.discount_value))} OFF`;
          } else {
            formattedDiscount = `${promo.discount_value} OFF`;
          }

          // Format period
          const startDate = new Date(promo.start_date!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          const endDate = new Date(promo.end_date!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const formattedPeriod = `Valid ${startDate} - ${endDate}`;

          return {
            ...promo,
            formattedDiscount,
            formattedPeriod
          };
        });

        setPromotions(formattedPromotions);
      } catch (err) {
        console.error('Error fetching active promotions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch promotions');
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();

    // Refresh promotions every 5 minutes (optional)
    const interval = setInterval(fetchPromotions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { promotions, loading, error };
}