'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCartStore } from '@/store/cart-store';

export default function WishlistPage() {
  const { items, loading, removeFromWishlist } = useWishlist();
  const addToCart = useCartStore((state) => state.addItem);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!removeId) return;

    setRemoving(true);
    const success = await removeFromWishlist(removeId);
    if (success) {
      toast.success('Removed from wishlist');
    } else {
      toast.error('Failed to remove from wishlist');
    }
    setRemoving(false);
    setRemoveId(null);
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success('Added to cart');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-900">My Wishlist</h1>
        <p className="text-brown-600">Products you have saved for later</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-brown-200 animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-brown-200 rounded-lg mb-4" />
                <div className="h-5 bg-brown-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-brown-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-brown-200">
          <CardContent className="py-16 text-center">
            <Heart className="h-16 w-16 text-brown-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brown-900 mb-2">Your wishlist is empty</h2>
            <p className="text-brown-600 mb-6">
              Save products you like by clicking the heart icon
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="border-brown-200 group relative overflow-hidden">
              <CardContent className="p-4">
                <Link href={`/products/${item.product.id}`}>
                  <div className="relative h-48 bg-brown-50 rounded-lg mb-4 overflow-hidden">
                    {item.product.main_image_url ? (
                      <Image
                        src={item.product.main_image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Heart className="h-12 w-12 text-brown-300" />
                      </div>
                    )}
                  </div>
                </Link>

                <Link href={`/products/${item.product.id}`}>
                  <h3 className="font-semibold text-brown-900 mb-1 line-clamp-2 hover:text-primary transition-colors">
                    {item.product.name}
                  </h3>
                </Link>

                {item.product.category && (
                  <p className="text-xs text-brown-500 mb-2">{item.product.category}</p>
                )}

                <p className="text-lg font-bold text-primary mb-4">
                  {formatPrice(item.product.base_price)}
                </p>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => handleAddToCart(item.product)}
                    disabled={item.product.stock_quantity === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {item.product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setRemoveId(item.product_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be removed from your wishlist. You can always add it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
