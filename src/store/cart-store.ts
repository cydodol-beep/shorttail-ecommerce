import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import type { Product, ProductVariant } from '@/types/database';

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.variant?.id === variant?.id
          );

          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }

          return {
            items: [...state.items, { product, variant, quantity }],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.product.id === productId && item.variant?.id === variantId)
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.variant?.id === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          // For variant products, use variant price_adjustment; for simple products, use base_price
          const price = item.variant ? (item.variant.price_adjustment || 0) : item.product.base_price;
          return total + price * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'shorttail-cart',
      version: 1, // Increment this when cart schema changes to invalidate old cache
      partialize: (state) => ({
        items: state.items,
        _hasHydrated: state._hasHydrated,
      }),
      migrate: (persistedState: any, version: number) => {
        // If version is 0 (or undefined), migrate to version 1
        if (version === 0) {
          // Return migrated state or reset to default
          return {
            items: persistedState?.items || [],
            _hasHydrated: false,
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hook to safely get cart item count (returns 0 during SSR)
export function useCartItemCount() {
  const [count, setCount] = useState(0);
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state._hasHydrated);

  useEffect(() => {
    if (hasHydrated) {
      const total = items.reduce((acc, item) => acc + item.quantity, 0);
      setCount(total);
    }
  }, [items, hasHydrated]);

  return count;
}
