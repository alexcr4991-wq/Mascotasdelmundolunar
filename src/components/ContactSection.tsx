import React, { useState } from 'react';
import { Phone, MessageCircle, Mail, MapPin, Clock, Send, CheckCircle2, ShieldCheck, CreditCard, ExternalLink, Lock } from 'lucide-react';
import { ContactInfo, CustomerLead } from '../types';
import { formatPhoneNumber } from '../utils/formatters';

interface ContactSectionProps {
  contactInfo: ContactInfo;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onNewCustomerLead?: (lead: CustomerLead) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ contactInfo, showToast, onNewCustomerLead }) => {
  const [name, setName] = useState('');
  const [petName, setPetName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      showToast('Por favor completa tu nombre, teléfono y mensaje.', 'warning');
      return;
    }

    // Save lead into local database so customer info is never lost
    const newLead: CustomerLead = {
      id: `lead_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      petName: petName.trim() || undefined,
      message: message.trim(),
      status: 'nuevo',
      createdAt: new Date().toISOString(),
      source: 'formulario_contacto',
    };

    if (onNewCustomerLead) {
      onNewCustomerLead(newLead);
    }

    // Build WhatsApp URL to 3214231616
    const cleanPhone = (contactInfo?.whatsapp || '3214231616').replace(/\D/g, '');
    const text = `🐾 *Mensaje desde formulario de contacto Lunary World Pets:*\n\n` +
      `👤 *Nombre:* ${name}\n` +
      `🐶 *Mascota:* ${petName || 'Perro / Gato'}\n` +
      `📱 *Teléfono:* ${phone}\n` +
      `💬 *Mensaje:* ${message}`;

    window.open(`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    setSent(true);
    setName('');
    setPetName('');
    setPhone('');
    setMessage('');
    showToast('¡Mensaje guardado en base de datos y enviado a WhatsApp!', 'success');
  };

  const wompiUrl = contactInfo.wompiPaymentLink || 'https://checkout.wompi.co/l/VPOS_Qn5COa';

  return (
    <div id="contact-us-section" className="py-12 sm:py-16 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE7DF] text-[#1C1F1E] text-xs font-bold uppercase tracking-wider">
            <Phone className="w-3.5 h-3.5" />
            <span>Atención Personalizada</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1F1E]">
            ¿Tienes dudas o necesitas asesoría?
          </h2>
          <p className="text-xs sm:text-sm text-[#6C716E]">
            Estamos listos para ayudarte a elegir el mejor alimento o juguete para tu mascota.
          </p>
        </div>

        {/* 2-Column Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Channels & Wompi Gateway Info */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* WhatsApp Big Card */}
            <div className="bg-[#1C2722] text-white p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">WhatsApp Directo</h3>
                  <p className="text-xs text-slate-300">Respuesta promedio en menos de 5 minutos</p>
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {formatPhoneNumber(contactInfo?.whatsapp)}
              </div>

              <a
                href={`https://wa.me/57${(contactInfo?.whatsapp || '3214231616').replace(/\D/g, '')}?text=${encodeURIComponent(
                  '¡Hola Lunary World Pets! Me gustaría recibir asesoría para mi mascota 🐾'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>Chatear por WhatsApp Ahora</span>
              </a>
            </div>

            {/* Wompi Official Gateway Card */}
            <div className="bg-gradient-to-br from-[#1C2722] to-[#2B3B34] text-white p-6 rounded-3xl space-y-3.5 shadow-xl border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Pasarela Oficial Wompi</h4>
                    <p className="text-[11px] text-emerald-300 font-medium">Bancolombia • PSE • Tarjetas</p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> 100% SEGURO
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                Todos tus pedidos en la tienda se cargan automáticamente con su valor exacto al pagar por <strong>PSE / Wompi</strong>. Para pagos personalizados o manuales, también dispones de nuestro datáfono virtual seguro.
              </p>

              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] font-bold text-slate-900 text-center">
                <div className="bg-white/90 p-2 rounded-xl">💳 Tarjetas</div>
                <div className="bg-white/90 p-2 rounded-xl">🏦 PSE</div>
                <div className="bg-white/90 p-2 rounded-xl">🟡 Bancolombia</div>
              </div>

              <a
                href={wompiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102"
              >
                <span>Datáfono Virtual para Pagos Libres</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Address and Schedule */}
            <div className="bg-white p-5 rounded-3xl border border-[#ECE5DD] space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#B97A48] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1C1F1E] block">Cobertura de Envíos:</strong>
                  <span className="text-[#5F6360]">{contactInfo.deliveryCoverage}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-[#ECE5DD] pt-3">
                <Clock className="w-4 h-4 text-[#B97A48] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1C1F1E] block">Horario de Atención:</strong>
                  <span className="text-[#5F6360]">{contactInfo.schedule}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-[#ECE5DD] pt-3">
                <Mail className="w-4 h-4 text-[#B97A48] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1C1F1E] block">Correo Electrónico:</strong>
                  <span className="text-[#5F6360]">{contactInfo.email}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#ECE5DD] shadow-xs space-y-5">
            <div>
              <h3 className="text-xl font-bold text-[#1C1F1E]">Envíanos un Mensaje Directo</h3>
              <p className="text-xs text-[#6C716E]">
                Te responderemos al instante por WhatsApp o correo electrónico.
              </p>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Andrés Ramírez"
                    className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Nombre de tu Mascota (Opcional)
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Ej. Bruno (Golden) / Misi (Gato)"
                    className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                  Tu Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 3123456789"
                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                  ¿En qué podemos ayudarte? *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntanos qué producto buscas, raza, peso o dudas sobre envíos..."
                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                />
              </div>

              <button
                type="submit"
                id="contact-form-submit-btn"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:scale-101 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Consulta a WhatsApp ({contactInfo.whatsapp})</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
