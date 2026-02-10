import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdvertisementCampaign, AdPosition } from '@/types/database';

interface TrackedImpression {
  adId: string;
  timestamp: number;
  sessionId: string;
}

interface TrackedClick {
  adId: string;
  timestamp: number;
  sessionId: string;
}

interface AdsStore {
  // Cache for ads by position
  adsByPosition: Record<AdPosition, AdvertisementCampaign[]>;
  lastFetchTime: Record<AdPosition, number>;
  
  // Tracking
  trackedImpressions: TrackedImpression[];
  trackedClicks: TrackedClick[];
  sessionId: string;
  
  // Loading states
  isLoading: Record<AdPosition, boolean>;
  errors: Record<AdPosition, string | null>;
  
  // Actions
  setAds: (position: AdPosition, ads: AdvertisementCampaign[]) => void;
  setLoading: (position: AdPosition, loading: boolean) => void;
  setError: (position: AdPosition, error: string | null) => void;
  addImpression: (adId: string) => void;
  addClick: (adId: string) => void;
  hasImpressionBeenTracked: (adId: string) => boolean;
  hasClickBeenTracked: (adId: string) => boolean;
  clearOldTracking: () => void;
  getCacheValid: (position: AdPosition) => boolean;
}

// Generate a session ID for tracking
const generateSessionId = () => {
  if (typeof window === 'undefined') return '';
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Tracking expiry: 24 hours
const TRACKING_EXPIRY = 24 * 60 * 60 * 1000;

export const useAdsStore = create<AdsStore>()(
  persist(
    (set, get) => ({
      adsByPosition: {
        sidebar: [],
        interstitial: [],
        banner: [],
        popup: [],
      },
      lastFetchTime: {
        sidebar: 0,
        interstitial: 0,
        banner: 0,
        popup: 0,
      },
      trackedImpressions: [],
      trackedClicks: [],
      sessionId: generateSessionId(),
      isLoading: {
        sidebar: false,
        interstitial: false,
        banner: false,
        popup: false,
      },
      errors: {
        sidebar: null,
        interstitial: null,
        banner: null,
        popup: null,
      },

      setAds: (position, ads) =>
        set((state) => ({
          adsByPosition: { ...state.adsByPosition, [position]: ads },
          lastFetchTime: { ...state.lastFetchTime, [position]: Date.now() },
        })),

      setLoading: (position, loading) =>
        set((state) => ({
          isLoading: { ...state.isLoading, [position]: loading },
        })),

      setError: (position, error) =>
        set((state) => ({
          errors: { ...state.errors, [position]: error },
        })),

      addImpression: (adId) =>
        set((state) => ({
          trackedImpressions: [
            ...state.trackedImpressions,
            {
              adId,
              timestamp: Date.now(),
              sessionId: state.sessionId,
            },
          ],
        })),

      addClick: (adId) =>
        set((state) => ({
          trackedClicks: [
            ...state.trackedClicks,
            {
              adId,
              timestamp: Date.now(),
              sessionId: state.sessionId,
            },
          ],
        })),

      hasImpressionBeenTracked: (adId) => {
        const state = get();
        return state.trackedImpressions.some(
          (imp) =>
            imp.adId === adId &&
            imp.sessionId === state.sessionId &&
            Date.now() - imp.timestamp < TRACKING_EXPIRY
        );
      },

      hasClickBeenTracked: (adId) => {
        const state = get();
        return state.trackedClicks.some(
          (click) =>
            click.adId === adId &&
            click.sessionId === state.sessionId &&
            Date.now() - click.timestamp < TRACKING_EXPIRY
        );
      },

      clearOldTracking: () =>
        set((state) => ({
          trackedImpressions: state.trackedImpressions.filter(
            (imp) => Date.now() - imp.timestamp < TRACKING_EXPIRY
          ),
          trackedClicks: state.trackedClicks.filter(
            (click) => Date.now() - click.timestamp < TRACKING_EXPIRY
          ),
        })),

      getCacheValid: (position) => {
        const state = get();
        const lastFetch = state.lastFetchTime[position];
        return Date.now() - lastFetch < CACHE_DURATION;
      },
    }),
    {
      name: 'shorttail-ads',
      version: 1,
      partialize: (state) => ({
        trackedImpressions: state.trackedImpressions,
        trackedClicks: state.trackedClicks,
        sessionId: state.sessionId,
        // Don't persist ads - fetch fresh on reload
      }),
    }
  )
);

// Helper hook for getting ads by position
export function useAdsByPosition(position: AdPosition) {
  return useAdsStore((state) => state.adsByPosition[position]);
}

// Helper hook for checking if ads are loading
export function useAdsLoading(position: AdPosition) {
  return useAdsStore((state) => state.isLoading[position]);
}

// Helper hook for getting ads error
export function useAdsError(position: AdPosition) {
  return useAdsStore((state) => state.errors[position]);
}
