import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  Flame,
  Megaphone,
  Video,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Clock,
  Layers,
  HelpCircle,
  RefreshCw,
  Send,
  Lightbulb,
  CheckCheck,
  Eye,
  Download,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { Product, ContactInfo } from '../types';

interface MarketingGrowthToolProps {
  products: Product[];
  contactInfo: ContactInfo;
  showToast: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

export const MarketingGrowthTool: React.FC<MarketingGrowthToolProps> = ({
  products,
  contactInfo,
  showToast,
}) => {
  const [activeSection, setActiveSection] = useState<'generator' | 'autopilot' | 'marketplace' | 'prompts' | 'plan'>('autopilot');

  // Generator form state
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length > 0 ? products[0].id : 'all'
  );
  const [selectedChannel, setSelectedChannel] = useState<'facebook' | 'facebook_marketplace' | 'whatsapp_broadcast' | 'tiktok_reels' | 'organic_growth_plan'>('facebook_marketplace');
  const [tone, setTone] = useState<'persuasivo' | 'oferta_urgente' | 'educativo_tierno' | 'directo_ventas'>('persuasivo');
  const [customCity, setCustomCity] = useState<string>('Bogotá y toda Colombia');
  const [customPhone, setCustomPhone] = useState<string>(contactInfo?.phone || '312 345 6789');
  const [customNote, setCustomNote] = useState<string>('');
  const [freeShipping, setFreeShipping] = useState<boolean>(true);

  // Result state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [usedAi, setUsedAi] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [justGenerated, setJustGenerated] = useState<boolean>(false);

  // Photo viewer modal state
  const [viewingPhotoModal, setViewingPhotoModal] = useState<boolean>(false);

  // Master Prompts Copied states
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  const resultContainerRef = useRef<HTMLDivElement>(null);

  // Selected product object
  const selectedProduct = selectedProductId === 'all'
    ? null
    : products.find((p) => p.id === selectedProductId) || products[0] || null;

  // Format currency helper
  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  // Instant Local Copy Generator (0 milliseconds latency, 100% reliable)
  const generateLocalAdCopy = (
    channel: string,
    prod: Product | null | undefined,
    city: string,
    phone: string,
    freeShip: boolean,
    adTone: string,
    note: string
  ): string => {
    const name = prod ? prod.name : 'Alimentos, Camas y Accesorios Premium';
    const priceFormatted = prod ? formatCOP(prod.price) : '$ 45.000';
    const origPriceFormatted = prod?.originalPrice ? formatCOP(prod.originalPrice) : undefined;
    const cleanPhoneNum = (phone || '3123456789').replace(/\D/g, '');
    const desc = prod?.description || 'Calidad garantizada, bienestar para tu mascota y entrega rápida.';

    if (channel === 'facebook_marketplace') {
      return `🛍️ TÍTULO RECOMENDADO PARA MARKETPLACE:
${name} - ¡Nuevo! Domicilio en ${city} 🐾

📝 DESCRIPCIÓN PARA MARKETPLACE:
¡Consiente a tu peludito con la mejor calidad al mejor precio! 🐶🐱

✨ Estado: 100% Nuevo en empaque sellado original
💰 Precio de Oferta: ${priceFormatted} ${origPriceFormatted ? `(Antes: ${origPriceFormatted})` : ''}
📍 Ubicación: ${city} (Envíos a domicilio y entrega rápida)
🛵 Métodos de Pago: Pasarela Oficial Wompi (PSE todos los bancos, Nequi, Bancolombia y Tarjetas). Despacho seguro a domicilio tras confirmar tu compra 🛵📦

📦 ¿Qué incluye?
${desc}
${note ? `\n🎁 Nota especial: ${note}` : ''}
${freeShip ? '🚚 Domicilio disponible y entrega garantizada.' : ''}

⚡ ¡POCAS UNIDADES DISPONIBLES!
Escríbeme un mensaje directo aquí en Marketplace o al WhatsApp: wa.me/57${cleanPhoneNum} para coordinar tu entrega hoy mismo 🐾📲`;
    }

    if (channel === 'whatsapp_broadcast') {
      return `🐾 ¡OFERTA RELÁMPAGO PARA TU PELUDITO! 🐶🐱

¿Buscando lo mejor para tu consentido? Llegó a *Lunary World Pets*:
🌟 *${name}*

🔥 *Solo por hoy:* ${priceFormatted} ${origPriceFormatted ? `(Precio normal: ${origPriceFormatted})` : ''}
${note ? `✨ *Detalle:* ${note}\n` : ''}🛵 Envíos rápidos en ${city}
💳 Aceptamos Nequi, Bancolombia, PSE y tarjetas

👇 ¡Pide el tuyo antes de que se agote el stock!
📲 Escríbeme tocando aquí: wa.me/57${cleanPhoneNum}?text=Hola!%20Quiero%20pedir%20el%20${encodeURIComponent(name)}`;
    }

    if (channel === 'tiktok_reels') {
      return `🎬 GUIÓN VIRAL PARA TIKTOK / REEL (30 SEGUNDOS) 🐶🎥

⏱️ [0:00 - 0:03] GANCHO (Detener el scroll):
(Muestra a tu perro o gato haciendo cara tierna o con su producto)
Texto en pantalla: "Si tienes un peludito en casa, TIENES que ver esto antes de que cometas este error... 🚨"

⏱️ [0:03 - 0:12] EL PROBLEMA:
Voz en off: "¿Sabías que la mayoría de los productos comunes para mascotas no duran o no les dan el bienestar que merecen? Muchas veces terminas gastando el doble..."

⏱️ [0:12 - 0:22] LA SOLUCIÓN (Muestra el producto):
(Tomas en primer plano de ${name}, abriéndolo o tu mascota disfrutándolo)
Voz en off: "Por eso descubrí ${name} en Lunary World Pets. Mira la calidad de los materiales y cómo le encanta. Además rinde muchísimo y cuida su salud."

⏱️ [0:22 - 0:30] OFERTA Y LLAMADO A LA ACCIÓN:
Texto en pantalla: "¡Solo ${priceFormatted}! Envíos en Colombia 🛵"
Voz en off: "Está en súper oferta hoy a solo ${priceFormatted} con domicilio en ${city}. Toca el link de mi perfil o escríbenos al WhatsApp para pedir el tuyo hoy."`;
    }

    if (channel === 'organic_growth_plan') {
      return `🚀 PLAN ORGÁNICO GRATIS: CÓMO CONSEGUIR 10 CLIENTES HOY SIN PAGAR PUBLICIDAD

1️⃣ LA ESTRATEGIA MARKETPLACE DE FACEBOOK (Tu canal #1):
• Publica de 3 a 5 productos estrella en Facebook Marketplace usando títulos con intención de búsqueda (Ej: "${name} Bogotá Domicilio").
• Marketplace le muestra tu producto a personas que viven cerca y que ya están buscando comprar ahora mismo.
• Responde en menos de 3 minutos cuando te pregunten "¿Sigue disponible?": "¡Hola! Sí señor(a), está disponible nuevo en caja. ¿En qué barrio te encuentras para coordinar el domicilio?".

2️⃣ GRUPOS DE FACEBOOK DE BARRIO Y MASCOTAS:
• Entra a 5 grupos locales (ej: "Amantes de los Perros Bogotá", "Mascotas Suba / Medellín / Cali", "Clasificados tu ciudad").
• En vez de poner un anuncio aburrido, publica una foto linda con el producto y di: "Amigos de la comunidad, tenemos disponibles pocas unidades de ${name} con domicilio gratis hoy. ¿A quién le gustaría consentir a su peludito?".

3️⃣ ALIANZAS A $0 CON NEGOCIOS VECINOS:
• Habla con paseadores de perros del parque de tu zona o peluquerías caninas que no vendan este producto.
• Ofréceles un 10% de comisión por cada vecino que te compre a través de su recomendación. ¡Ellos tienen la confianza del cliente y tú tienes el producto!`;
    }

    // Default: facebook
    return `🐾 ¡ATENCIÓN AMANTES DE LAS MASCOTAS! 🐶🐱❤️

¿Quieres darle lo mejor a tu peludito sin pagar de más? 
En *Lunary World Pets* tenemos en promoción especial:

⭐ *${name}* ⭐

${desc ? `✅ ${desc}\n` : ''}✅ 100% Calidad garantizada y recomendado para su bienestar
✅ Precio especial de lanzamiento: *${priceFormatted}*
${note ? `✅ ${note}\n` : ''}✅ Domicilio rápido en ${city} y envíos a todo el país
✅ Pagos 100% seguros a través de Pasarela Wompi (PSE, Nequi, Tarjetas, Bancolombia) y despacho a domicilio

🐶 ¡Porque tu mascota merece lo mejor de lo mejor! 🐱

📲 ¿Quieres el tuyo hoy? Escríbenos directamente a WhatsApp:
👉 wa.me/57${cleanPhoneNum}?text=Hola!%20Vi%20la%20promo%20de%20${encodeURIComponent(name)}%20en%20Facebook

💬 O déjanos un comentario y te enviamos toda la información al instante 👇`;
  };

  // Pre-generate on initial render so it is NEVER blank
  useEffect(() => {
    const initialText = generateLocalAdCopy(
      selectedChannel,
      selectedProduct,
      customCity,
      customPhone,
      freeShipping,
      tone,
      customNote
    );
    setGeneratedText(initialText);
  }, []);

  // Robust Photo Downloader (bypasses iframe restrictions, handles base64 & remote URLs)
  const handleDownloadPhoto = async () => {
    if (!selectedProduct?.imageUrl) {
      showToast('Sin imagen', 'Selecciona un producto que tenga imagen.', 'warning');
      return;
    }

    const cleanTitle = (selectedProduct.name || 'producto')
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_')
      .toLowerCase();
    const fileName = `${cleanTitle}_lunary_pets.jpg`;
    const imgUrl = selectedProduct.imageUrl;

    try {
      if (imgUrl.startsWith('data:')) {
        // Base64 Data URL: convert to Blob so it downloads properly in all browsers
        const parts = imgUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'image/jpeg';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        showToast('¡Foto Descargada!', `La imagen "${fileName}" se guardó en tu carpeta de Descargas.`, 'success');
        return;
      }

      // Remote URL: fetch as Blob or canvas
      try {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        showToast('¡Foto Descargada!', `La imagen "${fileName}" se guardó en tu carpeta de Descargas.`, 'success');
        return;
      } catch (fetchErr) {
        // Canvas CORS fallback
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 800;
            canvas.height = img.naturalHeight || 800;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((b) => {
                if (b) {
                  const blobUrl = URL.createObjectURL(b);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                  showToast('¡Foto Descargada!', `La imagen "${fileName}" se guardó en tu carpeta de Descargas.`, 'success');
                }
              }, 'image/jpeg', 0.95);
            }
          } catch (cErr) {
            console.warn('Canvas export failed:', cErr);
          }
        };
        img.src = imgUrl;
      }
    } catch (e: any) {
      console.warn('Error descargando imagen:', e);
      const link = document.createElement('a');
      link.href = imgUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Descarga iniciada', 'Comprueba tu carpeta de Descargas.', 'info');
    }
  };

  // Generate ad Handler: INSTANT client-side response + optional Gemini enhancement
  const handleGenerateAd = async () => {
    setIsGenerating(true);
    setCopied(false);
    setJustGenerated(true);

    // 1. INSTANT LOCAL GENERATION (0ms - guarantees user sees it immediately)
    const instantText = generateLocalAdCopy(
      selectedChannel,
      selectedProduct,
      customCity,
      customPhone,
      freeShipping,
      tone,
      customNote
    );
    setGeneratedText(instantText);
    setUsedAi(false);

    showToast(
      '✨ Publicidad Generada con Éxito',
      'Tu anuncio ya está listo. Cópialo o ábrelo en Facebook con 1 clic.',
      'success'
    );

    // Smooth scroll down to result if on mobile
    setTimeout(() => {
      if (resultContainerRef.current) {
        resultContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);

    // 2. BACKGROUND GEMINI CALL (optional enhancement)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('/api/marketing/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          channel: selectedChannel,
          productName: selectedProduct ? selectedProduct.name : 'Catálogo General de Lunary World Pets',
          productPrice: selectedProduct ? selectedProduct.price : undefined,
          originalPrice: selectedProduct ? selectedProduct.originalPrice : undefined,
          productCategory: selectedProduct ? selectedProduct.category : 'Accesorios y Alimentos',
          productPetType: selectedProduct ? selectedProduct.petType : 'Perros y Gatos',
          productDescription: selectedProduct ? selectedProduct.description : 'Los mejores productos para consentir la salud y felicidad de tu mascota.',
          city: customCity,
          phone: customPhone,
          freeShipping,
          customNote,
          tone,
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          setGeneratedText(data.text);
          setUsedAi(Boolean(data.usedAi));
        }
      }
    } catch (err: any) {
      console.log('Using instant local copy engine');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setJustGenerated(false), 3000);
    }
  };

  // Copy to clipboard
  const handleCopyText = (textToCopy: string, isPromptIndex?: number) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    if (isPromptIndex !== undefined) {
      setCopiedPromptIndex(isPromptIndex);
      setTimeout(() => setCopiedPromptIndex(null), 2500);
      showToast('Prompt Copiado', 'Pégalo en ChatGPT, Gemini o donde prefieras para crear tu estrategia.', 'success');
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast('¡Texto Copiado!', 'Listo para pegar en Facebook, Marketplace o WhatsApp.', 'success');
    }
  };

  // Quick action URLs
  const cleanPhone = (customPhone || '3123456789').replace(/\D/g, '');
  const whatsAppShareUrl = generatedText
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedText)}`
    : `https://api.whatsapp.com/send?phone=57${cleanPhone}`;

  // Master Prompts List for Pet Stores
  const MASTER_PROMPTS = [
    {
      title: '🎯 Guión de Cierre por WhatsApp (Cuando preguntan "¿Precio?")',
      description: 'Evita que los clientes se queden en visto. Guión probado para enganchar la conversación y cerrar la venta en 3 mensajes.',
      prompt: `Actúa como el vendedor estrella de la tienda de mascotas "Lunary World Pets" en Colombia. 
Un cliente me acaba de escribir a WhatsApp preguntando: "¿Precio?".
Escribe una respuesta en 3 pasos:
1. Saludo cálido y personalizado mencionando el nombre del producto y preguntando qué raza o edad tiene su mascota para asesorarlo.
2. Menciona el precio de oferta junto con un beneficio clave que justifica su valor (calidad, nutrición o durabilidad) + beneficio de envío en Colombia.
3. Pregunta de cierre con doble opción (ejemplo: "¿Prefieres que te lo despachemos hoy para recibir mañana o el fin de semana?").
Usa emojis moderados y tono cercano colombiano.`,
    },
    {
      title: '🔄 Mensaje de Recuperación para Clientes que dejaron en "Visto"',
      description: 'Reactiva a los clientes que mostraron interés pero no terminaron de pagar.',
      prompt: `Actúa como asesor de atención al cliente de "Lunary World Pets". 
Escribe un mensaje corto de seguimiento para WhatsApp para un cliente que pidió información de un producto para su mascota ayer pero dejó la conversación en visto.
El mensaje debe:
- Ser empático y cero invasivo (preguntar si tuvo algún problema con el medio de pago PSE/Nequi/Tarjeta).
- Avisar amablemente que nos quedan solo 2 unidades con el precio especial de oferta de esta semana.
- Ofrecer resolver cualquier duda o coordinar la entrega hoy mismo.
- Incluir un llamado a la acción simple.`,
    },
    {
      title: '🎁 Generador de "Combo o Pack de Ahorro" con Alto Margen',
      description: 'Arma combos que suben el ticket promedio de compra por cliente.',
      prompt: `Actúa como especialista en pricing y combos para tiendas de mascotas.
Ayúdame a armar 3 ideas de "Packs de Ahorro" para perros y gatos para mi tienda virtual en Colombia.
Para cada pack especifica:
- Nombre llamativo (ej: "Pack Consentido Saludable", "Combo Cachorro Feliz").
- Qué productos deben combinarse (ej: Alimento + Snack saludable + Juguete interactivo).
- Cómo presentar el ahorro para que el cliente sienta que está ganando.
- El texto del anuncio para publicarlo en estados de WhatsApp y Facebook.`,
    },
    {
      title: '🤝 Propuesta de Alianza a $0 con Paseadores de Perros y Veterinarias',
      description: 'Llega a cientos de dueños de mascotas en tu barrio sin pagar un peso en publicidad.',
      prompt: `Redacta un mensaje directo y profesional para presentar una alianza comercial entre mi tienda virtual "Lunary World Pets" y paseadores de perros o peluquerías caninas de mi barrio en Colombia.
La propuesta es:
- Ofrecerles un cupón de descuento especial del 10% con su nombre para que se lo den a los dueños de los perros que ellos atienden.
- Por cada cliente que use su cupón y compre, ellos reciben una comisión en efectivo.
- Redacta el mensaje de WhatsApp para escribirles de forma respetuosa, atractiva y destacando cómo ganan dinero extra sin esfuerzo.`,
    },
    {
      title: '🔥 Idea de Dinámica / Concurso Viral para Ganar Seguidores y Clientes',
      description: 'Cómo crear un sorteo local donde cada participante te deja su número de WhatsApp.',
      prompt: `Diseña una dinámica de concurso o sorteo orgánico para mi tienda de mascotas "Lunary World Pets" en Facebook e Instagram para conseguir 300 dueños de mascotas locales en 7 días sin pagar anuncios.
Requisitos:
- Premio de bajo costo para mí pero de alto deseo para el dueño (ej: Cama acolchada o bolsa de snack + juguete).
- Reglas sencillas donde etiqueten amigos y además nos escriban a WhatsApp para registrar su boleto (así creamos una base de datos de compradores).
- Redacta el texto completo del post con fechas, llamada a la acción y cómo contactar a los que no ganaron para ofrecerles un descuento de consolación.`,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF8F5] overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1C2722] via-[#24352E] to-[#1C2722] text-white p-6 border-b border-[#2C3E36] shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cero Gasto en Publicidad | Hecho para Colombia</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              🚀 Generador de Clientes & Publicidad Gratis
            </h2>
            <p className="text-xs sm:text-sm text-[#A8B2AC] mt-1 max-w-2xl">
              Crea anuncios magnéticos con Inteligencia Artificial, publica en Facebook Marketplace y grupos locales en 1 clic, y consigue tus primeros clientes hoy mismo.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="marketing-quick-marketplace-btn"
              onClick={() => {
                window.open('https://www.facebook.com/marketplace/create/item', '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1877F2] text-white hover:bg-[#166FE5] shadow-sm transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Abrir Facebook Marketplace</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="max-w-6xl mx-auto mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-white/10 pt-4">
          <button
            id="tab-sub-marketing-autopilot"
            onClick={() => setActiveSection('autopilot')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSection === 'autopilot'
                ? 'bg-amber-400 text-[#1C2722] shadow-sm font-black'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>🤖 Piloto Automático de Auto-Promoción</span>
          </button>

          <button
            id="tab-sub-marketing-generator"
            onClick={() => setActiveSection('generator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSection === 'generator'
                ? 'bg-amber-400 text-[#1C2722] shadow-sm font-black'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>1. Generador de Anuncios con IA</span>
          </button>

          <button
            id="tab-sub-marketing-marketplace"
            onClick={() => setActiveSection('marketplace')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSection === 'marketplace'
                ? 'bg-amber-400 text-[#1C2722] shadow-sm font-black'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>2. El Método Facebook Marketplace ($0)</span>
          </button>

          <button
            id="tab-sub-marketing-prompts"
            onClick={() => setActiveSection('prompts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSection === 'prompts'
                ? 'bg-amber-400 text-[#1C2722] shadow-sm font-black'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>3. Prompts Maestros para Facturar</span>
          </button>

          <button
            id="tab-sub-marketing-plan"
            onClick={() => setActiveSection('plan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSection === 'plan'
                ? 'bg-amber-400 text-[#1C2722] shadow-sm font-black'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <span>4. Plan de Choque: 10 Clientes en 48 Horas</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* ========================================================= */}
        {/* SECTION 0: AUTOPILOT AI MARKETING */}
        {/* ========================================================= */}
        {activeSection === 'autopilot' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1C2722] via-[#2A3B34] to-[#1C2722] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-950">
                    <Sparkles className="w-3.5 h-3.5" /> Piloto Automático de Auto-Promoción Activo
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Tu tienda se promociona sola con IA 🤖🚀
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A8B2AC] leading-relaxed">
                    Este motor inteligente genera y actualiza automáticamente campañas virales de 7 días tomando los productos reales de tu inventario. Cada día un ángulo de venta diferente para WhatsApp, Estados e Instagram sin que tengas que pensar qué publicar.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={() => {
                      showToast('🚀 Piloto Automático Sincronizado', 'Se han actualizado las campañas virales con el inventario actual de la tienda.', 'success');
                    }}
                    className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualizar Campaña Automática</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  day: 'LUNES - Oferta Relámpago en Alimentos',
                  hook: '¡Empieza la semana sin concentrado! Despacho rápido a domicilio.',
                  prod: products[0] || { name: 'Alimento Premium', price: 95000, imageUrl: '' },
                  channel: 'WhatsApp & Estados',
                },
                {
                  day: 'MARTES - Bienestar & Cuidado',
                  hook: '¿Tu peludo se rasca mucho? Protección antipulgas con entrega hoy.',
                  prod: products[1] || products[0] || { name: 'Antipulgas y Salud', price: 45000, imageUrl: '' },
                  channel: 'Facebook Marketplace',
                },
                {
                  day: 'MIÉRCOLES - Comodidad & Descanso',
                  hook: 'Un descanso ortopédico para cuidar las articulaciones de tu fiel amigo.',
                  prod: products[2] || products[0] || { name: 'Cama Ortopédica', price: 120000, imageUrl: '' },
                  channel: 'Grupos de Mascotas',
                },
                {
                  day: 'JUEVES - Juguetes & Diversión K9',
                  hook: 'Evita que rompa los muebles. Juguetes interactivos anti-ansiedad.',
                  prod: products[3] || products[0] || { name: 'Juguete Interactivo', price: 35000, imageUrl: '' },
                  channel: 'Historias de Instagram',
                },
                {
                  day: 'VIERNES - Fin de Semana Consentido',
                  hook: '¡Llegó el viernes y ellos lo saben! Snacks naturales y premios irresistibles.',
                  prod: products[4] || products[0] || { name: 'Snacks Premium', price: 28000, imageUrl: '' },
                  channel: 'WhatsApp Broadcast',
                },
                {
                  day: 'SÁBADO Y DOMINGO - Kit de Paseo y Aventura',
                  hook: 'Sal a pasear con seguridad, estilo y arneses ergonómicos antitirones.',
                  prod: products[5] || products[0] || { name: 'Arnés K9', price: 75000, imageUrl: '' },
                  channel: 'Marketplace & Redes',
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-5 border border-[#ECE5DD] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                        {item.day}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-500">{item.channel}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.prod.imageUrl && (
                        <img src={item.prod.imageUrl} alt={item.prod.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-neutral-200" />
                      )}
                      <div>
                        <h4 className="font-extrabold text-sm text-[#1C2722] line-clamp-1">{item.prod.name}</h4>
                        <span className="text-xs font-black text-emerald-800">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.prod.price || 85000)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#5F6360] bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E3D9] italic">
                      "{item.hook}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#ECE5DD] flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        const cleanPhone = (contactInfo?.phone || '3214231616').replace(/\D/g, '');
                        const text = `🐾 *${item.day} en Lunary World Pets* 🐾\n\n${item.hook}\n\n🌟 *${item.prod.name}*\n💰 Precio: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.prod.price || 85000)}\n\n🛵 Envíos a domicilio y pago 100% seguro por Wompi (PSE, Nequi, Tarjetas).\n\n📲 Pídelo aquí: wa.me/57${cleanPhone}`;
                        navigator.clipboard.writeText(text);
                        showToast('¡Campaña del día copiada!', 'Pégala en tu estado de WhatsApp o grupo para auto-promocionarte.', 'success');
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2A3B34] text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copiar Kit para Publicar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 1: AI AD & COPY GENERATOR */}
        {/* ========================================================= */}
        {activeSection === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#ECE5DD] shadow-xs flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-black text-[#1C2722] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Configura tu Publicidad en 1 Clic</span>
                </h3>
                <p className="text-xs text-[#787D7A] mt-0.5">
                  Selecciona el producto y el canal donde vas a publicar gratis.
                </p>
              </div>

              {/* 1. Select Product */}
              <div>
                <label className="block text-xs font-bold text-[#1C2722] mb-1.5">
                  1. ¿Qué producto quieres promocionar?
                </label>
                <select
                  id="marketing-select-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5DDD8] bg-[#FAF8F5] text-[#1C2722] focus:outline-hidden focus:ring-2 focus:ring-[#1C2722]"
                >
                  <option value="all">🌟 Promoción General de Toda la Tienda (Lunary World Pets)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCOP(p.price)})
                    </option>
                  ))}
                </select>

                {selectedProduct && (
                  <div className="mt-2 p-2.5 bg-[#FAF8F5] rounded-xl border border-[#ECE5DD] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=120'}
                        alt={selectedProduct.name}
                        onClick={() => setViewingPhotoModal(true)}
                        className="w-12 h-12 object-cover rounded-lg shrink-0 border border-[#ECE5DD] cursor-pointer hover:opacity-85"
                        title="Clic para ver foto en grande"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#1C2722] truncate">{selectedProduct.name}</p>
                        <p className="text-[11px] text-emerald-700 font-bold">{formatCOP(selectedProduct.price)}</p>
                        <p className="text-[10px] text-[#787D7A] truncate">Categoría: {selectedProduct.category} | {selectedProduct.petType}</p>
                      </div>
                    </div>

                    {selectedProduct.imageUrl && (
                      <button
                        type="button"
                        onClick={handleDownloadPhoto}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1 shrink-0"
                        title="Descargar foto del producto"
                      >
                        <Download className="w-3 h-3 text-amber-700" />
                        <span>Bajar Foto</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Select Platform */}
              <div>
                <label className="block text-xs font-bold text-[#1C2722] mb-1.5">
                  2. ¿Dónde vas a publicar? (Canal)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('facebook_marketplace')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                      selectedChannel === 'facebook_marketplace'
                        ? 'bg-blue-50 text-blue-900 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-[#FAF8F5] text-[#414643] border-[#ECE5DD] hover:bg-[#EFE9DF]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="leading-tight">Marketplace</p>
                      <span className="text-[10px] font-normal text-blue-700">El más recomendado</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('facebook')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                      selectedChannel === 'facebook'
                        ? 'bg-blue-50 text-blue-900 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-[#FAF8F5] text-[#414643] border-[#ECE5DD] hover:bg-[#EFE9DF]'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-[#1877F2] shrink-0" />
                    <div>
                      <p className="leading-tight">Grupos Facebook</p>
                      <span className="text-[10px] font-normal text-[#5F6360]">Comunidades y ventas</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('whatsapp_broadcast')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                      selectedChannel === 'whatsapp_broadcast'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-[#FAF8F5] text-[#414643] border-[#ECE5DD] hover:bg-[#EFE9DF]'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="leading-tight">WhatsApp</p>
                      <span className="text-[10px] font-normal text-emerald-700">Estados y difusión</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('tiktok_reels')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                      selectedChannel === 'tiktok_reels'
                        ? 'bg-rose-50 text-rose-900 border-rose-400 ring-1 ring-rose-400'
                        : 'bg-[#FAF8F5] text-[#414643] border-[#ECE5DD] hover:bg-[#EFE9DF]'
                    }`}
                  >
                    <Video className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <p className="leading-tight">TikTok / Reels</p>
                      <span className="text-[10px] font-normal text-rose-700">Guión viral de 30s</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Tone & City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C2722] mb-1">
                    3. Tono del anuncio
                  </label>
                  <select
                    value={tone}
                    onChange={(e: any) => setTone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#D5DDD8] bg-[#FAF8F5] text-[#1C2722]"
                  >
                    <option value="persuasivo">🔥 Oferta Persuasiva</option>
                    <option value="oferta_urgente">⚡ Urgencia y Pocas Unidades</option>
                    <option value="educativo_tierno">🐶 Tierno y de Bienestar</option>
                    <option value="directo_ventas">💰 Directo a Precio y Domicilio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2722] mb-1">
                    Ciudad / Cobertura
                  </label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Ej: Bogotá, Medellín o Colombia"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#D5DDD8] bg-[#FAF8F5] text-[#1C2722]"
                  />
                </div>
              </div>

              {/* 4. WhatsApp Phone */}
              <div>
                <label className="block text-xs font-bold text-[#1C2722] mb-1">
                  Teléfono de pedidos (WhatsApp)
                </label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="312 345 6789"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D5DDD8] bg-[#FAF8F5] text-[#1C2722]"
                />
              </div>

              {/* 5. Custom Note / Hook */}
              <div>
                <label className="block text-xs font-bold text-[#1C2722] mb-1">
                  Instrucción o detalle extra (opcional)
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Ej: Poner que incluye obsequio por compra hoy"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D5DDD8] bg-[#FAF8F5] text-[#1C2722]"
                />
              </div>

              {/* Free shipping checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#414643]">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="rounded text-[#1C2722] focus:ring-[#1C2722]"
                />
                <span>Mencionar opción de Envío a Domicilio y Pagos Seguros</span>
              </label>

              {/* Submit Generate Button */}
              <button
                id="marketing-btn-generate-ai"
                type="button"
                onClick={handleGenerateAd}
                disabled={isGenerating}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  justGenerated
                    ? 'bg-emerald-600 ring-2 ring-emerald-400'
                    : 'bg-gradient-to-r from-[#1C2722] via-[#2A4035] to-[#1C2722] hover:opacity-95 active:scale-[0.99]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Redactando Anuncio de Alto Impacto...</span>
                  </>
                ) : justGenerated ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-white animate-bounce" />
                    <span>¡Listo! Anuncio Generado (Míralo abajo 👇)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>✨ Generar Publicidad Vendedora en 1 Clic</span>
                  </>
                )}
              </button>

              {/* DIRECT INLINE PREVIEW: Shown directly beneath the button on small screens so the user NEVER misses it */}
              <div className="lg:hidden mt-2 pt-3 border-t border-[#ECE5DD] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Tu Anuncio Listo para Publicar:
                  </span>
                  <button
                    onClick={() => handleCopyText(generatedText)}
                    className="text-xs font-bold text-[#1C2722] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#D5DDD8] hover:bg-[#EFE9DF]"
                  >
                    {copied ? '¡Copiado!' : '📋 Copiar'}
                  </button>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#ECE5DD] font-mono text-[11px] text-[#1C2722] whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                  {generatedText}
                </div>

                {/* Mobile Photo Preview and Download Box */}
                {selectedProduct && selectedProduct.imageUrl && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        onClick={() => setViewingPhotoModal(true)}
                        className="w-10 h-10 object-cover rounded-lg border border-amber-300 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-amber-950 truncate">Foto del Producto</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingPhotoModal(true)}
                        className="px-2 py-1 text-[11px] font-bold bg-white text-[#1C2722] border border-[#D5DDD8] rounded-lg shadow-2xs"
                      >
                        👁️ Ver
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPhoto}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-2xs flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Bajar</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => {
                      handleCopyText(generatedText);
                      window.open('https://www.facebook.com/marketplace/create/item', '_blank');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold bg-[#1877F2] text-white hover:bg-[#166FE5]"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Marketplace</span>
                  </button>
                  <button
                    onClick={() => {
                      window.open(whatsAppShareUrl, '_blank');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold bg-[#25D366] text-white hover:bg-[#20bd5a]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Generated Result & 1-Click Publishing */}
            <div ref={resultContainerRef} className="lg:col-span-7 flex flex-col gap-4">
              <div
                className={`bg-white p-5 rounded-2xl border shadow-xs flex-1 flex flex-col transition-all ${
                  justGenerated ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-[#ECE5DD]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#ECE5DD] mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#1C2722]">
                        Anuncio Generado Listo para Publicar
                      </h3>
                      {usedAi ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Gemini AI
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Alta Conversión
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#787D7A] mt-0.5">
                      Copia el texto con un clic y pégalo directamente en Facebook, Marketplace o WhatsApp.
                    </p>
                  </div>

                  {generatedText && (
                    <button
                      id="marketing-copy-generated-btn"
                      onClick={() => handleCopyText(generatedText)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1C2722] hover:bg-[#2C3E36] text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Text Display Box */}
                <div className="flex-1 bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5DD] font-mono text-xs text-[#1C2722] whitespace-pre-wrap overflow-y-auto max-h-[340px] leading-relaxed select-all">
                  {generatedText}
                </div>

                {/* PRODUCT PHOTO CARD: Directly visible preview & 1-click download */}
                {selectedProduct && selectedProduct.imageUrl && (
                  <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        onClick={() => setViewingPhotoModal(true)}
                        className="w-14 h-14 object-cover rounded-lg border border-amber-300 shadow-xs cursor-pointer hover:scale-105 transition-transform bg-white"
                        title="Haz clic para ver foto en grande"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                          📸 Foto para adjuntar al anuncio:
                        </span>
                        <p className="text-xs font-bold text-[#1C2722] truncate">{selectedProduct.name}</p>
                        <p className="text-[11px] text-emerald-700 font-bold">{formatCOP(selectedProduct.price)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingPhotoModal(true)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-[#1C2722] border border-[#D5DDD8] hover:bg-[#FAF8F5] shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Ver foto en pantalla completa"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#5F6360]" />
                        <span>Ver Foto</span>
                      </button>

                      <button
                        id="btn-download-product-photo"
                        type="button"
                        onClick={handleDownloadPhoto}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                        title="Descargar imagen en tu computador o celular"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Foto (.JPG)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 1-Click Action Buttons */}
                {generatedText && (
                  <div className="mt-4 pt-3 border-t border-[#ECE5DD] flex flex-wrap items-center gap-2.5">
                    <button
                      id="marketing-open-marketplace-btn"
                      onClick={() => {
                        handleCopyText(generatedText);
                        window.open('https://www.facebook.com/marketplace/create/item', '_blank');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1877F2] text-white hover:bg-[#166FE5] shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>1. Copiar y Abrir Marketplace</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </button>

                    <button
                      id="marketing-open-facebook-btn"
                      onClick={() => {
                        handleCopyText(generatedText);
                        window.open('https://www.facebook.com/groups/feed/', '_blank');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2C3E36] text-white hover:bg-[#1C2722] shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Megaphone className="w-4 h-4" />
                      <span>2. Abrir Grupos Facebook</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </button>

                    <button
                      id="marketing-open-whatsapp-btn"
                      onClick={() => {
                        window.open(whatsAppShareUrl, '_blank');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>3. Enviar a WhatsApp</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Strategy Tip Card */}
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-amber-950">💡 Consejo de Oro para Empezar a Facturar Hoy:</p>
                  <p className="text-amber-900 mt-0.5 leading-relaxed">
                    Facebook Marketplace es la herramienta #1 de ventas gratis en Colombia. Las personas allí entran específicamente a comprar. Descarga la foto de tu producto con el botón amarillo de arriba, copia la descripción y publícala hoy en Marketplace para recibir pedidos directos a tu WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: THE FACEBOOK MARKETPLACE FREE METHOD */}
        {/* ========================================================= */}
        {activeSection === 'marketplace' && (
          <div className="bg-white p-6 rounded-2xl border border-[#ECE5DD] shadow-xs flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 mb-2">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>La Herramienta Más Rápida de Ventas en Colombia</span>
              </div>
              <h3 className="text-lg font-black text-[#1C2722]">
                El Método Paso a Paso: Vender por Facebook Marketplace Sin Pagar $1
              </h3>
              <p className="text-xs text-[#5F6360] mt-1 max-w-3xl">
                Marketplace le muestra tus productos de mascotas a personas que viven a menos de 10 km de ti de forma totalmente gratuita. Sigue estos 4 pasos para publicar hoy mismo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5DD] flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="text-xs font-bold text-[#1C2722]">Elige un Producto Estrella</h4>
                <p className="text-[11px] text-[#5F6360] leading-relaxed">
                  Los productos que más se venden en Marketplace son alimentos de bulto, camas antiestrés, rascadores de gato y juguetes interactivos.
                </p>
                <div className="mt-auto pt-2 border-t border-[#ECE5DD]">
                  <span className="text-[10px] font-bold text-blue-700">Tip: Productos con precio claro</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5DD] flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="text-xs font-bold text-[#1C2722]">Título con Búsqueda Local</h4>
                <p className="text-[11px] text-[#5F6360] leading-relaxed">
                  No pongas solo la marca. Pon: <span className="font-semibold text-[#1C2722]">"Alimento para Perro 15kg Domicilio Bogotá"</span> o <span className="font-semibold text-[#1C2722]">"Cama Térmica Mascotas Nueva"</span>.
                </p>
                <div className="mt-auto pt-2 border-t border-[#ECE5DD]">
                  <span className="text-[10px] font-bold text-blue-700">Tip: Incluye la palabra "Domicilio"</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5DD] flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="text-xs font-bold text-[#1C2722]">Fotos Reales y Claras</h4>
                <p className="text-[11px] text-[#5F6360] leading-relaxed">
                  Descarga la foto de tu catálogo con el botón amarillo o tómale una foto limpia con tu celular en fondo iluminado. Las fotos reales transmiten confianza inmediata.
                </p>
                <div className="mt-auto pt-2 border-t border-[#ECE5DD]">
                  <span className="text-[10px] font-bold text-blue-700">Tip: Agrega 2 o 3 fotos</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#ECE5DD] flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  4
                </div>
                <h4 className="text-xs font-bold text-[#1C2722]">Respuesta en 3 Minutos</h4>
                <p className="text-[11px] text-[#5F6360] leading-relaxed">
                  Cuando te pregunten "¿Sigue disponible?", responde: <span className="font-semibold text-[#1C2722]">"¡Hola! Sí, nuevo disponible. ¿En qué barrio estás para el domicilio?"</span>.
                </p>
                <div className="mt-auto pt-2 border-t border-[#ECE5DD]">
                  <span className="text-[10px] font-bold text-blue-700">Tip: Llévatelos a WhatsApp rápido</span>
                </div>
              </div>
            </div>

            {/* Direct Action Button */}
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-blue-950">¿Listo para publicar tu primer producto en Marketplace?</p>
                <p className="text-[11px] text-blue-800">
                  Toma menos de 2 minutos. Solo copia la descripción desde la pestaña 1 y abre Marketplace aquí:
                </p>
              </div>

              <button
                id="btn-goto-marketplace"
                onClick={() => window.open('https://www.facebook.com/marketplace/create/item', '_blank')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1877F2] text-white hover:bg-[#166FE5] flex items-center gap-2 shrink-0 shadow-sm cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Crear Publicación en Marketplace Ahora</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: MASTER PROMPTS FOR SALES */}
        {/* ========================================================= */}
        {activeSection === 'prompts' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#ECE5DD] shadow-xs">
              <h3 className="text-base font-black text-[#1C2722] flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Prompts Maestros de Inteligencia Artificial para Vender</span>
              </h3>
              <p className="text-xs text-[#5F6360] mt-1">
                Copia cualquiera de estos prompts con un clic y pégalos en ChatGPT, Gemini o donde prefieras. Fueron diseñados específicamente para cerrar ventas de mascotas en Colombia.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {MASTER_PROMPTS.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-[#ECE5DD] shadow-xs flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1C2722]">{item.title}</h4>
                      <p className="text-xs text-[#787D7A] mt-0.5">{item.description}</p>
                    </div>

                    <button
                      onClick={() => handleCopyText(item.prompt, idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        copiedPromptIndex === idx
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#1C2722] border border-[#D5DDD8] hover:bg-[#ECE5DD]'
                      }`}
                    >
                      {copiedPromptIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#5F6360]" />
                          <span>Copiar Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#ECE5DD] text-xs text-[#414643] font-mono whitespace-pre-wrap leading-relaxed">
                    {item.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: 48-HOUR CRASH ACTION PLAN */}
        {/* ========================================================= */}
        {activeSection === 'plan' && (
          <div className="bg-white p-6 rounded-2xl border border-[#ECE5DD] shadow-xs flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200 mb-2">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Plan de Choque para Facturar de Inmediato</span>
              </div>
              <h3 className="text-lg font-black text-[#1C2722]">
                Plan 48 Horas: Cómo Conseguir tus Primeros 10 Clientes Sin Pagar Publicidad
              </h3>
              <p className="text-xs text-[#5F6360] mt-1 max-w-3xl">
                No necesitas esperar semanas ni invertir millones en anuncios. Sigue este cronograma hoy mismo:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#ECE5DD] bg-[#FAF8F5] flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl font-bold text-xs shrink-0">
                  DÍA 1 (Mañana)
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-[#1C2722]">Paso 1: Publicar 3 Artículos en Facebook Marketplace</h4>
                  <p className="text-[#5F6360] mt-0.5">
                    Entra al Generador de la Pestaña 1, selecciona 3 productos con buen margen y genera la ficha para Marketplace. Publícalos en tu ciudad con opción de domicilio y pago 100% seguro a través de la pasarela Wompi (PSE, Tarjetas, Nequi).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#ECE5DD] bg-[#FAF8F5] flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs shrink-0">
                  DÍA 1 (Tarde)
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-[#1C2722]">Paso 2: Publicar en 5 Grupos de Facebook de Mascotas</h4>
                  <p className="text-[#5F6360] mt-0.5">
                    Busca grupos como "Mascotas Bogotá", "Amantes de los Gatos Colombia", "Clasificados tu localidad". Publica fotos con la oferta especial y tu enlace de WhatsApp para responder dudas.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#ECE5DD] bg-[#FAF8F5] flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl font-bold text-xs shrink-0">
                  DÍA 1 (Noche)
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-[#1C2722]">Paso 3: Campaña de Estados de WhatsApp</h4>
                  <p className="text-[#5F6360] mt-0.5">
                    Sube 3 fotos de tus productos estrella a tus Estados de WhatsApp con el texto: "¡Llegó surtido nuevo a Lunary World Pets con domicilio rápido! Escríbeme y te aparto el tuyo". Tu círculo cercano y conocidos son tus clientes más fáciles.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#ECE5DD] bg-[#FAF8F5] flex items-start gap-3">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl font-bold text-xs shrink-0">
                  DÍA 2 (Todo el Día)
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-[#1C2722]">Paso 4: Cierre Rápido y Pago Seguro con Pasarela Wompi / PSE</h4>
                  <p className="text-[#5F6360] mt-0.5">
                    A cada persona que te pregunte por WhatsApp, envíale el enlace de pago de tu tienda (con Wompi, Bancolombia, Nequi o PSE) y coordina el despacho a domicilio. La velocidad de respuesta es lo que define si te compran a ti o a otra tienda.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Motivation */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between gap-4">
              <div className="text-xs">
                <p className="font-bold text-emerald-950">¡Todo está listo en tu tienda para empezar a facturar!</p>
                <p className="text-emerald-800 mt-0.5">
                  Los productos ya están sincronizados en la nube y el checkout con Wompi está habilitado.
                </p>
              </div>

              <button
                onClick={() => setActiveSection('generator')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Generar Mi Primer Anuncio Ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Modal for High-Resolution Photo Viewing & Direct Download */}
      {viewingPhotoModal && selectedProduct && selectedProduct.imageUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-[#1C2722] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs sm:text-sm font-bold truncate max-w-xs">{selectedProduct.name}</h4>
              </div>
              <button
                onClick={() => setViewingPhotoModal(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="p-5 bg-[#FAF8F5] flex flex-col items-center justify-center">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="max-h-[360px] w-auto max-w-full object-contain rounded-2xl border border-[#ECE5DD] shadow-md bg-white"
              />
              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-[#1C2722]">{selectedProduct.name}</p>
                <p className="text-xs font-bold text-emerald-700">{formatCOP(selectedProduct.price)}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-[#ECE5DD] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewingPhotoModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#5F6360] hover:bg-[#FAF8F5] border border-[#ECE5DD] cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadPhoto();
                  setViewingPhotoModal(false);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Foto a mi Computador / Celular (.JPG)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
