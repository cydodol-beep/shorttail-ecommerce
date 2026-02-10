'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product, ProductVariant, Category } from '@/types/database';

export interface ProductFilters {
  category?: string;
  petType?: 'dog' | 'cat' | 'all';
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  searchQuery?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'popularity';
}

export interface ProductWithDetails extends Product {
  categories?: Category | null;
  product_variants?: ProductVariant[];
  lowestPrice: number;
  highestPrice: number;
  totalStock: number;
  isOutOfStock: boolean;
}

interface UseProductsGridOptions {
  initialFilters?: ProductFilters;
  itemsPerPage?: number;
}

interface UseProductsGridReturn {
  products: ProductWithDetails[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  filters: ProductFilters;
  setFilters: (filters: ProductFilters | ((prev: ProductFilters) => ProductFilters)) => void;
  loadMore: () => void;
  refetch: () => Promise<void>;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: ProductFilters = {
  category: 'all',
  petType: 'all',
  minPrice: undefined,
  maxPrice: undefined,
  inStockOnly: false,
  searchQuery: '',
  sortBy: 'newest',
};

export function useProductsGrid(options: UseProductsGridOptions = {}): UseProductsGridReturn {
  const { initialFilters = {}, itemsPerPage = 24 } = options;
  
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFiltersState] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const hasMore = products.length < totalCount;

  // Enhanced setFilters with debouncing for search
  const setFilters = useCallback((
    newFilters: ProductFilters | ((prev: ProductFilters) => ProductFilters)
  ) => {
    setFiltersState((prev) => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      
      // Reset page when filters change (except for pagination)
      if (JSON.stringify(updated) !== JSON.stringify(prev)) {
        setPage(1);
      }
      
      return updated;
    });
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (isLoadMore = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Build base query
      let query = supabase
        .from('products')
        .select(
          `
            id,
            name,
            description,
            sku,
            category_id,
            base_price,
            stock_quantity,
            condition,
            has_variants,
            main_image_url,
            gallery_image_urls,
            unit_weight_grams,
            is_active,
            related_product_ids,
            created_at,
            updated_at,
            categories:category_id(id, name, slug),
            product_variants(id, variant_name, price_adjustment, stock_quantity, variant_image_url)
          `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .abortSignal(abortControllerRef.current.signal);

      // Apply filters
      if (filters.category && filters.category !== 'all') {
        // Get category ID from slug
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.category)
          .single();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      if (filters.searchQuery?.trim()) {
        query = query.ilike('name', `%${filters.searchQuery.trim()}%`);
      }

      if (filters.inStockOnly) {
        query = query.gt('stock_quantity', 0);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price-asc':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('base_price', { ascending: false });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Process products with variants
      const processedProducts: ProductWithDetails[] = (data || []).map((product: any) => {
        const variants = product.product_variants || [];
        
        // Calculate price range
        let lowestPrice = product.base_price;
        let highestPrice = product.base_price;
        
        if (variants.length > 0) {
          const prices = variants.map((v: ProductVariant) => 
            product.base_price + (v.price_adjustment || 0)
          );
          lowestPrice = Math.min(...prices);
          highestPrice = Math.max(...prices);
        }

        // Calculate total stock
        const variantStock = variants.reduce(
          (sum: number, v: ProductVariant) => sum + (v.stock_quantity || 0),
          0
        );
        const totalStock = product.stock_quantity + variantStock;

        // Check if out of stock
        const isOutOfStock = totalStock <= 0;

        return {
          ...product,
          categories: product.categories,
          product_variants: variants,
          lowestPrice,
          highestPrice,
          totalStock,
          isOutOfStock,
        };
      });

      // Apply price filter in memory (since variants affect price)
      let filteredProducts = processedProducts;
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        filteredProducts = processedProducts.filter((product) => {
          const min = filters.minPrice ?? 0;
          const max = filters.maxPrice ?? Infinity;
          return product.lowestPrice >= min && product.lowestPrice <= max;
        });
      }

      if (isMountedRef.current) {
        if (isLoadMore) {
          setProducts((prev) => [...prev, ...filteredProducts]);
          setPage(currentPage);
        } else {
          setProducts(filteredProducts);
          setPage(1);
        }

        setTotalCount(count || 0);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      console.error('Error fetching products:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [filters, page, itemsPerPage, supabase]);

  // Debounced fetch for search
  useEffect(() => {
    isMountedRef.current = true;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        fetchProducts(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.searchQuery, filters.category, filters.sortBy, filters.inStockOnly, fetchProducts]);

  // Immediate fetch for other filters
  useEffect(() => {
    if (isMountedRef.current) {
      fetchProducts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minPrice, filters.maxPrice]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load more products
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchProducts(true);
    }
  }, [fetchProducts, isLoadingMore, hasMore]);

  return {
    products,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    filters,
    setFilters,
    loadMore,
    refetch: () => fetchProducts(false),
    resetFilters,
  };
}
