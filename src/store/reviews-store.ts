import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface Review {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  product_id: string;
  product_name?: string;
  rating: number;
  comment?: string;
  is_approved: boolean;
  created_at: string;
}

export interface ReviewFormData {
  rating: number;
  comment?: string;
}

interface ReviewsStore {
  reviews: Review[];
  loading: boolean;
  lastFetched: number | null;
  fetchReviews: () => Promise<void>;
  fetchProductReviews: (productId: string) => Promise<Review[]>;
  checkUserPurchased: (userId: string, productId: string) => Promise<boolean>;
  checkUserReviewed: (userId: string, productId: string) => Promise<boolean>;
  submitReview: (userId: string, productId: string, data: ReviewFormData) => Promise<boolean>;
  approveReview: (id: string) => Promise<boolean>;
  rejectReview: (id: string) => Promise<boolean>;
  deleteReview: (id: string) => Promise<boolean>;
  invalidate: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useReviewsStore = create<ReviewsStore>((set, get) => ({
  reviews: [],
  loading: false,
  lastFetched: null,

  fetchReviews: async () => {
    const state = get();

    // Skip if already loading
    if (state.loading) return;

    // Use cache if valid
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }

    set({ loading: true });

    try {
      const supabase = createClient();

      console.log('Fetching reviews from Supabase...');

      // Fetch reviews
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        set({ loading: false });
        return;
      }

      console.log('Reviews fetch result:', { count: reviewsData?.length || 0 });

      // Fetch user and product info
      const userIds = [...new Set((reviewsData || []).map((r: any) => r.user_id).filter(Boolean))];
      const productIds = [...new Set((reviewsData || []).map((r: any) => r.product_id).filter(Boolean))];

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, user_name, email')
        .in('id', userIds);

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));
      const productsMap = new Map((productsData || []).map((p: any) => [p.id, p]));

      const reviews = (reviewsData || []).map((review: any) => {
        const user = usersMap.get(review.user_id);
        const product = productsMap.get(review.product_id);

        return {
          id: review.id,
          user_id: review.user_id,
          user_name: user?.user_name,
          user_email: user?.email,
          product_id: review.product_id,
          product_name: product?.name,
          rating: review.rating,
          comment: review.comment,
          is_approved: review.is_approved,
          created_at: review.created_at,
        } as Review;
      });

      set({
        reviews,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching reviews:', err);
      set({ loading: false });
    }
  },

  fetchProductReviews: async (productId: string) => {
    try {
      const supabase = createClient();

      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching product reviews:', error);
        return [];
      }

      // Fetch user info
      const userIds = [...new Set((reviewsData || []).map((r: any) => r.user_id).filter(Boolean))];
      
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, user_name, user_email')
        .in('id', userIds);

      const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));

      return (reviewsData || []).map((review: any) => {
        const user = usersMap.get(review.user_id);
        return {
          id: review.id,
          user_id: review.user_id,
          user_name: user?.user_name || 'Anonymous',
          user_email: user?.user_email,
          product_id: review.product_id,
          rating: review.rating,
          comment: review.comment,
          is_approved: review.is_approved,
          created_at: review.created_at,
        } as Review;
      });
    } catch (err) {
      console.error('Exception fetching product reviews:', err);
      return [];
    }
  },

  checkUserPurchased: async (userId: string, productId: string) => {
    try {
      const supabase = createClient();

      // Check if user has any delivered/paid order containing this product
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner (
            product_id
          )
        `)
        .eq('user_id', userId)
        .in('status', ['paid', 'packed', 'shipped', 'delivered'])
        .eq('order_items.product_id', productId)
        .limit(1);

      if (error) {
        console.error('Error checking purchase:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (err) {
      console.error('Exception checking purchase:', err);
      return false;
    }
  },

  checkUserReviewed: async (userId: string, productId: string) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .limit(1);

      if (error) {
        console.error('Error checking review:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (err) {
      console.error('Exception checking review:', err);
      return false;
    }
  },

  submitReview: async (userId: string, productId: string, data: ReviewFormData) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          product_id: productId,
          rating: data.rating,
          comment: data.comment || null,
          is_approved: false,
        });

      if (error) {
        console.error('Error submitting review:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Exception submitting review:', err);
      return false;
    }
  },

  approveReview: async (id: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', id);

      if (error) {
        console.error('Error approving review:', error);
        return false;
      }

      // Update local state
      set((state) => ({
        reviews: state.reviews.map((review) =>
          review.id === id ? { ...review, is_approved: true } : review
        ),
      }));

      return true;
    } catch (err) {
      console.error('Exception approving review:', err);
      return false;
    }
  },

  rejectReview: async (id: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .eq('id', id);

      if (error) {
        console.error('Error rejecting review:', error);
        return false;
      }

      // Update local state
      set((state) => ({
        reviews: state.reviews.map((review) =>
          review.id === id ? { ...review, is_approved: false } : review
        ),
      }));

      return true;
    } catch (err) {
      console.error('Exception rejecting review:', err);
      return false;
    }
  },

  deleteReview: async (id: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting review:', error);
        return false;
      }

      // Remove from local state
      set((state) => ({
        reviews: state.reviews.filter((review) => review.id !== id),
      }));

      return true;
    } catch (err) {
      console.error('Exception deleting review:', err);
      return false;
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
