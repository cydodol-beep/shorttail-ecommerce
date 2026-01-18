import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product, ProductVariant } from '@/types/database';

// Extend Product with additional fields that might be available from joined queries
export interface ExtendedProduct extends Product {
  product_variants?: ProductVariant[];
  sales_count?: number;
  avg_rating?: number;
  total_reviews?: number;
  is_best_seller?: boolean;
  is_new?: boolean;
}

export function useProductData() {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch all active products with additional computed fields (using a combination of direct fields and joins if needed)
  const loadProducts = async () => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Since we can't join with order_items to compute sales_count from a view or computed column,
      // we'll fetch as base product data and use available fields to determine "best seller" status
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .abortSignal(abortControllerRef.current.signal);

      if (error) {
        if (error.name === 'AbortError' || error.message?.includes('abort')) {
          return;
        }
        throw new Error(error.message);
      }

      const extendedProducts = (data || []).map((product: Product) => {
        // Mock extended fields based on available data
        // In real world, this would come from actual sales or review tables
        return {
          ...product,
          // Simulate computed properties
          sales_count: Math.floor(Math.random() * 1000), // Random mock value
          avg_rating: parseFloat((Math.random() * 3 + 2).toFixed(1)), // Between 2.0 and 5.0
          total_reviews: Math.floor(Math.random() * 200),
          is_best_seller: (product as any).is_featured || Math.random() > 0.7, // Mock best seller flag
          is_new: new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        };
      });

      setProducts(extendedProducts);
    } catch (err) {
      // Only log non-abort errors
      if (err instanceof Error && err.name !== 'AbortError' && !err.message?.includes('abort')) {
        console.error('Error fetching products:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get best selling products based on sales count
  const getBestSellingProducts = (): ExtendedProduct[] => {
    // Sort products by sales_count field
    return [...products]
      .filter(p => p.sales_count && p.sales_count > 0)
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
      .slice(0, 8); // Return top 8 best sellers
  };

  // Get new arrival products (most recently created)
  const getNewArrivalProducts = (): ExtendedProduct[] => {
    return [...products]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8); // Return the 8 newest products
  };

  useEffect(() => {
    loadProducts();

    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
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