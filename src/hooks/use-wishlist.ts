'use client';

import { useEffect } from 'react';
import { useWishlistStore, type WishlistItem } from '@/store/wishlist-store';
import { useAuth } from '@/hooks/use-auth';

export type { WishlistItem };

export function useWishlist() {
  const { user } = useAuth();
  const items = useWishlistStore((state) => state.items);
  const loading = useWishlistStore((state) => state.loading);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  useEffect(() => {
    if (user?.id) {
      fetchWishlist(user.id);
    }
  }, [user?.id, fetchWishlist]);

  const addToWishlist = async (productId: string) => {
    if (!user?.id) return false;
    return useWishlistStore.getState().addToWishlist(user.id, productId);
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user?.id) return false;
    return useWishlistStore.getState().removeFromWishlist(user.id, productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId);
    }
  };

  return {
    items,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refresh: () => user?.id && fetchWishlist(user.id),
  };
}
