'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, AlertCircle, Check, Minus } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ProductWithDetails } from '@/hooks/use-products-grid';
import type { ProductVariant } from '@/types/database';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

interface ProductCardProps {
  product: ProductWithDetails;
  index?: number;
  onQuickView?: (product: ProductWithDetails) => void;
  viewMode?: 'grid' | 'list';
}

export function ProductCard({
  product,
  index = 0,
  onQuickView,
  viewMode = 'grid',
}: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  // Format price to IDR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get current price based on variant selection
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return product.base_price + selectedVariant.price_adjustment;
    }
    return product.lowestPrice;
  };

  // Get stock status
  const getStockStatus = () => {
    if (product.isOutOfStock) {
      return { label: 'Out of Stock', color: 'destructive', icon: Minus };
    }
    if (product.totalStock <= 5) {
      return { label: `Only ${product.totalStock} left`, color: 'warning', icon: AlertCircle };
    }
    if (product.totalStock <= 10) {
      return { label: 'Low Stock', color: 'secondary', icon: AlertCircle };
    }
    return { label: 'In Stock', color: 'success', icon: Check };
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (product.isOutOfStock) {
      toast.error('Product is out of stock');
      return;
    }

    // If product has variants and none selected, show quick view
    if (product.has_variants && !selectedVariant) {
      onQuickView?.(product);
      return;
    }

    addItem(product, selectedVariant || undefined);
    toast.success(`${product.name} added to cart!`);
  };

  // Get variant chips
  const variantChips = product.product_variants?.slice(0, 3) || [];
  const remainingVariants = (product.product_variants?.length || 0) - 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'group relative',
        viewMode === 'list' && 'col-span-full'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          'overflow-hidden transition-all duration-300 cursor-pointer',
          'border-brown-200 hover:border-accent hover:shadow-lg',
          product.isOutOfStock && 'opacity-75 grayscale-[0.3]',
          viewMode === 'list' && 'flex flex-row'
        )}
        onClick={() => onQuickView?.(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onQuickView?.(product);
          }
        }}
        aria-label={`View ${product.name}`}
      >
        {/* Image Container */}
        <div
          className={cn(
            'relative bg-brown-100 overflow-hidden',
            viewMode === 'grid' ? 'aspect-square' : 'w-48 h-48'
          )}
        >
          {/* Condition Badge */}
          {product.condition === 'secondhand' && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 z-10 text-[10px] bg-amber-100 text-amber-700 border-amber-200"
            >
              Secondhand
            </Badge>
          )}

          {/* Stock Status Badge */}
          {product.totalStock <= 5 && product.totalStock > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-2 right-2 z-10 text-[10px] animate-pulse"
            >
              <StockIcon size={10} className="mr-1" />
              {stockStatus.label}
            </Badge>
          )}

          {/* Out of Stock Overlay */}
          {product.isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <span className="text-white font-bold text-sm bg-red-500 px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Product Image */}
          {product.main_image_url ? (
            <>
              {!imageLoaded && (
                <Skeleton className="absolute inset-0" />
              )}
              <Image
                src={product.main_image_url}
                alt={product.name}
                fill
                className={cn(
                  'object-cover transition-transform duration-500',
                  isHovered && !product.isOutOfStock && 'scale-110',
                  !imageLoaded && 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                sizes={viewMode === 'grid' ? '(max-width: 640px) 50vw, 25vw' : '192px'}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-brown-300 text-sm">No Image</span>
            </div>
          )}

          {/* Hover Overlay with Quick Actions */}
          <motion.div
            initial={false}
            animate={{ opacity: isHovered && !product.isOutOfStock ? 1 : 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 z-30"
          >
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white hover:bg-accent hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView?.(product);
              }}
              aria-label="Quick view"
            >
              <Eye size={18} />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white hover:bg-accent hover:text-white"
              onClick={handleAddToCart}
              disabled={product.isOutOfStock}
              aria-label="Add to cart"
            >
              <ShoppingCart size={18} />
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <CardContent
          className={cn(
            'p-3 flex flex-col',
            viewMode === 'list' && 'flex-1 justify-between'
          )}
        >
          {/* Category */}
          {product.categories && (
            <span className="text-[10px] text-brown-500 uppercase tracking-wide mb-1">
              {product.categories.name}
            </span>
          )}

          {/* Product Name */}
          <h3
            className={cn(
              'font-semibold text-brown-900 line-clamp-2 mb-2 transition-colors',
              'group-hover:text-accent'
            )}
          >
            {product.name}
          </h3>

          {/* Variant Chips */}
          {variantChips.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {variantChips.map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariant(
                      selectedVariant?.id === variant.id ? null : variant
                    );
                  }}
                  className={cn(
                    'px-2 py-0.5 text-[10px] rounded-full border transition-colors',
                    selectedVariant?.id === variant.id
                      ? 'bg-accent text-white border-accent'
                      : 'bg-brown-50 text-brown-600 border-brown-200 hover:border-accent'
                  )}
                  aria-label={`Select variant ${variant.variant_name}`}
                >
                  {variant.variant_name}
                </button>
              ))}
              {remainingVariants > 0 && (
                <span className="px-2 py-0.5 text-[10px] text-brown-400">
                  +{remainingVariants} more
                </span>
              )}
            </div>
          )}

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-lg font-bold text-primary">
                {formatPrice(getCurrentPrice())}
              </span>
              {product.lowestPrice !== product.highestPrice && !selectedVariant && (
                <span className="text-xs text-brown-400">
                  - {formatPrice(product.highestPrice)}
                </span>
              )}
            </div>

            {/* Stock Info */}
            <div className="flex items-center gap-1 text-[10px] text-brown-500">
              <StockIcon size={12} className={cn(
                stockStatus.color === 'destructive' && 'text-red-500',
                stockStatus.color === 'warning' && 'text-amber-500',
                stockStatus.color === 'success' && 'text-green-500'
              )} />
              <span className={cn(
                stockStatus.color === 'destructive' && 'text-red-600',
                stockStatus.color === 'warning' && 'text-amber-600'
              )}>
                {stockStatus.label}
              </span>
            </div>

            {/* Quick Add Button (Mobile) */}
            <Button
              size="sm"
              className="w-full mt-2 lg:hidden"
              onClick={handleAddToCart}
              disabled={product.isOutOfStock}
            >
              <ShoppingCart size={14} className="mr-1" />
              {product.isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading skeleton for product card
export function ProductCardSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  return (
    <Card className={cn('overflow-hidden', viewMode === 'list' && 'flex flex-row')}>
      <div className={cn('bg-brown-100', viewMode === 'grid' ? 'aspect-square' : 'w-48 h-48')}>
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-3 flex flex-col">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-5 w-28" />
      </CardContent>
    </Card>
  );
}
