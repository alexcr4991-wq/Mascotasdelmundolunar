import React, { useState } from 'react';
import { Search, Package, CheckCircle2, Clock, Truck, X, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Order, ContactInfo } from '../types';
import { formatCOP, formatDate } from '../utils/formatters';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  contactInfo: ContactInfo;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  contactInfo,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      showToast('Ingresa un número de pedido o teléfono', 'warning');
      return;
    }

    const cleanQuery = searchTerm.trim().toLowerCase().replace('#', '');
    const matched = orders.find(
      (o) =>
        o.orderNumber.toLowerCase().includes(cleanQuery) ||
        o.customerPhone.includes(cleanQuery) ||
        o.customerName.toLowerCase().includes(cleanQuery)
    );

    setSearched(true);
    if (matched) {
      setFoundOrder(matched);
      showToast('¡Pedido encontrado!', 'success');
    } else {
      setFoundOrder(null);
      showToast('No se encontró ningún pedido con ese número o teléfono', 'info');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pagado':
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Pago Aprobado (Preparando Envío)</span>;
      case 'en_camino':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> En Camino a tu Dirección</span>;
      case 'entregado':
        return <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Entregado con Éxito</span>;
      case 'pendiente':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pendiente de Pago (Wompi / Nequi)</span>;
      case 'cancelado':
      case 'rechazado':
        return <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Cancelado / Rechazado</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-[#E8E3D9] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E3D9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#1C2722]">
                Rastreo de Pedido en Tiempo Real
              </h3>
              <p className="text-xs text-[#5F6360]">
                Consulta el estado de tu despacho, guía de transporte y pago en Colombia.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-neutral-200 text-[#5F6360] flex items-center justify-center font-bold text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1C2722]">
              Ingresa tu Número de Pedido o Teléfono Celular
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ej: LUN-1042 o 3214231616"
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-sm shrink-0"
              >
                Buscar Pedido
              </button>
            </div>
          </div>
        </form>

        {searched && foundOrder && (
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E3D9] space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5CFC4]">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Pedido #{foundOrder.orderNumber}</span>
                <h4 className="text-sm font-extrabold text-[#1C2722]">{foundOrder.customerName}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-neutral-500 block">{formatDate(foundOrder.createdAt)}</span>
                <strong className="text-sm font-black text-[#1C2722]">{formatCOP(foundOrder.total)}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600">Estado del Envío y Pago:</span>
                {getStatusBadge(foundOrder.status)}
              </div>
              <div className="text-xs text-neutral-600 bg-white p-3 rounded-xl border border-[#E8E3D9]">
                <p>📍 <strong>Destino:</strong> {foundOrder.customerAddress}, {foundOrder.customerCity}</p>
                <p>💳 <strong>Método de Pago:</strong> {foundOrder.paymentMethod.toUpperCase()} {foundOrder.wompiStatus ? `(${foundOrder.wompiStatus})` : ''}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700 block">Productos en tu pedido:</span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {foundOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl text-xs border border-[#E8E3D9]">
                    <div className="flex items-center gap-2">
                      <img src={item.imageUrl} alt={item.productName} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-[#1C2722] line-clamp-1">{item.productName}</p>
                        <span className="text-[10px] text-neutral-500">Cant: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-800">{formatCOP(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={`https://wa.me/57${(contactInfo.whatsapp || '3214231616').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, quiero consultar el estado de mi pedido #${foundOrder.orderNumber}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <span>💬 Consultar Soporte por WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {searched && !foundOrder && (
          <div className="text-center py-6 bg-[#FAF8F5] rounded-2xl border border-[#E8E3D9]">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-[#1C2722]">No encontramos coincidencias</h4>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">
              Verifica que el número de pedido tenga el formato correcto o escríbenos directamente a nuestro WhatsApp para ayudarte con tu guía.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-[#E8E3D9] flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Seguridad garantizada • Envíos a toda Colombia 🇨🇴</span>
        </div>
      </div>
    </div>
  );
};
