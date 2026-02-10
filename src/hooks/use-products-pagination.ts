'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

interface UseProductsPaginationOptions {
  initialFilters?: ProductFilters;
  itemsPerPage?: number;
}

interface UseProductsPaginationReturn {
  products: ProductWithDetails[];
  paginatedProducts: ProductWithDetails[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filters: ProductFilters;
  setFilters: (filters: ProductFilters | ((prev: ProductFilters) => ProductFilters)) => void;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
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

export function useProductsPagination(options: UseProductsPaginationOptions = {}): UseProductsPaginationReturn {
  const { initialFilters = {}, itemsPerPage = 20 } = options;
  
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFiltersState] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const supabase = createClient();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Calculate paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemsPerPage]);

  // Enhanced setFilters with debouncing for search
  const setFilters = useCallback((
    newFilters: ProductFilters | ((prev: ProductFilters) => ProductFilters)
  ) => {
    setFiltersState((prev) => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      
      // Reset page when filters change
      if (JSON.stringify(updated) !== JSON.stringify(prev)) {
        setCurrentPage(1);
      }
      
      return updated;
    });
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  // Fetch all products (for client-side pagination)
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build base query - fetch all matching products
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Apply category filter
      if (filters.category && filters.category !== 'all') {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.category)
          .single();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      // Apply search filter
      if (filters.searchQuery?.trim()) {
        query = query.ilike('name', `%${filters.searchQuery.trim()}%`);
      }

      // Apply stock filter
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

      // Fetch all products (up to 1000 for client-side pagination)
      query = query.limit(1000);

      const { data: productsData, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Products fetch error:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch products');
      }

      // Fetch variants for products that have them
      const productIds = (productsData || []).map((p: Product) => p.id);
      let variantsMap: Record<string, ProductVariant[]> = {};
      
      if (productIds.length > 0) {
        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('*')
          .in('product_id', productIds);
        
        if (!variantsError && variantsData) {
          variantsMap = variantsData.reduce((acc: Record<string, ProductVariant[]>, variant: ProductVariant) => {
            if (!acc[variant.product_id]) acc[variant.product_id] = [];
            acc[variant.product_id].push(variant);
            return acc;
          }, {});
        }
      }

      // Fetch categories
      const categoryIds = [...new Set((productsData || []).map((p: Product) => p.category_id).filter(Boolean))];
      let categoriesMap: Record<string, Category> = {};
      
      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .in('id', categoryIds);
        
        if (!categoriesError && categoriesData) {
          categoriesMap = categoriesData.reduce((acc: Record<string, Category>, cat: Category) => {
            acc[cat.id] = cat;
            return acc;
          }, {});
        }
      }

      // Process products
      let processedProducts: ProductWithDetails[] = (productsData || []).map((product: Product) => {
        const variants = variantsMap[product.id] || [];
        
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

        return {
          ...product,
          categories: product.category_id ? categoriesMap[product.category_id] || null : null,
          product_variants: variants,
          lowestPrice,
          highestPrice,
          totalStock,
          isOutOfStock: totalStock <= 0,
        };
      });

      // Apply price filter in memory
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        processedProducts = processedProducts.filter((product) => {
          const min = filters.minPrice ?? 0;
          const max = filters.maxPrice ?? Infinity;
          return product.lowestPrice >= min && product.lowestPrice <= max;
        });
      }

      if (isMountedRef.current) {
        setProducts(processedProducts);
        setTotalCount(count || 0);
        // Reset to page 1 when filters change
        setCurrentPage(1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      console.error('Error fetching products:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters, supabase]);

  // Debounced fetch for search
  useEffect(() => {
    isMountedRef.current = true;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        fetchProducts();
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
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minPrice, filters.maxPrice]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Pagination navigation
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          goToNextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goToPreviousPage();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          goToPage(totalPages);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPreviousPage, goToPage, totalPages]);

  return {
    products,
    paginatedProducts,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    filters,
    setFilters,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    refetch: fetchProducts,
    resetFilters,
  };
}
