import { create } from 'zustand';
import { createClient } from '../lib/supabase/client';

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  provider: string; // e.g. 'midtrans', 'xendit', 'manual'
  is_active: boolean;
  is_available: boolean;
  min_amount?: number;
  max_amount?: number;
  fee_fixed?: number;
  fee_percentage?: number;
  icon_url?: string;
  instruction?: string;
  account_details?: string; // For bank transfers
}

interface PaymentMethodsStore {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  lastFetched: number | null;
  fetchPaymentMethods: () => Promise<void>;
  getAvailablePaymentMethods: () => PaymentMethod[];
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const usePaymentMethodsStore = create<PaymentMethodsStore>((set, get) => ({
  paymentMethods: [],
  loading: false,
  lastFetched: null,

  fetchPaymentMethods: async () => {
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

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .eq('is_available', true) // Only show methods that are available for customers
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        set({ loading: false });
        return;
      }

      set({
        paymentMethods: data || [],
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      console.error('Exception fetching payment methods:', error);
      set({ loading: false });
    }
  },

  getAvailablePaymentMethods: () => {
    const state = get();
    return state.paymentMethods.filter(method => method.is_active && method.is_available);
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));