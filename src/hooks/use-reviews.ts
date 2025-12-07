'use client';

import { useEffect } from 'react';
import {
  useReviewsStore,
  type Review,
  type ReviewFormData,
} from '@/store/reviews-store';

export type { Review, ReviewFormData };

export function useReviews() {
  const reviews = useReviewsStore((state) => state.reviews);
  const loading = useReviewsStore((state) => state.loading);

  useEffect(() => {
    useReviewsStore.getState().fetchReviews();
  }, []);

  return {
    reviews,
    loading,
    refresh: () => {
      useReviewsStore.getState().invalidate();
      useReviewsStore.getState().fetchReviews();
    },
  };
}

export async function approveReview(id: string): Promise<boolean> {
  return useReviewsStore.getState().approveReview(id);
}

export async function rejectReview(id: string): Promise<boolean> {
  return useReviewsStore.getState().rejectReview(id);
}

export async function deleteReview(id: string): Promise<boolean> {
  return useReviewsStore.getState().deleteReview(id);
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  return useReviewsStore.getState().fetchProductReviews(productId);
}

export async function checkUserPurchased(userId: string, productId: string): Promise<boolean> {
  return useReviewsStore.getState().checkUserPurchased(userId, productId);
}

export async function checkUserReviewed(userId: string, productId: string): Promise<boolean> {
  return useReviewsStore.getState().checkUserReviewed(userId, productId);
}

export async function submitReview(
  userId: string,
  productId: string,
  data: ReviewFormData
): Promise<boolean> {
  return useReviewsStore.getState().submitReview(userId, productId, data);
}
