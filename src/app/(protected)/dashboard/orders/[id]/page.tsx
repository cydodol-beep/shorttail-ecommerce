'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Download, Receipt } from 'lucide-react';

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
  order_items: (OrderItemType & { product: { name: string; images: string[]; sku?: string } })[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!user || !id) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (name, images, sku)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setOrder(data as OrderWithItems);
    }
    setLoading(false);
  }, [user, id]);

  const handleDownloadInvoice = async () => {
    if (!order || !user) return;

    setGeneratingInvoice(true);
    try {
      // Get store settings for invoice generation
      const { allSettings } = useStoreSettingsStore.getState();
      const storeSettings = allSettings?.store || {
        storeName: 'ShortTail.id',
        storeDescription: 'Premium Pet Shop - Your one-stop shop for pet supplies',
        storeLogo: '',
        storeEmail: 'support@shorttail.id',
        storePhone: '+6281234567890',
        storeAddress: 'Jl. Pet Lovers No. 123',
        storeCity: 'Jakarta',
        storeProvince: 'DKI Jakarta',
        storePostalCode: '12345',
        storeCurrency: 'IDR',
        storeTimezone: 'Asia/Jakarta',
      };

      // Format the order data to match the expected structure for the invoice generator
      const orderForInvoice = {
        id: order.id,
        user_id: order.user_id || undefined, // Convert null to undefined
        user_name: '', // This is not part of the database order object
        user_email: '', // This is not part of the database order object
        cashier_id: order.cashier_id || undefined, // Convert null to undefined
        cashier_name: '', // This is not available here
        source: order.source,
        status: order.status,
        subtotal: order.subtotal,
        shipping_fee: order.shipping_fee,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        recipient_name: (order.shipping_address_snapshot as any)?.recipient_name || '',
        recipient_phone: (order.shipping_address_snapshot as any)?.phone || '',
        recipient_address: (order.shipping_address_snapshot as any)?.address_line1 || '',
        recipient_province: (order.shipping_address_snapshot as any)?.province || '',
        shipping_courier: order.shipping_courier_name || '',
        shipping_courier_name: order.shipping_courier_name || '',
        shipping_address_snapshot: order.shipping_address_snapshot,
        customer_notes: (order as any).customer_notes || '', // customer_notes might not be in the main Order type but could be returned by select('*')
        invoice_url: order.invoice_url || undefined, // Convert null to undefined
        packing_list_url: order.packing_list_url || undefined, // Convert null to undefined
        items_count: order.order_items?.length || 0,
        items: order.order_items?.map(item => ({
          product_id: item.product_id,
          product_name: item.product?.name || 'Product',
          product_sku: item.product?.sku || '',
          variant_id: item.variant_id || undefined,
          variant_name: (item as any).variant_name || undefined, // variant_name might be an additional field
          variant_sku: (item as any).variant_sku || undefined, // variant_sku might be an additional field
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
