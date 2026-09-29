import React from 'react';
import { Home, Grid, Search, ShoppingBag, MessageCircle, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { ContactInfo, PetType } from '../types';
import { formatCOP } from '../utils/formatters';

interface MobileBottomNavProps {
  activeSection: 'catalog' | 'about' | 'blog' | 'contact';
  onNavigate: (section: 'catalog' | 'about' | 'blog' | 'contact') => void;
  onOpenCategories: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  cartCount: number;
  cartTotal?: number;
  contactInfo: ContactInfo;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  onNavigate,
  onOpenCategories,
  onOpenSearch,
  onOpenCart,
  cartCount,
  cartTotal = 0,
  contactInfo,
}) => {
  const whatsappNumber = (contactInfo?.whatsapp || '3214231616').replace(/\D/g, '');

  return (
    <div
      id="mobile-bottom-navigation-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#ECE5DD] px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="grid grid-cols-5 items-center gap-1 max-w-md mx-auto">
        
        {/* 1. Inicio */}
        <button
          type="button"
          id="mobile-tab-home"
          onClick={() => {
            onNavigate('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            activeSection === 'catalog'
              ? 'text-[#1C1F1E] font-bold'
              : 'text-[#7A807C] hover:text-[#1C1F1E]'
          }`}
        >
          <div className="relative">
            <Home className="w-5 h-5 stroke-[2.2]" />
            {activeSection === 'catalog' && (
              <motion.div
                layoutId="mobileNavActiveDot"
                className="w-1.5 h-1.5 bg-[#C68748] rounded-full mx-auto mt-0.5"
              />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Inicio</span>
        </button>

        {/* 2. Categorías */}
        <button
          type="button"
          id="mobile-tab-categories"
          onClick={onOpenCategories}
          className="flex flex-col items-center justify-center py-1 text-[#7A807C] hover:text-[#1C1F1E] rounded-xl transition-all"
        >
          <Grid className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] tracking-tight mt-0.5">Categorías</span>
        </button>

        {/* 3. Buscar */}
        <button
          type="button"
          id="mobile-tab-search"
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center py-1 text-[#7A807C] hover:text-[#1C1F1E] rounded-xl transition-all"
        >
          <Search className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] tracking-tight mt-0.5">Buscar</span>
        </button>

        {/* 4. Carrito con Badge */}
        <button
          type="button"
          id="mobile-tab-cart"
          onClick={() => onOpenCart()}
          className="flex flex-col items-center justify-center py-1 text-[#1C1F1E] rounded-xl transition-all relative"
        >
          <div className="relative">
            <div className={`p-1 rounded-full ${cartCount > 0 ? 'bg-[#FAF2E9]' : ''}`}>
              <ShoppingBag className="w-5 h-5 text-[#1C1F1E] stroke-[2.2]" />
            </div>
            {cartCount > 0 && (
              <span
                id="mobile-cart-badge-counter"
                className="absolute -top-1 -right-1 bg-[#C68748] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-[#1C1F1E] tracking-tight mt-0.5">
            {cartCount > 0 ? formatCOP(cartTotal) : 'Carrito'}
          </span>
        </button>

        {/* 5. WhatsApp Asesoría */}
        <a
          id="mobile-tab-whatsapp"
          href={`https://wa.me/57${whatsappNumber}?text=${encodeURIComponent(
            '¡Hola Lunary Pet! Deseo asesoría sobre productos y compras 🐾'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 text-emerald-700 hover:text-emerald-800 rounded-xl transition-all"
        >
          <div className="relative p-1 rounded-full bg-emerald-50 text-emerald-700">
            <MessageCircle className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Asesoría</span>
        </a>

      </div>
    </div>
  );
};
