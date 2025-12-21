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

  // Get best selling products based on sales count
  const getBestSellingProducts = (): ProductWithVariants[] => {
    // Sort products by sales count (assuming sales_count is a field in the products table)
    return [...products]
      .filter(p => p.sales_count && p.sales_count > 0)
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
      .slice(0, 8); // Return top 8 bestsellers
  };

  // Get new arrival products (most recently created)
  const getNewArrivalProducts = (): ProductWithVariants[] => {
    return [...products]
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