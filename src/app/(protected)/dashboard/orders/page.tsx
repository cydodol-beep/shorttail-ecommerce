'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, ChevronRight, Receipt, FileText, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { generateInvoiceJPEG } from '@/lib/invoice-generator';
import { useStoreSettingsStore } from '@/store/store-settings-store';
import type { Order } from '@/types/database';

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
  });
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: <Package className="h-4 w-4" /> },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: <Truck className="h-4 w-4" /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <Clock className="h-4 w-4" /> },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }, [user]);

  const fetchOrderWithItems = useCallback(async (orderId: string) => {
    if (!user || !orderId) return null;
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
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return data;
  }, [user]);

  const handleViewInvoice = async (order: Order) => {
    setSelectedOrder(order);
    setGeneratingInvoice(true);

    try {
      // Get the order with items
      const orderWithItems = await fetchOrderWithItems(order.id);
      if (!orderWithItems) {
        throw new Error('Could not fetch order details');
      }

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
        id: orderWithItems.id,
        user_id: orderWithItems.user_id || undefined, // Convert null to undefined
        user_name: '', // This is not part of the database order object
        user_email: '', // This is not part of the database order object
        cashier_id: orderWithItems.cashier_id || undefined, // Convert null to undefined
        cashier_name: '', // This is not available here
        source: orderWithItems.source,
        status: orderWithItems.status,
        subtotal: orderWithItems.subtotal,
        shipping_fee: orderWithItems.shipping_fee,
        discount_amount: orderWithItems.discount_amount,
        total_amount: orderWithItems.total_amount,
        recipient_name: orderWithItems.recipient_name || (orderWithItems.shipping_address_snapshot as any)?.recipient_name || '',
        recipient_phone: orderWithItems.recipient_phone || (orderWithItems.shipping_address_snapshot as any)?.phone || '',
        recipient_address: orderWithItems.recipient_address || (orderWithItems.shipping_address_snapshot as any)?.address_line1 || '',
        recipient_province: orderWithItems.recipient_province || (orderWithItems.shipping_address_snapshot as any)?.province || '',
        shipping_courier: orderWithItems.shipping_courier || orderWithItems.shipping_courier_name || '',
        shipping_courier_name: orderWithItems.shipping_courier_name || '',
        shipping_address_snapshot: orderWithItems.shipping_address_snapshot,
        customer_notes: orderWithItems.customer_notes || (orderWithItems as any).customer_notes || '',
        invoice_url: orderWithItems.invoice_url || undefined, // Convert null to undefined
        packing_list_url: orderWithItems.packing_list_url || undefined, // Convert null to undefined
        payment_method: orderWithItems.payment_method || null,
        items_count: orderWithItems.order_items?.length || 0,
        items: orderWithItems.order_items?.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product?.name || 'Product',
          product_sku: item.product?.sku || '',
          variant_id: item.variant_id || undefined,
          variant_name: (item as any).variant_name || undefined, // variant_name might be an additional field
          variant_sku: (item as any).variant_sku || undefined, // variant_sku might be an additional field
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase,
        })) || [],
        created_at: orderWithItems.created_at,
        updated_at: orderWithItems.updated_at,
      };

      // Generate the invoice
      const invoiceBlob = await generateInvoiceJPEG(orderForInvoice, storeSettings);

      // Create a temporary URL for the preview
      const url = URL.createObjectURL(invoiceBlob);
      setInvoiceUrl(url);
      setInvoicePreviewOpen(true);
    } catch (error) {
      console.error('Error generating invoice preview:', error);
      // Handle error - could show a toast notification
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const closeInvoicePreview = () => {
    setInvoicePreviewOpen(false);
    if (invoiceUrl) {
      URL.revokeObjectURL(invoiceUrl);
      setInvoiceUrl(null);
    }
    setSelectedOrder(null);
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-brown-900">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto text-brown-300 mb-4" />
              <h3 className="text-lg font-semibold text-brown-900 mb-2">No orders yet</h3>
              <p className="text-brown-600 mb-4">Start shopping to see your orders here!</p>
              <Link href="/products">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <Card key={order.id} className="border-brown-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <Badge className={status.color}>
                        <span className="flex items-center gap-1">
                          {status.icon}
                          {status.label}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-sm text-brown-500">{formatDate(order.created_at)}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-brown-900">{formatPrice(order.total_amount)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(order)}
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
                              View Invoice
                            </>
                          )}
                        </Button>
                        <Link href={`/dashboard/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Invoice Preview Modal */}
        {invoicePreviewOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Invoice Preview - Order #{selectedOrder.id.slice(0, 8)}</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closeInvoicePreview}
                    disabled={generatingInvoice}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {invoiceUrl ? (
                  <div className="flex justify-center">
                    <iframe
                      src={invoiceUrl}
                      className="w-full h-[70vh] border rounded-lg"
                      title={`Invoice Preview for Order ${selectedOrder.id}`}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                )}

                <div className="flex justify-between gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={closeInvoicePreview}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedOrder) {
                        window.open(`/dashboard/orders/${selectedOrder.id}`, '_blank');
                      }
                    }}
                    className="flex-1"
                  >
                    Go to Order Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
