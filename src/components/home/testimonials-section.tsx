'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useLandingSections } from '@/hooks/use-landing-sections';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    user_name: string;
    user_avatar_url: string;
  };
  products?: {
    name: string;
  };
}

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('testimonials', {
    title: 'What Our Customers Say',
    subtitle: 'Real reviews from real pet owners',
  });

  const fetchReviews = useCallback(async () => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles:user_id (user_name, user_avatar_url),
        products:product_id (name)
      `)
      .eq('is_approved', true)
      .gte('rating', 4) // Only show 4+ star reviews
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
      return;
    }

    setReviews(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Auto-rotate testimonials
  useEffect(() => {
    if (reviews.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  if (loading || reviews.length === 0) {
    // Show placeholder testimonials
    return (
      <section className="py-16 bg-brown-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-brown-900 mb-4">
              {settings.title}
            </h2>
            <p className="text-brown-600 max-w-xl mx-auto">
              {settings.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Sarah M.', comment: 'Amazing quality products! My dog loves the treats from here.', rating: 5 },
              { name: 'John D.', comment: 'Fast delivery and great customer service. Highly recommend!', rating: 5 },
              { name: 'Lisa K.', comment: 'Best pet shop online. The variety is incredible.', rating: 5 },
            ].map((review, index) => (
              <Card key={index} className="border-brown-200 bg-white">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-brown-700 mb-4">&quot;{review.comment}&quot;</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {review.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-brown-900">{review.name}</p>
                      <p className="text-sm text-brown-500">Verified Buyer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-brown-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-brown-900 mb-4">
            {settings.title}
          </h2>
          <p className="text-brown-600 max-w-xl mx-auto">
            {settings.subtitle}
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.slice(0, 3).map((review) => (
            <Card key={review.id} className="border-brown-200 bg-white">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-brown-700 mb-4 line-clamp-4">&quot;{review.comment}&quot;</p>
                {review.products?.name && (
                  <p className="text-xs text-brown-400 mb-4">
                    Review for: {review.products.name}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.profiles?.user_avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {review.profiles?.user_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-brown-900">
                      {review.profiles?.user_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-brown-500">Verified Buyer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <Card className="border-brown-200 bg-white max-w-md mx-auto">
            <CardContent className="p-6">
              <Quote className="h-8 w-8 text-primary/20 mb-4" />
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-4 w-4 ${star <= reviews[currentIndex].rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-brown-700 mb-4">&quot;{reviews[currentIndex].comment}&quot;</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={reviews[currentIndex].profiles?.user_avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {reviews[currentIndex].profiles?.user_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-brown-900">
                    {reviews[currentIndex].profiles?.user_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-brown-500">Verified Buyer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          {reviews.length > 1 && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={goToPrev}
                className="p-2 bg-white rounded-full shadow-md hover:bg-brown-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-brown-600" />
              </button>
              <div className="flex gap-2 items-center">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? 'bg-primary w-4' : 'bg-brown-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={goToNext}
                className="p-2 bg-white rounded-full shadow-md hover:bg-brown-50 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-brown-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
