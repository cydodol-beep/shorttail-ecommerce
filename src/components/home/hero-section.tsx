'use client';

import Link from 'next/link';
import { useLandingSections } from '@/hooks/use-landing-sections';

export function HeroSection() {
  const { sections, fetched, getSectionSettings } = useLandingSections();

  // Get hero settings with proper defaults that will be overridden by DB settings
  const heroSettings = getSectionSettings('hero', {
    title: 'Spoil them with Nature\'s Best',
    subtitle: 'Premium organic treats, durable toys, and cozy beds',
    showTrustBadges: true,
    trustBadges: [
      { text: '24/7 Vet Support', icon: 'hospital' },
      { text: '100% Natural', icon: 'leaf' },
      { text: 'Free Returns', icon: 'return' },
    ],
  });

  return (
    <section className="relative min-h-[90vh] flex items-center bg-cream overflow-hidden py-12 lg:py-0">
      {/* Texture Background - Animated Pulse */}
      <div className="absolute inset-0 bg-[radial-gradient(#006d77_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Background blobs - Organic Movement */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 z-0" />

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
                <div className="absolute w-[105%] h-4 -bottom-1 -left-1 text-accent opacity-40 -z-10">
                  <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="12" fill="none" />
                  </svg>
                </div>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-teal/70 mb-8 max-w-lg leading-relaxed font-medium">
              Premium organic treats, durable toys, and cozy beds.
              Everything your <span className="text-accent font-bold">Anabul</span> needs for a happier, healthier life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/products">
                <button className="bg-accent hover:bg-accent-hover shadow-xl shadow-teal/20 hover:shadow-teal/30 group py-3 px-6 rounded-full text-white font-medium">
                  Start Shopping
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 inline">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </span>
                </button>
              </Link>
              <button className="border border-teal text-teal hover:bg-teal hover:text-white group py-3 px-6 rounded-full font-medium">
                <span className="mr-2 group-hover:scale-110 transition-transform">▶</span>
                Watch Video
              </button>
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
              <div className="absolute inset-0 border border-dashed border-teal/20 rounded-full animate-spin" style={{ animationDuration: '50s' }}></div>

              {/* Main Image (Dog) - Floats gently */}
              <div className="absolute inset-4 z-10 animate-bounce" style={{ animationDuration: '6s' }}>
                <div className="w-full h-full rounded-full overflow-hidden border-[8px] border-white shadow-2xl shadow-teal/10 relative">
                  <img
                    src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop"
                    alt="Happy Dog"
                    className="w-full h-full object-cover scale-110"
                  />
                </div>
              </div>

              {/* Secondary Image (Cat) - Floats with offset */}
              <div className="absolute -bottom-4 -left-8 z-20 w-40 h-40 md:w-48 md:h-48 animate-bounce" style={{ animationDuration: '7s', animationDelay: '0.5s' }}>
                <div className="w-full h-full rounded-full overflow-hidden border-[6px] border-white shadow-xl shadow-teal/15 bg-white relative">
                  <img
                    src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop"
                    alt="Curious Cat"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Floating Product Teaser Card (Conversion Driver) */}
              <div className="absolute top-10 -right-4 md:-right-10 z-30 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white max-w-[160px] animate-pulse" style={{ animationDuration: '5s' }}>
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
              </div>

              {/* 100% Natural Badge */}
              <div className="absolute top-0 left-0 z-20 transform -rotate-12">
                <div className="bg-accent text-white w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white animate-pulse" style={{ animationDuration: '4s' }}>
                  <span className="text-xl font-bold leading-none">50%</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">OFF</span>
                </div>
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
  );
}