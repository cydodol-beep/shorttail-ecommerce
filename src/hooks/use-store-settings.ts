'use client';

import { useEffect } from 'react';
import {
  useStoreSettingsStore,
  notifySettingsUpdated,
  type StoreSettings,
  type AllSettings,
  type ShippingSettings,
  type PaymentSettings,
  type LoyaltySettings,
  type NotificationSettings,
  defaultStoreSettings,
  defaultShippingSettings,
  defaultPaymentSettings,
  defaultLoyaltySettings,
  defaultNotificationSettings,
} from '@/store/store-settings-store';

export type {
  StoreSettings,
  AllSettings,
  ShippingSettings,
  PaymentSettings,
  LoyaltySettings,
  NotificationSettings,
};

export function useStoreSettings() {
  const settings = useStoreSettingsStore((state) => state.settings);
  const loading = useStoreSettingsStore((state) => state.loading);

  useEffect(() => {
    useStoreSettingsStore.getState().fetchSettings();
  }, []);

  return {
    settings,
    loading,
    refresh: () => {
      useStoreSettingsStore.getState().invalidate();
      useStoreSettingsStore.getState().fetchSettings();
    },
  };
}

export function useAllSettings() {
  const allSettings = useStoreSettingsStore((state) => state.allSettings);
  const settingsId = useStoreSettingsStore((state) => state.settingsId);
  const loading = useStoreSettingsStore((state) => state.loading);

  useEffect(() => {
    useStoreSettingsStore.getState().fetchSettings();
  }, []);

  return {
    settings: allSettings,
    settingsId,
    loading,
    refresh: () => {
      useStoreSettingsStore.getState().invalidate();
      useStoreSettingsStore.getState().fetchSettings();
    },
  };
}

export async function saveAllSettings(settings: AllSettings): Promise<{ error: Error | null }> {
  return useStoreSettingsStore.getState().saveSettings(settings);
}

export { 
  notifySettingsUpdated,
  defaultStoreSettings, 
  defaultShippingSettings, 
  defaultPaymentSettings, 
  defaultLoyaltySettings, 
  defaultNotificationSettings 
};
