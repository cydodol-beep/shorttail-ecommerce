import OpenAI from 'openai';
import { getRedisClient, generateCacheKey, CACHE_PREFIXES } from '@/lib/redis';
import { cacheWrapper, CACHE_TTL } from '@/lib/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Product } from '@/types/database';

/**
 * AI-Powered Product Recommendations
 * 
 * This module uses OpenAI to generate intelligent product recommendations
 * based on:
 * - User's purchase history
 * - Recently viewed products
 * - Similar user behavior
 * - Product attributes and categories
 * 
 * Environment variable required:
 * - OPENAI_API_KEY: OpenAI API key
 * 
 * Features:
 * - Redis caching for recommendations (1 hour TTL)
 * - Fallback to database recommendations if AI fails
 * - Rate limiting through caching
 * - Type-safe recommendations
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * User context for recommendations
 */
export interface UserContext {
  userId: string;
  purchaseHistory?: string[]; // Product IDs
  viewedProducts?: string[]; // Product IDs
  favoriteCategories?: string[];
  membershipTier?: string;
}

/**
 * Recommendation result
 */
export interface Recommendation {
  productId: string;
  product: Product;
  score: number; // 0-1 confidence score
  reason: string; // Why this product was recommended
  aiGenerated: boolean;
}

/**
 * Recommendation options
 */
export interface RecommendationOptions {
  limit?: number;
  includeReasons?: boolean;
  categoryFilter?: string;
  priceRange?: { min?: number; max?: number };
  bypassCache?: boolean;
}

/**
 * Get AI-powered product recommendations for a user
 * 
 * @param supabase - Supabase client
 * @param userContext - User context data
 * @param options - Recommendation options
 * @returns Array of recommendations
 * 
 * @example
 * const recommendations = await getAIRecommendations(
 *   supabase,
 *   { userId: 'user-123', purchaseHistory: ['prod-1', 'prod-2'] },
 *   { limit: 5, includeReasons: true }
 * );
 */
export async function getAIRecommendations(
  supabase: SupabaseClient<Database>,
  userContext: UserContext,
  options: RecommendationOptions = {}
): Promise<Recommendation[]> {
  const { limit = 5, includeReasons = true, bypassCache = false } = options;

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not configured, falling back to database recommendations');
    return getFallbackRecommendations(supabase, userContext, options);
  }

  // Generate cache key
  const cacheKey = generateCacheKey(
    CACHE_PREFIXES.RECOMMENDATIONS,
    `${userContext.userId}:${JSON.stringify(options)}`
  );

  // Try cache first
  const cached = await cacheWrapper(
    cacheKey,
    async () => generateAIRecommendations(supabase, userContext, options),
    CACHE_TTL.RECOMMENDATIONS,
    bypassCache
  );

  return cached.data;
}

/**
 * Generate AI recommendations using OpenAI
 */
async function generateAIRecommendations(
  supabase: SupabaseClient<Database>,
  userContext: UserContext,
  options: RecommendationOptions
): Promise<Recommendation[]> {
  const { limit = 5, includeReasons = true } = options;

  try {
    // Fetch context data
    const [products, purchaseHistory, viewedProducts] = await Promise.all([
      fetchAvailableProducts(supabase, options),
      fetchPurchaseHistoryDetails(supabase, userContext.purchaseHistory || []),
      fetchViewedProductsDetails(supabase, userContext.viewedProducts || []),
    ]);

    if (products.length === 0) {
      return [];
    }

    // Build prompt for AI
    const prompt = buildRecommendationPrompt(
      products,
      purchaseHistory,
      viewedProducts,
      userContext,
      limit,
      includeReasons
    );

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        {
          role: 'system',
          content: `You are a product recommendation engine for ShortTail.id, a pet shop e-commerce platform.
Your task is to analyze user behavior and product catalog to recommend the best products.

Rules:
1. Recommend products based on purchase history patterns, complementary items, and user preferences
2. Consider pet types, categories, and price ranges from user's history
3. Be diverse - don't recommend only from one category
4. Return ONLY a valid JSON array with no markdown formatting
5. Each recommendation must include: productId (string), score (number 0-1), reason (string)
6. Limit recommendations to the specified count
7. Sort by score descending (highest confidence first)`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Parse AI response
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Clean and parse JSON
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const aiRecommendations: Array<{
      productId: string;
      score: number;
      reason: string;
    }> = JSON.parse(cleanedContent);

    // Map to full recommendation objects
    const recommendations: Recommendation[] = aiRecommendations
      .map((rec) => {
        const product = products.find((p) => p.id === rec.productId);
        if (!product) return null;
        return {
          productId: rec.productId,
          product,
          score: Math.max(0, Math.min(1, rec.score)),
          reason: rec.reason,
          aiGenerated: true,
        };
      })
      .filter((r): r is Recommendation => r !== null)
      .slice(0, limit);

    return recommendations;
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    // Fall back to database-based recommendations
    return getFallbackRecommendations(supabase, userContext, options);
  }
}

/**
 * Build the recommendation prompt for OpenAI
 */
function buildRecommendationPrompt(
  products: Product[],
  purchaseHistory: Product[],
  viewedProducts: Product[],
  userContext: UserContext,
  limit: number,
  includeReasons: boolean
): string {
  const productList = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.base_price,
    description: p.description?.substring(0, 100) || '',
    condition: p.condition,
  }));

  const purchasedItems = purchaseHistory.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.base_price,
  }));

  const viewedItems = viewedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.base_price,
  }));

  return `Recommend ${limit} products from the available catalog for this user.

USER CONTEXT:
- Membership Tier: ${userContext.membershipTier || 'Standard'}
- Favorite Categories: ${userContext.favoriteCategories?.join(', ') || 'Not specified'}

PURCHASE HISTORY (${purchasedItems.length} items):
${JSON.stringify(purchasedItems, null, 2)}

RECENTLY VIEWED (${viewedItems.length} items):
${JSON.stringify(viewedItems, null, 2)}

AVAILABLE PRODUCTS (${productList.length} items):
${JSON.stringify(productList, null, 2)}

${includeReasons ? 'For each recommendation, explain WHY this product is a good match.' : ''}

Return ONLY a JSON array in this exact format:
[
  {
    "productId": "product-uuid",
    "score": 0.95,
    "reason": "Brief explanation of why this product is recommended"
  }
]`;
}

/**
 * Fetch available products from database
 */
async function fetchAvailableProducts(
  supabase: SupabaseClient<Database>,
  options: RecommendationOptions
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(100); // Limit to recent products for performance

  if (options.categoryFilter) {
    query = query.eq('category', options.categoryFilter);
  }

  if (options.priceRange?.min !== undefined) {
    query = query.gte('base_price', options.priceRange.min);
  }

  if (options.priceRange?.max !== undefined) {
    query = query.lte('base_price', options.priceRange.max);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch details for purchased products
 */
async function fetchPurchaseHistoryDetails(
  supabase: SupabaseClient<Database>,
  productIds: string[]
): Promise<Product[]> {
  if (productIds.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .limit(20);

  if (error) {
    console.error('Error fetching purchase history:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch details for viewed products
 */
async function fetchViewedProductsDetails(
  supabase: SupabaseClient<Database>,
  productIds: string[]
): Promise<Product[]> {
  if (productIds.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .limit(20);

  if (error) {
    console.error('Error fetching viewed products:', error);
    return [];
  }

  return data || [];
}

/**
 * Fallback recommendations using database queries
 * Used when AI service is unavailable
 */
async function getFallbackRecommendations(
  supabase: SupabaseClient<Database>,
  userContext: UserContext,
  options: RecommendationOptions
): Promise<Recommendation[]> {
  const { limit = 5 } = options;
  const recommendations: Recommendation[] = [];

  try {
    // 1. Get products from same categories as purchase history
    if (userContext.purchaseHistory && userContext.purchaseHistory.length > 0) {
      const { data: similarProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .in('category', userContext.favoriteCategories || [])
        .not('id', 'in', `(${userContext.purchaseHistory.join(',')})`)
        .limit(limit);

      if (similarProducts) {
        recommendations.push(
          ...(similarProducts as Product[]).map((p, i) => ({
            productId: p.id,
            product: p,
            score: 0.7 - i * 0.05,
            reason: 'Produk serupa dengan pembelian Anda sebelumnya',
            aiGenerated: false,
          }))
        );
      }
    }

    // 2. Get popular/new products if we don't have enough
    if (recommendations.length < limit) {
      const excludeIds = [
        ...recommendations.map((r) => r.productId),
        ...(userContext.purchaseHistory || []),
      ];

      const { data: popularProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .not('id', 'in', `(${excludeIds.join(',') || 'NULL'})`)
        .order('created_at', { ascending: false })
        .limit(limit - recommendations.length);

      if (popularProducts) {
        recommendations.push(
          ...(popularProducts as Product[]).map((p, i) => ({
            productId: p.id,
            product: p,
            score: 0.5 - i * 0.05,
            reason: 'Produk terbaru dan populer',
            aiGenerated: false,
          }))
        );
      }
    }

    // Deduplicate and limit
    const seen = new Set<string>();
    return recommendations
      .filter((r) => {
        if (seen.has(r.productId)) return false;
        seen.add(r.productId);
        return true;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error in fallback recommendations:', error);
    return [];
  }
}

/**
 * Get similar products to a given product
 * 
 * @param supabase - Supabase client
 * @param productId - Product to find similar items for
 * @param limit - Number of recommendations
 * @returns Array of similar products
 */
export async function getSimilarProducts(
  supabase: SupabaseClient<Database>,
  productId: string,
  limit: number = 4
): Promise<Recommendation[]> {
  try {
    // Check related_products first
    const { data: product } = await supabase
      .from('products')
      .select('id, related_product_ids, category')
      .eq('id', productId)
      .single();

    const prod = product as Product | null;

    if (prod?.related_product_ids && prod.related_product_ids.length > 0) {
      const { data: related } = await supabase
        .from('products')
        .select('*')
        .in('id', prod.related_product_ids)
        .eq('is_active', true)
        .limit(limit);

      if (related && related.length > 0) {
        return (related as Product[]).map((p, i) => ({
          productId: p.id,
          product: p,
          score: 0.9 - i * 0.05,
          reason: 'Produk terkait',
          aiGenerated: false,
        }));
      }
    }

    // Fallback: get same category
    if (prod?.category) {
      const { data: similar } = await supabase
        .from('products')
        .select('*')
        .eq('category', prod.category)
        .neq('id', productId)
        .eq('is_active', true)
        .limit(limit);

      if (similar) {
        return (similar as Product[]).map((p, i) => ({
          productId: p.id,
          product: p,
          score: 0.8 - i * 0.05,
          reason: 'Produk dalam kategori yang sama',
          aiGenerated: false,
        }));
      }
    }

    return [];
  } catch (error) {
    console.error('Error getting similar products:', error);
    return [];
  }
}

/**
 * Get frequently bought together products
 * 
 * @param supabase - Supabase client
 * @param productIds - Current cart/wishlist product IDs
 * @param limit - Number of recommendations
 * @returns Array of frequently bought together products
 */
export async function getFrequentlyBoughtTogether(
  supabase: SupabaseClient<Database>,
  productIds: string[],
  limit: number = 4
): Promise<Recommendation[]> {
  if (productIds.length === 0) return [];

  try {
    // Query to find products frequently bought with the given products
    const { data, error } = await supabase
      .rpc('get_frequently_bought_together', {
        p_product_ids: productIds,
        p_limit: limit,
      } as unknown as undefined);

    if (error || !data) {
      // Fallback: suggest complementary categories
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .not('id', 'in', `(${productIds.join(',')})`)
        .limit(limit);

      return ((products || []) as Product[]).map((p, i) => ({
        productId: p.id,
        product: p,
        score: 0.6 - i * 0.05,
        reason: 'Pelanggan juga membeli',
        aiGenerated: false,
      }));
    }

    return (data as Product[]).map((p, i) => ({
      productId: p.id,
      product: p,
      score: 0.85 - i * 0.05,
      reason: 'Sering dibeli bersama',
      aiGenerated: false,
    }));
  } catch (error) {
    console.error('Error getting frequently bought together:', error);
    return [];
  }
}