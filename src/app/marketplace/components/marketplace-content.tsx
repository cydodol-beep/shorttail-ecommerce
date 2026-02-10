'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Package, Grid, List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useProductsGrid, ProductFilters } from '@/hooks/use-products-grid';
import { ProductCard, ProductCardSkeleton } from '@/components/marketplace/product-card';
import { QuickViewModal } from '@/components/marketplace/quick-view-modal';
import { FilterBar } from '@/components/marketplace/filter-bar';
import { StickySidebarAds } from '@/components/marketplace/sidebar-ads';
import { InlineInterstitialAd } from '@/components/marketplace/interstitial-ad';
import { SocialProofToast } from '@/components/marketplace/social-proof-toast';
import type { ProductWithDetails } from '@/hooks/use-products-grid';

export function MarketplaceContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const {
    products,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    filters,
    setFilters,
    loadMore,
    refetch,
    resetFilters,
  } = useProductsGrid({
    itemsPerPage: 24,
  });

  // Handle quick view
  const handleQuickView = useCallback((product: ProductWithDetails) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  }, []);

  // Close quick view
  const handleCloseQuickView = useCallback(() => {
    setIsQuickViewOpen(false);
    setSelectedProduct(null);
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000 &&
        hasMore &&
        !isLoadingMore
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loadMore]);

  // Split products into rows for interstitial ads (mobile only)
  const getProductRows = () => {
    if (viewMode === 'list') return [{ products }];
    
    const rows: { products: ProductWithDetails[]; showAd?: boolean }[] = [];
    const productsPerRow = {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    };
    
    // Determine products per row based on viewport
    const getProductsPerRow = () => {
      if (typeof window === 'undefined') return productsPerRow.desktop;
      if (window.innerWidth < 640) return productsPerRow.mobile;
      if (window.innerWidth < 1024) return productsPerRow.tablet;
      return productsPerRow.desktop;
    };

    const ppr = getProductsPerRow();
    let currentRow: ProductWithDetails[] = [];
    let rowCount = 0;

    products.forEach((product, index) => {
      currentRow.push(product);
      
      if (currentRow.length === ppr || index === products.length - 1) {
        rows.push({
          products: [...currentRow],
          showAd: rowCount > 0 && rowCount % 3 === 0, // Show ad after every 3rd row
        });
        currentRow = [];
        rowCount++;
      }
    });

    return rows;
  };

  const productRows = getProductRows();

  return (
    <div className="min-h-screen bg-cream">
      {/* Social Proof Toasts */}
      <SocialProofToast position="bottom-left" interval={10000} />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-brown-900">
                Marketplace
              </h1>
              <p className="text-brown-600 mt-1">
                Discover premium products for your beloved pets
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalResults={totalCount}
          className="mb-6"
        />

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div
                className={cn(
                  'grid gap-4',
                  viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-1'
                )}
              >
                {[...Array(12)].map((_, i) => (
                  <ProductCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-brown-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-brown-900 mb-2">
                  Error loading products
                </h3>
                <p className="text-brown-600 mb-4">{error}</p>
                <Button onClick={refetch}>Try Again</Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-brown-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-brown-900 mb-2">
                  No products found
                </h3>
                <p className="text-brown-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={resetFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                {/* Mobile: Products with interstitial ads */}
                <div className="lg:hidden">
                  {productRows.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      <div
                        className={cn(
                          'grid gap-3 mb-4',
                          viewMode === 'grid'
                            ? 'grid-cols-2'
                            : 'grid-cols-1'
                        )}
                      >
                        {row.products.map((product, index) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            index={rowIndex * 4 + index}
                            onQuickView={handleQuickView}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                      {row.showAd && <InlineInterstitialAd />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Desktop: Simple grid */}
                <div
                  className={cn(
                    'hidden lg:grid gap-4',
                    viewMode === 'grid'
                      ? 'grid-cols-3 xl:grid-cols-4'
                      : 'grid-cols-1'
                  )}
                >
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      onQuickView={handleQuickView}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      variant="outline"
                      size="lg"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More Products'
                      )}
                    </Button>
                  </div>
                )}

                {/* End of Results */}
                {!hasMore && products.length > 0 && (
                  <div className="mt-8 text-center text-brown-500">
                    <p>You've reached the end</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop Sidebar Ads */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <StickySidebarAds maxAds={3} />
          </aside>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </div>
  );
}
