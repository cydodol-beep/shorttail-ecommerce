import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types/database';

export interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: Product;
}

interface WishlistStore {
  items: WishlistItem[];
  loading: boolean;
  lastFetched: number | null;
  fetchWishlist: (userId: string) => Promise<void>;
  addToWishlist: (userId: string, productId: string) => Promise<boolean>;
  removeFromWishlist: (userId: string, productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  loading: false,
  lastFetched: null,

  fetchWishlist: async (userId: string) => {
    const state = get();

    if (state.loading) return;

    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }

    set({ loading: true });

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          created_at,
          product:products (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist:', error);
        set({ loading: false });
        return;
      }

      const items = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        created_at: item.created_at,
        product: item.product,
      })) as WishlistItem[];

      set({
        items,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching wishlist:', err);
      set({ loading: false });
    }
  },

  addToWishlist: async (userId: string, productId: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: userId,
          product_id: productId,
        });

      if (error) {
        console.error('Error adding to wishlist:', error);
        return false;
      }

      // Invalidate cache to refetch
      set({ lastFetched: null });
      await get().fetchWishlist(userId);

      return true;
    } catch (err) {
      console.error('Exception adding to wishlist:', err);
      return false;
    }
  },

  removeFromWishlist: async (userId: string, productId: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing from wishlist:', error);
        return false;
      }

      // Update local state
      set((state) => ({
        items: state.items.filter((item) => item.product_id !== productId),
      }));

      return true;
    } catch (err) {
      console.error('Exception removing from wishlist:', err);
      return false;
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some((item) => item.product_id === productId);
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
