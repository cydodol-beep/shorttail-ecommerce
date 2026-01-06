import html2canvas from 'html2canvas';
import type { Order } from '@/store/orders-store';

export async function generateInvoiceJPEG(order: Order, storeInfo: any): Promise<Blob> {
  // Debug log to verify data is being passed
  console.log('Invoice Generator - Order payment_method:', order.payment_method);
  console.log('Invoice Generator - StoreInfo payment:', storeInfo?.payment);
  
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

            const recipientCity =
              (order.shipping_address_snapshot?.city) ||
              '';

            const recipientProvince = order.recipient_province ||
              (order.shipping_address_snapshot?.region || order.shipping_address_snapshot?.province) ||
              '';

            const recipientPostalCode =
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

      <!-- Payment Method -->
      ${(() => {
        // Normalize payment method to lowercase for comparison, handling spaces as underscores
        const rawPaymentMethod = order.payment_method;  // Store original for debugging
        const paymentMethod = order.payment_method?.toLowerCase?.().trim().replace(/\s+/g, '_') || order.payment_method;

        console.log('Invoice Generator - Order payment_method:', rawPaymentMethod);
        console.log('Invoice Generator - Order payment_details:', order.payment_details);
        console.log('Invoice Generator - StoreInfo payment:', storeInfo?.payment);

        // Get payment details from the order itself (snapshot at time of order)
        // Use only fields that exist on the Order type
        let orderPaymentDetails = order.payment_details || null;

        // If not found in main field, check in shipping_address_snapshot
        if (!orderPaymentDetails && order.shipping_address_snapshot && typeof order.shipping_address_snapshot === 'object') {
          orderPaymentDetails = order.shipping_address_snapshot.payment_details ||
                               order.shipping_address_snapshot.payment_info;
        }

        // Fallback to storeInfo payment details (current settings)
        // Ensure we handle both snake_case (DB) and camelCase (App) property names
        const rawData = orderPaymentDetails || storeInfo?.payment || {};
        const paymentData: any = { ...rawData };
        
        // Normalize keys to camelCase for consistent access
        if (paymentData.bank_name) paymentData.bankName = paymentData.bank_name;
        if (paymentData.bank_account_number) paymentData.bankAccountNumber = paymentData.bank_account_number;
        if (paymentData.bank_account_name) paymentData.bankAccountName = paymentData.bank_account_name;
        if (paymentData.ewallet_provider) paymentData.ewalletProvider = paymentData.ewallet_provider;
        if (paymentData.ewallet_number) paymentData.ewalletNumber = paymentData.ewallet_number;
        if (paymentData.qris_image) paymentData.qrisImage = paymentData.qris_image;
        if (paymentData.qris_name) paymentData.qrisName = paymentData.qris_name;
        if (paymentData.qris_nmid) paymentData.qrisNmid = paymentData.qris_nmid;

        console.log('Invoice Payment Debug:', {
          rawPaymentMethod,
          paymentMethod,
          paymentData,
          orderPaymentDetails,
          hasPaymentDetails: !!order.payment_details
        });

        // Determine what to show - always display payment section if we have payment data
        let paymentTitle = '';
        let paymentDetailsContent = '';

        // Handle each payment method with comprehensive checks - PRIORITIZE the actual payment method used
        const pm = paymentMethod?.replace(/-/g, '_') || '';
        
        if (rawPaymentMethod && pm.includes('cash')) {
          paymentTitle = 'Cash Payment';
          paymentDetailsContent = '<p style="margin: 0; font-size: 13px; color: #666;">Payment received in cash</p>';
        } else if (rawPaymentMethod && (pm === 'bank_transfer' || pm.includes('bank'))) {
          paymentTitle = 'Bank Transfer';
          // Always show bank details section for bank_transfer payment method
          paymentDetailsContent = '<div style="background-color: #e8f4fc; padding: 15px; border-radius: 6px; display: inline-block; text-align: left; width: 100%;">' +
            '<p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Bank:</strong> ' + (paymentData?.bankName || '-') + '</p>' +
            '<p style="margin: 0 0 8px 0; font-size: 15px; font-family: monospace;"><strong>Account No:</strong> ' + (paymentData?.bankAccountNumber || '-') + '</p>' +
            '<p style="margin: 0; font-size: 13px;"><strong>Account Name:</strong> ' + (paymentData?.bankAccountName || '-') + '</p>' +
            '</div>';
        } else if (rawPaymentMethod && (pm === 'ewallet' || pm.includes('wallet'))) {
          paymentTitle = 'E-Wallet';
          // Always show ewallet details section for ewallet payment method
          paymentDetailsContent = '<div style="background-color: #f3e8fc; padding: 15px; border-radius: 6px; display: inline-block; text-align: left; width: 100%;">' +
            '<p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Provider:</strong> ' + (paymentData?.ewalletProvider || '-') + '</p>' +
            '<p style="margin: 0; font-size: 15px; font-family: monospace;"><strong>Number:</strong> ' + (paymentData?.ewalletNumber || '-') + '</p>' +
            '</div>';
        } else if (rawPaymentMethod && (pm === 'qris' || pm.includes('qris'))) {
          paymentTitle = 'QRIS';
          // Always show QRIS section for qris payment method
          let qrisContent = '';
          if (paymentData?.qrisImage) {
            const qrisImageUrl = paymentData.qrisImage;
            qrisContent += '<img src="' + qrisImageUrl + '" alt="QRIS Code" style="max-width: 150px; max-height: 150px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />';
          }
          qrisContent += '<p style="margin: 0 0 5px 0; font-size: 13px;"><strong>Name:</strong> ' + (paymentData?.qrisName || '-') + '</p>';
          qrisContent += '<p style="margin: 0; font-size: 12px; font-family: monospace; color: #666;">NMID: ' + (paymentData?.qrisNmid || '-') + '</p>';
          paymentDetailsContent = '<div style="background-color: #fff8e8; padding: 15px; border-radius: 6px; display: inline-block; text-align: left; width: 100%;">' + qrisContent + '</div>';
        }

        // Only show available payment methods if NO specific payment method was used
        if (!rawPaymentMethod && paymentData) {
          // The order has no specific payment method used, so show available options
          const availableMethods = [];
          if (paymentData.bankTransferEnabled) availableMethods.push('Bank Transfer');
          if (paymentData.ewalletEnabled) availableMethods.push('E-Wallet');
          if (paymentData.qrisEnabled) availableMethods.push('QRIS');

          if (availableMethods.length > 0) {
            paymentTitle = 'Available Payment Methods';
            paymentDetailsContent = '<div style="background-color: #f0f0f0; padding: 15px; border-radius: 6px; display: inline-block; text-align: left; width: 100%;">' +
              '<p style="margin: 0 0 5px 0; font-size: 13px;">Methods available: ' + availableMethods.join(', ') + '</p>' +
              '</div>';
          }
        }

        // If we have a payment method but no details were generated, at least show the method used
        if (rawPaymentMethod && !paymentDetailsContent) {
          paymentTitle = 'Payment Method Used';
          paymentDetailsContent = '<p style="margin: 0; font-size: 14px; color: #666;"><strong>Type:</strong> ' + rawPaymentMethod + '</p>';
          console.log('No specific details found for payment method:', rawPaymentMethod, 'Payment data:', paymentData);
        }

        // Display the payment section if we have any title or details
        if (paymentTitle || paymentDetailsContent) {
          return '<div style="margin-top: 30px; text-align: center; padding: 20px; background-color: #f8f8f8; border-radius: 8px; width: 100%;">' +
            '<p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #8B4513;">' + (paymentTitle || 'Payment Information') + '</p>' +
            paymentDetailsContent +
            '</div>';
        }

        // If we have payment method but no section was created, ensure at least basic info shows
        if (rawPaymentMethod) {
          console.log('Payment method exists but no section created - raw value:', rawPaymentMethod, 'processed:', paymentMethod);
          return '<div style="margin-top: 30px; text-align: center; padding: 20px; background-color: #f8f8f8; border-radius: 8px; width: 100%;">' +
            '<p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #8B4513;">Payment Method Used</p>' +
            '<p style="margin: 0; font-size: 14px; color: #666;"><strong>Type:</strong> ' + rawPaymentMethod + '</p>' +
            '</div>';
        }

        // Return empty string if no payment info to display
        return '';
      })()}

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
