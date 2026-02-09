import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  variant_id?: string;
  variant_name?: string;
  variant_sku?: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: string;
  custom_order_id?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  cashier_id?: string;
  cashier_name?: string;
  source: string;
  status: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  recipient_province?: string;
  shipping_courier?: string;
  shipping_courier_name?: string;
  shipping_address_snapshot?: any;
  payment_method?: string;
  customer_notes?: string;
  payment_details?: any;
  invoice_url?: string;
  packing_list_url?: string;
  items_count?: number;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

interface OrdersStore {
  orders: Order[];
  loading: boolean;
  lastFetched: number | null;
  fetchOrders: (userRole?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  invalidate: () => void;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  orders: [],
  loading: false,
  lastFetched: null,

  fetchOrders: async (userRole?: string) => {
    const state = get();

    // Skip if already loading
    if (state.loading) return;

    // Use cache if valid
    if (state.lastFetched && Date.now() - state.lastFetched < CACHE_DURATION) {
      return;
    }

    set({ loading: true });

    try {
      const supabase = createClient();

      let ordersWithItems;

      // For kasir users, use the API route to fetch all orders they should see
      // This bypasses any potential RLS issues and ensures they see all orders
      if (userRole === 'kasir' || userRole === 'super_user') {
        // Fetch via API route that uses service role to bypass RLS
        const response = await fetch('/api/orders/kasir', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const ordersData = result.orders;

        // Get all order IDs to fetch items in batch
        const orderIds = ordersData?.map((order: any) => order.id) || [];
        
        // Fetch all order items with nested product and variant data in a single query
        let allItemsData: any[] = [];
        if (orderIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              products:product_id (name, sku),
              product_variants:variant_id (variant_name, sku)
            `)
            .in('order_id', orderIds);

          if (itemsError) {
            console.error('Error fetching order items:', itemsError);
          } else {
            allItemsData = itemsData || [];
          }
        }

        // Group items by order_id
        const itemsByOrderId = allItemsData.reduce((acc: Map<string, any[]>, item: any) => {
          if (!acc.has(item.order_id)) {
            acc.set(item.order_id, []);
          }
          acc.get(item.order_id)!.push(item);
          return acc;
        }, new Map());

        // Process the orders for kasir users (they already have profile info from API)
        ordersWithItems = (ordersData || []).map((order: any) => {
          const orderItems = itemsByOrderId.get(order.id) || [];
          
          const itemsWithDetails = orderItems.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.products?.name || 'Unknown Product',
            product_sku: item.products?.sku || undefined,
            variant_id: item.variant_id,
            variant_name: item.product_variants?.variant_name || null,
            variant_sku: item.product_variants?.sku || undefined,
            quantity: item.quantity,
            price_at_purchase: parseFloat(item.price_at_purchase) || 0,
          }));

          return {
            id: order.id,
            custom_order_id: order.custom_order_id,
            user_id: order.user_id,
            user_name: order.user_name,
            user_email: order.user_email,
            cashier_id: order.cashier_id,
            cashier_name: order.cashier_name,
            source: order.source,
            status: order.status,
            subtotal: parseFloat(order.subtotal) || 0,
            shipping_fee: parseFloat(order.shipping_fee) || 0,
            discount_amount: parseFloat(order.discount_amount) || 0,
            total_amount: parseFloat(order.total_amount) || 0,
            recipient_name: order.recipient_name,
            recipient_phone: order.recipient_phone,
            recipient_address: order.recipient_address,
            recipient_province: order.recipient_province,
            shipping_courier: order.shipping_courier,
            shipping_courier_name: order.shipping_courier_name,
            shipping_address_snapshot: order.shipping_address_snapshot,
            payment_method: order.payment_method,
            customer_notes: order.customer_notes || undefined,
            payment_details: order.payment_details || undefined,
            invoice_url: order.invoice_url,
            packing_list_url: order.packing_list_url,
            items_count: itemsWithDetails.length,
            items: itemsWithDetails,
            created_at: order.created_at,
            updated_at: order.updated_at,
          } as Order;
        });
      } else {
        // For other users, use the standard method with RLS
        // Only fetch orders that the current user is authorized to see (their own orders)
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders');
          set({ loading: false });
          return;
        }

        // Fetch user profiles to get user names
        const userIds = [...new Set((data || []).map((o: any) => o.user_id).filter((id: any) => id !== null && id !== undefined))];
        let profilesMap = new Map();

        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, user_name, user_email')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles');
          } else {
            profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
          }
        }

        // Get all order IDs to fetch items in batch
        const orderIds = data?.map((order: any) => order.id) || [];
        
        // Fetch all order items with nested product and variant data in a single query
        let allItemsData: any[] = [];
        if (orderIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              products:product_id (name, sku),
              product_variants:variant_id (variant_name, sku)
            `)
            .in('order_id', orderIds);

          if (itemsError) {
            console.error('Error fetching order items:', itemsError);
          } else {
            allItemsData = itemsData || [];
          }
        }

        // Group items by order_id
        const itemsByOrderId = allItemsData.reduce((acc: Map<string, any[]>, item: any) => {
          if (!acc.has(item.order_id)) {
            acc.set(item.order_id, []);
          }
          acc.get(item.order_id)!.push(item);
          return acc;
        }, new Map());

        // Process the orders for non-kasir users
        ordersWithItems = (data || []).map((order: any) => {
          const orderItems = itemsByOrderId.get(order.id) || [];
          
          const itemsWithDetails = orderItems.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.products?.name || 'Unknown Product',
            product_sku: item.products?.sku || undefined,
            variant_id: item.variant_id,
            variant_name: item.product_variants?.variant_name || null,
            variant_sku: item.product_variants?.sku || undefined,
            quantity: item.quantity,
            price_at_purchase: parseFloat(item.price_at_purchase) || 0,
          }));

          // Get user profile data from the map
          const userProfile = profilesMap.get(order.user_id);

          return {
            id: order.id,
            custom_order_id: order.custom_order_id,
            user_id: order.user_id,
            user_name: order.user_name || userProfile?.user_name,
            user_email: order.user_email || userProfile?.user_email,
            cashier_id: order.cashier_id,
            cashier_name: order.cashier_name,
            source: order.source,
            status: order.status,
            subtotal: parseFloat(order.subtotal) || 0,
            shipping_fee: parseFloat(order.shipping_fee) || 0,
            discount_amount: parseFloat(order.discount_amount) || 0,
            total_amount: parseFloat(order.total_amount) || 0,
            recipient_name: order.recipient_name,
            recipient_phone: order.recipient_phone,
            recipient_address: order.recipient_address,
            recipient_province: order.recipient_province,
            shipping_courier: order.shipping_courier,
            shipping_courier_name: order.shipping_courier_name,
            shipping_address_snapshot: order.shipping_address_snapshot,
            payment_method: order.payment_method,
            customer_notes: order.customer_notes || undefined,
            payment_details: order.payment_details || undefined,
            invoice_url: order.invoice_url,
            packing_list_url: order.packing_list_url,
            items_count: itemsWithDetails.length,
            items: itemsWithDetails,
            created_at: order.created_at,
            updated_at: order.updated_at,
          } as Order;
        });
      }

      set({
        orders: ordersWithItems,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching orders');
      set({ loading: false });
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      // Use API route to bypass RLS restrictions for kasir users
      const response = await fetch('/api/orders/kasir/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error updating order status');
        return false;
      }

      // Update local state
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId
            ? { ...order, status, updated_at: new Date().toISOString() }
            : order
        ),
      }));

      return true;
    } catch (err) {
      console.error('Exception updating order status');
      return false;
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
