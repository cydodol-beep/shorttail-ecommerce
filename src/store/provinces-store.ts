import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface Province {
  id: number;
  province_name: string;
  province_code?: string;
  is_active: boolean;
}

export interface ShippingRate {
  id: number;
  courier_id: number;
  province_id: number;
  cost: number;
  estimated_days?: string;
  province_name?: string;
  courier_name?: string;
}

interface ProvincesStore {
  provinces: Province[];
  loading: boolean;
  lastFetched: number | null;
  fetchProvinces: () => Promise<void>;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProvincesStore = create<ProvincesStore>((set, get) => ({
  provinces: [],
  loading: false,
  lastFetched: null,

  fetchProvinces: async () => {
    const state = get();

    if (state.loading) return;

    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }

    set({ loading: true });

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .eq('is_active', true)
        .order('province_name', { ascending: true });

      if (error) {
        console.error('Error fetching provinces:', error);
        set({ loading: false });
        return;
      }

      set({
        provinces: data || [],
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching provinces:', err);
      set({ loading: false });
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
