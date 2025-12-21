import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Promotion } from '@/types/database';

export function useActivePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
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

        setPromotions(data || []);
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