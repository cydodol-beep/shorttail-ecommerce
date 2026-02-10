'use client';

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  ArrowUp,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useProductsPagination, ProductFilters } from '@/hooks/use-products-pagination';
import { StickyHeader } from '@/components/marketplace/sticky-header';
import { ScrollProgress } from '@/components/marketplace/scroll-progress';
import { AnimatedFooter } from '@/components/marketplace/animated-footer';
import { SocialProofToast } from '@/components/marketplace/social-proof-toast';
import { FilterBar } from '@/components/marketplace/filter-bar';
import type { ProductWithDetails } from '@/hooks/use-products-pagination';

// Memoized Product Card Component
const ProductCard = memo(function ProductCard({ 
  product, 
  index 
}: { 
  product: ProductWithDetails; 
  index: number;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Image Container */}
      <Link href={`/products/${product.id}`} className="block relative aspect-square bg-gray-100">
        {isInView && product.main_image_url ? (
          <>
            <Image
              src={product.main_image_url}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Package className="h-12 w-12 text-gray-300" />
          </div>
        )}
        
        {/* Stock Badge */}
        {product.isOutOfStock && (
          <Badge variant="secondary" className="absolute top-2 left-2 bg-gray-900 text-white">
            Out of Stock
          </Badge>
        )}
        
        {/* View Count Overlay */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
            <Eye className="h-3 w-3 mr-1" />
            {Math.floor(Math.random() * 20) + 3} viewing
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {product.categories && (
          <p className="text-sm text-gray-500 mt-1">{product.categories.name}</p>
        )}
        
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold text-primary">
            Rp {product.lowestPrice.toLocaleString('id-ID')}
          </span>
          {product.highestPrice > product.lowestPrice && (
            <span className="text-sm text-gray-500">
              - Rp {product.highestPrice.toLocaleString('id-ID')}
            </span>
          )}
        </div>
        
        {product.totalStock > 0 && product.totalStock <= 5 && (
          <p className="text-sm text-red-600 mt-1 font-medium">
            Only {product.totalStock} left!
          </p>
        )}
      </div>
    </motion.div>
  );
});

// Loading Skeleton Grid
function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Skeleton className="aspect-square" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-2 text-gray-400">...</span>
          ) : (
            <Button
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
              className="min-w-[40px]"
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

// Scroll to Top Button
function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Main Marketplace Landing Component
export function MarketplaceLanding() {
  const {
    paginatedProducts,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    filters,
    setFilters,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    resetFilters,
  } = useProductsPagination({ itemsPerPage: 20 });

  const [showFilters, setShowFilters] = useState(false);

  // Handle search from header
  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, [setFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Scroll Progress Indicator */}
      <ScrollProgress />
      
      {/* Sticky Smart Header */}
      <StickyHeader 
        onSearch={handleSearch} 
        searchQuery={filters.searchQuery || ''}
        cartCount={0}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-32 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Premium Pet Products
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Quality products for your beloved pets. From food to accessories, we have everything you need.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {totalCount} Products
              </span>
              <span>•</span>
              <span>Free Shipping</span>
              <span>•</span>
              <span>24/7 Support</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filter Bar Toggle (Mobile) */}
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filter Bar */}
        <AnimatePresence>
          {(showFilters || typeof window !== 'undefined' && window.innerWidth >= 768) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:block overflow-hidden"
            >
              <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                totalResults={totalCount}
                className="mb-6"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing <span className="font-medium">{paginatedProducts.length}</span> of{' '}
            <span className="font-medium">{totalCount}</span> products
          </p>
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <ProductSkeletonGrid />
        ) : error ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading products</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
            <Button onClick={resetFilters}>Clear Filters</Button>
          </div>
        ) : (
          <>
            {/* Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {paginatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
                <p className="text-center text-sm text-gray-500 mt-4">
                  Use arrow keys or Page Up/Down to navigate
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Animated Footer */}
      <AnimatedFooter />

      {/* Social Proof Toast */}
      <SocialProofToast position="bottom-left" interval={10000} />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
