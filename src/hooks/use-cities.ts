'use client';

import { useEffect } from 'react';
import { useCitiesStore, type City } from '@/store/cities-store';

export type { City };

export function useCities(provinceId?: string | number) {
  const citiesStore = useCitiesStore();
  
  useEffect(() => {
    if (provinceId) {
      useCitiesStore.getState().fetchCities(provinceId.toString());
    }
  }, [provinceId]);

  const cities = provinceId ? citiesStore.getCitiesByProvince(provinceId.toString()) : [];

  return {
    cities,
    loading: citiesStore.loading,
    error: citiesStore.error,
    fetchCities: (id: string | number) => citiesStore.fetchCities(id.toString()),
  };
}
