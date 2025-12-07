import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface ShippingCourier {
  id: number;
  courier_name: string;
  courier_logo_url?: string;
  base_cost?: number;
  is_active: boolean;
}

export interface CourierFormData {
  courier_name: string;
  courier_logo_url?: string;
  base_cost?: number;
  is_active: boolean;
}

interface ShippingCouriersStore {
  couriers: ShippingCourier[];
  loading: boolean;
  lastFetched: number | null;
  fetchCouriers: () => Promise<void>;
  createCourier: (data: CourierFormData) => Promise<ShippingCourier | null>;
  updateCourier: (id: number, data: CourierFormData) => Promise<boolean>;
  deleteCourier: (id: number) => Promise<boolean>;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useShippingCouriersStore = create<ShippingCouriersStore>((set, get) => ({
  couriers: [],
  loading: false,
  lastFetched: null,

  fetchCouriers: async () => {
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

      console.log('Fetching shipping couriers from Supabase...');

      const { data, error } = await supabase
        .from('shipping_couriers')
        .select('*')
        .order('courier_name', { ascending: true });

      if (error) {
        console.error('Error fetching couriers:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        set({ loading: false });
        return;
      }

      console.log('Couriers fetch result:', { count: data?.length || 0 });

      const couriers = (data || []).map((courier: any) => ({
        id: courier.id,
        courier_name: courier.courier_name,
        courier_logo_url: courier.courier_logo_url,
        base_cost: courier.base_cost ? parseFloat(courier.base_cost) : undefined,
        is_active: courier.is_active,
      })) as ShippingCourier[];

      set({
        couriers,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching couriers:', err);
      set({ loading: false });
    }
  },

  createCourier: async (data: CourierFormData) => {
    try {
      const supabase = createClient();

      const { data: newCourier, error } = await supabase
        .from('shipping_couriers')
        .insert({
          courier_name: data.courier_name,
          courier_logo_url: data.courier_logo_url || null,
          base_cost: data.base_cost || null,
          is_active: data.is_active,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating courier:', error);
        return null;
      }

      // Add to local state
      const courier = {
        id: newCourier.id,
        courier_name: newCourier.courier_name,
        courier_logo_url: newCourier.courier_logo_url,
        base_cost: newCourier.base_cost ? parseFloat(newCourier.base_cost) : undefined,
        is_active: newCourier.is_active,
      } as ShippingCourier;

      set((state) => ({
        couriers: [...state.couriers, courier].sort((a, b) => 
          a.courier_name.localeCompare(b.courier_name)
        ),
      }));

      return courier;
    } catch (err) {
      console.error('Exception creating courier:', err);
      return null;
    }
  },

  updateCourier: async (id: number, data: CourierFormData) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('shipping_couriers')
        .update({
          courier_name: data.courier_name,
          courier_logo_url: data.courier_logo_url || null,
          base_cost: data.base_cost || null,
          is_active: data.is_active,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating courier:', error);
        return false;
      }

      // Update local state
      set((state) => ({
        couriers: state.couriers.map((courier) =>
          courier.id === id
            ? {
                ...courier,
                courier_name: data.courier_name,
                courier_logo_url: data.courier_logo_url,
                base_cost: data.base_cost,
                is_active: data.is_active,
              }
            : courier
        ).sort((a, b) => a.courier_name.localeCompare(b.courier_name)),
      }));

      return true;
    } catch (err) {
      console.error('Exception updating courier:', err);
      return false;
    }
  },

  deleteCourier: async (id: number) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('shipping_couriers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting courier:', error);
        return false;
      }

      // Remove from local state
      set((state) => ({
        couriers: state.couriers.filter((courier) => courier.id !== id),
      }));

      return true;
    } catch (err) {
      console.error('Exception deleting courier:', err);
      return false;
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
