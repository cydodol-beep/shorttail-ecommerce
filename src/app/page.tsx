'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
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
import Script from 'next/script';

export default function HomePage() {
  const { getVisibleSections } = useLandingSections();
  
  // Get sections in the correct order (sorted by sort_order)
  const visibleSections = getVisibleSections();
  
  // Map section keys to their components
  const sectionComponents: Record<string, React.ReactElement> = {
    hero: <HeroSection key="hero" />,
    promo_banner: <PromoBanner key="promo_banner" />,
    benefits: <BenefitsSection key="benefits" />,
    categories: <CategorySection key="categories" />,
    flash_sale: <FlashSale key="flash_sale" />,
    featured_products: <FeaturedProducts key="featured_products" />,
    new_arrivals: <NewArrivals key="new_arrivals" />,
    testimonials: <TestimonialsSection key="testimonials" />,
    newsletter: <NewsletterSection key="newsletter" />,
  };

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

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          {/* Render sections dynamically based on sort_order */}
          {visibleSections.map((section) => 
            sectionComponents[section.section_key] || null
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
}
