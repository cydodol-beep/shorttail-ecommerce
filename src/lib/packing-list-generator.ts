import { jsPDF } from 'jspdf';
import type { Order } from '@/store/orders-store';

export function generatePackingListPDF(order: Order, storeInfo: any): jsPDF {
  const doc = new jsPDF();
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get courier logo URL based on courier name
  const getCourierLogo = (courier: string | undefined) => {
    if (!courier) return '';
    const courierName = courier.toLowerCase();
    if (courierName.includes('jne')) return 'https://upload.wikimedia.org/wikipedia/commons/9/92/New_Logo_JNE.png';
    if (courierName.includes('jnt') || courierName.includes('j&t')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Logo_JnT.png/640px-Logo_JnT.png';
    if (courierName.includes('sicepat')) return 'https://sicepat.com/wp-content/themes/sicepat/img/logo.png';
    if (courierName.includes('pos')) return 'https://www.posindonesia.co.id/assets/images/logo.png';
    if (courierName.includes('tiki')) return 'https://www.tiki.id/assets/images/logo-tiki.png';
    return '';
  };

  let yPos = 20;

  // Header - Two Column Layout
  // Left Column: Store Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(storeInfo?.store_name || 'shorttail.id', 20, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(storeInfo?.store_address || '', 20, yPos);
  
  yPos += 5;
  if (storeInfo?.store_province || storeInfo?.store_postal_code) {
    const locationText = [storeInfo?.store_province, storeInfo?.store_postal_code].filter(Boolean).join(', ');
    doc.text(locationText, 20, yPos);
    yPos += 5;
  }
  doc.text(`Phone: ${storeInfo?.store_phone || '-'}`, 20, yPos);

  // Right Column: Courier Name, Order Info
  let rightYPos = 20;

  // Courier Name (30px = ~22pt in PDF)
  const courierName = order.shipping_courier ||
    (order.shipping_address_snapshot?.courier ||
     order.shipping_address_snapshot?.shipping_courier_name ||
     order.shipping_courier_name);

  if (courierName) {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(courierName, 190, rightYPos, { align: 'right' });
    rightYPos += 10;
  }

  // Order Number and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order #${order.id.slice(0, 8).toUpperCase()}`, 190, rightYPos, { align: 'right' });
  rightYPos += 5;
  doc.text(formatDate(order.created_at), 190, rightYPos, { align: 'right' });

  // Sync yPos with the longer column
  yPos = Math.max(yPos, rightYPos) + 10;

  // Separator line
  doc.setDrawColor(160, 147, 142);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  
  // Title - Centered
  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PACKING LIST', 105, yPos, { align: 'center' });
  
  // Ship To Section - Centered with 15px (11pt) bold
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ship To:', 105, yPos, { align: 'center' });

  yPos += 6;

  // Determine recipient data based on order source
  const recipientName = order.recipient_name || order.user_name ||
    (order.shipping_address_snapshot?.recipient_name) ||
    (order.shipping_address_snapshot?.name) ||
    'Walk-in Customer';

  doc.text(recipientName, 105, yPos, { align: 'center' });

  // Construct contact information
  let contactInfoParts = [];
  if (order.recipient_phone) contactInfoParts.push(order.recipient_phone);
  if (order.user_email) contactInfoParts.push(order.user_email);
  if (order.shipping_address_snapshot?.recipient_phone) contactInfoParts.push(order.shipping_address_snapshot.recipient_phone);

  if (contactInfoParts.length > 0) {
    yPos += 5;
    const contactInfo = contactInfoParts.join(' | ');
    doc.text(contactInfo, 105, yPos, { align: 'center' });
  }

  // Determine address information based on available data
  let addressParts = [];

  if (order.recipient_address) {
    addressParts.push(order.recipient_address);
  } else if (order.shipping_address_snapshot?.address_line1) {
    addressParts.push(order.shipping_address_snapshot.address_line1);
  }

  if (order.shipping_address_snapshot?.city) {
    addressParts.push(order.shipping_address_snapshot.city);
  }
  if (order.shipping_address_snapshot?.region || order.shipping_address_snapshot?.province) {
    const region = order.shipping_address_snapshot.region || order.shipping_address_snapshot.province;
    addressParts.push(region);
  }
  if (order.shipping_address_snapshot?.postal_code) {
    addressParts.push(order.shipping_address_snapshot.postal_code);
  }

  if (addressParts.length > 0) {
    yPos += 5;
    const fullAddress = addressParts.join(', ');
    const addressLines = doc.splitTextToSize(fullAddress, 120);
    doc.text(addressLines, 105, yPos, { align: 'center' });
    yPos += (addressLines.length - 1) * 5;
  }

  // Check for recipient province in both direct field and shipping snapshot
  const recipientProvince = order.recipient_province ||
    (order.shipping_address_snapshot?.region || order.shipping_address_snapshot?.province);

  if (recipientProvince) {
    yPos += 5;
    doc.text(recipientProvince, 105, yPos, { align: 'center' });
  }
  
  // Items Table
  yPos += 12;
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Item Name', 22, yPos);
  doc.text('Variant', 110, yPos);
  doc.text('Qty', 160, yPos);
  doc.text('✓', 180, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  // Items
  order.items?.forEach((item, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPos - 5, 170, 8, 'F');
    }
    
    const productName = doc.splitTextToSize(item.product_name, 85);
    doc.text(productName, 22, yPos);
    
    // Show variant prominently if it exists
    const variantName = item.variant_name || '-';
    const variantText = doc.splitTextToSize(variantName, 45);
    
    // If variant exists, make it bold
    if (item.variant_name) {
      doc.setFont('helvetica', 'bold');
      doc.text(variantText, 110, yPos);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setTextColor(150);
      doc.text(variantText, 110, yPos);
      doc.setTextColor(0);
    }
    
    doc.text(item.quantity.toString(), 160, yPos);
    
    // Checkbox
    doc.rect(178, yPos - 4, 5, 5);
    
    yPos += Math.max(productName.length, variantText.length) * 6 + 2;
  });
  
  // Summary
  yPos += 10;
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setDrawColor(0);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Total Items: ${order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}`, 22, yPos);
  doc.text(`Total Products: ${order.items?.length || 0}`, 100, yPos);
  
  // Customer Notes
  if (order.customer_notes) {
    yPos += 15;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(255, 251, 240);
    doc.rect(20, yPos - 5, 170, 0, 'F'); // Will adjust height after text
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(139, 69, 19);
    doc.text('Special Requests:', 22, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0);
    const notesLines = doc.splitTextToSize(order.customer_notes, 166);
    doc.text(notesLines, 22, yPos);
    
    const notesHeight = notesLines.length * 5 + 10;
    doc.setFillColor(255, 251, 240);
    doc.rect(20, yPos - 11, 170, notesHeight, 'F');
    doc.setDrawColor(139, 69, 19);
    doc.setLineWidth(2);
    doc.line(20, yPos - 11, 20, yPos - 11 + notesHeight);
    
    // Redraw text over background
    doc.setTextColor(139, 69, 19);
    doc.setFont('helvetica', 'bold');
    doc.text('Special Requests:', 22, yPos - 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(notesLines, 22, yPos);
    
    yPos += notesLines.length * 5 + 5;
  }
  
  // Thank you message
  yPos += 20;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const thankYouText = `Thank you for your order! If you have any questions, please contact us at ${storeInfo?.store_phone || '-'}`;
  const thankYouLines = doc.splitTextToSize(thankYouText, 170);
  doc.text(thankYouLines, 105, yPos, { align: 'center' });
  
  // Footer note
  yPos += (thankYouLines.length * 5) + 5;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('Please verify all items against this packing list before shipping.', 105, 285, { align: 'center' });
  
  return doc;
}

export function downloadPackingList(pdf: jsPDF, orderId: string) {
  pdf.save(`packing-list-${orderId.slice(0, 8)}.pdf`);
}
