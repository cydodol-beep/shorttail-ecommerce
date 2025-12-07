'use client';

import { useEffect } from 'react';
import { useProvincesStore, type Province } from '@/store/provinces-store';

export type { Province };

export function useProvinces() {
  const provinces = useProvincesStore((state) => state.provinces);
  const loading = useProvincesStore((state) => state.loading);

  useEffect(() => {
    useProvincesStore.getState().fetchProvinces();
  }, []);

  return {
    provinces,
    loading,
    refresh: () => {
      useProvincesStore.getState().invalidate();
      useProvincesStore.getState().fetchProvinces();
    },
  };
}
