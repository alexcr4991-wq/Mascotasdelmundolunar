import { Order, Product } from '../types';

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '321 423 1616';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString || '';
  }
}

/**
 * Builds direct WhatsApp URL for an instant order with prefilled cart details, customer data, and Nequi payment reference.
 */
export function buildOrderWhatsAppUrl(
  phone: string = '',
  order: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    items: { productName: string; variantName?: string; quantity: number; price: number; total: number }[];
    total: number;
    deliveryFee: number;
    paymentMethod: string;
    paymentReference?: string;
    wompiPaymentLink?: string;
    customerNotes?: string;
  }
): string {
  const cleanPhone = (phone || '').replace(/\D/g, '') || '3214231616';
  // Format Colombian country code 57 if not present
  const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

  let message = `🐾 *¡HOLA! DESEO REALIZAR UN PEDIDO EN LUNARY WORLD PETS*\n\n`;
  message += `👤 *Cliente:* ${order.customerName}\n`;
  message += `📱 *Teléfono:* ${order.customerPhone}\n`;
  message += `📍 *Dirección de Entrega:* ${order.customerAddress}\n`;
  message += `🏙️ *Ciudad:* ${order.customerCity}\n\n`;

  message += `🛒 *RESUMEN DE PRODUCTOS:*\n`;
  order.items.forEach((item, idx) => {
    const variantStr = item.variantName ? ` [${item.variantName}]` : '';
    message += `${idx + 1}. ${item.productName}${variantStr} x${item.quantity} = ${formatCOP(item.total)}\n`;
  });

  if (order.deliveryFee > 0) {
    message += `🚚 *Domicilio:* ${formatCOP(order.deliveryFee)}\n`;
  } else {
    message += `🚚 *Domicilio:* ¡GRATIS! 🎉\n`;
  }

  message += `\n💰 *TOTAL A PAGAR:* *${formatCOP(order.total)}*\n`;
  message += `💳 *Método de Pago:* ${order.paymentMethod.toUpperCase()}\n`;

  if (order.paymentReference) {
    message += `🔖 *Referencia / ID de Transacción:* ${order.paymentReference}\n`;
  }

  if (order.paymentMethod === 'wompi' && order.wompiPaymentLink) {
    message += `🔗 *Link de Pago Wompi:* ${order.wompiPaymentLink}\n`;
  }

  if (order.customerNotes) {
    message += `📝 *Nota adicional:* ${order.customerNotes}\n`;
  }

  message += `\n_Quedo atento a la confirmación del despacho. ¡Muchas gracias!_`;

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Gets direct product URL for sharing on WhatsApp, Instagram, TikTok or Facebook
 */
export function getProductShareUrl(productId: string): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/producto/${productId}`;
  }
  return `https://ais-pre-plhylrlm7ulcetruuzpnp5-668220432504.us-east1.run.app/producto/${productId}`;
}

/**
 * Builds direct product WhatsApp inquiry URL with product link
 */
export function buildProductInquiryWhatsAppUrl(phone: string = '', product: Product): string {
  const cleanPhone = (phone || '').replace(/\D/g, '') || '3214231616';
  const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  const directLink = getProductShareUrl(product.id);

  const message = `🐾 *¡Hola! Estoy interesado en este producto de LUNARY WORLD PETS:*\n\n` +
    `📌 *Producto:* ${product.name}\n` +
    `💰 *Precio:* ${formatCOP(product.price)}\n` +
    `🏷️ *Categoría:* ${product.category}\n` +
    `🐶 *Mascota:* ${product.petType === 'perro' ? 'Perro' : product.petType === 'gato' ? 'Gato' : 'Perros y Gatos'}\n` +
    `🔗 *Ver y Comprar Directo:* ${directLink}\n\n` +
    `¿Tienen disponibilidad para envío inmediato? ¡Gracias!`;

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}
