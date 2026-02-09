import { Redis } from '@upstash/redis';

/**
 * Redis client singleton for serverless Redis caching
 * Uses Upstash Redis for edge-compatible, serverless caching
 * 
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

let redisClient: Redis | null = null;

/**
 * Get or create the Redis client singleton
 * @returns Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Redis configuration missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      );
    }

    redisClient = new Redis({
      url,
      token,
    });
  }

  return redisClient;
}

/**
 * Redis key prefixes for different entity types
 */
export const CACHE_PREFIXES = {
  PRODUCTS: 'shorttail:products',
  CATEGORIES: 'shorttail:categories',
  SETTINGS: 'shorttail:settings',
  PROMOTIONS: 'shorttail:promotions',
  ORDERS: 'shorttail:orders',
  USERS: 'shorttail:users',
  RECOMMENDATIONS: 'shorttail:recommendations',
  NOTIFICATIONS: 'shorttail:notifications',
} as const;

/**
 * Generate a cache key with proper prefix format
 * @param prefix - The cache prefix from CACHE_PREFIXES
 * @param identifier - Optional identifier (ID, list type, etc.)
 * @returns Formatted cache key
 * 
 * @example
 * generateCacheKey('shorttail:products', '123') // 'shorttail:products:123'
 * generateCacheKey('shorttail:products', 'list:all') // 'shorttail:products:list:all'
 */
export function generateCacheKey(prefix: string, identifier?: string): string {
  if (identifier) {
    return `${prefix}:${identifier}`;
  }
  return prefix;
}

/**
 * Check if Redis is available (for health checks)
 * @returns Promise<boolean>
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete all keys matching a pattern (use with caution)
 * @param pattern - Redis pattern to match (e.g., 'shorttail:products:*')
 * @returns Number of keys deleted
 */
export async function deleteKeysByPattern(pattern: string): Promise<number> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return 0;
    
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('Error deleting Redis keys by pattern:', error);
    return 0;
  }
}

/**
 * Get cache statistics (useful for monitoring)
 * @returns Object with cache info
 */
export async function getCacheStats(): Promise<{
  available: boolean;
  keyCount?: number;
  error?: string;
}> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys('shorttail:*');
    
    return {
      available: true,
      keyCount: keys.length,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}