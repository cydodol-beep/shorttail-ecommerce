'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TESTIMONIALS } from '@/constants/products';
import Script from 'next/script';
import { ArrowRight, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/ui/product-card';
import { useLandingSections } from '@/hooks/use-landing-sections';
import { useProductData } from '@/hooks/use-product-data';

// Import the section components from the components directory
import { CategorySection } from '@/components/home/category-section';



const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
    <div className="w-full h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const SectionHeader: React.FC<{ title: string; subtitle: string; centered?: boolean }> = ({ title, subtitle, centered }) => (
  <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
    <span className="text-accent font-bold uppercase tracking-wider text-sm mb-2 block">{subtitle}</span>
    <h2 className="text-3xl md:text-4xl font-bold text-teal">{title}</h2>
  </div>
);

const BenefitsSection = () => (
  <section className="py-20 bg-cream">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Free Shipping", desc: "On orders over $50", icon: "🚚" },
          { title: "Quality Guarantee", desc: "100% natural products", icon: "⭐" },
          { title: "24/7 Support", desc: "Expert pet care advice", icon: "🏥" }
        ].map((benefit, idx) => (
          <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">{benefit.icon}</div>
            <h3 className="text-xl font-bold text-teal mb-2">{benefit.title}</h3>
            <p className="text-teal/70">{benefit.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);


const FlashSale = () => (
  <section className="py-20 bg-gradient-to-r from-accent to-orange-500 text-white relative overflow-hidden">
    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="md:w-1/2">
          <h2 className="text-4xl font-bold mb-4">Flash Sale!</h2>
          <p className="mb-6 text-white/90">Get up to 50% off on premium pet supplies. Limited time offer!</p>
          <div className="flex gap-2 mb-6">
            {[2, 1, 5, 2].map((time, idx) => (
              <div key={idx} className="bg-white/20 rounded-lg p-3 text-center min-w-[60px]">
                <span className="text-2xl font-bold block">{time}</span>
                <span className="text-xs opacity-80">Hours</span>
              </div>
            ))}
          </div>
          <Button className="bg-white text-teal hover:bg-white/90">Shop Now</Button>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative">
            <div className="w-64 h-64 bg-white/10 rounded-full blur-xl absolute -top-6 -left-6 z-0"></div>
            <div className="relative z-10">
              <img 
                src="https://picsum.photos/id/1062/300/300" 
                alt="Flash Sale Product" 
                className="w-64 h-64 object-cover rounded-full border-4 border-white shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const NewsletterSection = () => (
  <section className="py-20 bg-cream">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <SectionHeader title="Join Our Pack" subtitle="Newsletter" centered />
      <p className="text-teal/80 mb-8 max-w-md mx-auto">
        Subscribe to get special offers, free giveaways, and new product alerts.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Your email address"
          className="flex-1 px-4 py-3 rounded-full border border-teal/20 focus:outline-none focus:ring-2 focus:ring-accent text-teal"
        />
        <Button className="bg-accent hover:bg-accent-hover rounded-full px-6">
          Subscribe
        </Button>
      </div>
      <p className="text-xs text-teal/60 mt-4">
        By subscribing, you agree to our Privacy Policy and consent to receive updates.
      </p>
    </div>
  </section>
);

export default function HomePage() {
  const {
    products,
    loading: productsLoading,
    getBestSellingProducts,
    getNewArrivalProducts,
    error
  } = useProductData();
  const [loading, setLoading] = useState(true);
  const { isSectionVisible } = useLandingSections(); // Hook for admin section visibility

  // Pagination State
  const [bestSellersPage, setBestSellersPage] = useState(1);
  const [newArrivalsPage, setNewArrivalsPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Testimonial Carousel State
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [testimonialDirection, setTestimonialDirection] = useState(0);

  // Handle loading states
  useEffect(() => {
    if (!productsLoading && products && products.length > 0) {
      setLoading(false);
    }
  }, [products, productsLoading]);

  // Auto-play Testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      paginateTestimonial(1);
    }, 5000); // Auto-scroll every 5 seconds
    return () => clearInterval(interval);
  }, [currentTestimonialIndex]);

  const bestSellers = products && products.length > 0 ? getBestSellingProducts() : [];  // Get best-selling products from database
  const newArrivals = products && products.length > 0 ? getNewArrivalProducts() : [];   // Get new arrival products from database

  // Pagination Logic
  const totalBestSellersPages = Math.ceil(bestSellers.length / ITEMS_PER_PAGE);
  const currentBestSellers = bestSellers.slice(
    (bestSellersPage - 1) * ITEMS_PER_PAGE,
    bestSellersPage * ITEMS_PER_PAGE
  );

  const totalNewArrivalsPages = Math.ceil(newArrivals.length / ITEMS_PER_PAGE);
  const currentNewArrivals = newArrivals.slice(
    (newArrivalsPage - 1) * ITEMS_PER_PAGE,
    newArrivalsPage * ITEMS_PER_PAGE
  );

  // Pagination Controls Component
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-4 mt-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-10 h-10 p-0 flex items-center justify-center rounded-full"
        >
          <ChevronLeft size={20} />
        </Button>
        <span className="text-sm font-medium text-teal font-mono">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-10 h-10 p-0 flex items-center justify-center rounded-full"
        >
          <ChevronRight size={20} />
        </Button>
      </div>
    );
  };

  // Testimonial Logic
  const paginateTestimonial = (newDirection: number) => {
    setTestimonialDirection(newDirection);
    setCurrentTestimonialIndex((prev) => {
      let nextIndex = prev + newDirection;
      if (nextIndex < 0) nextIndex = (TESTIMONIALS && TESTIMONIALS.length > 0) ? TESTIMONIALS.length - 1 : 0;
      if (TESTIMONIALS && TESTIMONIALS.length > 0 && nextIndex >= TESTIMONIALS.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const testimonialVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100, // Reduced distance for smoother feel
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100, // Reduced distance
      opacity: 0,
      scale: 0.95
    })
  };

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

      <div className="min-h-screen font-sans text-teal">
        <Header />

        <main>
          {/* Hero Section - Always visible */}
          <section className="relative min-h-[90vh] flex items-center bg-cream overflow-hidden py-12 lg:py-0">
            {/* Texture Background - Animated Pulse */}
            <motion.div
              animate={{ opacity: [0.03, 0.05, 0.03] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(#006d77_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
            />

            {/* Background blobs - Organic Movement */}
            <motion.div
              animate={{
                scale: [1, 1.1, 0.95, 1],
                x: [0, 20, -20, 0],
                y: [0, -30, 20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 0.9, 1],
                x: [0, -30, 30, 0],
                y: [0, 40, -40, 0],
                rotate: [0, -10, 10, 0]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
                delay: 2
              }}
              className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 z-0"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Text Content */}
                <div className="order-2 lg:order-1 relative">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="inline-flex items-center py-1 px-3 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase border border-accent/20">
                      <span className="w-3 h-3 bg-accent rounded-full mr-1"></span>
                      #1 Vet Recommended
                    </span>
                    <span className="inline-block py-1 px-3 rounded-full bg-teal/5 text-teal text-xs font-bold tracking-wider uppercase border border-teal/10">
                      New Collection 2024
                    </span>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-bold text-teal leading-[1.05] mb-6 tracking-tight">
                    Spoil them with <br />
                    <span className="relative inline-block">
                      <span className="relative z-10">Nature's Best</span>
                      <motion.svg
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="absolute w-[105%] h-4 -bottom-1 -left-1 text-accent opacity-40 -z-10"
                        viewBox="0 0 100 10"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="12" fill="none" />
                      </motion.svg>
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl text-teal/70 mb-8 max-w-lg leading-relaxed font-medium">
                    Premium organic treats, durable toys, and cozy beds.
                    Everything your <span className="text-accent font-bold">Anabul</span> needs for a happier, healthier life.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 mb-10">
                    <Button variant="default" size="lg" className="bg-accent hover:bg-accent-hover shadow-xl shadow-teal/20 hover:shadow-teal/30 group">
                      Start Shopping
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </Button>
                    <Button variant="outline" size="lg" className="border-teal text-teal hover:bg-teal hover:text-white group">
                      <span className="mr-2 group-hover:scale-110 transition-transform">▶</span>
                      Watch Video
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-4">
                      {[1, 2, 3, 4].map(i => (
                        <img key={i} src={`https://picsum.photos/id/${i + 60}/50/50`} alt="User" className="w-12 h-12 rounded-full border-[3px] border-cream object-cover shadow-sm" />
                      ))}
                      <div className="w-12 h-12 rounded-full border-[3px] border-cream bg-teal text-white flex items-center justify-center text-xs font-bold">
                        +12k
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-teal">Happy Parents</p>
                      <div className="flex text-accent text-xs mt-0.5">
                        {[1,2,3,4,5].map(s => <span key={s} className="text-lg">★</span>)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Content - Immersive Scene */}
                <div className="order-1 lg:order-2 relative mt-8 lg:mt-0 flex justify-center lg:justify-end">
                  <div className="relative w-[340px] md:w-[450px] aspect-square">
                    {/* Rotating Circle Background */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal/5 to-accent/5 rounded-full blur-xl animate-pulse" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border border-dashed border-teal/20 rounded-full"
                    />

                    {/* Main Image (Dog) - Floats gently */}
                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-4 z-10"
                    >
                      <div className="w-full h-full rounded-full overflow-hidden border-[8px] border-white shadow-2xl shadow-teal/10 relative">
                          <img
                            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop"
                            alt="Happy Dog"
                            className="w-full h-full object-cover scale-110"
                          />
                      </div>
                    </motion.div>

                    {/* Secondary Image (Cat) - Floats with offset */}
                    <motion.div
                      animate={{ y: [0, 15, 0] }}
                      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="absolute -bottom-4 -left-8 z-20 w-40 h-40 md:w-48 md:h-48"
                    >
                      <div className="w-full h-full rounded-full overflow-hidden border-[6px] border-white shadow-xl shadow-teal/15 bg-white relative">
                        <img
                          src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop"
                          alt="Curious Cat"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>

                    {/* Floating Product Teaser Card (Conversion Driver) */}
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute top-10 -right-4 md:-right-10 z-30 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white max-w-[160px]"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-cream rounded-lg p-1">
                          <img src="https://picsum.photos/id/1062/100/100" className="w-10 h-10 rounded-md object-cover" alt="Food" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-teal line-clamp-1">Premium Kibble</p>
                          <p className="text-[10px] text-gray-500">$24.99</p>
                        </div>
                      </div>
                      <div className="w-full bg-teal text-white text-[10px] font-bold py-1.5 px-3 rounded-lg text-center cursor-pointer hover:bg-teal-dark transition-colors flex items-center justify-center gap-1">
                        Add to Cart <span>🛒</span>
                      </div>
                    </motion.div>

                    {/* 100% Natural Badge */}
                    <div className="absolute top-0 left-0 z-20 transform -rotate-12">
                      <motion.div
                        animate={{ rotate: [-12, -8, -12] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-accent text-white w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white"
                      >
                        <span className="text-xl font-bold leading-none">50%</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">OFF</span>
                      </motion.div>
                    </div>

                    {/* Quality Check Badge */}
                    <div className="absolute bottom-12 -right-2 md:-right-8 z-20">
                      <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-teal/10 flex items-center gap-2">
                        <div className="bg-green-100 text-green-600 p-1 rounded-full">
                          <span className="text-lg">✓</span>
                        </div>
                        <span className="text-xs font-bold text-teal">Vet Approved</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Dynamic sections based on admin panel settings */}
          {isSectionVisible('benefits') && <BenefitsSection />}
          {isSectionVisible('categories') && <CategorySection />}

          {/* Best Sellers Section */}
          {isSectionVisible('featured_products') && (
            <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader title="Best Sellers" subtitle="Customer Favorites" centered />
                <div className="min-h-[400px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                      ))
                    ) : (
                      currentBestSellers.map((product, i) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                        />
                      ))
                    )}
                  </div>
                </div>
                {!loading && (
                  <PaginationControls
                    currentPage={bestSellersPage}
                    totalPages={totalBestSellersPages}
                    onPageChange={setBestSellersPage}
                  />
                )}
              </div>
            </section>
          )}

          {isSectionVisible('flash_sale') && <FlashSale />}

          {/* New Arrivals Section */}
          {isSectionVisible('new_arrivals') && (
            <section id="new-arrivals" className="py-20 bg-cream relative">
               {/* Decorative Element */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl"></div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <SectionHeader title="New Arrivals" subtitle="Fresh In Stock" centered />
                <div className="min-h-[400px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                      ))
                    ) : (
                      currentNewArrivals.map((product, i) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                        />
                      ))
                    )}
                  </div>
                </div>
                {!loading && (
                  <PaginationControls
                    currentPage={newArrivalsPage}
                    totalPages={totalNewArrivalsPages}
                    onPageChange={setNewArrivalsPage}
                  />
                )}
              </div>
            </section>
          )}

          {/* Testimonials Carousel */}
          {isSectionVisible('testimonials') && (
            <section className="py-24 bg-white overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader title="Happy Parents" subtitle="Testimonials" centered />

                <div className="relative max-w-4xl mx-auto mt-12">
                  <div className="relative h-[400px] md:h-[320px] flex items-center justify-center">
                    <AnimatePresence initial={false} custom={testimonialDirection} mode="wait">
                      <motion.div
                        key={currentTestimonialIndex}
                        custom={testimonialDirection}
                        variants={testimonialVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.4 }
                        }}
                        className="absolute w-full px-4 md:px-12"
                      >
                        <div className="bg-cream p-8 md:p-12 rounded-[2rem] shadow-lg border border-teal/5 relative text-center">
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-accent text-white flex items-center justify-center rounded-full shadow-lg">
                            <Quote size={20} className="fill-current" />
                          </div>

                          <p className="text-xl md:text-2xl text-teal/80 italic mb-8 pt-6 leading-relaxed">
                            "{TESTIMONIALS && TESTIMONIALS[currentTestimonialIndex]?.content || 'Great products and excellent service!'}"
                          </p>

                          <div className="flex flex-col items-center gap-3">
                            <img
                              src={TESTIMONIALS && TESTIMONIALS[currentTestimonialIndex]?.avatar || 'https://picsum.photos/100/100'}
                              alt={TESTIMONIALS && TESTIMONIALS[currentTestimonialIndex]?.name || 'Customer'}
                              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                            />
                            <div>
                              <h4 className="font-bold text-teal text-lg">{TESTIMONIALS && TESTIMONIALS[currentTestimonialIndex]?.name || 'Happy Customer'}</h4>
                              <p className="text-sm text-accent font-medium uppercase tracking-wide">{TESTIMONIALS && TESTIMONIALS[currentTestimonialIndex]?.role || 'Pet Owner'}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-center items-center gap-4 mt-8 md:mt-4 z-10 relative">
                    <button
                      onClick={() => paginateTestimonial(-1)}
                      className="w-12 h-12 rounded-full bg-white border border-teal/10 text-teal shadow-lg hover:bg-teal hover:text-white transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent"
                      aria-label="Previous Testimonial"
                    >
                      <ChevronLeft size={24} />
                    </button>

                    {/* Dots */}
                    <div className="flex gap-2">
                      {TESTIMONIALS && TESTIMONIALS.length > 0 ? TESTIMONIALS.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const dir = idx > currentTestimonialIndex ? 1 : -1;
                            setTestimonialDirection(dir);
                            setCurrentTestimonialIndex(idx);
                          }}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            idx === currentTestimonialIndex ? 'bg-accent w-8' : 'bg-teal/20 hover:bg-teal/40'
                          }`}
                          aria-label={`Go to testimonial ${idx + 1}`}
                        />
                      )) : null}
                    </div>

                    <button
                      onClick={() => paginateTestimonial(1)}
                      className="w-12 h-12 rounded-full bg-white border border-teal/10 text-teal shadow-lg hover:bg-teal hover:text-white transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent"
                      aria-label="Next Testimonial"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {isSectionVisible('newsletter') && <NewsletterSection />}
        </main>

        <Footer />
      </div>
    </>
  );
}