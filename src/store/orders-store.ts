import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { useAuthState } from '@/hooks/use-auth';

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
  customer_notes?: string;
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
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  invalidate: () => void;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  orders: [],
  loading: false,
  lastFetched: null,

  fetchOrders: async () => {
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

      // Get current user's role to determine how to fetch orders
      const { role: userRole } = useAuthState();

      let ordersData;

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
        ordersData = result.orders;
      } else {
        // For other users, use the standard method with RLS
        // Only fetch orders that the current user is authorized to see (their own orders)
        console.log('Fetching orders from Supabase...');

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            user:profiles!user_id(user_name, email),
            cashier:profiles!cashier_id(user_name)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          set({ loading: false });
          return;
        }

        // Transform the data to match the original structure
        ordersData = (data || []).map((order: any) => ({
          ...order,
          user_name: order.user?.user_name,
          user_email: order.user?.email,
          cashier_name: order.cashier?.user_name,
        }));
      }

      console.log('Orders fetch result:', { count: ordersData?.length || 0 });

      // For non-kasir users, profile data is already included in the order fetch
      // so we don't need to fetch profiles separately (which would be restricted by RLS)
      let profilesMap = new Map();

      // Only build the profilesMap for kasir users since they use the API route
      // which doesn't fetch profiles separately in the same query
      if (userRole === 'kasir' || userRole === 'super_user') {
        // Fetch user and cashier profiles separately for kasir users (already handled in API)
        const userIds = [...new Set((ordersData || []).map((o: any) => o.user_id).filter((id: any) => id !== null && id !== undefined))];
        const cashierIds = [...new Set((ordersData || []).map((o: any) => o.cashier_id).filter((id: any) => id !== null && id !== undefined))];
        const allProfileIds = [...new Set([...userIds, ...cashierIds])];

        if (allProfileIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, user_name, email')
            .in('id', allProfileIds);

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
          } else {
            profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
          }
        }
      }

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          // Fetch order items separately
          // For non-kasir users, RLS will ensure they can only access items for their own orders
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) {
            console.error(`Error fetching items for order ${order.id}:`, itemsError);
          }

          // Fetch product and variant names separately
          const itemsWithDetails = await Promise.all(
            (itemsData || []).map(async (item: any) => {

              // Fetch product name
              // For non-kasir users, only fetch products they're authorized to access
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('name, sku')
                .eq('id', item.product_id)
                .single();

              if (productError) {
                console.error('Error fetching product:', productError);
              }

              // Fetch variant name if exists
              let variantName = null;
              let variantSku = null;
              if (item.variant_id) {
                const { data: variantData } = await supabase
                  .from('product_variants')
                  .select('variant_name, sku')
                  .eq('id', item.variant_id)
                  .limit(1);

                if (variantData && variantData.length > 0) {
                  variantName = variantData[0].variant_name;
                  variantSku = variantData[0].sku;
                }
              }

              return {
                product_id: item.product_id,
                product_name: productData?.name || 'Unknown Product',
                product_sku: productData?.sku || undefined,
                variant_id: item.variant_id,
                variant_name: variantName,
                variant_sku: variantSku || undefined,
                quantity: item.quantity,
                price_at_purchase: parseFloat(item.price_at_purchase) || 0,
              };
            })
          );

          // For non-kasir users, profile data is included in the order object already
          // For kasir users, we'll use the profile map
          let final_user_name = order.user_name;
          let final_user_email = order.user_email;
          let final_cashier_name = order.cashier_name;

          if (userRole === 'kasir' || userRole === 'super_user') {
            const userProfile = profilesMap.get(order.user_id);
            const cashierProfile = profilesMap.get(order.cashier_id);

            final_user_name = userProfile?.user_name;
            final_user_email = userProfile?.email;
            final_cashier_name = cashierProfile?.user_name;
          }

          return {
            id: order.id,
            user_id: order.user_id,
            user_name: final_user_name,
            user_email: final_user_email,
            cashier_id: order.cashier_id,
            cashier_name: final_cashier_name,
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
            invoice_url: order.invoice_url,
            packing_list_url: order.packing_list_url,
            items_count: itemsWithDetails.length,
            items: itemsWithDetails,
            created_at: order.created_at,
            updated_at: order.updated_at,
          } as Order;
        })
      );

      set({
        orders: ordersWithItems,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error('Exception fetching orders:', err);
      set({ loading: false });
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
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
      console.error('Exception updating order status:', err);
      return false;
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },
}));
