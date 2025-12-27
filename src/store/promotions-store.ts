import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface Promotion {
  id: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  applies_to?: string;
  product_ids?: string[];
  category_ids?: string[];
  free_shipping?: boolean;
  buy_quantity?: number;
  get_quantity?: number;
  max_uses_per_user?: number;
  total_uses?: number;
  available_for_pos?: boolean;
}

export interface PromotionFormData {
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  applies_to?: string;
  product_ids?: string[];
  category_ids?: string[];
  free_shipping?: boolean;
  buy_quantity?: number;
  get_quantity?: number;
  max_uses_per_user?: number;
  tiers?: { min_quantity: number; discount_percentage: number }[];
  available_for_pos?: boolean;
}

interface PromotionsStore {
  promotions: Promotion[];
  loading: boolean;
  lastFetched: number | null;
  fetchPromotions: () => Promise<void>;
  createPromotion: (data: PromotionFormData) => Promise<Promotion | null>;
  updatePromotion: (id: string, data: PromotionFormData) => Promise<boolean>;
  deletePromotion: (id: string) => Promise<boolean>;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const usePromotionsStore = create<PromotionsStore>((set, get) => ({
  promotions: [],
  loading: false,
  lastFetched: null,

  fetchPromotions: async () => {
    const state = get();

    // Skip if already loading
    if (state.loading) return;

    // Use cache if valid
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }

    set({ loading: true });

    try {
      const supabase = createClient();

      console.log('Fetching promotions from Supabase...');

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotions:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        set({ loading: false });
        return;
      }

      console.log('Promotions fetch result:', { count: data?.length || 0 });

      const promotions = (data || []).map((promo: any) => ({
        id: promo.id,
        code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: parseFloat(promo.discount_value) || 0,
        min_purchase_amount: promo.min_purchase_amount ? parseFloat(promo.min_purchase_amount) : undefined,
        start_date: promo.start_date,
        end_date: promo.end_date,
        is_active: promo.is_active,
        applies_to: promo.applies_to,
        product_ids: promo.product_ids || [],
        category_ids: promo.category_ids || [],
        free_shipping: promo.free_shipping || false,
        buy_quantity: promo.buy_quantity,
        get_quantity: promo.get_quantity,
        max_uses_per_user: promo.max_uses_per_user,
        total_uses: promo.total_uses || 0,
        available_for_pos: promo.available_for_pos ?? true,
      })) as Promotion[];

      set({
        promotions,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching promotions:', err);
      set({ loading: false });
    }
  },

  createPromotion: async (data: PromotionFormData) => {
    try {
      const supabase = createClient();

      const { data: newPromo, error } = await supabase
        .from('promotions')
        .insert({
          code: data.code,
          description: data.description || null,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          min_purchase_amount: data.min_purchase_amount || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          is_active: data.is_active,
          applies_to: data.applies_to || 'all_products',
          product_ids: data.product_ids || [],
          category_ids: data.category_ids || [],
          free_shipping: data.free_shipping || false,
          buy_quantity: data.buy_quantity || null,
          get_quantity: data.get_quantity || null,
          max_uses_per_user: data.max_uses_per_user || null,
          available_for_pos: data.available_for_pos ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating promotion:', error);
        return null;
      }

      // Insert tiers if buy_more_save_more
      if (data.discount_type === 'buy_more_save_more' && data.tiers && data.tiers.length > 0) {
        const tiersToInsert = data.tiers.map(tier => ({
          promotion_id: newPromo.id,
          min_quantity: tier.min_quantity,
          discount_percentage: tier.discount_percentage,
        }));

        const { error: tiersError } = await supabase
          .from('promotion_tiers')
          .insert(tiersToInsert);

        if (tiersError) {
          console.error('Error creating promotion tiers:', tiersError);
          // Don't fail the whole operation, tiers can be added later
        }
      }

      // Add to local state
      const promotion = {
        id: newPromo.id,
        code: newPromo.code,
        description: newPromo.description,
        discount_type: newPromo.discount_type,
        discount_value: parseFloat(newPromo.discount_value) || 0,
        min_purchase_amount: newPromo.min_purchase_amount ? parseFloat(newPromo.min_purchase_amount) : undefined,
        start_date: newPromo.start_date,
        end_date: newPromo.end_date,
        is_active: newPromo.is_active,
        applies_to: newPromo.applies_to,
        product_ids: newPromo.product_ids || [],
        category_ids: newPromo.category_ids || [],
        free_shipping: newPromo.free_shipping || false,
        buy_quantity: newPromo.buy_quantity,
        get_quantity: newPromo.get_quantity,
        max_uses_per_user: newPromo.max_uses_per_user,
        total_uses: newPromo.total_uses || 0,
        available_for_pos: newPromo.available_for_pos ?? true,
      } as Promotion;

      set((state) => ({
        promotions: [promotion, ...state.promotions],
      }));

      // Invalidate cache to ensure freshness on next fetch
      get().invalidate();

      return promotion;
    } catch (err) {
      console.error('Exception creating promotion:', err);
      return null;
    }
  },

  updatePromotion: async (id: string, data: PromotionFormData) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('promotions')
        .update({
          code: data.code,
          description: data.description || null,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          min_purchase_amount: data.min_purchase_amount || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          is_active: data.is_active,
          applies_to: data.applies_to || 'all_products',
          product_ids: data.product_ids || [],
          category_ids: data.category_ids || [],
          free_shipping: data.free_shipping || false,
          buy_quantity: data.buy_quantity || null,
          get_quantity: data.get_quantity || null,
          max_uses_per_user: data.max_uses_per_user || null,
          available_for_pos: data.available_for_pos ?? true,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating promotion:', error);
        return false;
      }

      // Update tiers if buy_more_save_more
      if (data.discount_type === 'buy_more_save_more' && data.tiers) {
        // Delete existing tiers
        await supabase
          .from('promotion_tiers')
          .delete()
          .eq('promotion_id', id);

        // Insert new tiers
        if (data.tiers.length > 0) {
          const tiersToInsert = data.tiers.map(tier => ({
            promotion_id: id,
            min_quantity: tier.min_quantity,
            discount_percentage: tier.discount_percentage,
          }));

          const { error: tiersError } = await supabase
            .from('promotion_tiers')
            .insert(tiersToInsert);

          if (tiersError) {
            console.error('Error updating promotion tiers:', tiersError);
          }
        }
      } else {
        // Delete tiers if not buy_more_save_more anymore
        await supabase
          .from('promotion_tiers')
          .delete()
          .eq('promotion_id', id);
      }

      // Update local state
      set((state) => ({
        promotions: state.promotions.map((promo) =>
          promo.id === id
            ? {
                ...promo,
                code: data.code,
                description: data.description,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                min_purchase_amount: data.min_purchase_amount,
                start_date: data.start_date,
                end_date: data.end_date,
                is_active: data.is_active,
                applies_to: data.applies_to,
                product_ids: data.product_ids,
                category_ids: data.category_ids,
                free_shipping: data.free_shipping,
                buy_quantity: data.buy_quantity,
                get_quantity: data.get_quantity,
                max_uses_per_user: data.max_uses_per_user,
                available_for_pos: data.available_for_pos,
              }
            : promo
        ),
      }));

      // Invalidate cache to ensure freshness on next fetch
      get().invalidate();

      return true;
    } catch (err) {
      console.error('Exception updating promotion:', err);
      return false;
    }
  },

  deletePromotion: async (id: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting promotion:', error);
        return false;
      }

      // Remove from local state
      set((state) => ({
        promotions: state.promotions.filter((promo) => promo.id !== id),
      }));

      // Invalidate cache to ensure freshness on next fetch
      get().invalidate();

      return true;
    } catch (err) {
      console.error('Exception deleting promotion:', err);
      return false;
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
