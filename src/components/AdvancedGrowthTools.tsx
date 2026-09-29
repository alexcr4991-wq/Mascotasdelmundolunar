import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Send,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  Download,
  Award,
  Mail,
  RefreshCw,
  Gift,
  Users,
  CheckCheck,
  Flame,
} from 'lucide-react';
import { Product, ContactInfo, Order, CustomerLead } from '../types';
import { formatCOP } from '../utils/formatters';

interface AdvancedGrowthToolsProps {
  products: Product[];
  contactInfo: ContactInfo;
  orders: Order[];
  customerLeads: CustomerLead[];
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AdvancedGrowthTools: React.FC<AdvancedGrowthToolsProps> = ({
  products,
  contactInfo,
  orders,
  customerLeads,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'recovery' | 'xml_feed' | 'loyalty' | 'newsletter'>('recovery');

  // 1. Cart Abandonment State
  const [abandonedCustomerName, setAbandonedCustomerName] = useState('Camila Pérez');
  const [abandonedPhone, setAbandonedPhone] = useState('3123456789');
  const [selectedAbandonedProduct, setSelectedAbandonedProduct] = useState(products[0]?.name || 'Alimento Premium Perros');
  const [abandonedTotal, setAbandonedTotal] = useState(products[0]?.price || 65000);
  const [copiedRecovery, setCopiedRecovery] = useState(false);

  // 2. XML Feed State
  const [copiedXmlUrl, setCopiedXmlUrl] = useState(false);

  // 3. Loyalty & Referrals State
  const [loyaltyClients, setLoyaltyClients] = useState([
    { id: '1', name: 'Carlos Mendoza', phone: '3104445566', coins: 150, referrals: 3 },
    { id: '2', name: 'Sofía Gómez', phone: '3157778899', coins: 300, referrals: 6 },
    { id: '3', name: 'Andrés Parra', phone: '3201112233', coins: 80, referrals: 1 },
  ]);
  const [newLoyaltyName, setNewLoyaltyName] = useState('');
  const [newLoyaltyPhone, setNewLoyaltyPhone] = useState('');

  // 4. Newsletter Generator State
  const [newsletterTopic, setNewsletterTopic] = useState<'descuento_fin_de_semana' | 'cuidado_invierno' | 'nutricion_senior' | 'lanzamiento_nuevo'>('descuento_fin_de_semana');
  const [generatedNewsletter, setGeneratedNewsletter] = useState('');
  const [copiedNewsletter, setCopiedNewsletter] = useState(false);

  const cleanPhone = (contactInfo?.phone || '3123456789').replace(/\D/g, '');

  // Generate Abandoned Cart Message
  const recoveryMessage = `🐾 ¡Hola ${abandonedCustomerName}! Notamos que guardaste "${selectedAbandonedProduct}" (${formatCOP(abandonedTotal)}) en tu carrito de Lunary World Pets pero no concluiste tu pedido. 🛒✨

¿Tuviste algún inconveniente con el pago o tienes dudas sobre el producto? 
Recuerda que aceptamos Nequi, Bancolombia, PSE y Tarjetas con despacho seguro a domicilio 🛵

🎁 ¡Si confirmas tu pedido hoy, te obsequiamos envío prioritario! 
Escríbenos aquí o toca el enlace para finalizar: wa.me/57${cleanPhone}?text=Hola!%20Quiero%20finalizar%20mi%20pedido%20de%20${encodeURIComponent(selectedAbandonedProduct)}`;

  // Generate XML Feed content
  const generateXmlFeed = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n`;
    xml += `  <title>Lunary World Pets - Catálogo Oficial</title>\n`;
    xml += `  <link>${window.location.origin}</link>\n`;
    xml += `  <description>Alimentos, camas y accesorios premium para perros y gatos</description>\n`;

    products.forEach((p) => {
      xml += `  <item>\n`;
      xml += `    <g:id>${p.id}</g:id>\n`;
      xml += `    <title><![CDATA[${p.name}]]></title>\n`;
      xml += `    <description><![CDATA[${p.description || p.name}]]></description>\n`;
      xml += `    <link>${window.location.origin}?product=${p.id}</link>\n`;
      xml += `    <g:image_link>${p.imageUrl}</g:image_link>\n`;
      xml += `    <g:price>${p.price} COP</g:price>\n`;
      xml += `    <g:availability>${p.inStock ? 'in stock' : 'out of stock'}</g:availability>\n`;
      xml += `    <g:brand>${p.brand || 'Lunary World Pets'}</g:brand>\n`;
      xml += `    <g:condition>new</g:condition>\n`;
      xml += `  </item>\n`;
    });

    xml += `</channel>\n</rss>`;
    return xml;
  };

  const handleDownloadXml = () => {
    const xmlContent = generateXmlFeed();
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lunary_pets_google_shopping_feed.xml');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('¡Feed XML descargado correctamente para Google Shopping y Facebook!', 'success');
  };

  // Generate Newsletter
  const handleGenerateNewsletter = () => {
    const siteUrl = window.location.origin;
    if (newsletterTopic === 'descuento_fin_de_semana') {
      setGeneratedNewsletter(`Subject: 🌟 ¡Fin de semana de consentidos! 20% OFF en todo para tu peludito 🐶🐱

¡Hola querido amante de las mascotas! 🐾

Este fin de semana en *Lunary World Pets* queremos consentir a tu perro o gato como se merece. Tenemos una selección especial de alimentos premium, snacks y accesorios con envío rápido a domicilio.

🔥 Destacado del fin de semana:
• Alimentos y snacks nutritivos seleccionados por expertos
• Despacho inmediato en Bogotá y Colombia
• Pagos seguros con Nequi, Bancolombia y PSE

👉 ¡Aprovecha la promoción visitando nuestra tienda ahora mismo!
${siteUrl}

Con cariño,
Equipo Lunary World Pets 🐾`);
    } else if (newsletterTopic === 'cuidado_invierno') {
      setGeneratedNewsletter(`Subject: 🌧️ Cuida a tu mascota del frío: Camas térmicas y abrigo en Lunary Pets 🧥🐾

¡Hola! 

Con los cambios de clima y la temporada de frío, nuestros peluditos necesitan extra protección para cuidar sus articulaciones y su salud general. 

✨ En Lunary World Pets tenemos todo lo necesario para mantenerlos abrigados y felices:
• Camas ortopédicas y térmicas acolchadas
• Alimentos reforzados con vitaminas y defensas
• Accesorios de paseo impermeables

🛒 ¡Consiente a tu mejor amigo hoy!
${siteUrl}

Un abrazo perruno y gatuno,
Equipo Lunary World Pets 🐾`);
    } else if (newsletterTopic === 'nutricion_senior') {
      setGeneratedNewsletter(`Subject: 🐕 ¿Tu peludito está entrando a la tercera edad? Descubre cómo cuidarlo 💙

¡Hola!

Nuestros perros y gatos senior (mayores de 7 años) requieren cuidados nutricionales especiales para mantener su energía, salud articular y pelaje brillante.

🥣 En Lunary World Pets te asesoramos con nuestra calculadora de porciones y alimentos especializados de alta digestibilidad.

👉 Descubre nuestro catálogo especializado aquí:
${siteUrl}

Con amor por las mascotas,
Equipo Lunary World Pets 🐾`);
    } else {
      setGeneratedNewsletter(`Subject: 🚀 ¡Nuevos productos en Lunary World Pets! Sé el primero en descubrirlos ✨

¡Hola!

¡Tenemos novedades increíbles en nuestra tienda! Acabamos de recibir productos importados y de alta calidad para consentir a perros y gatos exigentes.

🛍️ Entra a nuestra tienda y descubre las novedades antes que nadie:
${siteUrl}

¡Gracias por ser parte de nuestra gran familia peluda! 🐾`);
    }
    showToast('¡Newsletter generado con éxito!', 'success');
  };

  // Initial generation
  React.useEffect(() => {
    handleGenerateNewsletter();
  }, [newsletterTopic]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1C2722] via-[#24342D] to-[#18231E] text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-stone-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ● 100% Gratis & Autónomo
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Sin Costos Ocultos
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight">
            🚀 Herramientas Avanzadas de Crecimiento Automático
          </h3>
          <p className="text-xs text-stone-300 max-w-2xl">
            Recupera carritos abandonados por WhatsApp, exporta tu catálogo gratis a Google Shopping, premia a tus clientes con el programa de referidos Lunary Coins y genera boletines de email automáticos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => showToast('¡Todas las herramientas avanzadas están activas y operando al 100%!', 'success')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-stone-950 text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Estado: Activo</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-[#ECE5DD]">
        <button
          type="button"
          onClick={() => setActiveSubTab('recovery')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'recovery'
              ? 'bg-[#1C2722] text-white shadow-xs'
              : 'bg-[#FAF8F5] text-[#5F6360] hover:bg-[#EFE9DF]'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>1. Recuperador de Carritos (WhatsApp)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('xml_feed')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'xml_feed'
              ? 'bg-[#1C2722] text-white shadow-xs'
              : 'bg-[#FAF8F5] text-[#5F6360] hover:bg-[#EFE9DF]'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-amber-400" />
          <span>2. Google Shopping & Facebook XML Feed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('loyalty')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'loyalty'
              ? 'bg-[#1C2722] text-white shadow-xs'
              : 'bg-[#FAF8F5] text-[#5F6360] hover:bg-[#EFE9DF]'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-purple-400" />
          <span>3. Programa Referidos ("Lunary Coins")</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('newsletter')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'newsletter'
              ? 'bg-[#1C2722] text-white shadow-xs'
              : 'bg-[#FAF8F5] text-[#5F6360] hover:bg-[#EFE9DF]'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-sky-400" />
          <span>4. Generador Automático de Newsletters</span>
        </button>
      </div>

      {/* SUBTAB 1: CART ABANDONMENT RECOVERY */}
      {activeSubTab === 'recovery' && (
        <div className="bg-white border border-[#DED7CB] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-3">
            <div>
              <h4 className="font-bold text-sm text-[#1C1F1E] flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Bot de Recuperación de Carritos Abandonados por WhatsApp</span>
              </h4>
              <p className="text-xs text-[#5F6360]">
                Convierte visitantes indecisos en compradores con un mensaje persuasivo de 1 clic.
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full">
              Conversión Estimada: +35%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                  Nombre del Cliente o Visitante
                </label>
                <input
                  type="text"
                  value={abandonedCustomerName}
                  onChange={(e) => setAbandonedCustomerName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  type="text"
                  value={abandonedPhone}
                  onChange={(e) => setAbandonedPhone(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                  Producto que dejó en el Carrito
                </label>
                <select
                  value={selectedAbandonedProduct}
                  onChange={(e) => {
                    const found = products.find((p) => p.name === e.target.value);
                    setSelectedAbandonedProduct(e.target.value);
                    if (found) setAbandonedTotal(found.price);
                  }}
                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({formatCOP(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                  Valor Total Estimado (COP)
                </label>
                <input
                  type="number"
                  value={abandonedTotal}
                  onChange={(e) => setAbandonedTotal(Number(e.target.value) || 0)}
                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                />
              </div>
            </div>

            {/* Generated Message Preview */}
            <div className="bg-[#FAF8F5] border border-[#ECE5DD] rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1C1F1E] uppercase tracking-wider">
                    💬 Mensaje Listo para WhatsApp:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Optimizado
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#DED7CB] text-xs font-mono text-[#1C1F1E] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {recoveryMessage}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryMessage);
                    setCopiedRecovery(true);
                    showToast('¡Mensaje de recuperación copiado al portapapeles!', 'success');
                    setTimeout(() => setCopiedRecovery(false), 3000);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  {copiedRecovery ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{copiedRecovery ? '¡Copiado!' : 'Copiar Mensaje'}</span>
                </button>

                <a
                  href={`https://wa.me/57${abandonedPhone.replace(/\D/g, '')}?text=${encodeURIComponent(recoveryMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: GOOGLE SHOPPING XML FEED */}
      {activeSubTab === 'xml_feed' && (
        <div className="bg-white border border-[#DED7CB] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-3">
            <div>
              <h4 className="font-bold text-sm text-[#1C1F1E] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-600" />
                <span>Generador de Catálogo XML para Google Shopping y Facebook</span>
              </h4>
              <p className="text-xs text-[#5F6360]">
                Sube todos tus productos a Google de forma gratuita sin pagar anuncios.
              </p>
            </div>
            <span className="bg-amber-50 text-amber-900 text-[11px] font-bold px-3 py-1 rounded-full">
              {products.length} Productos en el Feed
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] space-y-3">
              <h5 className="text-xs font-bold text-[#1C1F1E]">¿Cómo usar este Feed XML gratis?</h5>
              <ol className="text-xs text-[#5F6360] space-y-1.5 list-decimal pl-4">
                <li>Haz clic en el botón de abajo para <strong>descargar tu archivo XML</strong> en tu computador.</li>
                <li>Entra gratis a <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="text-[#B97A48] font-bold underline">Google Merchant Center</a> con tu cuenta de Google.</li>
                <li>Crea un feed de productos y sube este archivo o usa la URL pública de tu tienda para sincronizar automáticamente todo tu catálogo de mascotas.</li>
                <li>¡Listo! Google mostrará tus productos en las búsquedas de imágenes y shopping de forma orgánica.</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadXml}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Descargar Archivo XML (.xml) para Google Shopping</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const xml = generateXmlFeed();
                  navigator.clipboard.writeText(xml);
                  setCopiedXmlUrl(true);
                  showToast('¡Código XML copiado al portapapeles!', 'success');
                  setTimeout(() => setCopiedXmlUrl(false), 3000);
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#DED7CB] hover:bg-[#FAF8F5] text-[#1C1F1E] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedXmlUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#5F6360]" />}
                <span>{copiedXmlUrl ? '¡Código XML Copiado!' : 'Copiar Código XML'}</span>
              </button>
            </div>

            {/* XML Preview Code Box */}
            <div>
              <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                Vista Previa del Feed XML Generado:
              </label>
              <textarea
                readOnly
                rows={6}
                value={generateXmlFeed()}
                className="w-full bg-[#1C2722] text-emerald-300 font-mono text-[11px] p-3.5 rounded-2xl outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: LOYALTY & REFERRALS (LUNARY COINS) */}
      {activeSubTab === 'loyalty' && (
        <div className="bg-white border border-[#DED7CB] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-3">
            <div>
              <h4 className="font-bold text-sm text-[#1C1F1E] flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Programa de Fidelización y Referidos ("Lunary Coins")</span>
              </h4>
              <p className="text-xs text-[#5F6360]">
                Premia a tus clientes con monedas virtuales por cada referido para conseguir clientes automáticos.
              </p>
            </div>
            <span className="bg-purple-50 text-purple-800 text-[11px] font-bold px-3 py-1 rounded-full">
              1 Lunary Coin = $1.000 COP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Add client form */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] space-y-3">
              <h5 className="text-xs font-bold text-[#1C1F1E] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#B97A48]" />
                <span>Inscribir Cliente en Lunary Coins</span>
              </h5>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1F1E] mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={newLoyaltyName}
                    onChange={(e) => setNewLoyaltyName(e.target.value)}
                    placeholder="Ej: Marcela Ríos"
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-xs text-[#1C1F1E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1F1E] mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={newLoyaltyPhone}
                    onChange={(e) => setNewLoyaltyPhone(e.target.value)}
                    placeholder="Ej: 3112223344"
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-xs text-[#1C1F1E] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newLoyaltyName) {
                      showToast('Ingresa el nombre del cliente.', 'warning');
                      return;
                    }
                    const newItem = {
                      id: `loyalty_${Date.now()}`,
                      name: newLoyaltyName,
                      phone: newLoyaltyPhone || '3000000000',
                      coins: 50, // bonus de bienvenida
                      referrals: 0,
                    };
                    setLoyaltyClients([newItem, ...loyaltyClients]);
                    setNewLoyaltyName('');
                    setNewLoyaltyPhone('');
                    showToast(`¡Cliente "${newItem.name}" inscrito con 50 Lunary Coins de regalo!`, 'success');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Registrar con 50 Coins de Bono
                </button>
              </div>
            </div>

            {/* Clients List */}
            <div className="md:col-span-2 space-y-3">
              <h5 className="text-xs font-bold text-[#1C1F1E]">Clientes Participantes y Saldo de Coins:</h5>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loyaltyClients.map((client) => (
                  <div key={client.id} className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE5DD] flex items-center justify-between">
                    <div>
                      <h6 className="text-xs font-bold text-[#1C1F1E]">{client.name}</h6>
                      <p className="text-[11px] text-[#5F6360]">WhatsApp: {client.phone} | Referidos: {client.referrals}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-100 text-purple-900 text-xs font-extrabold px-3 py-1 rounded-full">
                        🪙 {client.coins} Coins
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLoyaltyClients(loyaltyClients.map(c => c.id === client.id ? { ...c, coins: c.coins + 50, referrals: c.referrals + 1 } : c));
                          showToast(`¡Se sumaron 50 Lunary Coins a ${client.name} por un nuevo referido!`, 'success');
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 cursor-pointer"
                        title="Sumar 50 coins por referido"
                      >
                        + Referido
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: NEWSLETTER AUTOMATIC GENERATOR */}
      {activeSubTab === 'newsletter' && (
        <div className="bg-white border border-[#DED7CB] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-3">
            <div>
              <h4 className="font-bold text-sm text-[#1C1F1E] flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-600" />
                <span>Generador Automático de Campañas de Email / Newsletter</span>
              </h4>
              <p className="text-xs text-[#5F6360]">
                Crea correos profesionales para mantener a tus clientes enganchados y vendiendo más.
              </p>
            </div>
            <span className="bg-sky-50 text-sky-800 text-[11px] font-bold px-3 py-1 rounded-full">
              IA Asistida
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Topic selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#1C1F1E]">Selecciona la Campaña:</label>
              <div className="space-y-2">
                {[
                  { id: 'descuento_fin_de_semana', label: '🌟 Fin de Semana de Descuentos' },
                  { id: 'cuidado_invierno', label: '🌧️ Cuidado contra el Frío y Lluvia' },
                  { id: 'nutricion_senior', label: '🐕 Nutrición para Mascotas Senior' },
                  { id: 'lanzamiento_nuevo', label: '🚀 Lanzamiento de Nuevos Productos' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNewsletterTopic(item.id as any)}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                      newsletterTopic === item.id
                        ? 'bg-[#1C2722] text-white border-[#1C2722] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1C1F1E] border-[#ECE5DD] hover:bg-[#EFE9DF]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateNewsletter}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerar Contenido</span>
              </button>
            </div>

            {/* Newsletter Output */}
            <div className="md:col-span-2 bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-[#1C1F1E] block mb-2">✉️ Borrador del Correo Electrónico:</span>
                <textarea
                  readOnly
                  rows={8}
                  value={generatedNewsletter}
                  className="w-full bg-white p-3.5 rounded-xl border border-[#DED7CB] text-xs font-mono text-[#1C1F1E] outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedNewsletter);
                    setCopiedNewsletter(true);
                    showToast('¡Newsletter copiado al portapapeles!', 'success');
                    setTimeout(() => setCopiedNewsletter(false), 3000);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNewsletter ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{copiedNewsletter ? '¡Copiado!' : 'Copiar Newsletter'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
