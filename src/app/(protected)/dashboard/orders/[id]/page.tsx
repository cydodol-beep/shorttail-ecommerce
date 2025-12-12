'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Download, Receipt, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { generateInvoiceJPEG, downloadInvoice } from '@/lib/invoice-generator';
import { useStoreSettingsStore } from '@/store/store-settings-store';
import type { Order, OrderItem as OrderItemType } from '@/types/database';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: <Package className="h-4 w-4" /> },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: <Truck className="h-4 w-4" /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <Clock className="h-4 w-4" /> },
};

interface OrderWithItems extends Order {
  order_items: (OrderItemType & { product: { id: string; name: string; images: string[]; sku?: string } })[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [promotion, setPromotion] = useState<any>(null); // Store related promotion data

  const fetchOrder = useCallback(async () => {
    if (!user || !id) return;
    const supabase = createClient();

    // Get the order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        cashier_id,
        source,
        status,
        subtotal,
        shipping_fee,
        discount_amount,
        total_amount,
        shipping_courier_name,
        shipping_courier,
        shipping_address_snapshot,
        invoice_url,
        packing_list_url,
        is_packing_list_downloaded,
        created_at,
        updated_at,
        payment_method,
        recipient_name,
        recipient_phone,
        recipient_address,
        recipient_province,
        recipient_province_id,
        shipping_weight_grams,
        customer_notes
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      setLoading(false);
      return;
    }

    if (!orderData) {
      setLoading(false);
      return;
    }

    // Get the order items separately
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, variant_id, quantity, price_at_purchase')
      .eq('order_id', id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      setLoading(false);
      return;
    }

    // Get product and variant details for each item
    let itemsWithDetails = [];
    if (itemsData && itemsData.length > 0) {
      for (const item of itemsData) {
        // Get product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('name, sku')
          .eq('id', item.product_id)
          .single();

        let productDetails = {
          id: item.product_id,
          name: 'Unknown Product',
          images: [],
          sku: undefined
        };

        if (!productError && productData) {
          productDetails = {
            id: item.product_id,
            name: productData.name,
            images: [],
            sku: productData.sku
          };
        }

        // Get variant details if exists
        let variantDetails = {
          name: null,
          sku: null
        };

        if (item.variant_id) {
          const { data: variantData, error: variantError } = await supabase
            .from('product_variants')
            .select('variant_name, sku')
            .eq('id', item.variant_id)
            .single();

          if (!variantError && variantData) {
            variantDetails = {
              name: variantData.variant_name,
              sku: variantData.sku
            };
          }
        }

        itemsWithDetails.push({
          ...item,
          product: {
            id: productDetails.id,
            name: productDetails.name,
            images: productDetails.images,
            sku: productDetails.sku
          },
          variant_name: variantDetails.name || undefined,
          variant_sku: variantDetails.sku || undefined
        });
      }
    }

    // Combine the order data with the items
    const orderWithItems: OrderWithItems = {
      ...orderData,
      order_items: itemsWithDetails as (OrderItemType & { product: { id: string; name: string; images: string[]; sku?: string } })[]
    };

    setOrder(orderWithItems);

    // Try to find the promotion used for this order
    const { data: promotionUsageData, error: promoUsageError } = await supabase
      .from('promotion_usage')
      .select('promotion_id')
      .eq('order_id', orderData.id)
      .single();

    if (promotionUsageData && !promoUsageError) {
      const { data: promoData, error: promoError } = await supabase
        .from('promotions')
        .select(`
          id,
          code,
          description,
          discount_type,
          discount_value,
          min_purchase_amount,
          start_date,
          end_date,
          is_active,
          applies_to,
          product_ids,
          category_ids,
          free_shipping,
          buy_quantity,
          get_quantity,
          max_uses_per_user,
          total_uses
        `)
        .eq('id', promotionUsageData.promotion_id)
        .single();

      if (promoData && !promoError) {
        setPromotion(promoData);
      }
    }

    setLoading(false);
  }, [user, id]);

  const handleDownloadInvoice = async () => {
    if (!order || !user) return;

    setGeneratingInvoice(true);
    try {
      // Get user profile to get the user name
      let userName = '';
      if (order.user_id) {
        const supabase = createClient();
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_name')
          .eq('id', order.user_id)
          .single();

        if (!profileError && profileData) {
          userName = profileData.user_name || '';
        }
      }

      // Get store settings for invoice generation
      const { allSettings } = useStoreSettingsStore.getState();
      const storeSettings = {
        store_name: allSettings?.store?.storeName || 'ShortTail.id',
        store_logo: allSettings?.store?.storeLogo || '',
        store_address: allSettings?.store?.storeAddress || '',
        store_phone: allSettings?.store?.storePhone || '',
        store_email: allSettings?.store?.storeEmail || '',
      };

      // Format the order data to match the expected structure for the invoice generator
      const orderForInvoice = {
        id: order.id,
        user_id: order.user_id || undefined, // Convert null to undefined
        cashier_id: order.cashier_id || undefined,
        user_name: userName,
        source: order.source,
        status: order.status,
        subtotal: order.subtotal,
        shipping_fee: order.shipping_fee,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        recipient_name: order.recipient_name || (order.shipping_address_snapshot as any)?.recipient_name || undefined,
        recipient_phone: order.recipient_phone || (order.shipping_address_snapshot as any)?.phone || undefined,
        recipient_address: order.recipient_address || (order.shipping_address_snapshot as any)?.address_line1 || undefined,
        recipient_province: order.recipient_province || (order.shipping_address_snapshot as any)?.province || undefined,
        shipping_courier: order.shipping_courier || order.shipping_courier_name || undefined,
        shipping_courier_name: order.shipping_courier_name || undefined,
        shipping_address_snapshot: order.shipping_address_snapshot,
        customer_notes: order.customer_notes || undefined,
        items_count: order.order_items?.length || 0,
        items: order.order_items?.map(item => ({
          product_id: item.product_id,
          product_name: item.product?.name || 'Product',
          product_sku: item.product?.sku || undefined,
          variant_id: item.variant_id || undefined,
          variant_name: (item as any).variant_name || undefined,
          variant_sku: (item as any).variant_sku || undefined,
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase,
        })) || [],
        created_at: order.created_at,
        updated_at: order.updated_at,
      };

      // Generate the invoice
      const invoiceBlob = await generateInvoiceJPEG(orderForInvoice, storeSettings);

      // Download the invoice
      downloadInvoice(invoiceBlob, order.id);
    } catch (error) {
      console.error('Error generating invoice:', error);
      // Optionally, show a toast error here
    } finally {
      setGeneratingInvoice(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrder();
    }
  }, [user, fetchOrder]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-brown-900 mb-4">Order not found</h1>
          <Button asChild>
            <Link href="/dashboard/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const items = order.order_items || [];
  const shippingAddress = order.shipping_address_snapshot as Record<string, string> | null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brown-900">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-brown-600">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadInvoice}
              disabled={generatingInvoice}
            >
              {generatingInvoice ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Download Invoice
                </>
              )}
            </Button>
            <Badge className={`${status.color} text-sm px-3 py-1 h-fit`}>
              <span className="flex items-center gap-1">
                {status.icon}
                {status.label}
              </span>
            </Badge>
          </div>
        </div>

        {/* Information about editing orders */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-brown-900">Need to Edit Your Order?</h3>
                <p className="text-sm text-brown-600 mt-1">
                  Orders cannot be edited directly. If you need to make changes to your order,
                  please contact our admin team. They will assist you with any modifications
                  from the admin panel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promotion, Payment, and Notes Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Promotion Information */}
          {promotion && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-green-600" />
                  Promotion Applied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-brown-600">Code:</span>
                    <span className="font-semibold text-brown-900">{promotion.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brown-600">Type:</span>
                    <span className="font-semibold text-brown-900 capitalize">{promotion.discount_type.replace('_', ' ')}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-brown-600">Discount:</span>
                      <span className="font-semibold text-green-600">-{formatPrice(order.discount_amount)}</span>
                    </div>
                  )}
                  {promotion.description && (
                    <div className="flex justify-between">
                      <span className="text-brown-600">Description:</span>
                      <span className="font-semibold text-brown-900">{promotion.description}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-brown-600">Payment Method:</span>
                  <span className="font-semibold text-brown-900 capitalize">{order.payment_method || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brown-600">Order Source:</span>
                  <span className="font-semibold text-brown-900 capitalize">{order.source.replace('_', ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Notes */}
          {order.customer_notes && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Customer Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brown-700">{order.customer_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const productImage = item.product?.images?.[0];
                    const productName = item.product?.name || 'Product';
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="relative w-20 h-20 bg-brown-100 rounded-lg overflow-hidden flex-shrink-0">
                          {productImage ? (
                            <Image
                              src={productImage}
                              alt={productName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-brown-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-brown-900">{productName}</h4>
                          <p className="text-sm text-brown-600">Qty: {item.quantity}</p>
                          <p className="font-semibold text-primary">{formatPrice(item.price_at_purchase * item.quantity)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-brown-900">{shippingAddress.name}</p>
                  <p className="text-brown-600">{shippingAddress.phone}</p>
                  <p className="text-brown-600">{shippingAddress.address}</p>
                  <p className="text-brown-600">
                    {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-brown-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-brown-600">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shipping_fee)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg text-brown-900">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brown-900">{order.shipping_courier_name || 'Standard Shipping'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
