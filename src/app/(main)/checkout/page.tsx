'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronLeft,
  Truck,
  CreditCard,
  MapPin,
  Package,
  Loader2,
  PawPrint,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { RelatedProducts } from '@/components/products/related-products';
import { generateInvoiceJPEG, downloadInvoice } from '@/lib/invoice-generator';
import { useStoreSettingsStore } from '@/store/store-settings-store';

const checkoutSchema = z.object({
  recipient_name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address_line1: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postal_code: z.string().min(5, 'Postal code is required'),
  courier: z.string().min(1, 'Please select a courier'),
  customer_notes: z.string().optional(),
  promotion_code: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

const couriers = [
  { id: 'jne-reg', name: 'JNE Regular', price: 25000, eta: '3-5 days' },
  { id: 'jne-yes', name: 'JNE YES', price: 35000, eta: '1-2 days' },
  { id: 'jnt-express', name: 'J&T Express', price: 22000, eta: '2-4 days' },
  { id: 'sicepat', name: 'SiCepat REG', price: 20000, eta: '2-3 days' },
];

// Function to validate promotion code
async function validatePromotionCode(code: string, userId: string, productIds: string[], subtotal: number) {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('validate_promotion_code', {
      p_code: code,
      p_user_id: userId,
      p_product_ids: productIds,
      p_subtotal: subtotal
    });

  if (error) {
    console.error('Error validating promotion:', error);
    return null;
  }

  return data?.[0] || null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<typeof couriers[0] | null>(null);
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState('');

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipient_name: profile?.recipient_name || profile?.user_name || '',
      phone: profile?.user_phoneno || '',
      address_line1: profile?.recipient_address_line1 || profile?.address_line1 || '',
      city: profile?.recipient_city || profile?.city || '',
      province: profile?.recipient_region || profile?.region_state_province || '',
      postal_code: profile?.recipient_postal_code || profile?.postal_code || '',
      courier: '',
      customer_notes: '',
      promotion_code: '',
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    }
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [user, items.length, router]);

  const subtotal = getTotal();
  const shippingFee = selectedCourier?.price || 0;

  // Calculate discount amount if promotion is applied
  const discountAmount = appliedPromotion?.is_valid ? (appliedPromotion.discount_amount || 0) : 0;
  // Apply free shipping if promotion includes it
  const finalShippingFee = (appliedPromotion?.is_valid && appliedPromotion.free_shipping) ? 0 : shippingFee;
  const total = subtotal - discountAmount + finalShippingFee;

  const handleApplyPromotion = async () => {
    if (!promotionCode.trim() || !user || subtotal <= 0) return;

    setPromotionLoading(true);
    setPromotionError('');

    try {
      // Extract product IDs from cart items
      const productIds = items.map(item => item.product.id);

      const result = await validatePromotionCode(promotionCode.trim(), user.id, productIds, subtotal);

      if (result && result.is_valid) {
        setAppliedPromotion(result);
        toast.success(result.message || 'Promotion applied successfully!');
        // Update form state with the promotion code
        form.setValue('promotion_code', promotionCode.trim());
      } else {
        setPromotionError(result?.message || 'Invalid promotion code');
        setAppliedPromotion(null);
        form.setValue('promotion_code', '');
        toast.error(result?.message || 'Invalid promotion code');
      }
    } catch (error) {
      console.error('Error applying promotion:', error);
      setPromotionError('Failed to validate promotion code');
      toast.error('Failed to validate promotion code');
    } finally {
      setPromotionLoading(false);
    }
  };

  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    setPromotionCode('');
    form.setValue('promotion_code', '');
    setPromotionError('');
    toast.success('Promotion removed');
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          source: 'marketplace',
          status: 'pending',
          subtotal,
          shipping_fee: finalShippingFee, // Use the potentially reduced shipping fee
          discount_amount: discountAmount, // Use the calculated discount amount
          total_amount: total,
          shipping_courier_name: selectedCourier?.name,
          customer_notes: data.customer_notes || null,
          shipping_address_snapshot: {
            recipient_name: data.recipient_name,
            phone: data.phone,
            address_line1: data.address_line1,
            city: data.city,
            province: data.province,
            postal_code: data.postal_code,
          },
        })
        .select()
        .single();

      if (orderError) {
        toast.error('Failed to create order');
        setLoading(false);
        return;
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variant?.id || null,
        quantity: item.quantity,
        // For variant products, use variant price_adjustment; for simple products, use base_price
        price_at_purchase: item.variant ? (item.variant.price_adjustment || 0) : item.product.base_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        toast.error('Failed to create order items');
        setLoading(false);
        return;
      }

      // If promotion was applied, record usage
      if (appliedPromotion?.is_valid && data.promotion_code) {
        // First, get the promotion ID by code
        const { data: promoData } = await supabase
          .from('promotions')
          .select('id')
          .eq('code', data.promotion_code.toUpperCase())
          .single();

        if (promoData?.id) {
          await supabase
            .from('promotion_usage')
            .insert({
              promotion_id: promoData.id,
              user_id: user.id,
              order_id: order.id
            });
        }
      }

      // Update stock
      for (const item of items) {
        if (item.variant) {
          // For variant products, update the specific variant stock
          const newVariantStock = item.variant.stock_quantity - item.quantity;
          await supabase
            .from('product_variants')
            .update({ stock_quantity: newVariantStock })
            .eq('id', item.variant.id);
        } else {
          // For simple products, update product stock
          const newStock = item.product.stock_quantity - item.quantity;
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product.id);
        }
      }

      // Add points to user (1 point per 10,000 IDR spent, after discount)
      const pointsEarned = Math.floor(total / 10000);
      if (pointsEarned > 0 && profile) {
        await supabase
          .from('profiles')
          .update({ points_balance: (profile.points_balance || 0) + pointsEarned })
          .eq('id', user.id);
      }

      // Fetch store settings for invoice generation
      const { getStoreSettings } = useStoreSettingsStore.getState();
      const storeSettings = getStoreSettings();

      // Format order data for invoice (similar to how it's retrieved in the order store)
      const orderForInvoice = {
        id: order.id,
        user_id: order.user_id,
        cashier_id: order.cashier_id,
        source: order.source,
        status: order.status,
        subtotal: order.subtotal,
        shipping_fee: order.shipping_fee,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        shipping_courier: order.shipping_courier_name,
        recipient_name: order.shipping_address_snapshot?.recipient_name || profile?.user_name,
        recipient_phone: order.shipping_address_snapshot?.phone || profile?.user_phoneno,
        recipient_address: order.shipping_address_snapshot?.address_line1,
        recipient_city: order.shipping_address_snapshot?.city,
        recipient_province: order.shipping_address_snapshot?.province,
        customer_notes: order.customer_notes,
        created_at: order.created_at,
        items: items.map(item => ({
          product_name: item.product.name,
          variant_name: item.variant?.variant_name,
          variant_sku: item.variant?.sku,
          product_sku: item.product.sku,
          quantity: item.quantity,
          price_at_purchase: item.variant ? (item.variant.price_adjustment || 0) : item.product.base_price,
        })),
      };

      // Generate invoice
      try {
        const invoiceBlob = await generateInvoiceJPEG(orderForInvoice, storeSettings);
        // Save invoice URL to order
        await supabase
          .from('orders')
          .update({ invoice_url: URL.createObjectURL(invoiceBlob) }) // This would be a temp URL
          .eq('id', order.id);
      } catch (invoiceError) {
        console.error('Error generating invoice:', invoiceError);
        // Continue with order creation even if invoice generation fails
      }

      clearCart();
      toast.success(`Order placed successfully! You earned ${pointsEarned} points. Downloading your invoice...`);

      // Navigate to order details
      router.push(`/dashboard/orders/${order.id}`);
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('An error occurred during checkout');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold text-brown-900 mb-8">Checkout</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recipient_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+62812345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address, building, unit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Jakarta" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province</FormLabel>
                          <FormControl>
                            <Input placeholder="DKI Jakarta" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Promotions */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Have a Promotion Code?
                  </CardTitle>
                  <CardDescription>
                    Enter your discount code to save on your order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="promotion_code"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Enter promotion code"
                              value={promotionCode}
                              onChange={(e) => {
                                setPromotionCode(e.target.value);
                                field.onChange(e.target.value);
                              }}
                              disabled={promotionLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {appliedPromotion ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemovePromotion}
                        disabled={promotionLoading}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleApplyPromotion}
                        disabled={promotionLoading || !promotionCode.trim()}
                      >
                        {promotionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    )}
                  </div>
                  {promotionError && (
                    <p className="text-sm text-destructive mt-2">{promotionError}</p>
                  )}
                  {appliedPromotion && appliedPromotion.is_valid && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800">
                        ✓ Promotion applied successfully!
                      </p>
                      <p className="text-sm text-green-700">
                        {appliedPromotion.free_shipping ? 'Free shipping applied' : ''}
                        {appliedPromotion.discount_amount > 0 ? ` Discount: ${formatPrice(appliedPromotion.discount_amount)}` : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Notes */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Special Requests
                  </CardTitle>
                  <CardDescription>
                    Add any special requests or notes for your order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="customer_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Please deliver after 5 PM, gift wrap requested, etc."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Shipping Method */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="courier"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-3">
                            {couriers.map((courier) => (
                              <label
                                key={courier.id}
                                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                                  field.value === courier.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-brown-200 hover:border-brown-300'
                                }`}
                                onClick={() => {
                                  field.onChange(courier.id);
                                  setSelectedCourier(courier);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`h-4 w-4 rounded-full border-2 ${
                                      field.value === courier.id
                                        ? 'border-primary bg-primary'
                                        : 'border-brown-300'
                                    }`}
                                  >
                                    {field.value === courier.id && (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 bg-white rounded-full" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-brown-900">{courier.name}</p>
                                    <p className="text-sm text-brown-500">{courier.eta}</p>
                                  </div>
                                </div>
                                <p className="font-bold text-primary">
                                  {formatPrice(courier.price)}
                                </p>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Payment will be processed after order confirmation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-brown-50 rounded-lg flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-brown-900">Bank Transfer</p>
                      <p className="text-sm text-brown-600">
                        Payment instructions will be sent to your email
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <Card className="border-brown-200 sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      // For variant products, use variant price_adjustment; for simple products, use base_price
                      const price = item.variant ? (item.variant.price_adjustment || 0) : item.product.base_price;
                      return (
                        <div key={`${item.product.id}-${item.variant?.id}`} className="flex gap-3">
                          <div className="h-12 w-12 bg-brown-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                            {item.product.main_image_url ? (
                              <img
                                src={item.product.main_image_url}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PawPrint className="h-6 w-6 text-brown-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brown-900 line-clamp-1">
                              {item.product.name}
                            </p>
                            {item.variant && (
                              <p className="text-xs text-brown-500">{item.variant.variant_name}</p>
                            )}
                            <p className="text-sm text-brown-600">x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">
                            {formatPrice(price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brown-600">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {appliedPromotion && appliedPromotion.is_valid ? (
                      <>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-brown-600">Discount</span>
                            <span className="text-destructive">-{formatPrice(discountAmount)}</span>
                          </div>
                        )}
                        {appliedPromotion.free_shipping && (
                          <div className="flex justify-between text-sm">
                            <span className="text-brown-600">Shipping</span>
                            <span className="text-green-600">FREE</span>
                          </div>
                        )}
                        {!appliedPromotion.free_shipping && (
                          <div className="flex justify-between text-sm">
                            <span className="text-brown-600">Shipping</span>
                            <span>{finalShippingFee ? formatPrice(finalShippingFee) : '-'}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-brown-600">Shipping</span>
                        <span>{shippingFee ? formatPrice(shippingFee) : '-'}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Place Order
                  </Button>

                  <p className="text-xs text-center text-brown-500">
                    By placing this order, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Last Chance - Add More Items */}
      {items.length > 0 && (
        <div className="mt-12">
          <RelatedProducts 
            productId={items[0].product.id}
            title="Add More to Your Order"
            limit={5}
          />
        </div>
      )}
    </div>
  );
}
