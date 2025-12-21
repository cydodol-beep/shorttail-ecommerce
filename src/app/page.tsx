'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useLandingSections } from '@/hooks/use-landing-sections';
import Script from 'next/script';

// Import the section components from the original home components
import { HeroSection } from '@/components/home/hero-section';
import { PromoBanner } from '@/components/home/promo-banner';
import { BenefitsSection } from '@/components/home/benefits-section';
import { CategorySection } from '@/components/home/category-section';
import { FlashSale } from '@/components/home/flash-sale';
import { FeaturedProducts } from '@/components/home/featured-products';
import { NewArrivals } from '@/components/home/new-arrivals';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { NewsletterSection } from '@/components/home/newsletter-section';

export default function HomePage() {
  const { isSectionVisible } = useLandingSections();

  // Organization schema for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'PetStore',
    name: 'ShortTail.id',
    description: 'Premium pet shop in Indonesia offering quality pet food, toys, and accessories',
    url: 'https://shorttail.id',
    logo: 'https://shorttail.id/logo.png',
    image: 'https://shorttail.id/og-image.jpg',
    telephone: '+62-xxx-xxxx-xxxx',
    email: 'support@shorttail.id',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
      addressLocality: 'Indonesia',
    },
    sameAs: [
      'https://facebook.com/shorttail.id',
      'https://instagram.com/shorttail.id',
      'https://twitter.com/shorttail_id',
    ],
    priceRange: '$$',
    paymentAccepted: 'Credit Card, Debit Card, Bank Transfer, E-Wallet',
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ShortTail.id',
    url: 'https://shorttail.id',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://shorttail.id/products?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      {/* JSON-LD Schema Markup */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <div className="min-h-screen font-sans text-teal flex flex-col">
        <Header />

        <main className="flex-1">
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
        </main>

        <Footer />
      </div>
    </>
  );
}