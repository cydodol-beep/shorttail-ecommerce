import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAIRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  type UserContext,
  type RecommendationOptions,
} from '@/lib/ai/recommendations';
import * as Sentry from '@sentry/nextjs';

/**
 * AI Product Recommendations API Route
 * 
 * GET /api/recommendations
 * 
 * Query parameters:
 * - type: 'personalized' | 'similar' | 'frequently_bought' | 'trending'
 * - productId: (for 'similar' type) Product to find similar items
 * - productIds: (for 'frequently_bought') Comma-separated product IDs
 * - limit: Number of recommendations (default: 5, max: 20)
 * - category: Filter by category
 * 
 * Authentication: Required for personalized recommendations
 * 
 * Response:
 * {
 *   recommendations: Recommendation[],
 *   total: number,
 *   fromCache: boolean
 * }
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get parameters
    const type = searchParams.get('type') || 'personalized';
    const productId = searchParams.get('productId');
    const productIdsParam = searchParams.get('productIds');
    const category = searchParams.get('category');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '5', 10),
      20
    );

    // Validate type
    const validTypes = ['personalized', 'similar', 'frequently_bought', 'trending'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter', validTypes },
        { status: 400 }
      );
    }

    let recommendations;
    let fromCache = false;

    switch (type) {
      case 'personalized': {
        // Require authentication for personalized recommendations
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          return NextResponse.json(
            { error: 'Authentication required for personalized recommendations' },
            { status: 401 }
          );
        }

        // Fetch user context
        const userContext = await buildUserContext(supabase, user.id);
        
        const options: RecommendationOptions = {
          limit,
          includeReasons: true,
          categoryFilter: category || undefined,
        };

        const result = await getAIRecommendations(supabase, userContext, options);
        recommendations = result;
        fromCache = false; // AI recommendations don't use the simple cache
        break;
      }

      case 'similar': {
        if (!productId) {
          return NextResponse.json(
            { error: 'productId required for similar recommendations' },
            { status: 400 }
          );
        }

        recommendations = await getSimilarProducts(supabase, productId, limit);
        break;
      }

      case 'frequently_bought': {
        const productIds = productIdsParam?.split(',').filter(Boolean) || [];
        
        if (productIds.length === 0) {
          return NextResponse.json(
            { error: 'productIds required for frequently_bought recommendations' },
            { status: 400 }
          );
        }

        recommendations = await getFrequentlyBoughtTogether(supabase, productIds, limit);
        break;
      }

      case 'trending': {
        // Get trending products (most recent with high views/purchases)
        const { data: trending, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          throw error;
        }

        recommendations = (trending || []).map((p, i) => ({
          productId: p.id,
          product: p,
          score: 0.9 - i * 0.05,
          reason: 'Produk terbaru dan trending',
          aiGenerated: false,
        }));
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid recommendation type' },
          { status: 400 }
        );
    }

    // Add performance metrics
    const duration = Date.now() - startTime;

    // Track metrics in Sentry (optional)
    Sentry.addBreadcrumb({
      category: 'recommendations',
      message: `Generated ${type} recommendations`,
      data: {
        type,
        count: recommendations.length,
        duration,
        fromCache,
      },
      level: 'info',
    });

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
      fromCache,
      duration,
    });

  } catch (error) {
    console.error('Error in recommendations API:', error);
    
    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        route: '/api/recommendations',
      },
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Build user context from database
 */
async function buildUserContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserContext> {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();

  // Get purchase history
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(10);

  const orderIds = orders?.map((o) => o.id) || [];
  
  let purchaseHistory: string[] = [];
  if (orderIds.length > 0) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id')
      .in('order_id', orderIds);
    
    purchaseHistory = [...new Set(orderItems?.map((i) => i.product_id) || [])];
  }

  // Get favorite categories from purchase history
  let favoriteCategories: string[] = [];
  if (purchaseHistory.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('category')
      .in('id', purchaseHistory.slice(0, 20));
    
    const categories = products
      ?.map((p) => p.category)
      .filter((c): c is string => Boolean(c));
    
    favoriteCategories = [...new Set(categories || [])];
  }

  return {
    userId,
    purchaseHistory,
    favoriteCategories,
    membershipTier: profile?.tier,
  };
}

/**
 * POST endpoint for tracking product views
 * Used to improve recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { productId, action = 'view' } = body;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'productId required' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    // Log the interaction (can be used for analytics)
    if (user) {
      // In a real implementation, you might store this in a product_views table
      console.log(`User ${user.id} ${action}ed product ${productId}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking product interaction:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}