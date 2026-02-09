/**
 * Brevo Email Service Integration
 * 
 * This module provides email sending capabilities using Brevo (formerly Sendinblue).
 * Brevo offers a generous free tier (300 emails/day) making it ideal for startups.
 * 
 * Features:
 * - Order confirmation emails
 * - Shipping updates
 * - Delivery confirmations
 * - Promotional emails
 * - Email queue for batch sending
 * 
 * Environment variables required:
 * - BREVO_API_KEY: Brevo API key
 * - BREVO_SENDER_EMAIL: Default sender email address
 * - BREVO_SENDER_NAME: Default sender name
 */

import * as SibApiV3Sdk from '@getbrevo/brevo';

// Initialize Brevo API client
let brevoClient: SibApiV3Sdk.TransactionalEmailsApi | null = null;

/**
 * Get or create Brevo API client
 */
function getBrevoClient(): SibApiV3Sdk.TransactionalEmailsApi {
  if (!brevoClient) {
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is required');
    }

    const client = new SibApiV3Sdk.TransactionalEmailsApi();
    client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    
    brevoClient = client;
  }
  
  return brevoClient;
}

/**
 * Default sender configuration
 */
function getSender(): { email: string; name: string } {
  return {
    email: process.env.BREVO_SENDER_EMAIL || 'noreply@shorttail.id',
    name: process.env.BREVO_SENDER_NAME || 'ShortTail.id',
  };
}

/**
 * Email template types
 */
export type EmailTemplate = 
  | 'order_confirmation'
  | 'shipping_update'
  | 'delivery_confirmation'
  | 'order_cancelled'
  | 'password_reset'
  | 'welcome'
  | 'promotion';

/**
 * Email attachment
 */
export interface EmailAttachment {
  name: string;
  content: string; // base64 encoded
  type?: string;
}

/**
 * Order item for email templates
 */
export interface OrderItemEmail {
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

/**
 * Order data for email templates
 */
export interface OrderEmailData {
  orderId: string;
  customOrderId?: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemEmail[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: string;
  shippingCourier?: string;
  trackingNumber?: string;
  orderDate: string;
  status: string;
  paymentMethod?: string;
}

/**
 * Send email using Brevo
 * 
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param htmlContent - HTML content
 * @param options - Additional options
 * @returns Promise<boolean>
 * 
 * @example
 * await sendEmail(
 *   'customer@example.com',
 *   'Order Confirmation',
 *   '<h1>Thank you for your order!</h1>',
 *   { templateId: 'order_confirmation' }
 * );
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  options: {
    textContent?: string;
    attachments?: EmailAttachment[];
    templateId?: string;
    params?: Record<string, unknown>;
  } = {}
): Promise<boolean> {
  try {
    const client = getBrevoClient();
    const sender = getSender();

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    // Set sender
    sendSmtpEmail.sender = {
      email: sender.email,
      name: sender.name,
    };
    
    // Set recipient
    sendSmtpEmail.to = [{ email: to }];
    
    // Set subject
    sendSmtpEmail.subject = subject;
    
    // Set content
    if (options.templateId) {
      // Use template
      sendSmtpEmail.templateId = parseInt(options.templateId, 10);
      if (options.params) {
        sendSmtpEmail.params = options.params;
      }
    } else {
      // Use direct content
      sendSmtpEmail.htmlContent = htmlContent;
      if (options.textContent) {
        sendSmtpEmail.textContent = options.textContent;
      }
    }
    
    // Add attachments
    if (options.attachments && options.attachments.length > 0) {
      sendSmtpEmail.attachment = options.attachments.map((att) => ({
        name: att.name,
        content: att.content,
      }));
    }
    
    // Send email
    const response = await client.sendTransacEmail(sendSmtpEmail);
    
    console.log('Email sent successfully:', response.body?.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send order confirmation email
 * 
 * @param orderData - Order data
 * @returns Promise<boolean>
 */
export async function sendOrderConfirmationEmail(
  orderData: OrderEmailData
): Promise<boolean> {
  const subject = `Pesanan Anda #${orderData.customOrderId || orderData.orderId.slice(0, 8)} - ShortTail.id`;
  
  const htmlContent = buildOrderConfirmationTemplate(orderData);
  
  return sendEmail(orderData.customerEmail, subject, htmlContent);
}

/**
 * Send shipping update email
 * 
 * @param orderData - Order data with tracking info
 * @returns Promise<boolean>
 */
export async function sendShippingUpdateEmail(
  orderData: OrderEmailData
): Promise<boolean> {
  const subject = `Pesanan Anda Sedang Dikirim - #${orderData.customOrderId || orderData.orderId.slice(0, 8)}`;
  
  const htmlContent = buildShippingUpdateTemplate(orderData);
  
  return sendEmail(orderData.customerEmail, subject, htmlContent);
}

/**
 * Send delivery confirmation email
 * 
 * @param orderData - Order data
 * @returns Promise<boolean>
 */
export async function sendDeliveryConfirmationEmail(
  orderData: OrderEmailData
): Promise<boolean> {
  const subject = `Pesanan Anda Telah Diterima - #${orderData.customOrderId || orderData.orderId.slice(0, 8)}`;
  
  const htmlContent = buildDeliveryConfirmationTemplate(orderData);
  
  return sendEmail(orderData.customerEmail, subject, htmlContent);
}

/**
 * Send order cancelled email
 * 
 * @param orderData - Order data
 * @param reason - Cancellation reason
 * @returns Promise<boolean>
 */
export async function sendOrderCancelledEmail(
  orderData: OrderEmailData,
  reason?: string
): Promise<boolean> {
  const subject = `Pesanan Dibatalkan - #${orderData.customOrderId || orderData.orderId.slice(0, 8)}`;
  
  const htmlContent = buildOrderCancelledTemplate(orderData, reason);
  
  return sendEmail(orderData.customerEmail, subject, htmlContent);
}

/**
 * Send password reset email
 * 
 * @param email - User email
 * @param resetUrl - Password reset URL
 * @param userName - User name
 * @returns Promise<boolean>
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName?: string
): Promise<boolean> {
  const subject = 'Reset Password - ShortTail.id';
  
  const htmlContent = buildPasswordResetTemplate(resetUrl, userName);
  
  return sendEmail(email, subject, htmlContent);
}

/**
 * Send welcome email
 * 
 * @param email - User email
 * @param userName - User name
 * @returns Promise<boolean>
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string
): Promise<boolean> {
  const subject = 'Selamat Datang di ShortTail.id!';
  
  const htmlContent = buildWelcomeTemplate(userName);
  
  return sendEmail(email, subject, htmlContent);
}

// ============================================================================
// Email Templates
// ============================================================================

function buildOrderConfirmationTemplate(data: OrderEmailData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}${item.variant ? ` (${item.variant})` : ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rp ${formatPrice(item.price)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rp ${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Konfirmasi Pesanan</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50;">Pesanan Diterima!</h1>
          <p>Terima kasih telah berbelanja di ShortTail.id</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2>Detail Pesanan #${data.customOrderId || data.orderId.slice(0, 8)}</h2>
          <p><strong>Tanggal:</strong> ${formatDate(data.orderDate)}</p>
          <p><strong>Status:</strong> ${translateStatus(data.status)}</p>
          ${data.paymentMethod ? `<p><strong>Metode Pembayaran:</strong> ${data.paymentMethod}</p>` : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Produk</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Harga</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <p style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>Rp ${formatPrice(data.subtotal)}</span>
          </p>
          <p style="display: flex; justify-content: space-between;">
            <span>Ongkir:</span>
            <span>Rp ${formatPrice(data.shippingFee)}</span>
          </p>
          ${data.discountAmount > 0 ? `
            <p style="display: flex; justify-content: space-between; color: #4CAF50;">
              <span>Diskon:</span>
              <span>-Rp ${formatPrice(data.discountAmount)}</span>
            </p>
          ` : ''}
          <p style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2em; margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd;">
            <span>Total:</span>
            <span>Rp ${formatPrice(data.totalAmount)}</span>
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: #fff3cd; border-radius: 8px;">
          <h3>Alamat Pengiriman:</h3>
          <p>${data.shippingAddress.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
          <p>Jika ada pertanyaan, silakan hubungi kami di support@shorttail.id</p>
          <p>© 2024 ShortTail.id - Toko Peliharaan Terpercaya</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildShippingUpdateTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pesanan Dikirim</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2196F3;">Pesanan Sedang Dikirim! 🚚</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>Halo <strong>${data.customerName}</strong>,</p>
          <p>Pesanan Anda <strong>#${data.customOrderId || data.orderId.slice(0, 8)}</strong> telah dikirim!</p>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3>Informasi Pengiriman:</h3>
          <p><strong>Kurir:</strong> ${data.shippingCourier || 'JNE'}</p>
          ${data.trackingNumber ? `
            <p><strong>Nomor Resi:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px;">${data.trackingNumber}</code></p>
            <p style="margin-top: 10px;">
              <a href="https://cekresi.com/?noresi=${data.trackingNumber}" 
                 style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Lacak Pesanan
              </a>
            </p>
          ` : '<p>Nomor resi akan dikirimkan segera.</p>'}
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px;">
          <h3>Alamat Pengiriman:</h3>
          <p>${data.shippingAddress.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
          <p>© 2024 ShortTail.id - Toko Peliharaan Terpercaya</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildDeliveryConfirmationTemplate(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pesanan Diterima</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50;">Pesanan Telah Diterima! ✅</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>Halo <strong>${data.customerName}</strong>,</p>
          <p>Pesanan Anda <strong>#${data.customOrderId || data.orderId.slice(0, 8)}</strong> telah berhasil diterima!</p>
          <p>Total Pembayaran: <strong>Rp ${formatPrice(data.totalAmount)}</strong></p>
        </div>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3>Bagaimana pengalaman Anda?</h3>
          <p>Kami ingin mendengar feedback Anda! Silakan beri rating dan ulasan untuk produk yang Anda beli.</p>
          <p style="margin-top: 10px;">
            <a href="https://shorttail.id/dashboard/orders/${data.orderId}/review" 
               style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Beri Ulasan
            </a>
          </p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
          <p>Terima kasih telah berbelanja di ShortTail.id! 🐾</p>
          <p>© 2024 ShortTail.id - Toko Peliharaan Terpercaya</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildOrderCancelledTemplate(data: OrderEmailData, reason?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pesanan Dibatalkan</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f44336;">Pesanan Dibatalkan</h1>
        </div>
        
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>Halo <strong>${data.customerName}</strong>,</p>
          <p>Pesanan Anda <strong>#${data.customOrderId || data.orderId.slice(0, 8)}</strong> telah dibatalkan.</p>
          ${reason ? `<p><strong>Alasan:</strong> ${reason}</p>` : ''}
          ${data.totalAmount > 0 ? `<p>Dana sebesar <strong>Rp ${formatPrice(data.totalAmount)}</strong> akan dikembalikan dalam 3-5 hari kerja.</p>` : ''}
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <p>Jika ada pertanyaan, silakan hubungi kami:</p>
          <p><a href="mailto:support@shorttail.id">support@shorttail.id</a></p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
          <p>© 2024 ShortTail.id - Toko Peliharaan Terpercaya</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildPasswordResetTemplate(resetUrl: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2196F3;">Reset Password</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>Halo ${userName || 'Pengguna'},</p>
          <p>Kami menerima permintaan untuk mereset password akun ShortTail.id Anda.</p>
          <p>Klik tombol di bawah untuk melanjutkan:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 0.9em; color: #666;">
            Atau salin dan tempel link ini di browser:<br>
            <code style="word-break: break-all;">${resetUrl}</code>
          </p>
          
          <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
            Link ini akan kadaluarsa dalam 24 jam.<br>
            Jika Anda tidak meminta reset password, abaikan email ini.
          </p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
          <p>© 2024 ShortTail.id - Toko Peliharaan Terpercaya</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildWelcomeTemplate(userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Selamat Datang</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50;">Selamat Datang di ShortTail.id! 🐾</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>Halo ${userName || 'Pet Lover'},</p>
          <p>Selamat! Anda sekarang menjadi bagian dari komunitas pecinta hewan ShortTail.id.</p>
          
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Keuntungan Member:</h3>
            <ul>
              <li>📦 Gratis Ongkir untuk pembelian tertentu</li>
              <li>💰 Diskon eksklusif member</li>
              <li>🎁 Poin reward untuk setiap pembelian</li>
              <li>📢 Notifikasi promo terbaru</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://shorttail.id/products" 
               style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Mulai Belanja
            </a>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
          <p>Jika ada pertanyaan, hubungi kami di <a href="mailto:support@shorttail.id">support@shorttail.id</a></p>
          <p>© 2024 ShortTail.id - Toko Peliharaan Terpercaya</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatPrice(price: number): string {
  return price.toLocaleString('id-ID');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    pending: 'Menunggu Pembayaran',
    paid: 'Dibayar',
    packed: 'Dikemas',
    shipped: 'Dikirim',
    delivered: 'Diterima',
    cancelled: 'Dibatalkan',
    returned: 'Dikembalikan',
  };
  return translations[status] || status;
}

// ============================================================================
// Email Queue (Simple in-memory queue for batch processing)
// ============================================================================

interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  htmlContent: string;
  options?: Parameters<typeof sendEmail>[3];
  retries: number;
  maxRetries: number;
}

const emailQueue: QueuedEmail[] = [];
let isProcessing = false;

/**
 * Add email to queue
 */
export function queueEmail(
  to: string,
  subject: string,
  htmlContent: string,
  options?: Parameters<typeof sendEmail>[3]
): string {
  const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  emailQueue.push({
    id,
    to,
    subject,
    htmlContent,
    options,
    retries: 0,
    maxRetries: 3,
  });
  
  // Start processing if not already running
  if (!isProcessing) {
    processEmailQueue();
  }
  
  return id;
}

/**
 * Process email queue
 */
async function processEmailQueue(): Promise<void> {
  if (isProcessing || emailQueue.length === 0) return;
  
  isProcessing = true;
  
  while (emailQueue.length > 0) {
    const email = emailQueue.shift();
    if (!email) continue;
    
    try {
      const success = await sendEmail(
        email.to,
        email.subject,
        email.htmlContent,
        email.options
      );
      
      if (!success && email.retries < email.maxRetries) {
        email.retries++;
        emailQueue.push(email);
      }
    } catch (error) {
      console.error(`Error sending queued email ${email.id}:`, error);
      
      if (email.retries < email.maxRetries) {
        email.retries++;
        emailQueue.push(email);
      }
    }
    
    // Small delay between emails to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  isProcessing = false;
}

/**
 * Get queue status
 */
export function getEmailQueueStatus(): {
  pending: number;
  isProcessing: boolean;
} {
  return {
    pending: emailQueue.length,
    isProcessing,
  };
}