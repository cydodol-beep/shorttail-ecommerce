'use client';

import Link from 'next/link';
import { PawPrint, Star, ShoppingBag, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product, ProductVariant } from '@/types/database';

interface ProductCardProps {
  product: Product & { product_variants?: ProductVariant[] };
  onAddToCart?: (product: Product) => void;
  rank?: number;
  showQuickActions?: boolean;
  className?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProductCard({ product, onAddToCart, rank, showQuickActions = true, className }: ProductCardProps) {
  const getProductPrice = () => {
    if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
      const prices = product.product_variants.map(v => v.price_adjustment || 0);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return { min, max, isRange: min !== max };
    }
    return { min: product.base_price, max: product.base_price, isRange: false };
  };

  const getProductStock = () => {
    if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
      return product.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0);
    }
    return product.stock_quantity;
  };

  const priceInfo = getProductPrice();
  const stock = getProductStock();
  const isLowStock = stock <= 5 && stock > 0;
  const isOutOfStock = stock === 0;

  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary overflow-hidden h-full flex flex-col ${className || ''}`}>
      <CardContent className="p-0 flex flex-col h-full">
        {/* Product Image */}
        <div className="relative aspect-square bg-gradient-to-br from-brown-50 to-brown-100 overflow-hidden">
          <Link href={`/products/${product.id}`} className="block w-full h-full">
            {product.main_image_url ? (
              <img
                src={product.main_image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PawPrint className="h-12 w-12 sm:h-16 sm:w-16 text-brown-300" />
              </div>
            )}
          </Link>
          
          {/* Badges */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 z-10">
            {rank !== undefined && rank < 3 && (
              <Badge className="bg-orange-500 hover:bg-orange-500 text-[10px] sm:text-xs shadow-lg">
                #{rank + 1} Best
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="text-[10px] sm:text-xs shadow-lg">
                Out of Stock
              </Badge>
            )}
            {product.condition === 'secondhand' && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs shadow-lg">
                Secondhand
              </Badge>
            )}
          </div>

          {/* Quick Actions Overlay - Desktop Only */}
          {showQuickActions && (
            <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center gap-2 z-20">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full h-10 w-10 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                onClick={() => window.location.href = `/products/${product.id}`}
              >
                <Eye className="h-5 w-5" />
              </Button>
              {!product.has_variants && stock > 0 && onAddToCart && (
                <Button
                  size="icon"
                  className="rounded-full h-10 w-10 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                  onClick={() => onAddToCart(product)}
                >
                  <ShoppingBag className="h-5 w-5" />
                </Button>
              )}
              {product.has_variants && (
                <Button
                  size="icon"
                  className="rounded-full h-10 w-10 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                  onClick={() => window.location.href = `/products/${product.id}`}
                >
                  <ShoppingBag className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-[10px] sm:text-xs text-brown-500 ml-0.5 sm:ml-1">(5.0)</span>
          </div>
          
          {/* Product Name */}
          <Link href={`/products/${product.id}`} className="flex-1">
            <h3 className="font-semibold text-brown-900 text-xs sm:text-sm lg:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-tight">
              {product.name}
            </h3>
          </Link>
          
          {/* Price and Stock */}
          <div className="flex items-end justify-between gap-2 mt-auto">
            <div className="flex-1">
              {priceInfo.isRange ? (
                <p className="font-bold text-primary text-sm sm:text-base lg:text-lg">
                  {formatPrice(priceInfo.min)} - {formatPrice(priceInfo.max)}
                </p>
              ) : (
                <p className="font-bold text-primary text-sm sm:text-base lg:text-lg">
                  {formatPrice(priceInfo.min)}
                </p>
              )}
              {isLowStock && (
                <p className="text-[10px] sm:text-xs text-red-500 font-medium mt-0.5">
                  Only {stock} left!
                </p>
              )}
            </div>
            {product.has_variants && (
              <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                Options
              </Badge>
            )}
          </div>
        </div>

        {/* Add to Cart button - different behavior for products with variants */}
        {!product.has_variants && onAddToCart && (
          <Button
            className="w-full mt-3"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        )}
        {product.has_variants && (
          <Button
            className="w-full mt-3"
            onClick={() => window.location.href = `/products/${product.id}`}
            variant="default"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Choose Options
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export { ProductCard };
