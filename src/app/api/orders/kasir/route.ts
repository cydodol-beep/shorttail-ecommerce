import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// Helper function to implement timeout for async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ) as Promise<T>
  ]);
}

export async function GET(request: Request) {
  try {
    // Check authentication and kasir role
    const adminClient = createAdminClient();
    
    // Get the current user to verify role
    const { data: { user }, error: authError } = await adminClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is kasir or super_user
    const profileResponse = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: profile, error: profileError } = profileResponse;

    if (profileError || !profile || !['kasir', 'super_user'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all orders (both POS and marketplace) for kasir users
    // Using admin client to bypass RLS and get all orders
    const { data: ordersData, error: ordersError } = await adminClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders in API route:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Fetch user and cashier profiles separately
    const userIds = [...new Set((ordersData || []).map((o: any) => o.user_id).filter(Boolean))];
    const cashierIds = [...new Set((ordersData || []).map((o: any) => o.cashier_id).filter(Boolean))];
    const allProfileIds = [...new Set([...userIds, ...cashierIds])];

    let profilesMap = new Map();

    if (allProfileIds.length > 0) {
      const { data: profilesData } = await adminClient
        .from('profiles')
        .select('id, user_name, email')
        .in('id', allProfileIds);

      profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
    }

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order: any) => {
        // Fetch order items separately
        const { data: itemsData, error: itemsError } = await adminClient
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
            const { data: productData, error: productError } = await adminClient
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
              const { data: variantData } = await adminClient
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

        const userProfile = profilesMap.get(order.user_id);
        const cashierProfile = profilesMap.get(order.cashier_id);

        return {
          id: order.id,
          user_id: order.user_id,
          user_name: userProfile?.user_name,
          user_email: userProfile?.email,
          cashier_id: order.cashier_id,
          cashier_name: cashierProfile?.user_name,
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
        };
      })
    );

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Exception in kasir orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}