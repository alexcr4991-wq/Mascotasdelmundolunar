import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Stethoscope,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContactInfo, Product, CustomerLead } from '../types';
import { addStoredCustomerLead } from '../services/storage';
import { formatCOP } from '../utils/formatters';

interface CamilaChatWidgetProps {
  contactInfo: ContactInfo;
  products: Product[];
  onOpenCatalog: () => void;
  onOpenCart: () => void;
  onAddToCart: (product: Product) => void;
}

interface ChatMessage {
  id: string;
  sender: 'camila' | 'user';
  text: string;
  time: string;
  options?: Array<{ label: string; value: string }>;
  actionButton?: {
    label: string;
    action: () => void;
    url?: string;
  };
  recommendedProduct?: Product;
}

const MENU_TEXT = `🐾 ¡Hola! Bienvenido a **Lunary World Pets** 🐾
Soy tu asesora independiente. Por favor, selecciona una opción respondiendo con el NÚMERO:

1️⃣ 🛒 Ver Alimentos y Accesorios (Catálogo Web)
2️⃣ 🚑 Consulta rápida sobre bienestar o nutrición con IA
3️⃣ 📲 Hablar con Ventas por WhatsApp (Pedidos especiales)
4️⃣ 📩 Ver canales de soporte (Correo y redes)`;

const MENU_OPTIONS = [
  { label: '1️⃣ Ver Catálogo Web', value: '1' },
  { label: '2️⃣ Consulta Bienestar IA', value: '2' },
  { label: '3️⃣ Ventas por WhatsApp', value: '3' },
  { label: '4️⃣ Canales de Soporte', value: '4' },
];

export const CamilaChatWidget: React.FC<CamilaChatWidgetProps> = ({
  contactInfo,
  products,
  onOpenCatalog,
  onOpenCart,
  onAddToCart,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<'menu' | 'waiting_vet_query' | 'chat'>('menu');
  const [conversationId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem('camila_conv_id');
      if (existing) return existing;
      const newId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem('camila_conv_id', newId);
      return newId;
    } catch {
      return `conv_${Date.now()}`;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('camila_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Default initial greeting
    return [
      {
        id: 'msg_welcome',
        sender: 'camila',
        text: `¡Hola, qué más! 🇨🇴✨ Bienvenido a **Lunary World Pets**.\n\nSoy **Camila**, tu asesora virtual independiente y experta en bienestar animal. ¿Cómo te puedo colaborar hoy?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: MENU_OPTIONS,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, messages]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('camila_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Sync / Save lead to Firestore and Admin CRM
  const syncLeadToCRM = (lastUserMessage: string, contextSummary: string, isSalesIntent = false) => {
    try {
      const leadPayload: CustomerLead = {
        id: `lead_${conversationId}`,
        name: 'Cliente Chat Web Camila',
        phone: contactInfo.phone || '3214231616',
        email: contactInfo.email || 'alex.cr4991@gmail.com',
        city: 'Colombia (Chat Web)',
        message: lastUserMessage,
        status: isSalesIntent ? 'interesado' : 'nuevo',
        source: 'formulario_contacto',
        platform: 'otro',
        queryOrContext: contextSummary,
        notes: `Conversación con Camila (${messages.length} mensajes): ${lastUserMessage}`,
        createdAt: new Date().toISOString(),
        estimatedValue: isSalesIntent ? 120000 : 50000,
      };

      addStoredCustomerLead(leadPayload);
    } catch (err) {
      console.warn('Error sincronizando lead de Camila:', err);
    }
  };

  // Helper to add bot message with typing delay
  const addBotMessage = (
    text: string,
    options?: Array<{ label: string; value: string }>,
    actionButton?: { label: string; action: () => void; url?: string },
    recommendedProduct?: Product
  ) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'camila',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options,
        actionButton,
        recommendedProduct,
      };
      setMessages((prev) => [...prev, newMsg]);
      if (!isOpen) setHasUnread(true);
    }, 700);
  };

  // Handle User Input Submission
  const handleUserSend = async (rawInput: string) => {
    const text = rawInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Case: User says Menu or restart
    if (lower === 'menu' || lower === 'inicio' || lower === 'volver') {
      setCurrentStep('menu');
      addBotMessage(
        `🐾 ¡Hola! Bienvenido a **Lunary World Pets** 🐾\nSoy tu asesora independiente. Por favor, selecciona una opción respondiendo con el NÚMERO:\n\n1️⃣ 🛒 Ver Alimentos y Accesorios (Catálogo Web)\n2️⃣ 🚑 Consulta rápida sobre bienestar o nutrición con IA\n3️⃣ 📲 Hablar con Ventas por WhatsApp (Pedidos especiales)\n4️⃣ 📩 Ver canales de soporte (Correo y redes)`,
        MENU_OPTIONS
      );
      syncLeadToCRM(text, 'Regresó al menú principal');
      return;
    }

    // 1. SI EL USUARIO SALUDA (ej: "Hola", "Buenas", "Como vas")
    if (
      lower.startsWith('hola') ||
      lower.startsWith('buena') ||
      lower.includes('como vas') ||
      lower.includes('como te va') ||
      lower.includes('saludos') ||
      lower.includes('hey') ||
      lower.includes('buenos dias') ||
      lower.includes('buenas tardes') ||
      lower.includes('buenas noches')
    ) {
      setCurrentStep('menu');
      addBotMessage(
        `¡Hola, qué más! 🇨🇴🐾 ¡Bienvenido a **Lunary World Pets**!\n\n${MENU_TEXT}`,
        MENU_OPTIONS
      );
      syncLeadToCRM(text, 'Saludo inicial');
      return;
    }

    // 2. SI EL USUARIO RESPONDE "1" (Catálogo Web)
    if (text === '1' || lower.includes('catalogo') || lower.includes('alimento') || lower.includes('accesorios') || lower.includes('productos')) {
      setCurrentStep('menu');
      addBotMessage(
        `¡De una! 🛒✨ Te comparto el enlace directo a nuestro catálogo web oficial de **Lunary World Pets** con alimentos premium, camas ortopédicas, juguetes y accesorios:\n\n🔗 **https://lunaryworldpet.onrender.com**\n\n¡Todos nuestros envíos van asegurados a toda Colombia con pagos protegidos por Wompi y Nequi!`,
        [
          { label: '🛍️ Ver Catálogo en Pantalla', value: 'ver_catalogo' },
          { label: '📲 Pedir Asesoría por WhatsApp', value: '3' },
          { label: '↩️ Menú Principal', value: 'menu' },
        ],
        {
          label: 'Ir al Catálogo Ahora',
          action: () => {
            onOpenCatalog();
            setIsOpen(false);
          },
          url: 'https://lunaryworldpet.onrender.com',
        }
      );
      syncLeadToCRM(text, 'Interesado en catálogo web', true);
      return;
    }

    // Triggered inside catalog shortcut
    if (text === 'ver_catalogo') {
      onOpenCatalog();
      setIsOpen(false);
      return;
    }

    // 3. SI EL USUARIO RESPONDE "2" (Consulta Bienestar con IA)
    if (text === '2' || lower.includes('consulta') || lower.includes('bienestar') || lower.includes('nutricion') || lower.includes('veterinario')) {
      setCurrentStep('waiting_vet_query');
      addBotMessage(
        `🩺 Cuéntame: ¿Qué le pasa a tu mascota, qué raza es o qué duda tienes? Déjamela aquí abajo 👇`
      );
      syncLeadToCRM(text, 'Inició consulta de bienestar');
      return;
    }

    // 4. SI EL USUARIO RESPONDE "3" (Ventas WhatsApp)
    if (text === '3' || lower.includes('ventas') || lower.includes('whatsapp') || lower.includes('pedidos') || lower.includes('hablar')) {
      setCurrentStep('menu');
      const waUrl = `https://wa.me/573214231616?text=${encodeURIComponent(
        '¡Hola Alex! Vengo desde la tienda Lunary World Pets y quisiera asesoría con un pedido especial para mi mascota 🐾'
      )}`;

      addBotMessage(
        `📲 ¡Con el mayor gusto! Puedes chatear directamente con nuestro equipo de ventas y con Alex para pedidos especiales y asesoría personalizada al WhatsApp:\n\n👉 **+573214231616**\n\nHaz clic abajo para abrir el chat de una vez:`,
        [
          { label: '💬 Abrir WhatsApp Directo', value: 'open_wa' },
          { label: '↩️ Menú Principal', value: 'menu' },
        ],
        {
          label: '💬 Chatear al WhatsApp (+57 321 423 1616)',
          action: () => window.open(waUrl, '_blank'),
          url: waUrl,
        }
      );
      syncLeadToCRM(text, 'Contacto a ventas por WhatsApp (+573214231616)', true);
      return;
    }

    if (text === 'open_wa') {
      const waUrl = `https://wa.me/573214231616?text=${encodeURIComponent(
        '¡Hola Alex! Vengo desde la tienda Lunary World Pets y quisiera asesoría con un pedido especial 🐾'
      )}`;
      window.open(waUrl, '_blank');
      return;
    }

    // 5. SI EL USUARIO RESPONDE "4" (Canales de soporte)
    if (text === '4' || lower.includes('soporte') || lower.includes('contacto') || lower.includes('redes') || lower.includes('correo')) {
      setCurrentStep('menu');
      addBotMessage(
        `📩 ¡Aquí tienes todos nuestros canales oficiales de contacto y soporte en **Lunary World Pets**!\n\n• **Correo electrónico:** alex.cr4991@gmail.com\n• **WhatsApp Directo:** +57 321 423 1616\n• **Instagram:** @lunaryworldpets\n• **Facebook:** Lunary World Pets\n• **YouTube:** Lunary World Pets\n\n¡Cualquier duda que tengas, aquí estamos para consentir a tu mascota!`,
        [
          { label: '📲 Chatear por WhatsApp', value: '3' },
          { label: '🛒 Ver Catálogo Web', value: '1' },
          { label: '↩️ Menú Principal', value: 'menu' },
        ]
      );
      syncLeadToCRM(text, 'Consulta canales de soporte');
      return;
    }

    // 6. FLUJO PASO 2: EL USUARIO ESTÁ RESPONDIENDO SU DUDA DE BIENESTAR / NUTRICIÓN
    if (currentStep === 'waiting_vet_query') {
      setCurrentStep('menu');
      setIsTyping(true);

      // Match products in catalog to suggest
      let matchedProduct = products.find((p) => {
        const name = p.name.toLowerCase();
        const cat = p.category.toLowerCase();
        return (
          lower.includes('comida') && cat === 'alimentos' ||
          lower.includes('alimento') && cat === 'alimentos' ||
          lower.includes('cama') && cat === 'camas' ||
          lower.includes('juguete') && cat === 'juguetes' ||
          lower.includes('pulga') && cat === 'higiene' ||
          name.split(' ').some((word) => word.length > 4 && lower.includes(word))
        );
      });

      if (!matchedProduct && products.length > 0) {
        matchedProduct = products[0];
      }

      // Try AI advice from server or generate intelligent veterinary response
      try {
        const res = await fetch('/api/virtual-vet/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            petType: lower.includes('gato') || lower.includes('felin') ? 'gato' : 'perro',
            petAge: 'adulta',
            question: text,
            catalog: products.slice(0, 10).map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              category: p.category,
              desc: p.description,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsTyping(false);
          if (data?.answer) {
            const finalAdvice = `${data.answer}\n\nTe recomiendo revisar las opciones de nuestra tienda o escribirle directamente a **Alex** para orientarte con la mejor opción para tu peludito.`;
            addBotMessage(
              finalAdvice,
              [
                { label: '🛒 Ver Producto en Tienda', value: '1' },
                { label: '📲 Hablar con Alex por WhatsApp', value: '3' },
                { label: '↩️ Menú', value: 'menu' },
              ],
              undefined,
              matchedProduct
            );
            syncLeadToCRM(text, `Consulta IA de bienestar: ${text}`, true);
            return;
          }
        }
      } catch (err) {
        console.warn('Consulta AI fallback local:', err);
      }

      // Local empathetic advice (max 2 paragraphs as specified)
      setIsTyping(false);
      const advice = `Comprendo totalmente tu inquietud. En estos casos es fundamental priorizar una nutrición equilibrada y mantenerlo bien hidratado y cómodo para cuidar su bienestar y vitalidad.\n\nTe recomiendo darle un vistazo a los alimentos y productos especializados de nuestro catálogo en la web, o contactar a **Alex** por WhatsApp para darte una recomendación puntual según su raza y edad.`;

      addBotMessage(
        advice,
        [
          { label: '🛒 Ver Catálogo Web', value: '1' },
          { label: '📲 Contactar a Alex (+57 321 423 1616)', value: '3' },
          { label: '↩️ Menú', value: 'menu' },
        ],
        undefined,
        matchedProduct
      );
      syncLeadToCRM(text, `Consulta veterinaria IA: ${text}`, true);
      return;
    }

    // 7. REGLA DE ORO: SI EL USUARIO ESCRIBE ALGO NO ENTENDIDO
    addBotMessage(
      `Disculpa, no logré entenderte del todo. 😊\n\nPor favor escribe la palabra **"Menú"** o selecciona directamente una de las opciones con el NÚMERO (1, 2, 3 o 4) para ayudarte de inmediato:\n\n1️⃣ 🛒 Ver Alimentos y Accesorios (Catálogo)\n2️⃣ 🚑 Consulta rápida de bienestar con IA\n3️⃣ 📲 Hablar con Ventas por WhatsApp\n4️⃣ 📩 Canales de soporte y redes`,
      MENU_OPTIONS
    );
    syncLeadToCRM(text, `Mensaje no reconocido: ${text}`);
  };

  const camilaAvatar = contactInfo.camilaAvatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80';

  return (
    <>
      {/* Floating Trigger Button on Bottom-Right */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <motion.button
          id="open-camila-chat-btn"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2.5 bg-[#1C2722] hover:bg-[#2A3C34] text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-xl shadow-black/25 border-2 border-[#FAF8F5] transition-all cursor-pointer group"
          title="Chatear con Camila - Asesora Lunary World Pets"
        >
          {/* Avatar / Photo with online pulse */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#6B7B3E] shrink-0 border border-white/20 shadow-xs">
            <img
              src={camilaAvatar}
              alt="Camila Asesora"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1C2722] animate-pulse" />
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold leading-tight flex items-center gap-1">
              Camila <span className="text-amber-300">✨</span>
            </span>
            <span className="text-[10px] text-stone-300 leading-none">Asesora Lunary</span>
          </div>

          {/* Unread indicator */}
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-bounce" />
          )}
        </motion.button>
      </div>

      {/* Floating Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 sm:bottom-20 right-3 sm:right-6 z-50 w-[94vw] sm:w-[400px] h-[540px] max-h-[82vh] bg-[#FAF8F5] rounded-3xl shadow-2xl border border-[#EAE3D6] flex flex-col overflow-hidden font-sans"
          >
            {/* Header: Camila Info + Close */}
            <div className="bg-[#1C2722] text-white p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#6B7B3E] shrink-0 border-2 border-emerald-400/40 shadow-xs">
                  <img
                    src={camilaAvatar}
                    alt="Camila Asesora"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#1C2722]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold leading-snug">Camila</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                      En línea
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Asesora en Bienestar · Lunary World Pets
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleUserSend('menu')}
                  className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Reiniciar al Menú"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Sub-bar */}
            <div className="bg-[#FAF2E6] px-4 py-1.5 border-b border-[#EDE5D8] flex items-center justify-between text-[11px] text-[#695D4A]">
              <span className="flex items-center gap-1 font-medium">
                <span>💬</span> Respuestas automáticas y asesoría con IA
              </span>
              <span className="font-bold text-[#6B7B3E]">Alex: +57 321 423 1616</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-[13px] no-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-[#1C2722] text-white rounded-tr-xs'
                        : 'bg-white text-[#1C1F1E] border border-[#EAE3D6] rounded-tl-xs'
                    }`}
                  >
                    {msg.text}

                    {/* Recommended Product Box in Chat */}
                    {msg.recommendedProduct && (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#F5F2EB] border border-[#E5DDD0] flex items-center gap-2.5">
                        <img
                          src={msg.recommendedProduct.imageUrl}
                          alt={msg.recommendedProduct.name}
                          className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-stone-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-[#1C1F1E] truncate">
                            {msg.recommendedProduct.name}
                          </p>
                          <p className="text-[11px] text-[#6B7B3E] font-black">
                            {formatCOP(msg.recommendedProduct.price)} COP
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (msg.recommendedProduct) {
                              onAddToCart(msg.recommendedProduct);
                              onOpenCart();
                              setIsOpen(false);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#6B7B3E] text-white font-bold text-[10px] hover:bg-[#586731] transition-colors shrink-0"
                        >
                          Comprar
                        </button>
                      </div>
                    )}

                    {/* Action Button inside Message */}
                    {msg.actionButton && (
                      <div className="mt-2.5 pt-2 border-t border-black/5">
                        <button
                          onClick={msg.actionButton.action}
                          className="w-full py-2 px-3 rounded-xl bg-[#6B7B3E] hover:bg-[#586731] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <span>{msg.actionButton.label}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick-reply Option Chips */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleUserSend(opt.value)}
                          className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EAE4D9] text-[#1C1F1E] text-[11px] font-bold border border-[#E0D7C8] shadow-2xs transition-all hover:scale-102 cursor-pointer flex items-center gap-1"
                        >
                          <span>{opt.label}</span>
                          <ChevronRight className="w-3 h-3 text-stone-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-stone-400 mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-stone-500 bg-white p-2.5 rounded-2xl w-fit border border-[#EAE3D6] shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#6B7B3E]">Camila está escribiendo</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#6B7B3E] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#6B7B3E] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#6B7B3E] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-[#EAE3D6]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUserSend(inputValue);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    currentStep === 'waiting_vet_query'
                      ? 'Escribe qué le pasa a tu mascota o tu duda...'
                      : 'Responde con el número (1, 2, 3, 4) o escribe "Menú"...'
                  }
                  className="flex-1 bg-[#F5F2EB] text-xs sm:text-sm text-[#1C1F1E] placeholder:text-stone-400 px-4 py-2.5 rounded-full border border-[#E2DBD0] focus:border-[#6B7B3E] focus:bg-white focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 rounded-full bg-[#6B7B3E] hover:bg-[#586731] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                  title="Enviar mensaje"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5 px-2">
                <span>Escribe <strong>"Menú"</strong> para volver a ver las opciones</span>
                <span>Lunary World Pets</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
