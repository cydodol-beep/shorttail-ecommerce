'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAdsStore } from '@/store/ads-store';
import { createClient } from '@/lib/supabase/client';
import type { AdvertisementCampaign, AdPosition } from '@/types/database';

interface UseAdsOptions {
  position: AdPosition;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  userTier?: string;
  enabled?: boolean;
}

interface UseAdsReturn {
  ads: AdvertisementCampaign[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  trackImpression: (adId: string) => Promise<void>;
  trackClick: (adId: string) => Promise<void>;
}

// Get device type from user agent
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Generate session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('ad_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ad_session_id', sessionId);
  }
  return sessionId;
}

export function useAds(options: UseAdsOptions): UseAdsReturn {
  const { position, deviceType, userTier, enabled = true } = options;
  const supabase = createClient();
  
  const store = useAdsStore();
  const ads = store.adsByPosition[position];
  const isLoading = store.isLoading[position];
  const error = store.errors[position];
  
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch ads from API or Supabase
  const fetchAds = useCallback(async () => {
    if (!enabled) return;
    
    // Check cache validity
    if (store.getCacheValid(position)) {
      return;
    }

    store.setLoading(position, true);
    store.setError(position, null);

    try {
      // Try to fetch from API first (for Redis caching)
      const device = deviceType || getDeviceType();
      const params = new URLSearchParams({
        position,
        deviceType: device,
      });
      if (userTier) params.append('userTier', userTier);

      const response = await fetch(`/api/ads/list?${params}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        store.setAds(position, data.ads || []);
      } else {
        // Fallback to direct Supabase query
        const { data, error: supabaseError } = await supabase
          .from('advertisement_campaigns')
          .select('*')
          .eq('is_active', true)
          .eq('status', 'active')
          .eq('position', position)
          .or('start_date.is.null,start_date.lte.now')
          .or('end_date.is.null,end_date.gte.now')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10);

        if (supabaseError) throw supabaseError;
        store.setAds(position, data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ads';
      store.setError(position, errorMessage);
      console.error('Error fetching ads:', err);
    } finally {
      store.setLoading(position, false);
    }
  }, [position, deviceType, userTier, enabled, supabase, store]);

  // Track impression
  const trackImpression = useCallback(async (adId: string) => {
    // Check if already tracked in this session
    if (store.hasImpressionBeenTracked(adId)) {
      return;
    }

    // Add to local tracking immediately
    store.addImpression(adId);

    try {
      const device = deviceType || getDeviceType();
      const sessionId = getSessionId();

      // Send to API
      await fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          sessionId,
          deviceType: device,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      // Silently fail - don't break user experience
      console.error('Error tracking impression:', err);
    }
  }, [deviceType, store]);

  // Track click
  const trackClick = useCallback(async (adId: string) => {
    // Check if already tracked in this session
    if (store.hasClickBeenTracked(adId)) {
      return;
    }

    // Add to local tracking immediately
    store.addClick(adId);

    try {
      const device = deviceType || getDeviceType();
      const sessionId = getSessionId();

      // Send to API
      await fetch('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          sessionId,
          deviceType: device,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      // Silently fail - don't break user experience
      console.error('Error tracking click:', err);
    }
  }, [deviceType, store]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    // Debounce fetch to prevent multiple rapid calls
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchAds();
    }, 100);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchAds, enabled]);

  // Cleanup old tracking data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      store.clearOldTracking();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [store]);

  return {
    ads,
    isLoading,
    error,
    refetch: fetchAds,
    trackImpression,
    trackClick,
  };
}

// Hook for tracking ad view with IntersectionObserver
export function useAdViewTracking(
  adId: string,
  onView: (adId: string) => void,
  options?: IntersectionObserverInit
) {
  const ref = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!ref.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            onView(adId);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '0px',
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [adId, onView, options]);

  return ref;
}

// Hook for A/B test group assignment
export function useAdABTestGroup(): 'A' | 'B' | 'control' {
  const [group, setGroup] = useState<'A' | 'B' | 'control'>('control');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user already has a group assigned
    let assignedGroup = localStorage.getItem('ad_ab_test_group') as 'A' | 'B' | 'control' | null;
    
    if (!assignedGroup) {
      // Randomly assign to group (50/50 split)
      const random = Math.random();
      assignedGroup = random < 0.33 ? 'A' : random < 0.66 ? 'B' : 'control';
      localStorage.setItem('ad_ab_test_group', assignedGroup);
    }

    setGroup(assignedGroup);
  }, []);

  return group;
}

// Hook to filter ads by A/B test group
export function useFilteredAdsByABTest(
  ads: AdvertisementCampaign[]
): AdvertisementCampaign[] {
  const userGroup = useAdABTestGroup();

  return ads.filter((ad) => {
    // If ad has no A/B test group, show to everyone
    if (!ad.ab_test_group || ad.ab_test_group === 'control') {
      return true;
    }
    // Only show if user's group matches ad's group
    return ad.ab_test_group === userGroup;
  });
}
