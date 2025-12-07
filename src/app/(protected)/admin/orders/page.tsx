'use client';

import { useState } from 'react';
import { 
  ShoppingCart, 
  Search,
  Filter,
  Eye,
  Pencil,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  packed: { label: 'Packed', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  returned: { label: 'Returned', color: 'bg-orange-100 text-orange-800', icon: XCircle },
};

export default function AdminOrdersPage() {
  useAuth();
  const { orders, loading, refresh } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    recipient_province: '',
    shipping_courier: '',
    customer_notes: '',
    shipping_fee: 0,
    discount_amount: 0,
    status: 'pending',
  });

  // Filter orders
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  // Handle edit order
  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      recipient_name: order.recipient_name || '',
      recipient_phone: order.recipient_phone || '',
      recipient_address: order.recipient_address || '',
      recipient_province: order.recipient_province || '',
      shipping_courier: order.shipping_courier || order.shipping_courier_name || '',
      customer_notes: order.customer_notes || '',
      shipping_fee: order.shipping_fee || 0,
      discount_amount: order.discount_amount || 0,
      status: order.status,
    });
    setEditOpen(true);
  };

  // Save edited order
  const handleSaveEdit = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase
        .from('orders')
        .update({
          recipient_name: editForm.recipient_name,
          recipient_phone: editForm.recipient_phone,
          recipient_address: editForm.recipient_address,
          recipient_province: editForm.recipient_province,
          shipping_courier: editForm.shipping_courier,
          customer_notes: editForm.customer_notes,
          shipping_fee: editForm.shipping_fee,
          discount_amount: editForm.discount_amount,
          status: editForm.status,
          total_amount: selectedOrder.subtotal + editForm.shipping_fee - editForm.discount_amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) {
        console.error('Error updating order:', error);
        toast.error('Failed to update order');
      } else {
        toast.success('Order updated successfully');
        setEditOpen(false);
        refresh();
      }
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update order');
    } finally {
      setUpdating(false);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Order Management</h1>
          <p className="text-brown-600 mt-1">Manage customer orders and track fulfillment</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = orders.filter((o: Order) => o.status === status).length;
          const Icon = config?.icon || Clock;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config?.color || 'bg-gray-100 text-gray-800'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brown-900">{count}</p>
                    <p className="text-xs text-brown-600">{config?.label || status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>View and manage all customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-400" />
              <Input
                placeholder="Search by order ID or customer email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]" suppressHydrationWarning>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-brown-300 mx-auto mb-3" />
              <p className="text-brown-600">No orders found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: Order) => {
                    const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || { 
                      label: order.status, 
                      color: 'bg-gray-100 text-gray-800', 
                      icon: Clock 
                    };
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.id.split('-')[0]}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{order.recipient_name || order.user_name || 'Guest'}</p>
                            <p className="text-xs text-brown-500">{order.recipient_phone || order.user_email || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{order.items_count || 0} items</span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {order.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setDetailsOpen(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                              title="Edit Order"
                            >
                              <Pencil className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="bg-brown-50 p-4 rounded-lg space-y-1">
                  <p className="text-sm"><span className="font-medium">Name:</span> {selectedOrder.recipient_name || selectedOrder.user_name || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">Phone:</span> {selectedOrder.recipient_phone || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedOrder.user_email || 'N/A'}</p>
                  {selectedOrder.recipient_address && (
                    <p className="text-sm">
                      <span className="font-medium">Address:</span>{' '}
                      {selectedOrder.recipient_address}
                      {selectedOrder.recipient_province && `, ${selectedOrder.recipient_province}`}
                    </p>
                  )}
                  {selectedOrder.shipping_courier_name && (
                    <p className="text-sm">
                      <span className="font-medium">Courier:</span> {selectedOrder.shipping_courier_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-sm text-brown-600">{item.variant_name}</p>
                        )}
                        <p className="text-sm text-brown-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.price_at_purchase * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="bg-brown-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping Fee</span>
                    <span>{formatCurrency(selectedOrder.shipping_fee || 0)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div>
                <h3 className="font-semibold mb-2">Update Status</h3>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Metadata */}
              <div className="text-xs text-brown-500 space-y-1">
                <p>Created: {formatDate(selectedOrder.created_at)}</p>
                <p>Updated: {formatDate(selectedOrder.updated_at)}</p>
                {selectedOrder.cashier_name && (
                  <p>Processed by: {selectedOrder.cashier_name}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Order ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Recipient Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Recipient Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Recipient Name</label>
                    <Input
                      value={editForm.recipient_name}
                      onChange={(e) => setEditForm({ ...editForm, recipient_name: e.target.value })}
                      placeholder="Enter recipient name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      value={editForm.recipient_phone}
                      onChange={(e) => setEditForm({ ...editForm, recipient_phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Address</label>
                  <Textarea
                    value={editForm.recipient_address}
                    onChange={(e) => setEditForm({ ...editForm, recipient_address: e.target.value })}
                    placeholder="Enter full delivery address"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Province</label>
                  <Input
                    value={editForm.recipient_province}
                    onChange={(e) => setEditForm({ ...editForm, recipient_province: e.target.value })}
                    placeholder="Enter province"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Shipping Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Shipping Information</h3>
                <div>
                  <label className="text-sm font-medium">Shipping Courier</label>
                  <Input
                    value={editForm.shipping_courier}
                    onChange={(e) => setEditForm({ ...editForm, shipping_courier: e.target.value })}
                    placeholder="Enter courier name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Shipping Fee (Rp)</label>
                  <Input
                    type="number"
                    value={editForm.shipping_fee}
                    onChange={(e) => setEditForm({ ...editForm, shipping_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Order Status */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Order Status</h3>
                <Select 
                  value={editForm.status} 
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Special Requests */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Special Requests / Notes</h3>
                <Textarea
                  value={editForm.customer_notes}
                  onChange={(e) => setEditForm({ ...editForm, customer_notes: e.target.value })}
                  placeholder="Enter any special requests or notes"
                  className="min-h-[80px]"
                />
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Pricing Adjustments</h3>
                <div>
                  <label className="text-sm font-medium">Discount Amount (Rp)</label>
                  <Input
                    type="number"
                    value={editForm.discount_amount}
                    onChange={(e) => setEditForm({ ...editForm, discount_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div className="bg-brown-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping Fee</span>
                    <span>{formatCurrency(editForm.shipping_fee)}</span>
                  </div>
                  {editForm.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(editForm.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>New Total</span>
                    <span>{formatCurrency(selectedOrder.subtotal + editForm.shipping_fee - editForm.discount_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
