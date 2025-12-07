'use client';

import { useEffect } from 'react';
import {
  useShippingCouriersStore,
  type ShippingCourier,
  type CourierFormData,
} from '@/store/shipping-couriers-store';

export type { ShippingCourier, CourierFormData };

export function useShippingCouriers() {
  const couriers = useShippingCouriersStore((state) => state.couriers);
  const loading = useShippingCouriersStore((state) => state.loading);

  useEffect(() => {
    useShippingCouriersStore.getState().fetchCouriers();
  }, []);

  return {
    couriers,
    loading,
    refresh: () => {
      useShippingCouriersStore.getState().invalidate();
      useShippingCouriersStore.getState().fetchCouriers();
    },
  };
}

export async function createCourier(data: CourierFormData): Promise<ShippingCourier | null> {
  return useShippingCouriersStore.getState().createCourier(data);
}

export async function updateCourier(id: number, data: CourierFormData): Promise<boolean> {
  return useShippingCouriersStore.getState().updateCourier(id, data);
}

export async function deleteCourier(id: number): Promise<boolean> {
  return useShippingCouriersStore.getState().deleteCourier(id);
}
