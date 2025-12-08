import { useEffect } from 'react';
import { useRelatedProductsStore } from '@/store/related-products-store';

export function useRelatedProducts(productId: string, limit = 5) {
  const { relatedProducts, loading, fetchRelatedProducts, getRelatedProducts } = useRelatedProductsStore();

  useEffect(() => {
    if (productId) {
      fetchRelatedProducts(productId, limit);
    }
  }, [productId, limit, fetchRelatedProducts]);

  return {
    relatedProducts: getRelatedProducts(productId),
    loading,
    refresh: () => fetchRelatedProducts(productId, limit),
  };
}
