import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

interface CartItem {
  product: {
    id: string;
    name: string;
    base_price: number;
    stock_quantity: number;
  };
  variant: {
    id: string;
    variant_name: string;
    price_adjustment: number;
    stock_quantity: number;
  } | null;
  quantity: number;
  price: number;
  displayName: string;
}

interface CreateOrderRequest {
  cart: CartItem[];
  subtotal: number;
  shippingCostAmount: number;
  discountAmount: number;
  total: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  provinceName: string;
  provinceId: number | null;
  courierName: string;
  totalWeightGrams: number;
  paymentMethod: string;
  customerNotes: string | null;
  customerName: string | null;
  customerPhone: string | null;
}

export async function POST(request: Request) {
  try {
    // Authenticate the user first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is kasir or admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, user_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    if (!['kasir', 'master_admin', 'normal_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Kasir role required' }, { status: 403 });
    }

    // Parse request body
    const body: CreateOrderRequest = await request.json();
    const {
      cart,
      subtotal,
      shippingCostAmount,
      discountAmount,
      total,
      recipientName,
      recipientPhone,
      recipientAddress,
      provinceName,
      provinceId,
      courierName,
      totalWeightGrams,
      paymentMethod,
      customerNotes,
      customerName,
      customerPhone,
    } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Use admin client to bypass RLS for order creation
    const adminClient = createAdminClient();

    // Verify stock availability for all items
    for (const item of cart) {
      if (item.variant) {
        const { data: variantData, error: variantError } = await adminClient
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', item.variant.id)
          .single();

        if (variantError || !variantData || variantData.stock_quantity < item.quantity) {
          return NextResponse.json({
            error: `Not enough stock for ${item.product.name} - ${item.variant.variant_name}. Only ${variantData?.stock_quantity || 0} available.`
          }, { status: 400 });
        }
      } else {
        const { data: productData, error: productError } = await adminClient
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product.id)
          .single();

        if (productError || !productData || productData.stock_quantity < item.quantity) {
          return NextResponse.json({
            error: `Not enough stock for ${item.product.name}. Only ${productData?.stock_quantity || 0} available.`
          }, { status: 400 });
        }
      }
    }

    // Create the order
    const orderData: Record<string, any> = {
      user_id: null, // Walk-in customer
      cashier_id: user.id,
      source: 'pos',
      status: 'paid',
      subtotal,
      shipping_fee: shippingCostAmount,
      discount_amount: discountAmount,
      total_amount: total,
      recipient_name: recipientName || null,
      recipient_phone: recipientPhone || null,
      recipient_address: recipientAddress || null,
      recipient_province: provinceName || null,
      recipient_province_id: provinceId,
      shipping_courier: courierName || null,
      shipping_weight_grams: totalWeightGrams,
      payment_method: paymentMethod,
      customer_notes: customerNotes,
      shipping_address_snapshot: customerPhone ? { customer_phone: customerPhone } : null,
    };

    // Only add user_name and cashier_name if the columns exist
    // These columns are added in migration 024
    try {
      orderData.user_name = customerName || null;
      orderData.cashier_name = profile.user_name || null;
    } catch (e) {
      // Columns might not exist, that's okay
    }

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert(orderData)
      .select('*')
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      
      // If error is about unknown columns, try again without user_name/cashier_name
      if (orderError.message?.includes('user_name') || orderError.message?.includes('cashier_name')) {
        console.log('Retrying without user_name/cashier_name columns...');
        delete orderData.user_name;
        delete orderData.cashier_name;
        
        const { data: orderRetry, error: orderRetryError } = await adminClient
          .from('orders')
          .insert(orderData)
          .select('*')
          .single();

        if (orderRetryError) {
          console.error('Order creation retry error:', orderRetryError);
          return NextResponse.json({ error: 'Failed to create order', details: orderRetryError.message }, { status: 500 });
        }

        // Continue with the retry order
        return await processOrderItems(adminClient, orderRetry, cart, total);
      }

      return NextResponse.json({ error: 'Failed to create order', details: orderError.message }, { status: 500 });
    }

    return await processOrderItems(adminClient, order, cart, total);
  } catch (error: any) {
    console.error('Unexpected error in kasir order creation:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

async function processOrderItems(adminClient: any, order: any, cart: CartItem[], total: number) {
  // Create order items
  const orderItems = cart.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    variant_id: item.variant?.id || null,
    quantity: item.quantity,
    price_at_purchase: item.price,
  }));

  const { error: itemsError } = await adminClient
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Order items creation error:', itemsError);
    // Rollback: delete the order if items failed
    await adminClient.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: 'Failed to create order items', details: itemsError.message }, { status: 500 });
  }

  // Update stock for each item
  for (const item of cart) {
    if (item.variant) {
      const { data: variantData } = await adminClient
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', item.variant.id)
        .single();

      if (variantData) {
        const newStock = variantData.stock_quantity - item.quantity;
        await adminClient
          .from('product_variants')
          .update({ stock_quantity: newStock })
          .eq('id', item.variant.id);
      }
    } else {
      const { data: productData } = await adminClient
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product.id)
        .single();

      if (productData) {
        const newStock = productData.stock_quantity - item.quantity;
        await adminClient
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product.id);
      }
    }
  }

  // Create notification for new POS order
  try {
    await adminClient
      .from('notifications')
      .insert({
        user_id: null,
        title: 'New POS Order Placed!',
        message: `Order #${order.custom_order_id || order.id.slice(0, 8)} has been placed via POS with total amount of Rp ${total.toLocaleString('id-ID')}.`,
        action_link: `/admin/orders/${order.id}`,
      });
  } catch (notifError) {
    console.error('Error creating notification:', notifError);
    // Non-fatal error, continue
  }

  return NextResponse.json({
    success: true,
    order: order,
    message: 'Order created successfully',
  });
}
