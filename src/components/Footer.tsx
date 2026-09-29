import React from 'react';
import { Heart, Phone, Mail, MapPin, Lock, ShieldCheck, Scale, RefreshCw, Truck, FileText } from 'lucide-react';
import { ContactInfo } from '../types';
import { formatPhoneNumber } from '../utils/formatters';

interface FooterProps {
  contactInfo: ContactInfo;
  onNavigate: (section: 'catalog' | 'about' | 'blog' | 'contact') => void;
  onOpenAdmin: () => void;
  onOpenPolicy?: (tab: 'returns' | 'shipping' | 'terms' | 'privacy') => void;
}

export const Footer: React.FC<FooterProps> = ({
  contactInfo,
  onNavigate,
  onOpenAdmin,
  onOpenPolicy,
}) => {
  return (
    <footer className="bg-[#18231E] text-slate-300 pt-12 pb-8 border-t border-[#26372F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main 5-column Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* Brand & Slogan */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col items-start">
              <div className="relative flex items-center">
                <span className="text-2xl font-black tracking-[0.24em] text-white font-sans leading-none pl-1">
                  LUNARY
                </span>
                <span className="absolute -top-3.5 right-0 text-sm select-none text-white">
                  🐾
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-[1.5px] w-4 bg-white/70"></span>
                <span className="text-[9px] font-bold tracking-[0.22em] text-white uppercase leading-none pl-0.5 whitespace-nowrap">
                  WORLD PETS
                </span>
                <span className="h-[1.5px] w-4 bg-white/70"></span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              {contactInfo.slogan}. Alimentos super premium, juguetes estimulantes, camas y productos de higiene seleccionados con amor en Colombia.
            </p>

            <div className="flex items-center gap-2 text-xs text-amber-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pagos 100% seguros y respaldados</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Explorar</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-white transition-colors"
                >
                  Catálogo Completo
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors"
                >
                  Sobre Nosotros
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('blog')}
                  className="hover:text-white transition-colors"
                >
                  Consejos & Blog
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors"
                >
                  Contacto & Asesoría
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Categorías</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors">
                  🥣 Alimentos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors">
                  🧶 Juguetes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors">
                  🧴 Higiene
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors">
                  🛏️ Camas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors">
                  🦮 Accesorios
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Policies & Transparency for Google Ads */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#B97A48]" />
              Políticas & Garantías
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenPolicy?.('returns')}
                  className="hover:text-white transition-colors text-left flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400 shrink-0" />
                  Devoluciones (30 días)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy?.('shipping')}
                  className="hover:text-white transition-colors text-left flex items-center gap-1"
                >
                  <Truck className="w-3 h-3 text-blue-400 shrink-0" />
                  Política de Envíos
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy?.('terms')}
                  className="hover:text-white transition-colors text-left flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                  Términos del Servicio
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicy?.('privacy')}
                  className="hover:text-white transition-colors text-left flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-purple-400 shrink-0" />
                  Privacidad & Datos
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Admin Portal */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Atención & Pedidos</h4>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/57${(contactInfo?.whatsapp || '3214231616').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white font-bold"
                >
                  WhatsApp: {formatPhoneNumber(contactInfo?.whatsapp)}
                </a>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-[#B97A48] shrink-0" />
                <span>{contactInfo.email}</span>
              </p>
              {contactInfo.city && (
                <p className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-[#B97A48] shrink-0" />
                  <span>{contactInfo.city}, Colombia</span>
                </p>
              )}
            </div>

            {/* Admin Portal Button */}
            <div className="pt-2">
              <button
                id="footer-admin-portal-link"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <Lock className="w-3 h-3 text-amber-300" />
                <span>Panel de Administración</span>
              </button>
            </div>
          </div>

        </div>

        {/* Colombian Payment Badges & Legal Bottom Bar */}
        <div className="pt-8 border-t border-[#26372F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[11px] text-slate-300 font-semibold">Pasarela Oficial Wompi:</span>
            <span className="bg-white/10 text-white font-bold px-2 py-0.5 rounded text-[11px] border border-white/20">
              💳 Tarjetas Visa / Mastercard
            </span>
            <span className="bg-white/10 text-white font-bold px-2 py-0.5 rounded text-[11px] border border-white/20">
              🏦 Débito PSE
            </span>
            <span className="bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded text-[11px]">
              🟡 Botón Bancolombia
            </span>
            <span className="bg-emerald-800 text-emerald-100 font-bold px-2 py-0.5 rounded text-[11px] border border-emerald-600">
              🔒 100% Protegido
            </span>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <div>
              © {new Date().getFullYear()} {contactInfo.storeName}. Comercio Electrónico Legal en Colombia.
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-3 text-[11px] text-slate-400">
              <button onClick={() => onOpenPolicy?.('returns')} className="hover:text-white underline">
                Devoluciones
              </button>
              <span>•</span>
              <button onClick={() => onOpenPolicy?.('shipping')} className="hover:text-white underline">
                Envíos
              </button>
              <span>•</span>
              <button onClick={() => onOpenPolicy?.('terms')} className="hover:text-white underline">
                Términos
              </button>
              <span>•</span>
              <button onClick={() => onOpenPolicy?.('privacy')} className="hover:text-white underline">
                Privacidad
              </button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

