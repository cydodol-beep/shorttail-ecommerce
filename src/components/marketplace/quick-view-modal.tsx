'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, ChevronLeft, ChevronRight, Check, AlertCircle, Package } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ProductWithDetails } from '@/hooks/use-products-grid';
import type { ProductVariant } from '@/types/database';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { ProductCard } from './product-card';

interface QuickViewModalProps {
  product: ProductWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  relatedProducts?: ProductWithDetails[];
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  relatedProducts = [],
}: QuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedVariant(null);
      setCurrentImageIndex(0);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  // Format price to IDR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get all images
  const images = [
    product.main_image_url,
    ...(product.gallery_image_urls || []),
  ].filter(Boolean) as string[];

  // Get current price
  const currentPrice = selectedVariant
    ? product.base_price + selectedVariant.price_adjustment
    : product.lowestPrice;

  // Get current stock
  const currentStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.totalStock;

  // Handle add to cart
  const handleAddToCart = () => {
    if (product.isOutOfStock) {
      toast.error('Product is out of stock');
      return;
    }

    if (product.has_variants && !selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedVariant || undefined);
    }
    
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-green-500" />
        <span>
          {quantity}x {product.name} added to cart!
        </span>
      </div>
    );
    onClose();
  };

  // Navigate images
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-brown-100 aspect-square md:aspect-auto md:h-full min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                {images[currentImageIndex] ? (
                  <Image
                    src={images[currentImageIndex]}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-16 h-16 text-brown-300" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === currentImageIndex
                        ? 'bg-accent'
                        : 'bg-white/60 hover:bg-white'
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Condition Badge */}
            {product.condition === 'secondhand' && (
              <Badge className="absolute top-4 left-4 bg-amber-100 text-amber-700 border-amber-200">
                Secondhand
              </Badge>
            )}
          </div>

          {/* Content Section */}
          <ScrollArea className="max-h-[80vh] md:max-h-[600px]">
            <div className="p-6">
              {/* Category */}
              {product.categories && (
                <span className="text-xs text-brown-500 uppercase tracking-wide">
                  {product.categories.name}
                </span>
              )}

              {/* Title */}
              <h2 className="text-2xl font-bold text-brown-900 mt-1 mb-2">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(currentPrice)}
                </span>
                {product.lowestPrice !== product.highestPrice && !selectedVariant && (
                  <span className="text-sm text-brown-400">
                    {formatPrice(product.lowestPrice)} - {formatPrice(product.highestPrice)}
                  </span>
                )}
              </div>

              <Separator className="my-4" />

              {/* Description */}
              {product.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-brown-900 mb-2">Description</h3>
                  <p className="text-sm text-brown-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4">
                {product.isOutOfStock ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Out of Stock
                  </Badge>
                ) : currentStock <= 5 ? (
                  <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    Only {currentStock} left
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    In Stock ({currentStock})
                  </Badge>
                )}
              </div>

              {/* Variants */}
              {product.has_variants && product.product_variants && product.product_variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-brown-900 mb-3">
                    Select Variant
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.product_variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(
                          selectedVariant?.id === variant.id ? null : variant
                        )}
                        disabled={variant.stock_quantity <= 0}
                        className={cn(
                          'px-4 py-2 text-sm rounded-lg border-2 transition-all',
                          selectedVariant?.id === variant.id
                            ? 'border-accent bg-accent/5 text-accent'
                            : 'border-brown-200 hover:border-accent/50',
                          variant.stock_quantity <= 0 && 'opacity-50 cursor-not-allowed line-through'
                        )}
                      >
                        <span className="font-medium">{variant.variant_name}</span>
                        <span className="ml-2 text-brown-500">
                          +{formatPrice(variant.price_adjustment)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-brown-900 mb-3">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-lg border border-brown-200 flex items-center justify-center hover:border-accent disabled:opacity-50"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= currentStock}
                    className="w-10 h-10 rounded-lg border border-brown-200 flex items-center justify-center hover:border-accent disabled:opacity-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={product.isOutOfStock || (product.has_variants && !selectedVariant)}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.isOutOfStock
                  ? 'Out of Stock'
                  : product.has_variants && !selectedVariant
                  ? 'Select a Variant'
                  : 'Add to Cart'}
              </Button>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-sm font-semibold text-brown-900 mb-3">
                      You might also like
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {relatedProducts.slice(0, 2).map((relatedProduct) => (
                        <ProductCard
                          key={relatedProduct.id}
                          product={relatedProduct}
                          onQuickView={(p) => {
                            // Handle related product quick view
                            toast.info('Related product selected');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
