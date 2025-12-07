'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, PawPrint } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();

  const subtotal = getTotal();
  const shippingFee = subtotal > 500000 ? 0 : 25000;
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 bg-brown-50 rounded-full w-fit mx-auto mb-6">
            <ShoppingBag className="h-16 w-16 text-brown-300" />
          </div>
          <h2 className="text-2xl font-bold text-brown-900 mb-2">Your cart is empty</h2>
          <p className="text-brown-600 mb-6">
            Looks like you haven&apos;t added any items to your cart yet.
          </p>
          <Button asChild>
            <Link href="/products">
              Start Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brown-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => {
              // For variant products, use variant price_adjustment; for simple products, use base_price
              const itemPrice = item.variant ? (item.variant.price_adjustment || 0) : item.product.base_price;
              const itemTotal = itemPrice * item.quantity;

              return (
                <motion.div
                  key={`${item.product.id}-${item.variant?.id || 'no-variant'}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-brown-200">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-brown-100 rounded-lg shrink-0 overflow-hidden">
                          {item.product.main_image_url ? (
                            <img
                              src={item.product.main_image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PawPrint className="h-8 w-8 text-brown-300" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="font-semibold text-brown-900 hover:text-primary transition-colors line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          {item.variant && (
                            <p className="text-sm text-brown-600 mt-1">
                              Variant: {item.variant.variant_name}
                            </p>
                          )}
                          <p className="text-primary font-medium mt-1">
                            {formatPrice(itemPrice)}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end justify-between">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.product.id, item.variant?.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center border border-brown-200 rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="mt-4 pt-4 border-t border-brown-100 flex justify-between">
                        <span className="text-sm text-brown-600">Subtotal</span>
                        <span className="font-semibold text-brown-900">
                          {formatPrice(itemTotal)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <Button variant="outline" onClick={clearCart} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cart
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="border-brown-200 sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-brown-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brown-600">Shipping</span>
                <span className="font-medium">
                  {shippingFee === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
              {subtotal < 500000 && (
                <p className="text-xs text-brown-500">
                  Add {formatPrice(500000 - subtotal)} more for free shipping!
                </p>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-brown-900">Total</span>
                <span className="font-bold text-lg text-primary">{formatPrice(total)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
