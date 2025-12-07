import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface CategoriesStore {
  categories: Category[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchCategories: () => Promise<void>;
  getActiveCategories: () => Category[];
  getCategoryBySlug: (slug: string) => Category | undefined;
  getCategoryById: (id: string) => Category | undefined;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 100; // 100ms debounce

let fetchTimeout: NodeJS.Timeout | null = null;

// Create store with stable references to prevent infinite re-renders
export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchCategories: async () => {
    const state = get();
    
    // Debounce multiple rapid calls
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }
    
    // Skip if already loading
    if (state.loading) return;
    
    // Use cache if valid
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION && state.categories.length > 0) {
      return;
    }

    return new Promise<void>((resolve) => {
      fetchTimeout = setTimeout(async () => {
        set({ loading: true, error: null });

        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('categories')
            .select('id, name, slug, description, image_url, is_active, sort_order')
            .order('sort_order', { ascending: true });

          if (error) {
            console.error('Error fetching categories:', error);
            set({ error: error.message, loading: false });
          } else {
            set({ 
              categories: data || [], 
              loading: false, 
              error: null,
              lastFetched: Date.now() 
            });
          }
        } catch (err) {
          console.error('Exception fetching categories:', err);
          set({ 
            error: err instanceof Error ? err.message : 'Failed to fetch categories', 
            loading: false 
          });
        }
        resolve();
      }, DEBOUNCE_DELAY);
    });
  },

  getActiveCategories: () => {
    return get().categories
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  getCategoryBySlug: (slug: string) => {
    return get().categories.find((c) => c.slug === slug);
  },

  getCategoryById: (id: string) => {
    return get().categories.find((c) => c.id === id);
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));

// Notify store to refetch
export function notifyCategoriesUpdated() {
  useCategoriesStore.getState().invalidate();
  useCategoriesStore.getState().fetchCategories();
}
