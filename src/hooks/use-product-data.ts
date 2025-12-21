import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product, ProductVariant } from '@/types/database';

export interface ProductWithVariants extends Product {
  product_variants?: ProductVariant[];
}

export function useProductData() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false }); // Order by newest first

      if (error) {
        throw new Error(error.message);
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get best selling products based on order count
  const getBestSellingProducts = (): ProductWithVariants[] => {
    // Sort products by sales count or best seller flag
    return [...products]
      .filter(p => p.is_best_seller || (p as any).sales_count > 0)
      .sort((a, b) => {
        const aSales = (a as any).sales_count || 0;
        const bSales = (b as any).sales_count || 0;
        // If both have best seller flag, use sales count for tiebreaker
        if (a.is_best_seller && b.is_best_seller) {
          return bSales - aSales;
        }
        // Best seller flag takes precedence
        if (a.is_best_seller && !b.is_best_seller) return -1;
        if (!a.is_best_seller && b.is_best_seller) return 1;
        // Otherwise, sort by sales count
        return bSales - aSales;
      })
      .slice(0, 8); // Return top 8 bestsellers
  };

  // Get new arrival products (most recently created)
  const getNewArrivalProducts = (): ProductWithVariants[] => {
    return [...products]
      .filter(p => p.is_new || new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8); // Return the 8 newest products
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    getBestSellingProducts,
    getNewArrivalProducts,
    refetch: loadProducts
  };
}