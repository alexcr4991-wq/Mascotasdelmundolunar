import React, { useState } from 'react';
import { Stethoscope, Sparkles, Send, X, Dog, Cat, MessageSquare, ShoppingBag, Check } from 'lucide-react';
import { Product, ContactInfo } from '../types';
import { formatCOP } from '../utils/formatters';

interface VirtualVetModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  contactInfo: ContactInfo;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onAddToCart: (product: Product, variantId?: string) => void;
}

interface ChatMessage {
  sender: 'user' | 'vet';
  text: string;
  recommendedProduct?: Product;
}

export const VirtualVetModal: React.FC<VirtualVetModalProps> = ({
  isOpen,
  onClose,
  products,
  contactInfo,
  showToast,
  onAddToCart,
}) => {
  const [petType, setPetType] = useState<'perro' | 'gato'>('perro');
  const [petAge, setPetAge] = useState('2 años');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'vet',
      text: '¡Hola! 🐾 Soy el Asesor Veterinario y Nutricional Virtual de *Lunary World Pets*. ¿Qué duda tienes sobre la salud, alimentación o comportamiento de tu peludo hoy?',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userText = question.trim();
    const newMessages = [...messages, { sender: 'user' as const, text: userText }];
    setMessages(newMessages);
    setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/virtual-vet/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petType,
          petAge,
          question: userText,
          catalog: products.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, desc: p.description })),
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        let matchingProduct: Product | undefined = undefined;
        if (data.recommendedProductId) {
          matchingProduct = products.find(p => p.id === data.recommendedProductId);
        }
        if (!matchingProduct && products.length > 0) {
          matchingProduct = products[0];
        }

        setMessages([
          ...newMessages,
          {
            sender: 'vet',
            text: data.answer || 'Te recomiendo mantener una dieta balanceada y agua fresca disponible.',
            recommendedProduct: matchingProduct,
          },
        ]);
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (err) {
      // Intelligent fallback
      const lowerQ = userText.toLowerCase();
      let matchedProd = products.find(p => p.category.toLowerCase().includes('alimento') || p.name.toLowerCase().includes('concentrado'));
      let responseText = `Para tu ${petType} de ${petAge}: Es importante asegurar hidratación constante y observación veterinaria si persisten los síntomas.`;

      if (lowerQ.includes('comida') || lowerQ.includes('alimento') || lowerQ.includes('hambre') || lowerQ.includes('concentrado')) {
        responseText = `Para la alimentación óptima de tu ${petType}, te recomendamos nuestro concentrado y alimento super premium con alta digestibilidad.`;
      } else if (lowerQ.includes('pulgas') || lowerQ.includes('garrapata') || lowerQ.includes('parásito')) {
        responseText = `Para protección contra pulgas y garrapatas, contamos con pastillas y antipulgas de acción rápida aprobados por veterinarios.`;
        matchedProd = products.find(p => p.name.toLowerCase().includes('pulga') || p.name.toLowerCase().includes('pipeta') || p.category.toLowerCase().includes('medicamento')) || products[0];
      } else if (lowerQ.includes('cama') || lowerQ.includes('dormir') || lowerQ.includes('descanso')) {
        responseText = `Para un descanso reparador y protección articular, una cama ortopédica es la mejor opción.`;
        matchedProd = products.find(p => p.name.toLowerCase().includes('cama')) || products[0];
      }

      setMessages([
        ...newMessages,
        {
          sender: 'vet',
          text: responseText,
          recommendedProduct: matchedProd,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E3D9] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#1C2722] to-[#2A3B34] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold">Veterinario Virtual & Nutricionista AI</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">24/7</span>
              </div>
              <p className="text-xs text-[#A3B8B0]">Orientación experta y recomendación instantánea de productos en Colombia.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pet Selector Bar */}
        <div className="bg-[#FAF8F5] px-6 py-3 border-b border-[#E8E3D9] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1C2722]">Mascota:</span>
            <button
              onClick={() => setPetType('perro')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                petType === 'perro' ? 'bg-[#1C2722] text-white shadow-xs' : 'bg-white text-neutral-600 border border-[#D5CFC4]'
              }`}
            >
              <Dog className="w-3.5 h-3.5" /> Perro
            </button>
            <button
              onClick={() => setPetType('gato')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                petType === 'gato' ? 'bg-[#1C2722] text-white shadow-xs' : 'bg-white text-neutral-600 border border-[#D5CFC4]'
              }`}
            >
              <Cat className="w-3.5 h-3.5" /> Gato
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1C2722]">Edad:</span>
            <select
              value={petAge}
              onChange={(e) => setPetAge(e.target.value)}
              className="text-xs py-1 px-2.5 rounded-xl border border-[#D5CFC4] bg-white font-medium text-[#1C2722]"
            >
              <option value="Cachorro (< 1 año)">Cachorro (&lt; 1 año)</option>
              <option value="1 a 3 años">1 a 3 años</option>
              <option value="4 a 7 años">4 a 7 años (Adulto)</option>
              <option value="Senior (> 8 años)">Senior (&gt; 8 años)</option>
            </select>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#1C2722] text-white rounded-br-xs'
                    : 'bg-[#FAF8F5] border border-[#E8E3D9] text-[#1C2722] rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {msg.recommendedProduct && (
                  <div className="mt-3 pt-3 border-t border-[#E8E3D9] bg-white p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <img
                      src={msg.recommendedProduct.imageUrl}
                      alt={msg.recommendedProduct.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block">Recomendación Experta</span>
                      <h5 className="font-extrabold text-xs text-[#1C2722] truncate">{msg.recommendedProduct.name}</h5>
                      <span className="font-black text-emerald-800 text-xs">{formatCOP(msg.recommendedProduct.price)}</span>
                    </div>
                    <button
                      onClick={() => {
                        onAddToCart(msg.recommendedProduct!);
                        showToast(`¡${msg.recommendedProduct!.name} agregado al carrito!`, 'success');
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shrink-0 shadow-xs flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Comprar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-[#FAF8F5] p-3 rounded-2xl w-fit">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Analizando síntomas y consultando catálogo veterinario...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-[#FAF8F5] border-t border-[#E8E3D9] flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Pregúntale al veterinario sobre tu ${petType} (ej: ¿Qué concentrado le doy?, tiene picazón...)...`}
            className="flex-1 text-xs px-4 py-3 rounded-2xl border border-[#D5CFC4] bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-5 py-3 rounded-2xl bg-[#1C2722] hover:bg-[#2A3B34] text-white font-black text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <span>Preguntar</span>
            <Send className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </form>
      </div>
    </div>
  );
};
