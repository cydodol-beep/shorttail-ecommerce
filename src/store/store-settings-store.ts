import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface StoreSettings {
  storeName: string;
  storeDescription: string;
  storeLogo: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  storeCity: string;
  storeProvince: string;
  storePostalCode: string;
  storeCurrency: string;
  storeTimezone: string;
}

export interface ShippingSettings {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  enableCOD: boolean;
  codFee: number;
  processingDays: number;
}

export interface PaymentSettings {
  bankTransferEnabled: boolean;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  ewalletEnabled: boolean;
  ewalletProvider: string;
  ewalletNumber: string;
  qrisEnabled: boolean;
  qrisImage: string;
  qrisName: string;
  qrisNmid: string;
}

export interface LoyaltySettings {
  pointsEnabled: boolean;
  pointsPerRupiah: number;
  minPointsRedeem: number;
  pointsValue: number;
  referralBonus: number;
  tierNewbornThreshold: number;
  tierTransitionalThreshold: number;
  tierJuvenileThreshold: number;
  tierAdolescenceThreshold: number;
  tierAdulthoodThreshold: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  orderConfirmation: boolean;
  orderShipped: boolean;
  orderDelivered: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  newUserNotification: boolean;
  reviewNotification: boolean;
}

export interface AllSettings {
  store: StoreSettings;
  shipping: ShippingSettings;
  payment: PaymentSettings;
  loyalty: LoyaltySettings;
  notification: NotificationSettings;
}

const defaultStoreSettings: StoreSettings = {
  storeName: 'ShortTail.id',
  storeDescription: 'Premium Pet Shop - Your one-stop shop for pet supplies',
  storeLogo: '',
  storeEmail: 'support@shorttail.id',
  storePhone: '+6281234567890',
  storeAddress: 'Jl. Pet Lovers No. 123',
  storeCity: 'Jakarta',
  storeProvince: 'DKI Jakarta',
  storePostalCode: '12345',
  storeCurrency: 'IDR',
  storeTimezone: 'Asia/Jakarta',
};

const defaultShippingSettings: ShippingSettings = {
  freeShippingEnabled: true,
  freeShippingThreshold: 500000,
  defaultShippingFee: 25000,
  enableCOD: true,
  codFee: 5000,
  processingDays: 2,
};

const defaultPaymentSettings: PaymentSettings = {
  bankTransferEnabled: true,
  bankName: 'BCA',
  bankAccountNumber: '1234567890',
  bankAccountName: 'PT ShortTail Indonesia',
  ewalletEnabled: true,
  ewalletProvider: 'GoPay',
  ewalletNumber: '081234567890',
  qrisEnabled: false,
  qrisImage: '',
  qrisName: '',
  qrisNmid: '',
};

const defaultLoyaltySettings: LoyaltySettings = {
  pointsEnabled: true,
  pointsPerRupiah: 10000,
  minPointsRedeem: 100,
  pointsValue: 100,
  referralBonus: 50,
  tierNewbornThreshold: 0,
  tierTransitionalThreshold: 500,
  tierJuvenileThreshold: 2000,
  tierAdolescenceThreshold: 5000,
  tierAdulthoodThreshold: 10000,
};

const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  orderConfirmation: true,
  orderShipped: true,
  orderDelivered: true,
  lowStockAlert: true,
  lowStockThreshold: 10,
  newUserNotification: true,
  reviewNotification: true,
};

function dbToSettings(row: Record<string, unknown>): AllSettings {
  return {
    store: {
      storeName: (row.store_name as string) || defaultStoreSettings.storeName,
      storeDescription: (row.store_description as string) || defaultStoreSettings.storeDescription,
      storeLogo: (row.store_logo as string) || '',
      storeEmail: (row.store_email as string) || defaultStoreSettings.storeEmail,
      storePhone: (row.store_phone as string) || defaultStoreSettings.storePhone,
      storeAddress: (row.store_address as string) || defaultStoreSettings.storeAddress,
      storeCity: (row.store_city as string) || defaultStoreSettings.storeCity,
      storeProvince: (row.store_province as string) || defaultStoreSettings.storeProvince,
      storePostalCode: (row.store_postal_code as string) || defaultStoreSettings.storePostalCode,
      storeCurrency: (row.store_currency as string) || defaultStoreSettings.storeCurrency,
      storeTimezone: (row.store_timezone as string) || defaultStoreSettings.storeTimezone,
    },
    shipping: {
      freeShippingEnabled: row.free_shipping_enabled as boolean ?? defaultShippingSettings.freeShippingEnabled,
      freeShippingThreshold: Number(row.free_shipping_threshold) || defaultShippingSettings.freeShippingThreshold,
      defaultShippingFee: Number(row.default_shipping_fee) || defaultShippingSettings.defaultShippingFee,
      enableCOD: row.enable_cod as boolean ?? defaultShippingSettings.enableCOD,
      codFee: Number(row.cod_fee) || defaultShippingSettings.codFee,
      processingDays: Number(row.processing_days) || defaultShippingSettings.processingDays,
    },
    payment: {
      bankTransferEnabled: row.bank_transfer_enabled as boolean ?? defaultPaymentSettings.bankTransferEnabled,
      bankName: (row.bank_name as string) || defaultPaymentSettings.bankName,
      bankAccountNumber: (row.bank_account_number as string) || defaultPaymentSettings.bankAccountNumber,
      bankAccountName: (row.bank_account_name as string) || defaultPaymentSettings.bankAccountName,
      ewalletEnabled: row.ewallet_enabled as boolean ?? defaultPaymentSettings.ewalletEnabled,
      ewalletProvider: (row.ewallet_provider as string) || defaultPaymentSettings.ewalletProvider,
      ewalletNumber: (row.ewallet_number as string) || defaultPaymentSettings.ewalletNumber,
      qrisEnabled: row.qris_enabled as boolean ?? defaultPaymentSettings.qrisEnabled,
      qrisImage: (row.qris_image as string) || '',
      qrisName: (row.qris_name as string) || defaultPaymentSettings.qrisName,
      qrisNmid: (row.qris_nmid as string) || defaultPaymentSettings.qrisNmid,
    },
    loyalty: {
      pointsEnabled: row.points_enabled as boolean ?? defaultLoyaltySettings.pointsEnabled,
      pointsPerRupiah: Number(row.points_per_rupiah) || defaultLoyaltySettings.pointsPerRupiah,
      minPointsRedeem: Number(row.min_points_redeem) || defaultLoyaltySettings.minPointsRedeem,
      pointsValue: Number(row.points_value) || defaultLoyaltySettings.pointsValue,
      referralBonus: Number(row.referral_bonus) || defaultLoyaltySettings.referralBonus,
      tierNewbornThreshold: Number(row.tier_newborn_threshold) ?? defaultLoyaltySettings.tierNewbornThreshold,
      tierTransitionalThreshold: Number(row.tier_transitional_threshold) || defaultLoyaltySettings.tierTransitionalThreshold,
      tierJuvenileThreshold: Number(row.tier_juvenile_threshold) || defaultLoyaltySettings.tierJuvenileThreshold,
      tierAdolescenceThreshold: Number(row.tier_adolescence_threshold) || defaultLoyaltySettings.tierAdolescenceThreshold,
      tierAdulthoodThreshold: Number(row.tier_adulthood_threshold) || defaultLoyaltySettings.tierAdulthoodThreshold,
    },
    notification: {
      emailNotifications: row.email_notifications as boolean ?? defaultNotificationSettings.emailNotifications,
      orderConfirmation: row.order_confirmation as boolean ?? defaultNotificationSettings.orderConfirmation,
      orderShipped: row.order_shipped as boolean ?? defaultNotificationSettings.orderShipped,
      orderDelivered: row.order_delivered as boolean ?? defaultNotificationSettings.orderDelivered,
      lowStockAlert: row.low_stock_alert as boolean ?? defaultNotificationSettings.lowStockAlert,
      lowStockThreshold: Number(row.low_stock_threshold) || defaultNotificationSettings.lowStockThreshold,
      newUserNotification: row.new_user_notification as boolean ?? defaultNotificationSettings.newUserNotification,
      reviewNotification: row.review_notification as boolean ?? defaultNotificationSettings.reviewNotification,
    },
  };
}

function settingsToDb(settings: AllSettings): Record<string, unknown> {
  return {
    store_name: settings.store.storeName,
    store_description: settings.store.storeDescription,
    store_logo: settings.store.storeLogo || null,
    store_email: settings.store.storeEmail,
    store_phone: settings.store.storePhone,
    store_address: settings.store.storeAddress,
    store_city: settings.store.storeCity,
    store_province: settings.store.storeProvince,
    store_postal_code: settings.store.storePostalCode,
    store_currency: settings.store.storeCurrency,
    store_timezone: settings.store.storeTimezone,
    free_shipping_enabled: settings.shipping.freeShippingEnabled,
    free_shipping_threshold: settings.shipping.freeShippingThreshold,
    default_shipping_fee: settings.shipping.defaultShippingFee,
    enable_cod: settings.shipping.enableCOD,
    cod_fee: settings.shipping.codFee,
    processing_days: settings.shipping.processingDays,
    bank_transfer_enabled: settings.payment.bankTransferEnabled,
    bank_name: settings.payment.bankName,
    bank_account_number: settings.payment.bankAccountNumber,
    bank_account_name: settings.payment.bankAccountName,
    ewallet_enabled: settings.payment.ewalletEnabled,
    ewallet_provider: settings.payment.ewalletProvider,
    ewallet_number: settings.payment.ewalletNumber,
    qris_enabled: settings.payment.qrisEnabled,
    qris_image: settings.payment.qrisImage || null,
    qris_name: settings.payment.qrisName,
    qris_nmid: settings.payment.qrisNmid,
    points_enabled: settings.loyalty.pointsEnabled,
    points_per_rupiah: settings.loyalty.pointsPerRupiah,
    min_points_redeem: settings.loyalty.minPointsRedeem,
    points_value: settings.loyalty.pointsValue,
    referral_bonus: settings.loyalty.referralBonus,
    tier_newborn_threshold: settings.loyalty.tierNewbornThreshold,
    tier_transitional_threshold: settings.loyalty.tierTransitionalThreshold,
    tier_juvenile_threshold: settings.loyalty.tierJuvenileThreshold,
    tier_adolescence_threshold: settings.loyalty.tierAdolescenceThreshold,
    tier_adulthood_threshold: settings.loyalty.tierAdulthoodThreshold,
    email_notifications: settings.notification.emailNotifications,
    order_confirmation: settings.notification.orderConfirmation,
    order_shipped: settings.notification.orderShipped,
    order_delivered: settings.notification.orderDelivered,
    low_stock_alert: settings.notification.lowStockAlert,
    low_stock_threshold: settings.notification.lowStockThreshold,
    new_user_notification: settings.notification.newUserNotification,
    review_notification: settings.notification.reviewNotification,
  };
}

interface StoreSettingsStore {
  settings: StoreSettings;
  allSettings: AllSettings;
  settingsId: string | null;
  loading: boolean;
  lastFetched: number | null;
  fetchSettings: () => Promise<void>;
  saveSettings: (settings: AllSettings) => Promise<{ error: Error | null }>;
  invalidate: () => void;
}

const CACHE_DURATION = 0; // Disabled for development - fetch fresh every time

export const useStoreSettingsStore = create<StoreSettingsStore>((set, get) => ({
  settings: defaultStoreSettings,
  allSettings: {
    store: defaultStoreSettings,
    shipping: defaultShippingSettings,
    payment: defaultPaymentSettings,
    loyalty: defaultLoyaltySettings,
    notification: defaultNotificationSettings,
  },
  settingsId: null,
  loading: false,
  lastFetched: null,

  fetchSettings: async () => {
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
      console.log('Fetching store settings from Supabase...');
      
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching store settings:', error);
        set({ loading: false, lastFetched: Date.now() });
        return;
      }
      
      if (!data) {
        console.warn('No store settings found in database');
        set({ loading: false, lastFetched: Date.now() });
        return;
      }

      const allSettings = dbToSettings(data);
      
      set({
        settings: allSettings.store,
        allSettings,
        settingsId: data.id,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching store settings:', err);
      set({ loading: false, lastFetched: Date.now() });
    }
  },

  saveSettings: async (settings: AllSettings) => {
    try {
      const supabase = createClient();
      const state = get();
      const payload = settingsToDb(settings);
      
      console.log('Save initiated', { 
        hasSettingsId: !!state.settingsId, 
        settingsId: state.settingsId,
        descriptionLength: settings.store.storeDescription?.length || 0
      });
      
      // Use server-side API route for better reliability
      if (state.settingsId) {
        console.log('Calling settings API...');
        const startTime = performance.now();
        
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save settings');
        }

        const duration = performance.now() - startTime;
        console.log(`API call completed in ${duration.toFixed(2)}ms`);
        console.log('Settings updated successfully');
      } else {
        // Fallback: try to get the ID first, or insert if none exists
        const { data: existing, error: fetchError } = await supabase
          .from('store_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching settings:', fetchError);
          return { error: fetchError as Error };
        }

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('store_settings')
            .update(payload)
            .eq('id', existing.id);
          
          if (error) {
            console.error('Error updating settings:', error);
            return { error: error as Error };
          }
          
          // Store the ID for future saves
          set({ settingsId: existing.id });
          console.log('Settings updated successfully with new ID:', existing.id);
        } else {
          // Insert new record
          const { data, error } = await supabase
            .from('store_settings')
            .insert(payload)
            .select('id')
            .single();
          
          if (error) {
            console.error('Error creating settings:', error);
            return { error: error as Error };
          }
          
          // Store the ID for future saves
          set({ settingsId: data?.id || null });
          console.log('Settings created successfully with ID:', data?.id);
        }
      }

      // Update local state immediately
      set({
        settings: settings.store,
        allSettings: settings,
        lastFetched: Date.now(),
      });

      return { error: null };
    } catch (err) {
      console.error('Exception saving settings:', err);
      return { error: err as Error };
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));

// Notify store to refetch
export function notifySettingsUpdated() {
  useStoreSettingsStore.getState().invalidate();
  useStoreSettingsStore.getState().fetchSettings();
}

// Export defaults
export { 
  defaultStoreSettings, 
  defaultShippingSettings, 
  defaultPaymentSettings, 
  defaultLoyaltySettings, 
  defaultNotificationSettings 
};
