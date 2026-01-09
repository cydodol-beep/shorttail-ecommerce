import { create } from 'zustand';

export interface City {
  id: number;
  city_name: string;
  postal_code: string;
  type: string;
  province_id: string; // Komerce API seems to return this
}

interface CitiesStore {
  cities: Record<string, City[]>; // Cache by provinceId
  loading: boolean;
  error: string | null;
  fetchCities: (provinceId: string) => Promise<void>;
  getCitiesByProvince: (provinceId: string) => City[];
}

export const useCitiesStore = create<CitiesStore>((set, get) => ({
  cities: {},
  loading: false,
  error: null,

  fetchCities: async (provinceId: string) => {
    const state = get();
    
    // Return if already cached and not empty
    if (state.cities[provinceId] && state.cities[provinceId].length > 0) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/shipping/rajaongkir/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provinceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cities');
      }

      const rawCities = data.data || [];
      
      // Map API response to our City interface
      const citiesList = rawCities.map((city: any) => ({
        ...city,
        id: typeof city.id === 'string' ? parseInt(city.id) : (city.id || parseInt(city.city_id) || 0),
        city_id: city.city_id ? parseInt(city.city_id) : (city.id ? parseInt(city.id.toString()) : 0)
      }));
      
      set((state) => ({
        cities: {
          ...state.cities,
          [provinceId]: citiesList,
        },
        loading: false,
      }));
    } catch (err: any) {
      console.error('Error fetching cities:', err);
      set({ loading: false, error: err.message });
    }
  },

  getCitiesByProvince: (provinceId: string) => {
    return get().cities[provinceId] || [];
  },
}));
