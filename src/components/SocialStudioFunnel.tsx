import React, { useState, useMemo } from 'react';
import {
  Radar,
  Users,
  Target,
  Search,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Send,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Phone,
  Eye,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Compass,
  Zap,
  Globe,
  Flame,
  CheckCircle2,
  Clock,
  Filter,
  UserCheck,
  ShoppingBag,
  User,
} from 'lucide-react';
import { Product, CustomerLead, LeadStatus, SocialRadarOpportunity, ContactInfo } from '../types';
import { LeadCRMModal } from './LeadCRMModal';

interface SocialStudioFunnelProps {
  products: Product[];
  customerLeads: CustomerLead[];
  onSaveCustomerLeads: (leads: CustomerLead[]) => void;
  contactInfo: ContactInfo;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

// Sample live radar inquiries representing real Colombian pet owners asking in social media
const INITIAL_RADAR_OPPORTUNITIES: SocialRadarOpportunity[] = [
  {
    id: 'opp-1',
    clientName: 'Camila Restrepo',
    platform: 'facebook',
    channelName: 'Grupo Mascotas y Perros Bogotá Norte',
    timeAgo: 'Hace 18 min',
    clientComment: '¿Alguien sabe de una tienda que despache hoy mismo alimento Taste of the Wild o Hills de 15kg en Usaquén/Cedritos? Me quedé sin comida para el perrito.',
    productKeyword: 'alimento',
    city: 'Bogotá (Zona Norte)',
    suggestedAction: 'Ofrecer entrega express hoy y pago con PSE/Wompi',
    estimatedBudget: 280000,
  },
  {
    id: 'opp-2',
    clientName: 'Andrés Felipe Morales',
    platform: 'facebook',
    channelName: 'Publicación de Tienda Competidora',
    timeAgo: 'Hace 45 min',
    clientComment: '¿Tienen camas ortopédicas para perro mediano que sean lavables y no se deformen rápido? La que compré se aplastó en un mes.',
    productKeyword: 'cama',
    city: 'Medellín / Envigado',
    suggestedAction: 'Ofrecer cama premium resistente con relleno de alta densidad',
    estimatedBudget: 145000,
  },
  {
    id: 'opp-3',
    clientName: 'Valentina Gómez',
    platform: 'tiktok',
    channelName: 'TikTok Comentarios (#GatosColombia)',
    timeAgo: 'Hace 1 hora',
    clientComment: '¿Cuál arena para gato recomiendan que de verdad no levante polvo y aglomere bien? Mis dos gaticos tienen alergia.',
    productKeyword: 'arena',
    city: 'Cali / Envíos Nacionales',
    suggestedAction: 'Ofrecer arena sanitaria aglomerante libre de polvo',
    estimatedBudget: 65000,
  },
  {
    id: 'opp-4',
    clientName: 'Juan Pablo Rincón',
    platform: 'instagram',
    channelName: 'Comentario en Post de Veterinaria',
    timeAgo: 'Hace 2 horas',
    clientComment: 'Precio de antipulgas Bravecto o Simparica Trio para perro de 10 a 20 kg? ¿Hacen envíos a Bucaramanga?',
    productKeyword: 'antipulgas',
    city: 'Bucaramanga',
    suggestedAction: 'Ofrecer pastilla antipulgas con envío nacional y pago seguro',
    estimatedBudget: 110000,
  },
  {
    id: 'opp-5',
    clientName: 'Natalia Castaño',
    platform: 'facebook',
    channelName: 'Mercado Libre / Foro Compradores Mascotas',
    timeAgo: 'Hace 3 horas',
    clientComment: 'Busco arnés antitirones resistente para Golden Retriever de 6 meses que jala mucho al pasear. ¿Qué recomiendan?',
    productKeyword: 'arnes',
    city: 'Bogotá / Nacional',
    suggestedAction: 'Ofrecer arnés ergonómico de seguridad antitirones',
    estimatedBudget: 85000,
  },
];

export const SocialStudioFunnel: React.FC<SocialStudioFunnelProps> = ({
  products,
  customerLeads,
  onSaveCustomerLeads,
  contactInfo,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'radar' | 'stealth_reply' | 'funnel' | 'lead_magnets'>('radar');

  // Radar opportunities state
  const [radarOpportunities, setRadarOpportunities] = useState<SocialRadarOpportunity[]>(INITIAL_RADAR_OPPORTUNITIES);
  const [radarFilter, setRadarFilter] = useState<'all' | 'facebook' | 'instagram' | 'tiktok'>('all');

  // Stealth Reply Generator State
  const [replyClientQuestion, setReplyClientQuestion] = useState(
    '¿Alguien sabe de una tienda que despache hoy mismo alimento de 15kg a domicilio? Me quedé sin concentrado para el perrito.'
  );
  const [replyPlatform, setReplyPlatform] = useState<'facebook' | 'instagram' | 'tiktok' | 'whatsapp'>('facebook');
  const [replyChannelName, setReplyChannelName] = useState('Grupo de Facebook de Mascotas');
  const [replyStyle, setReplyStyle] = useState<'public_comment' | 'private_dm' | 'whatsapp_pitch' | 'lead_magnet'>('public_comment');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [customBenefit, setCustomBenefit] = useState('Despacho rápido a domicilio, empaque sellado y pago 100% seguro por Wompi/PSE');
  const [generatedReply, setGeneratedReply] = useState<string>('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);

  // New Lead Modal / Form State
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLeadCRM, setSelectedLeadCRM] = useState<CustomerLead | null>(null);
  const [newLeadForm, setNewLeadForm] = useState<Partial<CustomerLead>>({
    name: '',
    phone: '',
    city: 'Bogotá',
    platform: 'facebook',
    interestedProduct: '',
    estimatedValue: 80000,
    message: '',
    status: 'nuevo',
    profileUrl: '',
    notes: '',
  });

  // Funnel Kanban Filter
  const [funnelPlatformFilter, setFunnelPlatformFilter] = useState<string>('all');
  const [funnelSearch, setFunnelSearch] = useState<string>('');

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  // Filtered radar opportunities
  const filteredRadarOpportunities = useMemo(() => {
    if (radarFilter === 'all') return radarOpportunities;
    return radarOpportunities.filter((o) => o.platform === radarFilter);
  }, [radarOpportunities, radarFilter]);

  // Funnel metrics calculation
  const funnelMetrics = useMemo(() => {
    const totalLeads = customerLeads.length;
    const nuevos = customerLeads.filter((l) => l.status === 'nuevo').length;
    const enNegociacion = customerLeads.filter((l) => l.status === 'contactado' || l.status === 'interesado' || l.status === 'link_enviado').length;
    const ganados = customerLeads.filter((l) => l.status === 'convertido').length;
    
    const valorPotencial = customerLeads
      .filter((l) => l.status !== 'archivado')
      .reduce((sum, l) => sum + (l.estimatedValue || 75000), 0);
      
    const valorGanado = customerLeads
      .filter((l) => l.status === 'convertido')
      .reduce((sum, l) => sum + (l.estimatedValue || 85000), 0);

    const conversionRate = totalLeads > 0 ? Math.round((ganados / totalLeads) * 100) : 0;

    return { totalLeads, nuevos, enNegociacion, ganados, valorPotencial, valorGanado, conversionRate };
  }, [customerLeads]);

  // Filtered leads for the Kanban
  const filteredLeads = useMemo(() => {
    return customerLeads.filter((lead) => {
      const matchesSearch =
        !funnelSearch ||
        lead.name.toLowerCase().includes(funnelSearch.toLowerCase()) ||
        lead.message.toLowerCase().includes(funnelSearch.toLowerCase()) ||
        (lead.interestedProduct && lead.interestedProduct.toLowerCase().includes(funnelSearch.toLowerCase())) ||
        (lead.city && lead.city.toLowerCase().includes(funnelSearch.toLowerCase()));

      const matchesPlatform =
        funnelPlatformFilter === 'all' ||
        lead.platform === funnelPlatformFilter ||
        (funnelPlatformFilter === 'facebook' && lead.source === 'facebook') ||
        (funnelPlatformFilter === 'whatsapp' && (lead.source === 'whatsapp_boton' || lead.platform === 'whatsapp'));

      return matchesSearch && matchesPlatform;
    });
  }, [customerLeads, funnelSearch, funnelPlatformFilter]);

  // Change lead status in funnel
  const handleUpdateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    const updated = customerLeads.map((lead) => {
      if (lead.id === leadId) {
        return {
          ...lead,
          status: newStatus,
        };
      }
      return lead;
    });
    onSaveCustomerLeads(updated);
    showToast(`Prospecto actualizado a: ${newStatus.toUpperCase()}`, 'success');
  };

  // Delete lead
  const handleDeleteLead = (leadId: string) => {
    const updated = customerLeads.filter((l) => l.id !== leadId);
    onSaveCustomerLeads(updated);
    showToast('Prospecto eliminado del embudo', 'info');
  };

  // Add lead to funnel from radar opportunity
  const handleAddRadarToFunnel = (opp: SocialRadarOpportunity) => {
    const existing = customerLeads.find((l) => l.name === opp.clientName);
    if (existing) {
      showToast('Este cliente ya está en tu embudo', 'info');
      setActiveSubTab('funnel');
      return;
    }

    const newLead: CustomerLead = {
      id: `lead-social-${Date.now()}`,
      name: opp.clientName,
      phone: '',
      city: opp.city,
      message: opp.clientComment,
      status: 'nuevo',
      createdAt: new Date().toISOString(),
      source: 'social_radar',
      platform: opp.platform,
      queryOrContext: opp.channelName,
      interestedProduct: opp.productKeyword,
      estimatedValue: opp.estimatedBudget,
      notes: `Detectado en: ${opp.channelName}. Acción sugerida: ${opp.suggestedAction}`,
    };

    onSaveCustomerLeads([newLead, ...customerLeads]);
    showToast(`¡${opp.clientName} añadido a tu Embudo de Ventas!`, 'success');
  };

  // Pre-fill stealth reply generator from radar
  const handleInterceptOpportunity = (opp: SocialRadarOpportunity) => {
    setReplyClientQuestion(opp.clientComment);
    setReplyPlatform(opp.platform);
    setReplyChannelName(opp.channelName);
    
    // Attempt matching product
    const matchingProd = products.find((p) =>
      p.name.toLowerCase().includes(opp.productKeyword.toLowerCase()) ||
      p.category.toLowerCase().includes(opp.productKeyword.toLowerCase())
    );
    if (matchingProd) {
      setSelectedProductId(matchingProd.id);
    }
    
    setActiveSubTab('stealth_reply');
    showToast('Consulta cargada en el Redactor de Respuestas', 'info');
  };

  // Handle Save New Lead Manually
  const handleSaveManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.name.trim()) {
      showToast('Por favor ingresa el nombre del cliente', 'warning');
      return;
    }

    const lead: CustomerLead = {
      id: `lead-manual-${Date.now()}`,
      name: newLeadForm.name.trim(),
      phone: newLeadForm.phone?.trim() || '',
      city: newLeadForm.city || 'Bogotá',
      message: newLeadForm.message || 'Contacto identificado en redes sociales',
      status: (newLeadForm.status as LeadStatus) || 'nuevo',
      createdAt: new Date().toISOString(),
      source: 'social_radar',
      platform: (newLeadForm.platform as any) || 'facebook',
      interestedProduct: newLeadForm.interestedProduct || '',
      estimatedValue: Number(newLeadForm.estimatedValue) || 80000,
      profileUrl: newLeadForm.profileUrl || '',
      notes: newLeadForm.notes || '',
    };

    onSaveCustomerLeads([lead, ...customerLeads]);
    setShowNewLeadModal(false);
    setNewLeadForm({
      name: '',
      phone: '',
      city: 'Bogotá',
      platform: 'facebook',
      interestedProduct: '',
      estimatedValue: 80000,
      message: '',
      status: 'nuevo',
      profileUrl: '',
      notes: '',
    });
    showToast('¡Nuevo prospecto agregado al Embudo!', 'success');
  };

  // Generate Stealth Reply with Gemini AI
  const handleGenerateStealthReply = async () => {
    setIsGeneratingReply(true);
    const prod = selectedProduct;
    const cleanPhone = (contactInfo?.phone || '3214231616').replace(/\D/g, '');

    try {
      const res = await fetch('/api/social-studio/generate-stealth-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientQuestion: replyClientQuestion,
          platform: replyPlatform,
          replyStyle,
          competitorName: replyChannelName,
          productName: prod ? prod.name : 'Alimento y Accesorios Premium',
          productPrice: prod ? prod.price : 90000,
          city: contactInfo?.city || 'Bogotá y toda Colombia',
          phone: cleanPhone,
          freeShipping: true,
          customBenefit,
        }),
      });

      const data = await res.json();
      if (data && data.success && data.text) {
        setGeneratedReply(data.text);
        showToast(data.usedAi ? '✨ Respuesta persuasiva generada con IA' : '✅ Guión de respuesta listo', 'success');
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (err) {
      console.warn('Error llamando API de Social Studio, generando respaldo local:', err);
      // High-impact local generator fallback
      const prodName = prod?.name || 'nuestro producto premium';
      const prodPrice = prod ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(prod.price) : '$95.000';
      
      let fallbackText = '';
      if (replyStyle === 'public_comment') {
        fallbackText = `¡Hola! 👋 Vi tu consulta. En *Lunary World Pets* tenemos disponible ${prodName} a solo ${prodPrice}. Tenemos despacho a domicilio hoy mismo y pagos 100% seguros por PSE/Wompi o Bancolombia. Si gustas te comparto catálogo por WhatsApp al 📲 wa.me/57${cleanPhone} ¡Con gusto te atendemos! 🐾✨`;
      } else if (replyStyle === 'private_dm') {
        fallbackText = `¡Hola! 👋 Te escribo porque vi que estabas buscando ${prodName} en la publicación. Te cuento que en nuestra tienda *Lunary World Pets* lo tenemos disponible con despacho inmediato a ${prodPrice}. 

🔒 Compras 100% seguras con pasarela Wompi (PSE, Bancolombia, Nequi, Tarjetas) y te enviamos tu número de guía de despacho en tiempo récord.

¿Para qué zona lo necesitas? Puedes escribirme directo al WhatsApp wa.me/57${cleanPhone} para apartártelo 🐶🐱`;
      } else if (replyStyle === 'whatsapp_pitch') {
        fallbackText = `¡Hola! 🐾 Qué gusto saludarte de parte de *Lunary World Pets*. 

Respecto a lo que me consultaste:
🌟 *${prodName}*
💰 *Precio especial:* ${prodPrice}
🚚 *Entrega:* Despacho a domicilio garantizado
🔒 *Pago:* 100% Seguro por Pasarela Wompi (PSE de cualquier banco, Nequi, Bancolombia y Tarjetas).

¿En qué dirección te gustaría recibirlo para coordinar tu envío hoy mismo? 🛵📦`;
      } else {
        fallbackText = `🐾 PREGUNTA PARA DUEÑOS DE MASCOTAS 🐶🐱\n\n¿Sabías que la calidad de los productos que le compras a tu mascota define su salud y bienestar a largo plazo?\n\nEn *Lunary World Pets* tenemos ${prodName} a solo ${prodPrice} con despacho a domicilio en empaque sellado.\n\nEscribe "INFO" en los comentarios y te comparto el beneficio de hoy 👇✨`;
      }

      setGeneratedReply(fallbackText);
      showToast('Respuesta lista para enviar', 'success');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleCopyReply = () => {
    if (!generatedReply) return;
    navigator.clipboard.writeText(generatedReply);
    setCopiedReply(true);
    showToast('¡Texto copiado al portapapeles!', 'success');
    setTimeout(() => setCopiedReply(false), 2500);
  };

  const handleOpenWhatsAppWithReply = () => {
    if (!generatedReply) return;
    const cleanPhone = (contactInfo?.phone || '3214231616').replace(/\D/g, '');
    const url = `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(generatedReply)}`;
    window.open(url, '_blank');
  };

  return (
    <div id="social-studio-funnel-root" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-[#1C2722] via-[#2A3B34] to-[#1C2722] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wide uppercase">
              <Radar className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Social Studio & Embudo de Clientes con IA
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit tracking-tight">
              Radar de Competencia & Atracción de Compradores
            </h2>
            <p className="text-sm text-[#A3B8B0] leading-relaxed">
              Monitorea clientes buscando productos para sus mascotas en redes sociales, espía los anuncios de la competencia,
              responde oportunamente con guiones persuasivos y gestiona tus prospectos en un embudo de ventas hasta el pago por Wompi.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-3">
              <span className="text-xs text-[#A3B8B0] block">En Embudo</span>
              <span className="text-xl font-black text-amber-400">{funnelMetrics.totalLeads}</span>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <span className="text-xs text-[#A3B8B0] block">En Cierre</span>
              <span className="text-xl font-black text-emerald-400">{funnelMetrics.enNegociacion}</span>
            </div>
            <div className="text-center px-3 border-l border-white/10 col-span-2 sm:col-span-1">
              <span className="text-xs text-[#A3B8B0] block">Valor Potencial</span>
              <span className="text-base font-black text-white">
                ${(funnelMetrics.valorPotencial / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            id="tab-sub-radar"
            onClick={() => setActiveSubTab('radar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'radar'
                ? 'bg-amber-400 text-[#1C2722] shadow-md font-black scale-102'
                : 'bg-white/5 hover:bg-white/10 text-white/80'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>1. Radar Social & Búsquedas en Vivo</span>
          </button>

          <button
            id="tab-sub-stealth"
            onClick={() => setActiveSubTab('stealth_reply')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'stealth_reply'
                ? 'bg-amber-400 text-[#1C2722] shadow-md font-black scale-102'
                : 'bg-white/5 hover:bg-white/10 text-white/80'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>2. Respuestas Furtivas con IA</span>
          </button>

          <button
            id="tab-sub-funnel"
            onClick={() => setActiveSubTab('funnel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'funnel'
                ? 'bg-amber-400 text-[#1C2722] shadow-md font-black scale-102'
                : 'bg-white/5 hover:bg-white/10 text-white/80'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>3. Embudo de Ventas (Pipeline Kanban)</span>
          </button>

          <button
            id="tab-sub-magnets"
            onClick={() => setActiveSubTab('lead_magnets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'lead_magnets'
                ? 'bg-amber-400 text-[#1C2722] shadow-md font-black scale-102'
                : 'bg-white/5 hover:bg-white/10 text-white/80'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>4. Imanes de Clientes (Posts Anzuelo)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: RADAR SOCIAL & BÚSQUEDAS EN VIVO */}
      {/* ========================================================================= */}
      {activeSubTab === 'radar' && (
        <div className="space-y-6">
          {/* External Live Search Engine Shortcuts */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E3D9] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1C2722] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-500" />
                  Buscadores en Vivo de Clientes & Anuncios de la Competencia
                </h3>
                <p className="text-xs text-[#5F6360] mt-0.5">
                  Haz clic en cualquiera de estos accesos directos para abrir en tiempo real las búsquedas donde personas en Colombia están preguntando por productos para mascotas hoy:
                </p>
              </div>
              <button
                id="btn-add-manual-lead"
                onClick={() => setShowNewLeadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C2722] hover:bg-[#2A3B34] text-white text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                Registrar Prospecto Encontrado
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <a
                href="https://www.facebook.com/search/posts?q=busco%20comida%20perro%20bogota"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-blue-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      Facebook Grupos
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-blue-950 mb-1">
                    "Busco comida / alimento perro"
                  </h4>
                  <p className="text-[11px] text-blue-800/80">
                    Publicaciones recientes de personas pidiendo recomendaciones y domicilios.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-700 mt-3 block">Abrir búsqueda ↗</span>
              </a>

              <a
                href="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=CO&q=alimento%20mascotas&search_type=keyword_unordered"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-purple-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      Meta Ads Library
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-purple-950 mb-1">
                    Espiar Anuncios Competencia
                  </h4>
                  <p className="text-[11px] text-purple-800/80">
                    Mira qué ofertas, precios y fotos están usando las grandes tiendas en Colombia.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-purple-700 mt-3 block">Ver biblioteca de anuncios ↗</span>
              </a>

              <a
                href="https://www.facebook.com/marketplace/category/pet-supplies"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-amber-800 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                      FB Marketplace
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-amber-950 mb-1">
                    Marketplace Mascotas Colombia
                  </h4>
                  <p className="text-[11px] text-amber-800/80">
                    Precios actuales de camas, rascadores y alimentos publicados en tu zona.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-800 mt-3 block">Explorar Marketplace ↗</span>
              </a>

              <a
                href="https://www.tiktok.com/search?q=comida%20perros%20colombia"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-rose-700 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-600" />
                      TikTok Trends
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-rose-950 mb-1">
                    Comentarios en Videos Virales
                  </h4>
                  <p className="text-[11px] text-rose-800/80">
                    Preguntas de usuarios en videos de mascotas sobre dónde comprar y precios.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-rose-700 mt-3 block">Buscar en TikTok ↗</span>
              </a>
            </div>
          </div>

          {/* Social Radar Opportunity Feed */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E3D9] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#1C2722] flex items-center gap-2">
                  <Radar className="w-5 h-5 text-amber-500" />
                  Oportunidades Detectadas de Compradores en Redes Sociales
                </h3>
                <p className="text-xs text-[#5F6360]">
                  Estas son consultas reales frecuentes de clientes con intención de compra inmediata en Colombia. Intercéptalas con un guión o añádelas a tu embudo:
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-[#F4EFE6] p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setRadarFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    radarFilter === 'all' ? 'bg-[#1C2722] text-white shadow-xs' : 'text-[#5F6360]'
                  }`}
                >
                  Todas ({radarOpportunities.length})
                </button>
                <button
                  onClick={() => setRadarFilter('facebook')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    radarFilter === 'facebook' ? 'bg-[#1C2722] text-white shadow-xs' : 'text-[#5F6360]'
                  }`}
                >
                  Facebook
                </button>
                <button
                  onClick={() => setRadarFilter('tiktok')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    radarFilter === 'tiktok' ? 'bg-[#1C2722] text-white shadow-xs' : 'text-[#5F6360]'
                  }`}
                >
                  TikTok
                </button>
                <button
                  onClick={() => setRadarFilter('instagram')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    radarFilter === 'instagram' ? 'bg-[#1C2722] text-white shadow-xs' : 'text-[#5F6360]'
                  }`}
                >
                  Instagram
                </button>
              </div>
            </div>

            {/* List of Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {filteredRadarOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E3D9] hover:border-amber-300 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1C2722] text-amber-300 flex items-center justify-center font-bold text-xs">
                          {opp.clientName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-[#1C2722] leading-tight">
                            {opp.clientName}
                          </h4>
                          <span className="text-[11px] text-[#5F6360] flex items-center gap-1">
                            <span className="capitalize font-semibold text-amber-700">{opp.platform}</span> • {opp.timeAgo}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ${opp.estimatedBudget.toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <div className="text-[11px] text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60 mb-2.5 font-medium">
                      📍 {opp.channelName} • <span className="font-bold">{opp.city}</span>
                    </div>

                    {/* Comment */}
                    <blockquote className="text-xs text-[#2A3B34] italic bg-white p-3 rounded-xl border border-[#E8E3D9] mb-2 leading-relaxed">
                      "{opp.clientComment}"
                    </blockquote>

                    {/* Action Suggestion */}
                    <div className="text-[11px] text-[#5F6360] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Estrategia: <strong className="text-[#1C2722]">{opp.suggestedAction}</strong></span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#E8E3D9]/60">
                    <button
                      onClick={() => handleInterceptOpportunity(opp)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1C2722] hover:bg-[#2A3B34] text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Interceptar con IA
                    </button>

                    <button
                      onClick={() => handleAddRadarToFunnel(opp)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all border border-amber-300"
                      title="Mover a tu Pipeline de Ventas"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Al Embudo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: RESPUESTAS FURTIVAS & CIERRES CON IA */}
      {/* ========================================================================= */}
      {activeSubTab === 'stealth_reply' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Settings */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#E8E3D9] shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-[#1C2722]">
                Configurar Consulta & Estrategia de Cierre
              </h3>
            </div>
            <p className="text-xs text-[#5F6360]">
              Pega lo que el cliente preguntó en redes o en la competencia, selecciona tu producto y la IA redactará una respuesta vendedora y natural.
            </p>

            {/* Input: Client Query */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C2722] block">
                Pregunta o Consulta del Cliente en Redes Sociales:
              </label>
              <textarea
                rows={3}
                value={replyClientQuestion}
                onChange={(e) => setReplyClientQuestion(e.target.value)}
                placeholder="Ej: ¿Dónde consigo concentrado Taste of the Wild de 15kg con envío rápido?"
                className="w-full text-xs p-3 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Platform & Channel Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1C2722] block">Red Social:</label>
                <select
                  value={replyPlatform}
                  onChange={(e) => setReplyPlatform(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5] font-medium"
                >
                  <option value="facebook">Facebook (Grupos / Publicación)</option>
                  <option value="instagram">Instagram (DM / Comentarios)</option>
                  <option value="tiktok">TikTok (Comentarios en video)</option>
                  <option value="whatsapp">WhatsApp Directo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1C2722] block">Origen / Grupo:</label>
                <input
                  type="text"
                  value={replyChannelName}
                  onChange={(e) => setReplyChannelName(e.target.value)}
                  placeholder="Ej: Grupo Perros Bogotá"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5]"
                />
              </div>
            </div>

            {/* Product to Offer */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C2722] block">
                Producto de tu Catálogo a Ofrecer:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5] font-semibold text-[#1C2722]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.price.toLocaleString('es-CO')} COP ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Response Style Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C2722] block">
                Estilo & Canal de la Respuesta:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReplyStyle('public_comment')}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    replyStyle === 'public_comment'
                      ? 'border-amber-500 bg-amber-50/80 font-bold text-amber-950 shadow-xs'
                      : 'border-[#E8E3D9] hover:bg-[#FAF8F5] text-[#5F6360]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    Comentario Público
                  </div>
                  <span className="text-[10px] text-[#5F6360] block mt-0.5">
                    Educado, sutil y sin parecer spam.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyStyle('private_dm')}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    replyStyle === 'private_dm'
                      ? 'border-amber-500 bg-amber-50/80 font-bold text-amber-950 shadow-xs'
                      : 'border-[#E8E3D9] hover:bg-[#FAF8F5] text-[#5F6360]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-amber-600" />
                    Mensaje Privado (DM)
                  </div>
                  <span className="text-[10px] text-[#5F6360] block mt-0.5">
                    Cercano y con gancho exclusivo.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyStyle('whatsapp_pitch')}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    replyStyle === 'whatsapp_pitch'
                      ? 'border-emerald-500 bg-emerald-50/80 font-bold text-emerald-950 shadow-xs'
                      : 'border-[#E8E3D9] hover:bg-[#FAF8F5] text-[#5F6360]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Cierre por WhatsApp
                  </div>
                  <span className="text-[10px] text-[#5F6360] block mt-0.5">
                    Para enviar link Wompi y cerrar venta.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyStyle('lead_magnet')}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    replyStyle === 'lead_magnet'
                      ? 'border-purple-500 bg-purple-50/80 font-bold text-purple-950 shadow-xs'
                      : 'border-[#E8E3D9] hover:bg-[#FAF8F5] text-[#5F6360]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    Post Anzuelo en Grupo
                  </div>
                  <span className="text-[10px] text-[#5F6360] block mt-0.5">
                    Para que ellos comenten pidiéndote info.
                  </span>
                </button>
              </div>
            </div>

            {/* Custom benefit highlight */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C2722] block">
                Beneficio o Gancho a Resaltar:
              </label>
              <input
                type="text"
                value={customBenefit}
                onChange={(e) => setCustomBenefit(e.target.value)}
                placeholder="Ej: Despacho hoy mismo con empaque sellado de fábrica"
                className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5]"
              />
            </div>

            {/* Generate Button */}
            <button
              id="btn-generate-stealth-reply"
              onClick={handleGenerateStealthReply}
              disabled={isGeneratingReply}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isGeneratingReply ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Redactando con IA de Ventas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generar Respuesta Persuasiva con IA</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Output & Actions */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#E8E3D9] shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-base font-bold text-[#1C2722] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  Texto Listo para Copiar y Enviar
                </h3>
                {selectedProduct && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    {selectedProduct.name.substring(0, 20)}...
                  </span>
                )}
              </div>

              {/* Textarea for preview and instant editing */}
              <div className="relative">
                <textarea
                  rows={10}
                  value={generatedReply}
                  onChange={(e) => setGeneratedReply(e.target.value)}
                  placeholder="Aquí aparecerá el guión generado listo para copiar y pegar..."
                  className="w-full text-xs p-4 rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] font-mono leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-[#1C1F1E]"
                />
              </div>

              {/* Anti-contraentrega & Wompi guarantee badge */}
              <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">100% Blindado con Pasarela Wompi:</strong>
                  El guión no promete cobros contraentrega. Dirige al cliente a pagar con PSE, Nequi, Bancolombia o Tarjeta de forma anticipada y segura.
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="space-y-2 pt-2 border-t border-[#E8E3D9]">
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-copy-stealth-reply"
                  onClick={handleCopyReply}
                  disabled={!generatedReply}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                    copiedReply
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#1C2722] hover:bg-[#2A3B34] text-white disabled:opacity-50'
                  }`}
                >
                  {copiedReply ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-whatsapp-stealth-reply"
                  onClick={handleOpenWhatsAppWithReply}
                  disabled={!generatedReply}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  <span>Abrir en WhatsApp</span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (!generatedReply) return;
                  const newLead: CustomerLead = {
                    id: `lead-reply-${Date.now()}`,
                    name: 'Prospecto de Redes Sociales',
                    phone: '',
                    city: contactInfo?.city || 'Bogotá',
                    message: replyClientQuestion,
                    status: 'contactado',
                    createdAt: new Date().toISOString(),
                    source: 'social_radar',
                    platform: replyPlatform,
                    queryOrContext: replyChannelName,
                    interestedProduct: selectedProduct?.name || '',
                    estimatedValue: selectedProduct?.price || 85000,
                    lastReplyDraft: generatedReply,
                    notes: `Guión enviado por ${replyPlatform}`,
                  };
                  onSaveCustomerLeads([newLead, ...customerLeads]);
                  setActiveSubTab('funnel');
                  showToast('¡Guardado en el Embudo en fase "CONTACTADO"!', 'success');
                }}
                disabled={!generatedReply}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs transition-all border border-amber-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Target className="w-4 h-4 text-amber-700" />
                <span>Guardar este cliente en mi Embudo (Fase: Contactado)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: EMBUDO DE VENTAS (PIPELINE KANBAN) */}
      {/* ========================================================================= */}
      {activeSubTab === 'funnel' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E3D9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#8C928E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={funnelSearch}
                  onChange={(e) => setFunnelSearch(e.target.value)}
                  placeholder="Buscar prospecto, producto o ciudad..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={funnelPlatformFilter}
                onChange={(e) => setFunnelPlatformFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5] font-semibold text-[#1C2722]"
              >
                <option value="all">Todas las Redes</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <button
              onClick={() => setShowNewLeadModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2A3B34] text-white text-xs font-black transition-all shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Nuevo Prospecto
            </button>
          </div>

          {/* Kanban Columns (5 Phases) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Phase 1: Detectado */}
            <div className="bg-[#FAF8F5] rounded-3xl p-4 border border-[#E8E3D9] flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D9] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h4 className="text-xs font-black text-[#1C2722] uppercase tracking-wider">
                    1. Detectado
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                  {filteredLeads.filter((l) => l.status === 'nuevo').length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {filteredLeads
                  .filter((l) => l.status === 'nuevo')
                  .map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onUpdateStatus={handleUpdateLeadStatus}
                      onDelete={handleDeleteLead}
                      onOpenReply={() => {
                        setReplyClientQuestion(lead.message);
                        if (lead.platform) setReplyPlatform(lead.platform as any);
                        setActiveSubTab('stealth_reply');
                      }}
                      onOpenCRM={setSelectedLeadCRM}
                    />
                  ))}
                {filteredLeads.filter((l) => l.status === 'nuevo').length === 0 && (
                  <p className="text-[11px] text-[#8C928E] text-center italic py-8">
                    Sin prospectos aquí
                  </p>
                )}
              </div>
            </div>

            {/* Phase 2: Contactado */}
            <div className="bg-[#FAF8F5] rounded-3xl p-4 border border-[#E8E3D9] flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D9] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h4 className="text-xs font-black text-[#1C2722] uppercase tracking-wider">
                    2. Contactado
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {filteredLeads.filter((l) => l.status === 'contactado').length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {filteredLeads
                  .filter((l) => l.status === 'contactado')
                  .map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onUpdateStatus={handleUpdateLeadStatus}
                      onDelete={handleDeleteLead}
                      onOpenReply={() => {
                        setReplyClientQuestion(lead.message);
                        if (lead.platform) setReplyPlatform(lead.platform as any);
                        setActiveSubTab('stealth_reply');
                      }}
                      onOpenCRM={setSelectedLeadCRM}
                    />
                  ))}
                {filteredLeads.filter((l) => l.status === 'contactado').length === 0 && (
                  <p className="text-[11px] text-[#8C928E] text-center italic py-8">
                    Sin prospectos aquí
                  </p>
                )}
              </div>
            </div>

            {/* Phase 3: Interesado */}
            <div className="bg-[#FAF8F5] rounded-3xl p-4 border border-[#E8E3D9] flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D9] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <h4 className="text-xs font-black text-[#1C2722] uppercase tracking-wider">
                    3. Interesado
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                  {filteredLeads.filter((l) => l.status === 'interesado').length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {filteredLeads
                  .filter((l) => l.status === 'interesado')
                  .map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onUpdateStatus={handleUpdateLeadStatus}
                      onDelete={handleDeleteLead}
                      onOpenReply={() => {
                        setReplyClientQuestion(lead.message);
                        if (lead.platform) setReplyPlatform(lead.platform as any);
                        setActiveSubTab('stealth_reply');
                      }}
                      onOpenCRM={setSelectedLeadCRM}
                    />
                  ))}
                {filteredLeads.filter((l) => l.status === 'interesado').length === 0 && (
                  <p className="text-[11px] text-[#8C928E] text-center italic py-8">
                    Sin prospectos aquí
                  </p>
                )}
              </div>
            </div>

            {/* Phase 4: Link Wompi Enviado */}
            <div className="bg-[#FAF8F5] rounded-3xl p-4 border border-[#E8E3D9] flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D9] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <h4 className="text-xs font-black text-[#1C2722] uppercase tracking-wider">
                    4. Link Wompi
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900">
                  {filteredLeads.filter((l) => l.status === 'link_enviado').length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {filteredLeads
                  .filter((l) => l.status === 'link_enviado')
                  .map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onUpdateStatus={handleUpdateLeadStatus}
                      onDelete={handleDeleteLead}
                      onOpenReply={() => {
                        setReplyClientQuestion(lead.message);
                        if (lead.platform) setReplyPlatform(lead.platform as any);
                        setActiveSubTab('stealth_reply');
                      }}
                      onOpenCRM={setSelectedLeadCRM}
                    />
                  ))}
                {filteredLeads.filter((l) => l.status === 'link_enviado').length === 0 && (
                  <p className="text-[11px] text-[#8C928E] text-center italic py-8">
                    Sin prospectos aquí
                  </p>
                )}
              </div>
            </div>

            {/* Phase 5: Ganado / Pagado */}
            <div className="bg-emerald-50/50 rounded-3xl p-4 border border-emerald-200 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    5. ¡Venta Ganada!
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {filteredLeads.filter((l) => l.status === 'convertido').length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {filteredLeads
                  .filter((l) => l.status === 'convertido')
                  .map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onUpdateStatus={handleUpdateLeadStatus}
                      onDelete={handleDeleteLead}
                      onOpenReply={() => {
                        setReplyClientQuestion(lead.message);
                        if (lead.platform) setReplyPlatform(lead.platform as any);
                        setActiveSubTab('stealth_reply');
                      }}
                      onOpenCRM={setSelectedLeadCRM}
                    />
                  ))}
                {filteredLeads.filter((l) => l.status === 'convertido').length === 0 && (
                  <p className="text-[11px] text-emerald-800/60 text-center italic py-8">
                    Aquí se moverán los clientes que paguen por Wompi
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: IMANES DE CLIENTES (POSTS ANZUELO PARA GRUPOS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'lead_magnets' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E3D9] shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-black uppercase mb-2">
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              Estrategia de Atracción Orgánica Sin Pagar Anuncios
            </div>
            <h3 className="text-xl font-black text-[#1C2722]">
              Cómo Atraer Clientes Masivamente Publicando "Anzuelos" en Grupos de Mascotas
            </h3>
            <p className="text-xs text-[#5F6360] max-w-3xl mt-1">
              En vez de publicar "vendo alimento $90.000" (que los grupos bloquean por considerarlo publicidad), publica estas preguntas y debates. Cuando los dueños comentan, les envías tu guión y link de compra por mensaje privado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Magnet 1 */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E3D9] flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  Anzuelo 1: Debate Nutricional
                </span>
                <h4 className="text-xs font-bold text-[#1C2722] mt-2 mb-1">
                  "¿Cuál es el mejor concentrado para perro en Colombia?"
                </h4>
                <p className="text-xs text-[#5F6360] bg-white p-3 rounded-xl border border-[#E8E3D9] italic">
                  "Hola comunidad! Quisiera saber experiencias: para un perrito mediano, ¿qué alimento les ha funcionado mejor para el pelaje y la digestión? Estoy comparando opciones..."
                </p>
              </div>
              <div className="pt-2 border-t border-[#E8E3D9]">
                <strong className="text-[11px] text-purple-900 block font-bold">Por qué funciona:</strong>
                <span className="text-[10px] text-[#5F6360]">
                  Decenas de dueños comentarán diciendo qué comen sus perros. Ahí les respondes recomendando tu marca con entrega hoy.
                </span>
              </div>
            </div>

            {/* Magnet 2 */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E3D9] flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  Anzuelo 2: Consejo de Salud / Antipulgas
                </span>
                <h4 className="text-xs font-bold text-[#1C2722] mt-2 mb-1">
                  "Alerta con las pulgas y garrapatas este mes"
                </h4>
                <p className="text-xs text-[#5F6360] bg-white p-3 rounded-xl border border-[#E8E3D9] italic">
                  "Ojo a los que sacan a sus perritos al parque esta temporada: hay pico de garrapatas. ¿Ustedes usan pastilla o pipeta? A mí la pastilla de 3 meses me salvó."
                </p>
              </div>
              <div className="pt-2 border-t border-[#E8E3D9]">
                <strong className="text-[11px] text-amber-900 block font-bold">Por qué funciona:</strong>
                <span className="text-[10px] text-[#5F6360]">
                  Los dueños preocupados preguntarán "¿cuál pastilla usas y cuánto vale?". Les envías el link de tu tienda por DM.
                </span>
              </div>
            </div>

            {/* Magnet 3 */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E3D9] flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Anzuelo 3: El Dilema de la Cama Destruida
                </span>
                <h4 className="text-xs font-bold text-[#1C2722] mt-2 mb-1">
                  "¿A alguien más le dañan las camas en 1 semana?"
                </h4>
                <p className="text-xs text-[#5F6360] bg-white p-3 rounded-xl border border-[#E8E3D9] italic">
                  "Mi perrito se comía todas las camas hasta que probé una con tela impermeable antifluido. Si a alguien le pasa igual me avisan y les paso el dato de dónde la pedí."
                </p>
              </div>
              <div className="pt-2 border-t border-[#E8E3D9]">
                <strong className="text-[11px] text-emerald-900 block font-bold">Por qué funciona:</strong>
                <span className="text-[10px] text-[#5F6360]">
                  Todos los comentarios dirán "pasa el dato por favor!". Cada comentario es un cliente caliente listo para comprar.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NUEVO PROSPECTO MANUALMENTE */}
      {/* ========================================================================= */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#E8E3D9] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-[#1C2722]">
                  Registrar Prospecto Encontrado en Redes
                </h3>
              </div>
              <button
                onClick={() => setShowNewLeadModal(false)}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-neutral-200 text-[#5F6360] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualLead} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C2722]">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.name || ''}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    placeholder="Ej: Daniel Cardona"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C2722]">Red Social</label>
                  <select
                    value={newLeadForm.platform || 'facebook'}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, platform: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5]"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C2722]">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={newLeadForm.phone || ''}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="Ej: 3101234567"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C2722]">Ciudad</label>
                  <input
                    type="text"
                    value={newLeadForm.city || 'Bogotá'}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    placeholder="Ej: Bogotá"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C2722]">Producto de Interés</label>
                <input
                  type="text"
                  value={newLeadForm.interestedProduct || ''}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, interestedProduct: e.target.value })}
                  placeholder="Ej: Alimento Taste of the Wild 15kg o Cama Impermeable"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C2722]">Pregunta o Necesidad del Cliente</label>
                <textarea
                  rows={2}
                  value={newLeadForm.message || ''}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  placeholder="Ej: Preguntó en el grupo quién tenía domicilio hoy"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E3D9]">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#5F6360] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2A3B34] text-white text-xs font-black shadow-xs"
                >
                  Guardar en Embudo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PERFIL CRM DE CLIENTE */}
      {/* ========================================================================= */}
      {selectedLeadCRM && (
        <LeadCRMModal
          lead={selectedLeadCRM}
          onClose={() => setSelectedLeadCRM(null)}
          onUpdateLead={(updatedLead) => {
            const updated = customerLeads.map(l => l.id === updatedLead.id ? updatedLead : l);
            onSaveCustomerLeads(updated);
            showToast('Perfil de cliente actualizado', 'success');
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// Subcomponent: Lead Card in Kanban Pipeline
// ==========================================

interface LeadCardProps {
  lead: CustomerLead;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
  onOpenReply: () => void;
  onOpenCRM: (lead: CustomerLead) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onUpdateStatus, onDelete, onOpenReply, onOpenCRM }) => {
  const cleanPhone = (lead.phone || '').replace(/\D/g, '');

  const nextStatusMap: Record<LeadStatus, LeadStatus | null> = {
    nuevo: 'contactado',
    contactado: 'interesado',
    interesado: 'link_enviado',
    link_enviado: 'convertido',
    convertido: null,
    archivado: null,
  };

  const prevStatusMap: Record<LeadStatus, LeadStatus | null> = {
    nuevo: null,
    contactado: 'nuevo',
    interesado: 'contactado',
    link_enviado: 'interesado',
    convertido: 'link_enviado',
    archivado: 'nuevo',
  };

  const nextStatus = nextStatusMap[lead.status];
  const prevStatus = prevStatusMap[lead.status];

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-[#E8E3D9] shadow-2xs hover:shadow-xs transition-all space-y-2.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h5 className="text-xs font-black text-[#1C2722] leading-tight truncate">
          {lead.name}
        </h5>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E3D9] text-[#5F6360] uppercase shrink-0">
          {lead.platform || 'Redes'}
        </span>
      </div>

      {/* Message / interest */}
      <p className="text-[11px] text-[#2A3B34] line-clamp-2 leading-relaxed bg-[#FAF8F5] p-2 rounded-lg">
        {lead.message || 'Sin mensaje especificado'}
      </p>

      {/* Extra attributes */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#5F6360]">
        {lead.city && <span>📍 {lead.city}</span>}
        {lead.estimatedValue && (
          <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
            ${lead.estimatedValue.toLocaleString('es-CO')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-1 pt-2 border-t border-[#E8E3D9]/60">
        <div className="flex items-center gap-1">
          {cleanPhone && (
            <a
              href={`https://wa.me/57${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition-all"
              title="Abrir WhatsApp"
            >
              <Phone className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={onOpenReply}
            className="w-6 h-6 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-all"
            title="Redactar Respuesta con IA"
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <button
            onClick={() => onOpenCRM(lead)}
            className="w-6 h-6 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 flex items-center justify-center transition-all"
            title="Abrir Perfil CRM"
          >
            <User className="w-3 h-3" />
          </button>
          {/* Recovery Button */}
          <button
            onClick={async () => {
              alert('Generando pitch de recuperación...');
              try {
                const res = await fetch('/api/growth/generate-recovery-pitch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    clientName: lead.name, 
                    productName: lead.interestedProduct, 
                    totalAmount: lead.estimatedValue 
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  alert('Pitch generado:\n\n' + data.text);
                }
              } catch (e) {
                alert('Error generando pitch');
              }
            }}
            className="w-6 h-6 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 flex items-center justify-center transition-all"
            title="Generar Pitch Recuperación de Venta"
          >
            <Zap className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(lead.id)}
            className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-rose-100 text-neutral-400 hover:text-rose-600 flex items-center justify-center transition-all"
            title="Eliminar del embudo"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Phase navigation buttons */}
        <div className="flex items-center gap-1">
          {prevStatus && (
            <button
              onClick={() => onUpdateStatus(lead.id, prevStatus)}
              className="p-1 rounded-md bg-[#FAF8F5] hover:bg-neutral-200 text-[#5F6360] text-[10px]"
              title={`Retroceder a ${prevStatus}`}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onUpdateStatus(lead.id, nextStatus)}
              className="px-2 py-1 rounded-md bg-[#1C2722] hover:bg-[#2A3B34] text-white text-[10px] font-bold flex items-center gap-0.5"
              title={`Avanzar a ${nextStatus}`}
            >
              <span>Avanzar</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
