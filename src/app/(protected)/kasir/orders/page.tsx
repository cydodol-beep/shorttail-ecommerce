'use client';

import { useState } from 'react';
import { 
  ShoppingCart, 
  Search,
  Eye,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  MapPin,
  FileText,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useOrders, updateOrderStatus, type Order } from '@/hooks/use-orders';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { generateInvoiceJPEG, downloadInvoice } from '@/lib/invoice-generator';
import { generatePackingListPDF, downloadPackingList } from '@/lib/packing-list-generator';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: DollarSign },
  packed: { label: 'Packed', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  returned: { label: 'Returned', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
};

type OrderStatus = keyof typeof STATUS_CONFIG;

export default function KasirOrdersPage() {
  const { user } = useAuth();
  const { orders, loading, refresh } = useOrders();
  const { settings } = useStoreSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  // Filter orders - show all POS orders and all marketplace orders
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;

    // Kasir can see: all POS orders AND all marketplace orders
    const canView = order.source === 'pos' || order.source === 'marketplace';

    return matchesSearch && matchesStatus && matchesSource && canView;
  });

  // Calculate stats
  const todayOrders = orders.filter(o => {
    const today = new Date();
    const orderDate = new Date(o.created_at);
    return orderDate.toDateString() === today.toDateString() &&
           (o.source === 'pos' || o.source === 'marketplace');
  });

  const todayRevenue = todayOrders
    .filter(o => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const myPosOrders = orders.filter(o => o.source === 'pos' && o.cashier_id === user?.id);

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        toast.success('Order status updated');
        refresh();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error('Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // View order details
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  // Generate Invoice (JPEG)
  const handleGenerateInvoice = async (order: Order) => {
    setGenerating(order.id);
    try {
      const storeInfo = {
        store_name: settings?.storeName || 'shorttail.id',
        store_logo: settings?.storeLogo || '',
        store_address: settings?.storeAddress || '',
        store_phone: settings?.storePhone || '',
        store_email: settings?.storeEmail || '',
      };

      const blob = await generateInvoiceJPEG(order, storeInfo);
      downloadInvoice(blob, order.id);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Error generating invoice:', err);
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(null);
    }
  };

  // Generate Packing List (PDF)
  const handleGeneratePackingList = async (order: Order) => {
    setGenerating(order.id);
    try {
      const storeInfo = {
        store_name: settings?.storeName || 'shorttail.id',
        store_logo: settings?.storeLogo || '',
        store_address: settings?.storeAddress || '',
        store_phone: settings?.storePhone || '',
        store_email: settings?.storeEmail || '',
        store_province: settings?.storeProvince || '',
        store_postal_code: settings?.storePostalCode || '',
      };

      const pdf = generatePackingListPDF(order, storeInfo);
      downloadPackingList(pdf, order.id);
      
      // Automatically update order status to 'packed' if not already packed or beyond
      if (order.status === 'pending' || order.status === 'paid') {
        const success = await updateOrderStatus(order.id, 'packed');
        if (success) {
          toast.success('Packing list downloaded and order marked as packed');
          refresh(); // Refresh the orders list to show updated status
        } else {
          toast.success('Packing list downloaded successfully');
        }
      } else {
        toast.success('Packing list downloaded successfully');
      }
    } catch (err) {
      console.error('Error generating packing list:', err);
      toast.error('Failed to generate packing list');
    } finally {
      setGenerating(null);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brown-900">Orders</h1>
        <p className="text-brown-600 mt-1">View and manage orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-brown-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{todayOrders.length}</p>
                <p className="text-sm text-brown-600">Today's Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brown-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{formatCurrency(todayRevenue)}</p>
                <p className="text-sm text-brown-600">Today's Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brown-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{myPosOrders.length}</p>
                <p className="text-sm text-brown-600">My POS Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brown-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">
                  {orders.filter(o => o.status === 'pending' && (o.source === 'pos' || o.source === 'marketplace')).length}
                </p>
                <p className="text-sm text-brown-600">Pending Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-brown-200">
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Search and filter orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-400" />
              <Input
                placeholder="Search by Order ID, customer email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-brown-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ShoppingCart className="h-12 w-12 text-brown-300 mb-4" />
              <p className="text-brown-600">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="min-w-[250px]">Order Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: Order) => {
                    const StatusIcon = STATUS_CONFIG[order.status as OrderStatus]?.icon || Clock;
                    const statusConfig = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.pending;

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {order.source === 'pos'
                                ? (order.recipient_name || order.user_name || 'Walk-in Customer')
                                : (order.recipient_name || order.user_name || 'Online Customer')}
                            </span>
                            {order.user_email && (
                              <span className="text-xs text-brown-500">
                                {order.user_email}
                              </span>
                            )}
                            {order.recipient_phone && (
                              <span className="text-xs text-brown-500">
                                {order.recipient_phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.source === 'pos' ? 'default' : 'outline'} className="text-xs">
                            {order.source.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-[300px]">
                            {order.items && order.items.length > 0 ? (
                              order.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium text-brown-900">
                                    {item.quantity}x {item.product_name}
                                  </span>
                                  {item.variant_name && (
                                    <span className="text-brown-600 ml-1">
                                      ({item.variant_name})
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-brown-500">No items</span>
                            )}
                            {order.items && order.items.length > 3 && (
                              <div className="text-xs text-brown-500">
                                +{order.items.length - 3} more items
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.color} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateInvoice(order)}
                              disabled={generating === order.id}
                              title="Download Invoice (JPEG)"
                            >
                              {generating === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGeneratePackingList(order)}
                              disabled={generating === order.id}
                              title="Download Packing List (PDF)"
                            >
                              {generating === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedOrder && handleGenerateInvoice(selectedOrder)}
                  disabled={generating === selectedOrder?.id}
                >
                  {generating === selectedOrder?.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedOrder && handleGeneratePackingList(selectedOrder)}
                  disabled={generating === selectedOrder?.id}
                >
                  {generating === selectedOrder?.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Packing List
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id.slice(0, 8)} - {formatDate(selectedOrder?.created_at || '')}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-brown-600">Order ID</label>
                    <p className="font-mono text-sm">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brown-600">Source</label>
                    <p>
                      <Badge variant={selectedOrder.source === 'pos' ? 'default' : 'outline'}>
                        {selectedOrder.source.toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brown-600">Customer</label>
                    <p className="text-sm">
                      {selectedOrder.recipient_name || selectedOrder.user_name || 'Walk-in Customer'}
                      {selectedOrder.user_email && (
                        <span className="block text-xs text-brown-500">{selectedOrder.user_email}</span>
                      )}
                      {selectedOrder.recipient_phone && (
                        <span className="block text-xs text-brown-500">{selectedOrder.recipient_phone}</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brown-600">Cashier</label>
                    <p className="text-sm">
                      {selectedOrder.source === 'pos'
                        ? (selectedOrder.cashier_name || 'N/A')
                        : 'Online Order'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Status Update */}
                <div>
                  <label className="text-sm font-medium text-brown-600 mb-2 block">
                    Update Status
                  </label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-brown-900 mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-brown-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-brown-900">
                            {item.product_name}
                            {item.variant_name && (
                              <span className="text-brown-600"> - {item.variant_name}</span>
                            )}
                          </p>
                          <p className="text-xs text-brown-500">
                            {formatCurrency(item.price_at_purchase)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">
                          {formatCurrency(item.price_at_purchase * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Shipping Info */}
                {selectedOrder.source === 'marketplace' && selectedOrder.shipping_address_snapshot && (
                  <>
                    <div>
                      <h3 className="font-semibold text-brown-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </h3>
                      <div className="p-3 bg-brown-50 rounded-lg text-sm space-y-1">
                        <p className="font-medium">
                          {selectedOrder.shipping_address_snapshot.recipient_name || '-'}
                        </p>
                        <p>{selectedOrder.shipping_address_snapshot.address_line1 || '-'}</p>
                        <p>
                          {selectedOrder.shipping_address_snapshot.city || '-'},{' '}
                          {selectedOrder.shipping_address_snapshot.region || '-'}{' '}
                          {selectedOrder.shipping_address_snapshot.postal_code || '-'}
                        </p>
                      </div>
                      {selectedOrder.shipping_courier_name && (
                        <p className="mt-2 text-sm text-brown-600">
                          <strong>Courier:</strong> {selectedOrder.shipping_courier_name}
                        </p>
                      )}
                    </div>
                    <Separator />
                  </>
                )}

                {/* Order Summary */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-brown-900 mb-3">Order Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.shipping_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-brown-600">Shipping Fee</span>
                      <span className="font-medium">
                        {formatCurrency(selectedOrder.shipping_fee)}
                      </span>
                    </div>
                  )}
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">
                        -{formatCurrency(selectedOrder.discount_amount)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
