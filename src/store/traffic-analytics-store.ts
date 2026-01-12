import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface TrafficDataPoint {
  date?: string;
  hour?: string;
  day?: string;
  month?: string;
  year?: number;
  unique_visitors: number;
  total_visits: number;
}

interface TrafficSummary {
  total_visitors: number;
  today_visitors: number;
  week_visitors: number;
  month_visitors: number;
  avg_daily_visitors: number;
}

interface TopPage {
  page_url: string;
  visit_count: number;
  unique_visitors: number;
}

interface CountryTraffic {
  country_code: string;
  visitor_count: number;
}

interface DeviceTraffic {
  device_type: string;
  visitor_count: number;
}

interface TrafficAnalyticsState {
  // Raw data
  trafficData: TrafficDataPoint[];
  summary: TrafficSummary | null;
  topPages: TopPage[];
  countries: CountryTraffic[];
  devices: DeviceTraffic[];
  
  // Loading states
  loading: boolean;
  summaryLoading: boolean;
  topPagesLoading: boolean;
  countriesLoading: boolean;
  devicesLoading: boolean;
  
  // Error states
  error: string | null;
  summaryError: string | null;
  topPagesError: string | null;
  countriesError: string | null;
  devicesError: string | null;
  
  // Fetch methods
  fetchTrafficData: (period: 'hourly' | 'daily' | 'monthly' | 'yearly', days?: number) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchTopPages: (days?: number) => Promise<void>;
  fetchCountries: (days?: number) => Promise<void>;
  fetchDevices: (days?: number) => Promise<void>;
  clearErrors: () => void;
}

// Create a cache key based on params
const getCacheKey = (type: string, params: Record<string, any>): string => {
  return `${type}_${JSON.stringify(params)}`;
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if cache is valid
const isCacheValid = (key: string): boolean => {
  const cached = cache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_DURATION;
};

export const useTrafficAnalyticsStore = create<TrafficAnalyticsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        trafficData: [],
        summary: null,
        topPages: [],
        countries: [],
        devices: [],
        
        loading: false,
        summaryLoading: false,
        topPagesLoading: false,
        countriesLoading: false,
        devicesLoading: false,
        
        error: null,
        summaryError: null,
        topPagesError: null,
        countriesError: null,
        devicesError: null,
        
        // Fetch traffic data over time
        fetchTrafficData: async (period, days = 30) => {
          const cacheKey = getCacheKey('trafficData', { period, days });
          
          if (isCacheValid(cacheKey)) {
            const cached = cache.get(cacheKey)!;
            set({ trafficData: cached.data, loading: false });
            return;
          }
          
          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/analytics/traffic?period=${period}&days=${days}`);
            const result = await response.json();
            
            if (result.success) {
              cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
              set({ trafficData: result.data, loading: false });
            } else {
              set({ error: result.error || 'Failed to fetch traffic data', loading: false });
            }
          } catch (error: any) {
            set({ error: error.message || 'Network error', loading: false });
          }
        },
        
        // Fetch traffic summary
        fetchSummary: async () => {
          const cacheKey = getCacheKey('summary', {});
          
          if (isCacheValid(cacheKey)) {
            const cached = cache.get(cacheKey)!;
            set({ summary: cached.data, summaryLoading: false });
            return;
          }
          
          set({ summaryLoading: true, summaryError: null });
          try {
            const response = await fetch('/api/analytics/metrics?type=summary');
            const result = await response.json();
            
            if (result.success) {
              cache.set(cacheKey, { data: result.data[0], timestamp: Date.now() });
              set({ summary: result.data[0], summaryLoading: false });
            } else {
              set({ summaryError: result.error || 'Failed to fetch summary', summaryLoading: false });
            }
          } catch (error: any) {
            set({ summaryError: error.message || 'Network error', summaryLoading: false });
          }
        },
        
        // Fetch top pages
        fetchTopPages: async (days = 30) => {
          const cacheKey = getCacheKey('topPages', { days });
          
          if (isCacheValid(cacheKey)) {
            const cached = cache.get(cacheKey)!;
            set({ topPages: cached.data, topPagesLoading: false });
            return;
          }
          
          set({ topPagesLoading: true, topPagesError: null });
          try {
            const response = await fetch(`/api/analytics/metrics?type=topPages&days=${days}`);
            const result = await response.json();
            
            if (result.success) {
              cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
              set({ topPages: result.data, topPagesLoading: false });
            } else {
              set({ topPagesError: result.error || 'Failed to fetch top pages', topPagesLoading: false });
            }
          } catch (error: any) {
            set({ topPagesError: error.message || 'Network error', topPagesLoading: false });
          }
        },
        
        // Fetch traffic by country
        fetchCountries: async (days = 30) => {
          const cacheKey = getCacheKey('countries', { days });
          
          if (isCacheValid(cacheKey)) {
            const cached = cache.get(cacheKey)!;
            set({ countries: cached.data, countriesLoading: false });
            return;
          }
          
          set({ countriesLoading: true, countriesError: null });
          try {
            const response = await fetch(`/api/analytics/metrics?type=byCountry&days=${days}`);
            const result = await response.json();
            
            if (result.success) {
              cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
              set({ countries: result.data, countriesLoading: false });
            } else {
              set({ countriesError: result.error || 'Failed to fetch countries', countriesLoading: false });
            }
          } catch (error: any) {
            set({ countriesError: error.message || 'Network error', countriesLoading: false });
          }
        },
        
        // Fetch traffic by device
        fetchDevices: async (days = 30) => {
          const cacheKey = getCacheKey('devices', { days });
          
          if (isCacheValid(cacheKey)) {
            const cached = cache.get(cacheKey)!;
            set({ devices: cached.data, devicesLoading: false });
            return;
          }
          
          set({ devicesLoading: true, devicesError: null });
          try {
            const response = await fetch(`/api/analytics/metrics?type=byDevice&days=${days}`);
            const result = await response.json();
            
            if (result.success) {
              cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
              set({ devices: result.data, devicesLoading: false });
            } else {
              set({ devicesError: result.error || 'Failed to fetch devices', devicesLoading: false });
            }
          } catch (error: any) {
            set({ devicesError: error.message || 'Network error', devicesLoading: false });
          }
        },
        
        // Clear errors
        clearErrors: () => {
          set({
            error: null,
            summaryError: null,
            topPagesError: null,
            countriesError: null,
            devicesError: null,
          });
        },
      }),
      {
        name: 'traffic-analytics-storage', // name of the item in the storage (must be unique)
        partialize: (state) => ({ 
          // Only persist essential data, not loading states
          trafficData: state.trafficData,
          summary: state.summary,
          topPages: state.topPages,
          countries: state.countries,
          devices: state.devices,
        }),
      }
    ),
    { name: 'traffic-analytics-store' } // devtool name
  )
);