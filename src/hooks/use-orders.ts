'use client';

import { useEffect } from 'react';
import {
  useOrdersStore,
  type Order,
} from '@/store/orders-store';

export type { Order };

export function useOrders() {
  const orders = useOrdersStore((state) => state.orders);
  const loading = useOrdersStore((state) => state.loading);

  useEffect(() => {
    useOrdersStore.getState().fetchOrders();
  }, []);

  return {
    orders,
    loading,
    refresh: () => {
      useOrdersStore.getState().invalidate();
      useOrdersStore.getState().fetchOrders();
    },
  };
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  return useOrdersStore.getState().updateOrderStatus(orderId, status);
}
