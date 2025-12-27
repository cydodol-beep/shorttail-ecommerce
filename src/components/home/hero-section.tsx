'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useLandingSections } from '@/hooks/use-landing-sections';
import { useProductData } from '@/hooks/use-product-data';
import type { ExtendedProduct } from '@/hooks/use-product-data';

// TypeScript interface for benefit settings
interface BenefitSetting {
  icon: string;
  title: string;
  description: string;
  color?: string;
}

interface BenefitsSectionSettings {
  benefits: BenefitSetting[];
}

// TypeScript interface for hero section settings
interface HeroSectionSettings {
  title?: string;
  subtitle?: string;
  topTags?: string[];
  description?: string;
  ctaText?: string;
  buttonText?: string;
  imageUrls?: string[];
  discountValue?: string;
  discountLabel?: string;
  vetApprovedText?: string;
}

export default function HeroSection() {
  const { getSectionSettings } = useLandingSections();

  const {
    products,
    loading: productsLoading,
  } = useProductData();

  // For the floating product teaser
  const [currentProduct, setCurrentProduct] = useState<ExtendedProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Initialize the floating product teaser with a random product
  useEffect(() => {
    if (products && products.length > 0) {
      // Filter active products that have images
      const activeProducts = products.filter(p => p.is_active && p.main_image_url);
      if (activeProducts.length > 0) {
        // Select a random product
        const randomIndex = Math.floor(Math.random() * activeProducts.length);
        setCurrentProduct(activeProducts[randomIndex]);
        setLoadingProduct(false);
      }
    }
  }, [products]);

  // Set up auto-rotation every 10 seconds
  useEffect(() => {
    if (products && products.length > 0) {
      const interval = setInterval(() => {
        const activeProducts = products.filter(p => p.is_active && p.main_image_url);
        if (activeProducts.length > 0) {
          const randomIndex = Math.floor(Math.random() * activeProducts.length);
          setCurrentProduct(activeProducts[randomIndex]);
        }
      }, 10000); // Rotate every 10 seconds

      return () => clearInterval(interval);
    }
  }, [products]);

  // Get hero settings with defaults
  const heroSettings: HeroSectionSettings = getSectionSettings('hero', {
    title: "Everything Your Pet Needs & Loves",
    subtitle: "",
    topTags: [
      "#1 Vet Recommended",
      "New Collection 2024"
    ],
    description: "Premium organic treats, durable toys, and cozy beds. Everything your Anabul needs for a happier, healthier life.",
    ctaText: "Start Shopping",
    buttonText: "Watch Video",
    imageUrls: [
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop"
    ]
  });

  const images = heroSettings.imageUrls || [
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop"
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center bg-cream overflow-hidden py-11 lg:py-0">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-11 lg:gap-18 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1 relative">
            {/* Dynamic hashtags from admin settings */}
            <div className="flex items-center gap-2.5 mb-5.5">
              {(heroSettings.topTags && heroSettings.topTags.length > 0) ? (
                heroSettings.topTags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center py-1 px-3 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase border border-accent/20">
                    {index === 0 && <span className="w-3 h-3 bg-accent rounded-full mr-1"></span>}
                    {tag}
                  </span>
                ))
              ) : (
                <>
                  <span className="inline-flex items-center py-1 px-3 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase border border-accent/20">
                    <span className="w-3 h-3 bg-accent rounded-full mr-1"></span>
                    #1 Vet Recommended
                  </span>
                  <span className="inline-block py-1 px-3 rounded-full bg-teal/5 text-teal text-xs font-bold tracking-wider uppercase border border-teal/10">
                    New Collection 2024
                  </span>
                </>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-teal leading-[1.05] mb-5.5 tracking-tight">
              {(heroSettings.title && heroSettings.title !== "") ? heroSettings.title : "Spoil them with"}
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">
                  {heroSettings.subtitle && heroSettings.subtitle !== "" ? heroSettings.subtitle : "Nature's Best"}
                </span>
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

            <p className="text-base md:text-lg text-teal/70 mb-7 max-w-lg leading-relaxed font-medium"
               dangerouslySetInnerHTML={{
                 __html: (heroSettings.description && heroSettings.description !== "")
                   ? heroSettings.description
                   : "Premium organic treats, durable toys, and cozy beds. Everything your <span class=\"text-accent font-bold\">Anabul</span> needs for a happier, healthier life."
               }}>
            </p>
          </div>

          {/* Button section */}
          <div className="flex flex-col sm:flex-row gap-3.5 mb-9">
            <Link href="/products">
              <Button variant="default" size="lg" className="bg-accent hover:bg-accent-hover shadow-xl shadow-teal/20 hover:shadow-teal/30 group text-sm">
                {(() => {
                  const heroSettings: HeroSectionSettings = getSectionSettings('hero', {
                    title: "Everything Your Pet Needs & Loves",
                    subtitle: "",
                    showTrustBadges: true,
                    trustBadges: [
                      {text: "Fast Delivery", icon: "truck"},
                      {text: "Secure Payment", icon: "shield"},
                      {text: "24/7 Support", icon: "clock"}
                    ],
                    topTags: [
                      "#1 Vet Recommended",
                      "New Collection 2024"
                    ],
                    description: "Premium organic treats, durable toys, and cozy beds. Everything your Anabul needs for a happier, healthier life.",
                    ctaText: "Shop Products",
                    buttonText: "About Us",
                    imageUrls: [
                      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop"
                    ]
                  });
                  return heroSettings.ctaText || "Shop Products";
                })()}
                <span className="ml-2 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Button>
            </Link>
            <Link href="/about">
            <Button variant="outline" size="lg" className="border-teal text-teal hover:bg-teal hover:text-white group text-sm">
              <span className="mr-2 group-hover:scale-110 transition-transform">▶</span>
              {(() => {
                const heroSettings: HeroSectionSettings = getSectionSettings('hero', {
                  title: "Everything Your Pet Needs & Loves",
                  subtitle: "",
                  topTags: [
                    "#1 Vet Recommended",
                    "New Collection 2024"
                  ],
                  description: "Premium organic treats, durable toys, and cozy beds. Everything your Anabul needs for a happier, healthier life.",
                  ctaText: "Start Shopping",
                  buttonText: "About Us",
                  imageUrls: [
                    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop"
                  ]
                });
                return heroSettings.buttonText || "About Us";
              })()}
            </Button>
          </Link>
          </div>

          {/* User testimonials section */}
          <div className="flex items-center gap-3.5">
            <div className="flex -space-x-3.5">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://picsum.photos/id/${i + 60}/50/50`} alt="User" className="w-10.5 h-10.5 rounded-full border-2.5 border-cream object-cover shadow-sm" />
              ))}
              <div className="w-10.5 h-10.5 rounded-full border-2.5 border-cream bg-teal text-white flex items-center justify-center text-[10px] font-bold">
                +12k
              </div>
            </div>
            <div className="text-xs">
              <p className="font-bold text-teal">Happy Parents</p>
              <div className="flex text-accent text-[9px] mt-0.5">
                {[1,2,3,4,5].map(s => <span key={s} className="text-base">★</span>)}
              </div>
            </div>
          </div>

          {/* Dynamic Image Content */}
          <div className="order-1 lg:order-2 relative mt-8 lg:mt-0 flex justify-center lg:justify-end">
            <div className="relative w-[306px] md:w-[405px] aspect-square">
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
                <div className="w-full h-full rounded-full overflow-hidden border-[7px] border-white shadow-2xl shadow-teal/10 relative">
                    <img
                      src={images[0]}
                      alt="Happy Pet"
                      className="w-full h-full object-cover scale-110"
                    />
                </div>
              </motion.div>

              {/* Secondary Image (Cat) - Floats with offset */}
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -left-8 z-20 w-36 h-36 md:w-43 md:h-43"
              >
                <div className="w-full h-full rounded-full overflow-hidden border-[5px] border-white shadow-xl shadow-teal/15 bg-white relative">
                  <img
                    src={images[1]}
                    alt="Curious Pet"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              {/* Floating Product Teaser Card (Conversion Driver) */}
              {loadingProduct || !currentProduct ? (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute top-9 -right-4 md:-right-9 z-30 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-white max-w-[144px]"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="bg-cream rounded-lg p-0.5">
                      <div className="w-9 h-9 rounded-md bg-gray-200 animate-pulse" />
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
                      <div className="h-2 bg-gray-200 rounded w-12" />
                    </div>
                  </div>
                  <div className="w-full bg-teal text-white text-[9px] font-bold py-1.25 px-2.5 rounded-lg text-center">
                    <div className="h-2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute top-9 -right-4 md:-right-9 z-30 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-white max-w-[144px]"
                >
                  <Link href={`/products/${currentProduct.id}`} className="block">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="bg-cream rounded-lg p-0.5">
                        <img
                          src={currentProduct.main_image_url || "https://placehold.co/100x100?text=No+Image"}
                          className="w-9 h-9 rounded-md object-cover"
                          alt={currentProduct.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/100x100?text=No+Image";
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-teal line-clamp-1">{currentProduct.name}</p>
                        <p className="text-[9px] text-gray-500">Rp {currentProduct.base_price.toLocaleString()}</p>
                      </div>
                    </div>
                  </Link>
                  <Link href={`/cart?add=${currentProduct.id}`} className="block">
                    <div className="w-full bg-teal text-white text-[9px] font-bold py-1.25 px-2.5 rounded-lg text-center cursor-pointer hover:bg-teal-dark transition-colors flex items-center justify-center gap-1">
                      Add to Cart <span>🛒</span>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* 100% Natural Badge - Positioned to avoid conflicts */}
              <div className="absolute top-0 left-0 z-30 transform -rotate-12">
                <motion.div
                  animate={{ rotate: [-12, -8, -12] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-accent text-white w-18 h-18 rounded-full flex flex-col items-center justify-center shadow-lg border-3.5 border-white"
                >
                  <span className="text-lg font-bold leading-none">
                    {(heroSettings.discountValue && heroSettings.discountValue !== "") ? heroSettings.discountValue : "50%"}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider">
                    {(heroSettings.discountLabel && heroSettings.discountLabel !== "") ? heroSettings.discountLabel : "OFF"}
                  </span>
                </motion.div>
              </div>

              {/* Quality Check Badge - Positioned to prevent overlap */}
              <div className="absolute top-4 right-4 z-30">
                <div className="bg-white px-3.5 py-1.5 rounded-xl shadow-lg border border-teal/10 flex items-center gap-1.5">
                  <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                    <span className="text-base">✓</span>
                  </div>
                  <span className="text-[9px] font-bold text-teal">
                    {(heroSettings.vetApprovedText && heroSettings.vetApprovedText !== "") ? heroSettings.vetApprovedText : "Vet Approved"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}