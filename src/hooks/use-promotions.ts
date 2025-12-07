'use client';

import { useEffect } from 'react';
import {
  usePromotionsStore,
  type Promotion,
  type PromotionFormData,
} from '@/store/promotions-store';

export type { Promotion, PromotionFormData };

export function usePromotions() {
  const promotions = usePromotionsStore((state) => state.promotions);
  const loading = usePromotionsStore((state) => state.loading);

  useEffect(() => {
    usePromotionsStore.getState().fetchPromotions();
  }, []);

  return {
    promotions,
    loading,
    refresh: () => {
      usePromotionsStore.getState().invalidate();
      usePromotionsStore.getState().fetchPromotions();
    },
  };
}

export async function createPromotion(data: PromotionFormData): Promise<Promotion | null> {
  return usePromotionsStore.getState().createPromotion(data);
}

export async function updatePromotion(id: string, data: PromotionFormData): Promise<boolean> {
  return usePromotionsStore.getState().updatePromotion(id, data);
}

export async function deletePromotion(id: string): Promise<boolean> {
  return usePromotionsStore.getState().deletePromotion(id);
}
