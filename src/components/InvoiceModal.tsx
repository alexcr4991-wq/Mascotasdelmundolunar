import React, { useRef } from 'react';
import {
  X,
  Printer,
  Send,
  Download,
  FileCheck,
  Building2,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ContactInfo, Order } from '../types';
import { formatCOP, formatDate, formatPhoneNumber } from '../utils/formatters';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  contactInfo: ContactInfo;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  contactInfo,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendInvoiceWhatsApp = () => {
    let itemsText = order.items
      .map((it) => `• ${it.productName} (x${it.quantity}) - ${formatCOP(it.total)}`)
      .join('\n');

    const text = `🧾 *COMPROBANTE DE COMPRA - LUNARY WORLD PETS*\n` +
      `-----------------------------------------\n` +
      `📋 *Orden:* #${order.orderNumber}\n` +
      `📅 *Fecha:* ${formatDate(order.createdAt)}\n` +
      `👤 *Cliente:* ${order.customerName}\n` +
      `📱 *Teléfono:* ${order.customerPhone}\n` +
      `📍 *Entrega:* ${order.customerAddress}, ${order.customerCity || 'Colombia'}\n` +
      `-----------------------------------------\n` +
      `🛒 *PRODUCTOS:*\n${itemsText}\n` +
      `-----------------------------------------\n` +
      `Subtotal: ${formatCOP(order.subtotal)}\n` +
      (order.discountAmount ? `Descuento: -${formatCOP(order.discountAmount)}\n` : '') +
      `Envío Domicilio: ${order.deliveryFee === 0 ? 'GRATIS' : formatCOP(order.deliveryFee)}\n` +
      `*TOTAL:* ${formatCOP(order.total)}\n` +
      `*Método:* ${order.paymentMethod.toUpperCase()}` +
      (order.paymentReference ? ` (Ref: ${order.paymentReference})` : '') +
      `\n\n🐾 ¡Gracias por confiar en Lunary World Pets para consentir a tu mascota!`;

    const cleanPhone = (order.customerPhone || contactInfo?.whatsapp || '3214231616').replace(/\D/g, '');
    const url = `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="invoice-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="invoice-modal-container"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#ECE5DD] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Top Control Bar (Hidden during window.print via print:hidden) */}
        <div className="p-4 bg-[#18231E] text-white flex items-center justify-between border-b border-[#2A3B33] print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Comprobante Digital de Venta #{order.orderNumber}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              title="Imprimir o guardar PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={handleSendInvoiceWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors"
              title="Enviar por WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enviar WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div ref={printRef} className="p-6 sm:p-8 space-y-6 bg-white overflow-y-auto max-h-[80vh] text-[#1C1F1E]">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#ECE5DD] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-[0.2em] text-[#1C1F1E]">
                  LUNARY
                </span>
                <span className="text-lg">🐾</span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#787E7A] uppercase">
                WORLD PETS COLOMBIA
              </p>
              <p className="text-xs text-[#5F6360] mt-1">
                WhatsApp de Atención: <strong>{formatPhoneNumber(contactInfo.whatsapp)}</strong>
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-[#FAF8F5] border border-[#ECE5DD] text-[#B97A48]">
                ORDEN #{order.orderNumber}
              </span>
              <p className="text-xs text-[#787E7A] mt-1">
                Fecha: {formatDate(order.createdAt)}
              </p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5">
                Estado: {order.status === 'pagado' ? '✅ Pagado (Confirmado)' : order.status.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Customer & Delivery details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] text-xs">
            <div>
              <span className="text-[11px] font-bold text-[#787E7A] uppercase block mb-1">
                Datos del Comprador:
              </span>
              <p className="font-bold text-[#1C1F1E] text-sm">{order.customerName}</p>
              <p className="text-[#5F6360] mt-0.5">Teléfono: {formatPhoneNumber(order.customerPhone)}</p>
              {order.customerEmail && <p className="text-[#5F6360]">Email: {order.customerEmail}</p>}
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#787E7A] uppercase block mb-1">
                Dirección de Despacho:
              </span>
              <p className="font-semibold text-[#1C1F1E]">{order.customerAddress}</p>
              <p className="text-[#5F6360]">{order.customerCity || 'Colombia'}</p>
              {order.customerNotes && (
                <p className="text-[11px] text-[#B97A48] italic mt-1">
                  Nota: &quot;{order.customerNotes}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#ECE5DD] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#ECE5DD] text-[#787E7A] font-bold">
                <tr>
                  <th className="p-3">Producto / Presentación</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3 text-right">Precio Unit.</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5DD]">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]/50">
                    <td className="p-3 font-semibold text-[#1C1F1E]">{item.productName}</td>
                    <td className="p-3 text-center font-bold text-[#1C1F1E]">x{item.quantity}</td>
                    <td className="p-3 text-right text-[#5F6360]">{formatCOP(item.price)}</td>
                    <td className="p-3 text-right font-bold text-[#1C1F1E]">{formatCOP(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-[#686D6A]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#1C1F1E]">{formatCOP(order.subtotal)}</span>
              </div>

              {order.discountAmount ? (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Descuento Auto-Envío (5%):</span>
                  <span>-{formatCOP(order.discountAmount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-[#686D6A]">
                <span>Envío Domicilio:</span>
                <span className="font-semibold text-[#1C1F1E]">
                  {order.deliveryFee === 0 ? <strong className="text-emerald-700">GRATIS</strong> : formatCOP(order.deliveryFee)}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-[#1C1F1E] border-t border-[#ECE5DD] pt-2">
                <span>Total a Pagar:</span>
                <span className="text-[#B97A48]">{formatCOP(order.total)}</span>
              </div>

              <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#ECE5DD] mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#787E7A]">Método de Pago:</span>
                  <span className="font-bold text-[#1C1F1E] uppercase">{order.paymentMethod === 'wompi' ? 'Pasarela Wompi (Bancolombia/PSE/Tarjetas)' : order.paymentMethod}</span>
                </div>
                {order.wompiTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-[#787E7A]">ID Transacción Wompi:</span>
                    <span className="font-mono font-bold text-emerald-700">{order.wompiTransactionId}</span>
                  </div>
                )}
                {order.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-[#787E7A]">Ref. Comprobante / Pago:</span>
                    <span className="font-mono font-bold text-emerald-700">{order.paymentReference}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-[#ECE5DD] space-y-1">
            <p className="text-xs font-bold text-[#1C1F1E]">
              ¡Muchas gracias por tu compra en Lunary World Pets! 🐾
            </p>
            <p className="text-[11px] text-[#787E7A]">
              Para cualquier consulta sobre tu despacho, contáctanos por WhatsApp al {formatPhoneNumber(contactInfo.whatsapp)}.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
