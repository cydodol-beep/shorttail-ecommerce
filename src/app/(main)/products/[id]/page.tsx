'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ShoppingBag, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  Shield, 
  Minus, 
  Plus,
  PawPrint,
  User,
  Loader2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { fetchProductReviews, submitReview, checkUserPurchased, checkUserReviewed, type Review } from '@/hooks/use-reviews';
import type { Product, ProductVariant } from '@/types/database';
import { RelatedProducts } from '@/components/products/related-products';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  const fetchProduct = useCallback(async () => {
    const supabase = createClient();
    
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      setLoading(false);
      return;
    }

    setProduct(productData);

    if (productData.has_variants) {
      const { data: variantData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', resolvedParams.id)
        .order('variant_name');
      
      setVariants(variantData || []);
    }

    setLoading(false);
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Fetch reviews
  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    const data = await fetchProductReviews(resolvedParams.id);
    setReviews(data);
    setReviewsLoading(false);
  }, [resolvedParams.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Check if user can review (purchased product and hasn't reviewed yet)
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user?.id) {
        setCheckingEligibility(false);
        return;
      }

      setCheckingEligibility(true);
      const [purchased, reviewed] = await Promise.all([
        checkUserPurchased(user.id, resolvedParams.id),
        checkUserReviewed(user.id, resolvedParams.id),
      ]);
      setHasPurchased(purchased);
      setHasReviewed(reviewed);
      setCheckingEligibility(false);
    };

    checkEligibility();
  }, [user?.id, resolvedParams.id]);

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to submit a review');
      router.push('/login');
      return;
    }

    if (!hasPurchased) {
      toast.error('You can only review products you have purchased');
      return;
    }

    if (hasReviewed) {
      toast.error('You have already reviewed this product');
      return;
    }

    if (userRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    const success = await submitReview(user.id, resolvedParams.id, {
      rating: userRating,
      comment: reviewComment.trim() || undefined,
    });

    if (success) {
      toast.success('Review submitted! It will appear after admin approval.');
      setUserRating(0);
      setReviewComment('');
      setHasReviewed(true);
    } else {
      toast.error('Failed to submit review');
    }
    setSubmittingReview(false);
  };

  const getCurrentPrice = () => {
    if (!product) return 0;
    // If product has variants and a variant is selected, use variant price_adjustment
    if (product.has_variants && selectedVariant) {
      return selectedVariant.price_adjustment || 0;
    }
    // If product has variants but none selected, show lowest variant price
    if (product.has_variants && variants.length > 0) {
      return Math.min(...variants.map(v => v.price_adjustment || 0));
    }
    return product.base_price || 0;
  };

  const getPriceRange = () => {
    if (!product?.has_variants || variants.length === 0) return null;
    const prices = variants.map(v => v.price_adjustment || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return null;
    return { min, max };
  };

  const getCurrentStock = () => {
    if (product?.has_variants) {
      if (selectedVariant) return selectedVariant.stock_quantity;
      // Total stock from all variants
      return variants.reduce((sum, v) => sum + v.stock_quantity, 0);
    }
    return product?.stock_quantity || 0;
  };

  const getCurrentWeight = () => {
    if (product?.has_variants && selectedVariant) {
      return selectedVariant.weight_grams || 0;
    }
    return product?.unit_weight_grams || 0;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.has_variants && !selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedVariant || undefined);
    }
    
    toast.success(`${quantity} x ${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <PawPrint className="h-16 w-16 text-brown-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-brown-900 mb-2">Product Not Found</h2>
        <p className="text-brown-600 mb-4">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/products')}>Back to Products</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Button
        variant="ghost"
        className="mb-6 -ml-4"
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="aspect-square bg-brown-100 rounded-xl overflow-hidden">
            {product.main_image_url ? (
              <img
                src={product.main_image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PawPrint className="h-32 w-32 text-brown-300" />
              </div>
            )}
          </div>
          
          {/* Gallery thumbnails */}
          {product.gallery_image_urls && product.gallery_image_urls.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {product.gallery_image_urls.map((url, index) => (
                <div
                  key={index}
                  className="w-20 h-20 shrink-0 bg-brown-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                >
                  <img src={url} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            {product.condition === 'secondhand' && (
              <Badge variant="secondary">Secondhand</Badge>
            )}
            <Badge variant="outline" className="capitalize">{product.category}</Badge>
          </div>

          <h1 className="text-3xl font-bold text-brown-900 mb-2">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
            <span className="text-sm text-brown-600">
              {reviews.length > 0 
                ? `${averageRating.toFixed(1)} (${reviews.length} review${reviews.length !== 1 ? 's' : ''})` 
                : 'No reviews yet'}
            </span>
          </div>

          <div className="mb-6">
            {(() => {
              const priceRange = getPriceRange();
              if (priceRange && !selectedVariant) {
                return (
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
                  </p>
                );
              }
              return (
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(getCurrentPrice())}
                </p>
              );
            })()}
            {product.has_variants && selectedVariant && (
              <p className="text-sm text-brown-500 mt-1">
                Weight: {getCurrentWeight()}g
              </p>
            )}
            {!product.has_variants && product.unit_weight_grams && (
              <p className="text-sm text-brown-500 mt-1">
                Weight: {product.unit_weight_grams}g
              </p>
            )}
          </div>

          <p className="text-brown-600 mb-6">{product.description}</p>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-brown-900 mb-2">
                Select Variant {product.has_variants && <span className="text-destructive">*</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedVariant(variant)}
                    disabled={variant.stock_quantity === 0}
                    className="flex flex-col h-auto py-2"
                  >
                    <span>{variant.variant_name}</span>
                    <span className="text-xs opacity-80">
                      {formatPrice(variant.price_adjustment || 0)}
                    </span>
                    {variant.stock_quantity === 0 && (
                      <span className="text-xs text-destructive">Out of stock</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-brown-900 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-brown-200 rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(getCurrentStock(), quantity + 1))}
                  disabled={quantity >= getCurrentStock()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-brown-600">
                {getCurrentStock()} available
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleAddToCart}
              disabled={getCurrentStock() === 0}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {getCurrentStock() === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-brown-50 rounded-lg">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-brown-900">Free Shipping</p>
                <p className="text-xs text-brown-600">On orders over Rp 500k</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-brown-50 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-brown-900">Guaranteed</p>
                <p className="text-xs text-brown-600">100% authentic</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mt-12">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none text-brown-700">
            <p>{product.description || 'No description available.'}</p>
          </div>
        </TabsContent>
        <TabsContent value="specifications" className="mt-6">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="text-sm text-brown-600">SKU</div>
            <div className="text-sm font-medium text-brown-900">{product.sku || 'N/A'}</div>
            <div className="text-sm text-brown-600">Weight</div>
            <div className="text-sm font-medium text-brown-900">{product.unit_weight_grams}g</div>
            <div className="text-sm text-brown-600">Condition</div>
            <div className="text-sm font-medium text-brown-900 capitalize">{product.condition || 'New'}</div>
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-8">
            {/* Write Review Section */}
            <div className="bg-brown-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-brown-900 mb-4">Write a Review</h3>
              
              {checkingEligibility ? (
                <div className="flex items-center gap-2 text-brown-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking eligibility...</span>
                </div>
              ) : !user ? (
                <div className="text-center py-4">
                  <p className="text-brown-600 mb-3">Please login to submit a review.</p>
                  <Button variant="outline" onClick={() => router.push('/login')}>
                    Login to Review
                  </Button>
                </div>
              ) : hasReviewed ? (
                <div className="text-center py-4">
                  <Star className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
                  <p className="text-brown-700 font-medium">Thank you for your review!</p>
                  <p className="text-sm text-brown-500">You have already submitted a review for this product.</p>
                </div>
              ) : !hasPurchased ? (
                <div className="text-center py-4">
                  <ShoppingBag className="h-10 w-10 text-brown-300 mx-auto mb-2" />
                  <p className="text-brown-700 font-medium">Purchase to Review</p>
                  <p className="text-sm text-brown-500">Only customers who have purchased this product can leave a review.</p>
                </div>
              ) : (
                <>
                  {/* Star Rating Input */}
                  <div className="mb-4">
                    <p className="text-sm text-brown-600 mb-2">Your Rating</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoverRating || userRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="mb-4">
                    <p className="text-sm text-brown-600 mb-2">Your Review (Optional)</p>
                    <Textarea
                      placeholder="Share your experience with this product..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || userRating === 0}
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Reviews List */}
            <div>
              <h3 className="text-lg font-semibold text-brown-900 mb-4">
                Customer Reviews ({reviews.length})
              </h3>

              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 bg-brown-50 rounded-xl">
                  <Star className="h-12 w-12 text-brown-300 mx-auto mb-3" />
                  <p className="text-brown-600">No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-brown-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-white">
                            {review.user_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-brown-900">{review.user_name || 'Anonymous'}</p>
                            <span className="text-xs text-brown-500">
                              {new Date(review.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-brown-700">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      <RelatedProducts 
        productId={product.id} 
        title="You Might Also Like"
        limit={5}
      />
    </div>
  );
}
