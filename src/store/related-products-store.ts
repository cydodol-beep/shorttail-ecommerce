import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types/database';

export interface RelatedProduct extends Omit<Product, 'has_variants'> {
  is_manual?: boolean;
  has_variants?: boolean;
  min_variant_price?: number;
  max_variant_price?: number;
}

interface CachedProducts {
  products: RelatedProduct[];
  timestamp: number;
}

interface RelatedProductsStore {
  relatedProducts: Record<string, CachedProducts>;
  loading: boolean;
  fetchRelatedProducts: (productId: string, limit?: number, forceRefresh?: boolean) => Promise<RelatedProduct[]>;
  getRelatedProducts: (productId: string) => RelatedProduct[];
  addRelation: (productId: string, relatedProductId: string) => Promise<boolean>;
  removeRelation: (productId: string, relatedProductId: string) => Promise<boolean>;
  updateRelationOrder: (productId: string, relations: Array<{ id: string; sort_order: number }>) => Promise<boolean>;
  invalidate: (productId: string) => void;
}

const CACHE_DURATION = 30 * 1000; // 30 seconds

export const useRelatedProductsStore = create<RelatedProductsStore>((set, get) => ({
  relatedProducts: {},
  loading: false,

  fetchRelatedProducts: async (productId: string, limit = 5, forceRefresh = false) => {
    const state = get();
    const now = Date.now();
    
    // Return cached if available and not expired (unless force refresh)
    const cached = state.relatedProducts[productId];
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Returning cached related products for', productId);
      return cached.products;
    }

    console.log('Fetching fresh related products for', productId);
    set({ loading: true });

    try {
      const supabase = createClient();

      // Use the database function to get related products with smart fallback
      const { data, error } = await supabase
        .rpc('get_related_products', {
          p_product_id: productId,
          p_limit: limit
        });

      if (error) {
        console.error('Error fetching related products:', error);
        set({ loading: false });
        return [];
      }

      const products = (data || []) as RelatedProduct[];
      console.log('Fetched related products:', products.length, 'items');

      // Cache the results with timestamp
      set((state) => ({
        relatedProducts: {
          ...state.relatedProducts,
          [productId]: {
            products,
            timestamp: Date.now()
          }
        },
        loading: false
      }));

      return products;
    } catch (err) {
      console.error('Exception fetching related products:', err);
      set({ loading: false });
      return [];
    }
  },

  getRelatedProducts: (productId: string) => {
    const cached = get().relatedProducts[productId];
    return cached ? cached.products : [];
  },

  addRelation: async (productId: string, relatedProductId: string) => {
    try {
      const supabase = createClient();

      // Get current max sort_order
      const { data: existing } = await supabase
        .from('product_relations')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

      const { error } = await supabase
        .from('product_relations')
        .insert({
          product_id: productId,
          related_product_id: relatedProductId,
          sort_order: nextOrder
        });

      if (error) {
        console.error('Error adding relation:', error);
        return false;
      }

      // Invalidate cache
      get().invalidate(productId);
      return true;
    } catch (err) {
      console.error('Exception adding relation:', err);
      return false;
    }
  },

  removeRelation: async (productId: string, relatedProductId: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('product_relations')
        .delete()
        .eq('product_id', productId)
        .eq('related_product_id', relatedProductId);

      if (error) {
        console.error('Error removing relation:', error);
        return false;
      }

      // Invalidate cache
      get().invalidate(productId);
      return true;
    } catch (err) {
      console.error('Exception removing relation:', err);
      return false;
    }
  },

  updateRelationOrder: async (productId: string, relations: Array<{ id: string; sort_order: number }>) => {
    try {
      const supabase = createClient();

      // Update each relation's sort order
      for (const relation of relations) {
        const { error } = await supabase
          .from('product_relations')
          .update({ sort_order: relation.sort_order })
          .eq('product_id', productId)
          .eq('related_product_id', relation.id);

        if (error) {
          console.error('Error updating relation order:', error);
          return false;
        }
      }

      // Invalidate cache
      get().invalidate(productId);
      return true;
    } catch (err) {
      console.error('Exception updating relation order:', err);
      return false;
    }
  },

  invalidate: (productId: string) => {
    set((state) => {
      const { [productId]: removed, ...rest } = state.relatedProducts;
      return { relatedProducts: rest };
    });
  },
}));
