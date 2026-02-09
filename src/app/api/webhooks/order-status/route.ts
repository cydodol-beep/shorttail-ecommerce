/**
 * Order Status Webhook API Route
 * 
 * POST /api/webhooks/order-status
 * 
 * This webhook is triggered when order status changes.
 * It sends automated emails to customers based on the status:
 * - Order confirmation (when paid)
 * - Shipping update (when shipped)
 * - Delivery confirmation (when delivered)
 * - Order cancellation (when cancelled)
 * 
 * Can be triggered by:
 * 1. Database trigger (pg_http extension)
 * 2. Manual API call from admin panel
 * 3. External payment gateway callbacks
 * 
 * Security: Requires webhook secret for validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  sendOrderConfirmationEmail,
  sendShippingUpdateEmail,
  sendDeliveryConfirmationEmail,
  sendOrderCancelledEmail,
  queueEmail,
  type OrderEmailData,
  type OrderItemEmail,
} from '@/lib/email/brevo';
import * as Sentry from '@sentry/nextjs';

/**
 * Webhook payload structure
 */
interface WebhookPayload {
  orderId: string;
  oldStatus: string;
  newStatus: string;
  triggeredBy?: string; // 'payment_gateway', 'admin', 'system'
  metadata?: Record<string, unknown>;
}

/**
 * POST handler for order status webhook
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.ORDER_STATUS_WEBHOOK_SECRET;
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload: WebhookPayload = await request.json();
    
    // Validate required fields
    if (!payload.orderId || !payload.newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, newStatus' },
        { status: 400 }
      );
    }

    console.log(`Processing order status webhook: ${payload.orderId} -> ${payload.newStatus}`);

    // Fetch order details using admin client
    const adminClient = createAdminClient();
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select(`
        id,
        custom_order_id,
        user_id,
        user_name,
        user_email,
        status,
        subtotal,
        shipping_fee,
        discount_amount,
        total_amount,
        shipping_courier_name,
        tracking_number,
        shipping_address_snapshot,
        payment_method,
        created_at,
        recipient_name,
        recipient_phone,
        recipient_address,
        recipient_province
      `)
      .eq('id', payload.orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await adminClient
      .from('order_items')
      .select(`
        quantity,
        price_at_purchase,
        product_id,
        variant_id
      `)
      .eq('order_id', payload.orderId);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    }

    // Build order items with product names
    const items: OrderItemEmail[] = [];
    
    if (orderItems) {
      for (const item of orderItems) {
        // Fetch product name
        const { data: product } = await adminClient
          .from('products')
          .select('name, sku')
          .eq('id', item.product_id)
          .single();

        // Fetch variant name if applicable
        let variantName: string | undefined;
        if (item.variant_id) {
          const { data: variant } = await adminClient
            .from('product_variants')
            .select('variant_name')
            .eq('id', item.variant_id)
            .single();
          variantName = variant?.variant_name || undefined;
        }

        items.push({
          name: product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: parseFloat(item.price_at_purchase) || 0,
          variant: variantName,
        });
      }
    }

    // Build shipping address string
    const shippingAddress = buildShippingAddress(order);

    // Build order email data
    const orderData: OrderEmailData = {
      orderId: order.id,
      customOrderId: order.custom_order_id,
      customerName: order.user_name || order.recipient_name || 'Customer',
      customerEmail: order.user_email || '',
      items,
      subtotal: parseFloat(order.subtotal) || 0,
      shippingFee: parseFloat(order.shipping_fee) || 0,
      discountAmount: parseFloat(order.discount_amount) || 0,
      totalAmount: parseFloat(order.total_amount) || 0,
      shippingAddress,
      shippingCourier: order.shipping_courier_name,
      trackingNumber: order.tracking_number,
      orderDate: order.created_at,
      status: payload.newStatus,
      paymentMethod: order.payment_method,
    };

    // Send appropriate email based on status
    let emailSent = false;
    const emailResults: string[] = [];

    switch (payload.newStatus) {
      case 'paid':
        // Send order confirmation when payment is received
        if (order.user_email) {
          emailSent = await sendOrderConfirmationEmail(orderData);
          emailResults.push(emailSent ? 'order_confirmation_sent' : 'order_confirmation_failed');
        }
        break;

      case 'shipped':
        // Send shipping update
        if (order.user_email) {
          emailSent = await sendShippingUpdateEmail(orderData);
          emailResults.push(emailSent ? 'shipping_update_sent' : 'shipping_update_failed');
        }
        break;

      case 'delivered':
        // Send delivery confirmation
        if (order.user_email) {
          emailSent = await sendDeliveryConfirmationEmail(orderData);
          emailResults.push(emailSent ? 'delivery_confirmation_sent' : 'delivery_confirmation_failed');
        }
        break;

      case 'cancelled':
        // Send cancellation email
        if (order.user_email) {
          const reason = payload.metadata?.cancellation_reason as string | undefined;
          emailSent = await sendOrderCancelledEmail(orderData, reason);
          emailResults.push(emailSent ? 'cancellation_email_sent' : 'cancellation_email_failed');
        }
        break;

      default:
        // No email for other status changes
        emailResults.push('no_email_for_status');
    }

    // Log the webhook processing
    const duration = Date.now() - startTime;
    
    Sentry.addBreadcrumb({
      category: 'webhook',
      message: `Order status webhook processed: ${payload.orderId}`,
      data: {
        orderId: payload.orderId,
        oldStatus: payload.oldStatus,
        newStatus: payload.newStatus,
        emailSent,
        emailResults,
        duration,
      },
      level: 'info',
    });

    // Record in webhook logs table (optional, for audit trail)
    await logWebhookEvent(adminClient, {
      orderId: payload.orderId,
      oldStatus: payload.oldStatus,
      newStatus: payload.newStatus,
      emailSent,
      emailResults,
      triggeredBy: payload.triggeredBy,
      processedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      orderId: payload.orderId,
      status: payload.newStatus,
      emailSent,
      emailResults,
      duration,
    });

  } catch (error) {
    console.error('Error processing order status webhook:', error);
    
    Sentry.captureException(error, {
      tags: {
        route: '/api/webhooks/order-status',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Build shipping address string from order data
 */
function buildShippingAddress(order: Record<string, unknown>): string {
  const parts: string[] = [];
  
  // Use recipient address from order
  if (order.recipient_name) {
    parts.push(`Atas nama: ${order.recipient_name}`);
  }
  
  if (order.recipient_address) {
    parts.push(order.recipient_address as string);
  }
  
  if (order.recipient_province) {
    parts.push(order.recipient_province as string);
  }
  
  if (order.recipient_phone) {
    parts.push(`Telepon: ${order.recipient_phone}`);
  }
  
  // Fallback to shipping_address_snapshot if available
  if (parts.length === 0 && order.shipping_address_snapshot) {
    const snapshot = order.shipping_address_snapshot as Record<string, string>;
    if (snapshot.address) parts.push(snapshot.address);
    if (snapshot.city) parts.push(snapshot.city);
    if (snapshot.province) parts.push(snapshot.province);
    if (snapshot.phone) parts.push(`Telepon: ${snapshot.phone}`);
  }
  
  return parts.join('\n') || 'Alamat tidak tersedia';
}

/**
 * Log webhook event for audit trail
 */
async function logWebhookEvent(
  adminClient: ReturnType<typeof createAdminClient>,
  event: {
    orderId: string;
    oldStatus: string;
    newStatus: string;
    emailSent: boolean;
    emailResults: string[];
    triggeredBy?: string;
    processedAt: string;
  }
): Promise<void> {
  try {
    // Check if webhook_logs table exists
    const { error: tableError } = await adminClient
      .from('webhook_logs')
      .select('id')
      .limit(1);

    if (tableError?.message?.includes('does not exist')) {
      // Table doesn't exist, skip logging
      return;
    }

    await adminClient.from('webhook_logs').insert({
      order_id: event.orderId,
      event_type: 'order_status_change',
      old_status: event.oldStatus,
      new_status: event.newStatus,
      email_sent: event.emailSent,
      email_results: event.emailResults,
      triggered_by: event.triggeredBy,
      processed_at: event.processedAt,
    });
  } catch (error) {
    // Don't fail the webhook if logging fails
    console.error('Error logging webhook event:', error);
  }
}

/**
 * GET handler for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'order-status-webhook',
    timestamp: new Date().toISOString(),
  });
}