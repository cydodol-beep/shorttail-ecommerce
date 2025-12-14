import html2canvas from 'html2canvas';
import type { Order } from '@/store/orders-store';

export async function generateInvoiceJPEG(order: Order, storeInfo: any): Promise<Blob> {
  // Create a temporary div to render the invoice
  const invoiceDiv = document.createElement('div');
  invoiceDiv.style.position = 'absolute';
  invoiceDiv.style.left = '-9999px';
  invoiceDiv.style.width = '794px'; // A4 width in pixels at 96 DPI
  invoiceDiv.style.backgroundColor = 'white';
  invoiceDiv.style.padding = '60px';
  invoiceDiv.style.fontFamily = 'Arial, sans-serif';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get courier logo URL based on courier name
  const getCourierLogo = (courier: string | undefined) => {
    if (!courier) return '';
    const courierName = courier.toLowerCase();
    // Common Indonesian courier logos
    if (courierName.includes('jne')) return 'https://upload.wikimedia.org/wikipedia/commons/9/92/New_Logo_JNE.png';
    if (courierName.includes('jnt') || courierName.includes('j&t')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Logo_JnT.png/640px-Logo_JnT.png';
    if (courierName.includes('sicepat')) return 'https://sicepat.com/wp-content/themes/sicepat/img/logo.png';
    if (courierName.includes('pos')) return 'https://www.posindonesia.co.id/assets/images/logo.png';
    if (courierName.includes('tiki')) return 'https://www.tiki.id/assets/images/logo-tiki.png';
    return '';
  };

  const courierLogo = getCourierLogo(order.shipping_courier);

  invoiceDiv.innerHTML = `
    <div style="border: 2px solid #a0938e; padding: 40px; min-height: 1054px;">
      <!-- Header with two columns -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start;">
        <!-- Left Column: Store Info -->
        <div style="flex: 1;">
          ${storeInfo?.store_logo ? `<img src="${storeInfo.store_logo}" alt="Store Logo" style="max-width: 120px; max-height: 60px; margin-bottom: 10px; display: block;" />` : ''}
          <p style="margin: 3px 0; font-size: 14px; font-weight: bold; color: #8B4513;">${storeInfo?.store_name || 'shorttail.id'}</p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">${storeInfo?.store_address || ''}</p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Phone: ${storeInfo?.store_phone || '-'}</p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">Email: ${storeInfo?.store_email || '-'}</p>
        </div>
        
        <!-- Right Column: Courier Logo -->
        <div style="flex: 0 0 auto; text-align: right;">
          ${courierLogo ? `<img src="${courierLogo}" alt="Courier Logo" style="max-width: 150px; max-height: 80px; display: block; margin-left: auto;" />` : '<div style="width: 150px; height: 80px;"></div>'}
          ${order.shipping_courier ? `<p style="margin: 8px 0 0 0; font-size: 25px; font-weight: bold; color: #8B4513; text-align: right;">${order.shipping_courier}</p>` : ''}
        </div>
      </div>

      <div style="border-top: 2px solid #a0938e; margin: 20px 0;"></div>

      <!-- Invoice Title (Centered) -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #8B4513;">ShortTail's INVOICE</h2>
      </div>

      <!-- Two Column Section: Recipient Info (Left) and Invoice Info (Right) -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 25px; gap: 40px;">
        <!-- Left Column: Recipient Info -->
        <div style="flex: 1;">
          <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">Recipient Information:</p>
          ${(() => {
            const recipientName = order.recipient_name || order.user_name ||
              (order.shipping_address_snapshot?.recipient_name) ||
              (order.shipping_address_snapshot?.name) ||
              'Walk-in Customer';

            const recipientAddress = order.recipient_address ||
              (order.shipping_address_snapshot?.address_line1) ||
              '';

            const recipientCity = order.recipient_city ||
              (order.shipping_address_snapshot?.city) ||
              '';

            const recipientProvince = order.recipient_province ||
              (order.shipping_address_snapshot?.region || order.shipping_address_snapshot?.province) ||
              '';

            const recipientPostalCode = order.recipient_postal_code ||
              (order.shipping_address_snapshot?.postal_code) ||
              '';

            const recipientPhone = order.recipient_phone ||
              (order.shipping_address_snapshot?.recipient_phone ||
               order.shipping_address_snapshot?.phone) ||
              '';

            return `
              ${recipientName ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Name:</strong> ${recipientName}</p>` : ''}
              ${recipientAddress ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Address:</strong> ${recipientAddress}</p>` : ''}
              ${recipientCity ? `<p style="margin: 3px 0; font-size: 13px;"><strong>City:</strong> ${recipientCity}</p>` : ''}
              ${recipientProvince ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Province:</strong> ${recipientProvince}</p>` : ''}
              ${recipientPostalCode ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Postal Code:</strong> ${recipientPostalCode}</p>` : ''}
              ${recipientPhone ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Phone Number:</strong> ${recipientPhone}</p>` : ''}
            `;
          })()}
        </div>

        <!-- Right Column: Invoice Info -->
        <div style="flex: 1; text-align: right;">
          <p style="margin: 3px 0; font-size: 13px;"><strong>Invoice Number:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Invoice Date:</strong> ${formatDate(order.created_at)}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Status:</strong> <span style="text-transform: uppercase; color: ${order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : '#666'};">${order.status}</span></p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Source:</strong> <span style="text-transform: uppercase;">${order.source}</span></p>
        </div>
      </div>

      <div style="border-top: 1px solid #ccc; margin: 20px 0;"></div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px;">Item</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px;">SKU</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-size: 13px;">Qty</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 13px;">Price</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 13px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items?.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-size: 12px;">
                <strong>${item.product_name}</strong>${item.variant_name ? `<br/><span style="color: #666; font-size: 11px;">Variant: ${item.variant_name}</span>` : ''}
              </td>
              <td style="border: 1px solid #ddd; padding: 10px; font-size: 12px; color: #666;">${item.variant_sku || item.product_sku || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-size: 12px;">${item.quantity}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 12px;">${formatCurrency(item.price_at_purchase)}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 12px;">${formatCurrency(item.price_at_purchase * item.quantity)}</td>
            </tr>
          `).join('') || '<tr><td colspan="5" style="text-align: center; padding: 10px; font-size: 12px;">No items</td></tr>'}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="text-align: right; margin-top: 20px;">
        <p style="margin: 5px 0; font-size: 13px;"><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
        ${order.shipping_fee > 0 ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Shipping Fee:</strong> ${formatCurrency(order.shipping_fee)}</p>` : ''}
        ${order.discount_amount > 0 ? `<p style="margin: 5px 0; color: green; font-size: 13px;"><strong>Discount:</strong> -${formatCurrency(order.discount_amount)}</p>` : ''}
        <div style="border-top: 2px solid #a0938e; margin: 10px 0 10px auto; width: 280px;"></div>
        <p style="margin: 5px 0; font-size: 16px;"><strong>TOTAL:</strong> ${formatCurrency(order.total_amount)}</p>
      </div>

      ${order.customer_notes ? `
      <!-- Customer Notes -->
      <div style="margin-top: 30px; padding: 15px; background-color: #fffbf0; border-left: 4px solid #8B4513; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #8B4513;">Special Requests:</p>
        <p style="margin: 0; font-size: 12px; color: #666; white-space: pre-wrap;">${order.customer_notes}</p>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
        <p>Thank you for your purchase!</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  `;

  document.body.appendChild(invoiceDiv);

  try {
    // Wait for all images to load
    const images = invoiceDiv.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map((img) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true); // Continue even if image fails
            // Timeout after 3 seconds
            setTimeout(() => resolve(true), 3000);
          }
        });
      })
    );

    // Generate canvas from HTML
    const canvas = await html2canvas(invoiceDiv, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      useCORS: true, // Enable CORS for external images
      allowTaint: true,
    });

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image'));
        }
      }, 'image/jpeg', 0.95);
    });
  } finally {
    document.body.removeChild(invoiceDiv);
  }
}

export function downloadInvoice(blob: Blob, orderId: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${orderId.slice(0, 8)}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
