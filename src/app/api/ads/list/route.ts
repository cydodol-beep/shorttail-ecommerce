import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AdvertisementCampaign, AdPosition } from '@/types/database';

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

// In-memory cache for Redis-like behavior
const cache = new Map<string, { data: AdvertisementCampaign[]; timestamp: number }>();

function getCacheKey(position: string, deviceType: string, userTier: string): string {
  return `ads:${position}:${deviceType}:${userTier}`;
}

function getCachedAds(key: string): AdvertisementCampaign[] | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION * 1000) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedAds(key: string, ads: AdvertisementCampaign[]): void {
  cache.set(key, { data: ads, timestamp: Date.now() });
}

// Create a simple Supabase client for public data (no auth required)
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') as AdPosition | null;
    const deviceType = searchParams.get('deviceType') || 'desktop';
    const userTier = searchParams.get('userTier') || '';

    if (!position) {
      return NextResponse.json(
        { error: 'Position parameter is required' },
        { status: 400 }
      );
    }

    // Validate position
    const validPositions: AdPosition[] = ['sidebar', 'interstitial', 'banner', 'popup'];
    if (!validPositions.includes(position)) {
      return NextResponse.json(
        { error: 'Invalid position parameter' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = getCacheKey(position, deviceType, userTier);
    const cachedAds = getCachedAds(cacheKey);
    
    if (cachedAds) {
      return NextResponse.json(
        { ads: cachedAds, cached: true },
        {
          headers: {
            'Cache-Control': `public, max-age=${CACHE_DURATION}`,
            'X-Cache': 'HIT',
          },
        }
      );
    }

    // Create simple Supabase client (no cookies needed for public ads)
    const supabase = createSupabaseClient();

    // Build query - simplified to avoid complex JSONB filtering that may cause issues
    const { data: ads, error } = await supabase
      .from('advertisement_campaigns')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .eq('position', position)
      .or('start_date.is.null,start_date.lte.now()')
      .or('end_date.is.null,end_date.gte.now()')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching ads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch advertisements', details: error.message },
        { status: 500 }
      );
    }

    // Cache the results
    const adsData = ads || [];
    setCachedAds(cacheKey, adsData);

    return NextResponse.json(
      { ads: adsData, cached: false },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_DURATION}`,
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('Error in ads list API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Cleanup cache periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 1000) {
      cache.delete(key);
    }
  }
}, 60 * 60 * 1000);
