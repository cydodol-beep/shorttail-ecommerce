'use client';

import { HeroSection } from '@/components/home/hero-section';
import { PromoBanner } from '@/components/home/promo-banner';
import { BenefitsSection } from '@/components/home/benefits-section';
import { CategorySection } from '@/components/home/category-section';
import { FlashSale } from '@/components/home/flash-sale';
import { FeaturedProducts } from '@/components/home/featured-products';
import { NewArrivals } from '@/components/home/new-arrivals';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { NewsletterSection } from '@/components/home/newsletter-section';
import { useLandingSections } from '@/hooks/use-landing-sections';

export default function HomePage() {
  const { isSectionVisible } = useLandingSections();

  return (
    <div className="min-h-screen">
      {/* Hero Section with Store Info */}
      {isSectionVisible('hero') && <HeroSection />}
      
      {/* Active Promotions Banner */}
      {isSectionVisible('promo_banner') && <PromoBanner />}
      
      {/* Benefits/Trust Badges */}
      {isSectionVisible('benefits') && <BenefitsSection />}
      
      {/* Shop by Category */}
      {isSectionVisible('categories') && <CategorySection />}
      
      {/* Flash Sale Section */}
      {isSectionVisible('flash_sale') && <FlashSale />}
      
      {/* Featured Products */}
      {isSectionVisible('featured_products') && <FeaturedProducts />}
      
      {/* New Arrivals */}
      {isSectionVisible('new_arrivals') && <NewArrivals />}
      
      {/* Customer Testimonials */}
      {isSectionVisible('testimonials') && <TestimonialsSection />}
      
      {/* Newsletter Subscription */}
      {isSectionVisible('newsletter') && <NewsletterSection />}
    </div>
  );
}
