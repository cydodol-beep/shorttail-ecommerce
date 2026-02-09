import { getRedisClient, generateCacheKey, CACHE_PREFIXES, deleteKeysByPattern } from './redis';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Cache TTL (Time To Live) configurations in seconds
 */
export const CACHE_TTL = {
  // Products: 5 minutes (frequently changing)
  PRODUCTS: 300,
  PRODUCTS_LIST: 300,
  
  // Categories: 1 hour (rarely changing)
  CATEGORIES: 3600,
  
  // Store Settings: 1 hour (rarely changing)
  SETTINGS: 3600,
  
  // Promotions: 10 minutes (moderate change frequency)
  PROMOTIONS: 600,
  
  // Orders: 5 minutes (frequently changing)
  ORDERS: 300,
  
  // User Profiles: 10 minutes
  USERS: 600,
  
  // AI Recommendations: 1 hour
  RECOMMENDATIONS: 3600,
  
  // Notifications: 5 minutes
  NOTIFICATIONS: 300,
} as const;

/**
 * Cache options interface
 */
interface CacheOptions {
  ttl?: number;
  tags?: string[];
  bypassCache?: boolean;
}

/**
 * Result wrapper for cached operations
 */
interface CachedResult<T> {
  data: T;
  fromCache: boolean;
  cachedAt?: number;
}

/**
 * Generic cache wrapper for any async function
 * 
 * @param key - Unique cache key
 * @param fetchFn - Function to fetch data if not cached
 * @param ttl - Time to live in seconds
 * @param bypassCache - Skip cache and fetch fresh data
 * @returns Promise with data and cache metadata
 * 
 * @example
 * const result = await cacheWrapper(
 *   'shorttail:products:123',
 *   () => supabase.from('products').select('*').eq('id', 123).single(),
 *   CACHE_TTL.PRODUCTS
 * );
 */
export async function cacheWrapper<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300,
  bypassCache: boolean = false
): Promise<CachedResult<T>> {
  try {
    const redis = getRedisClient();

    // Try to get from cache if not bypassing
    if (!bypassCache) {
      const cached = await redis.get<string>(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as T;
          return {
            data: parsed,
            fromCache: true,
            cachedAt: Date.now(),
          };
        } catch {
          // If parsing fails, continue to fetch fresh data
          console.warn('Failed to parse cached data for key:', key);
        }
      }
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache (don't await to not block response)
    redis.setex(key, ttl, JSON.stringify(data)).catch((err) => {
      console.error('Failed to set cache for key:', key, err);
    });

    return {
      data,
      fromCache: false,
    };
  } catch (error) {
    console.error('Cache wrapper error:', error);
    // Fallback to direct fetch if cache fails
    const data = await fetchFn();
    return {
      data,
      fromCache: false,
    };
  }
}

/**
 * Get a single product by ID with caching
 * 
 * @param supabase - Supabase client
 * @param productId - Product UUID
 * @param options - Cache options
 * @returns Cached product data
 */
export async function getCachedProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  options: CacheOptions = {}
) {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.PRODUCTS, productId);
  
  return cacheWrapper(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    options.ttl || CACHE_TTL.PRODUCTS,
    options.bypassCache
  );
}

/**
 * Get products list with caching
 * 
 * @param supabase - Supabase client
 * @param filters - Optional filters
 * @param options - Cache options
 * @returns Cached products list
 */
export async function getCachedProductsList(
  supabase: SupabaseClient<Database>,
  filters?: {
    categoryId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  },
  options: CacheOptions = {}
) {
  const filterKey = filters 
    ? `list:${JSON.stringify(filters)}`
    : 'list:all';
  const cacheKey = generateCacheKey(CACHE_PREFIXES.PRODUCTS, filterKey);
  
  return cacheWrapper(
    cacheKey,
    async () => {
      let query = supabase
        .from('products')
        .select('*, product_variants(*)');
      
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      
      query = query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    options.ttl || CACHE_TTL.PRODUCTS_LIST,
    options.bypassCache
  );
}

/**
 * Get categories with caching
 * 
 * @param supabase - Supabase client
 * @param options - Cache options
 * @returns Cached categories
 */
export async function getCachedCategories(
  supabase: SupabaseClient<Database>,
  options: CacheOptions = {}
) {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.CATEGORIES, 'list:all');
  
  return cacheWrapper(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    options.ttl || CACHE_TTL.CATEGORIES,
    options.bypassCache
  );
}

/**
 * Get store settings with caching
 * 
 * @param supabase - Supabase client
 * @param options - Cache options
 * @returns Cached store settings
 */
export async function getCachedSettings(
  supabase: SupabaseClient<Database>,
  options: CacheOptions = {}
) {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.SETTINGS, 'store');
  
  return cacheWrapper(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    options.ttl || CACHE_TTL.SETTINGS,
    options.bypassCache
  );
}

/**
 * Get active promotions with caching
 * 
 * @param supabase - Supabase client
 * @param options - Cache options
 * @returns Cached promotions
 */
export async function getCachedPromotions(
  supabase: SupabaseClient<Database>,
  options: CacheOptions = {}
) {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.PROMOTIONS, 'active');
  
  return cacheWrapper(
    cacheKey,
    async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);
      
      if (error) throw error;
      return data || [];
    },
    options.ttl || CACHE_TTL.PROMOTIONS,
    options.bypassCache
  );
}

/**
 * Invalidate cache for a specific entity type
 * 
 * @param prefix - Cache prefix from CACHE_PREFIXES
 * @param identifier - Optional specific identifier
 * @returns Number of keys invalidated
 * 
 * @example
 * // Invalidate all product caches
 * invalidateCache(CACHE_PREFIXES.PRODUCTS);
 * 
 * // Invalidate specific product
 * invalidateCache(CACHE_PREFIXES.PRODUCTS, 'product-123');
 */
export async function invalidateCache(
  prefix: string,
  identifier?: string
): Promise<number> {
  try {
    const pattern = identifier 
      ? `${prefix}:${identifier}*`
      : `${prefix}:*`;
    
    return await deleteKeysByPattern(pattern);
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate product cache (convenience function)
 * @param productId - Optional specific product ID
 */
export async function invalidateProductCache(productId?: string): Promise<number> {
  return invalidateCache(CACHE_PREFIXES.PRODUCTS, productId);
}

/**
 * Invalidate category cache
 */
export async function invalidateCategoryCache(): Promise<number> {
  return invalidateCache(CACHE_PREFIXES.CATEGORIES);
}

/**
 * Invalidate settings cache
 */
export async function invalidateSettingsCache(): Promise<number> {
  return invalidateCache(CACHE_PREFIXES.SETTINGS);
}

/**
 * Invalidate promotions cache
 */
export async function invalidatePromotionsCache(): Promise<number> {
  return invalidateCache(CACHE_PREFIXES.PROMOTIONS);
}

/**
 * Invalidate all ShortTail caches (use with caution)
 * @returns Number of keys deleted
 */
export async function invalidateAllCache(): Promise<number> {
  return deleteKeysByPattern('shorttail:*');
}

/**
 * Prefetch data into cache (useful for warming cache)
 * 
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in seconds
 */
export async function prefetchCache<T>(
  key: string,
  data: T,
  ttl: number = 300
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Prefetch cache error:', error);
  }
}

/**
 * Decorator-style cache utility for wrapping existing functions
 * 
 * @param fn - Function to wrap
 * @param getCacheKey - Function to generate cache key from arguments
 * @param ttl - Time to live in seconds
 * @returns Wrapped function with caching
 * 
 * @example
 * const getProduct = withCache(
 *   async (id: string) => {
 *     const { data } = await supabase.from('products').select('*').eq('id', id).single();
 *     return data;
 *   },
 *   (id) => generateCacheKey(CACHE_PREFIXES.PRODUCTS, id),
 *   CACHE_TTL.PRODUCTS
 * );
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getCacheKey: (...args: Parameters<T>) => string,
  ttl: number = 300
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = getCacheKey(...args);
    const result = await cacheWrapper(key, () => fn(...args), ttl);
    return result.data;
  }) as T;
}