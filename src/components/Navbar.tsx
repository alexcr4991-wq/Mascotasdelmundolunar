import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  ChevronDown,
  Menu,
  X,
  Phone,
  Truck,
  Heart,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
} from 'lucide-react';
import { ContactInfo, PetType } from '../types';

interface NavbarProps {
  contactInfo: ContactInfo;
  cartCount: number;
  selectedPetType: PetType;
  onSelectPetType: (type: PetType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenCalculator?: () => void;
  onOpenTracker?: () => void;
  onOpenVirtualVet?: () => void;
  isAdminLoggedIn: boolean;
  activeSection: 'catalog' | 'about' | 'blog' | 'contact';
  onNavigate: (section: 'catalog' | 'about' | 'blog' | 'contact') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  contactInfo,
  cartCount,
  selectedPetType,
  onSelectPetType,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenAdmin,
  onOpenCalculator,
  onOpenTracker,
  onOpenVirtualVet,
  isAdminLoggedIn,
  activeSection,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (section: 'catalog' | 'about' | 'blog' | 'contact') => {
    onNavigate(section);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoriesClick = () => {
    if (activeSection !== 'catalog') {
      onNavigate('catalog');
    }
    setTimeout(() => {
      const el = document.getElementById('categories-preview-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#EAE3D6] shadow-2xs">
      
      {/* 1. Top Announcement Header (Dark charcoal bar like reference image) */}
      <div
        id="top-announcement-bar"
        className="bg-[#181A19] text-[#EBE5DB] px-4 py-2 text-xs font-medium border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Free Shipping promo */}
          <div className="flex items-center gap-2">
            <span className="text-sm select-none">🚚</span>
            <span>
              Envíos gratis en compras superiores a $150.000 COP{' '}
              <button
                onClick={() => {
                  const el = document.getElementById('catalog-products-container');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="underline text-stone-300 hover:text-white font-semibold ml-1 cursor-pointer"
              >
                Ver detalles
              </button>
            </span>
          </div>

          {/* Right: Currency / Country & Social Links */}
          <div className="hidden md:flex items-center gap-4 text-[#A8AFA9] text-[11px]">
            <div className="flex items-center gap-1 text-[#E0DDD5]">
              <Globe className="w-3.5 h-3.5 text-[#6B7B3E]" />
              <span>Colombia (COP $)</span>
            </div>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2.5">
              <a
                href={contactInfo.instagramUrl || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                title="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href={contactInfo.facebookUrl || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                title="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://wa.me/57${contactInfo.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
                title="WhatsApp Directo"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Middle Navigation: Brand Logo + Center Pill Search + Right Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 sm:gap-8">
          
          {/* Brand Logo matching Lunary style with modern editorial font */}
          <div className="shrink-0">
            <button
              id="brand-logo-button"
              onClick={() => handleNavClick('catalog')}
              className="flex items-center gap-1.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="flex items-baseline">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C1F1E] group-hover:text-[#6B7B3E] transition-colors">
                  lunary
                </span>
                <span className="text-[#6B7B3E] text-xl font-bold ml-0.5 group-hover:rotate-12 transition-transform select-none">
                  🐾
                </span>
              </div>
            </button>
          </div>

          {/* Center Search Input with clean Pill shape */}
          <div className="hidden sm:flex flex-1 max-w-lg mx-auto">
            <div className="relative w-full">
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por alimento, juguete, accesorio o marca..."
                className="w-full bg-[#F5F2EB] hover:bg-[#EFECE4] focus:bg-white text-xs sm:text-sm text-[#1C1F1E] placeholder:text-[#8D928E] pl-10 pr-9 py-2.5 rounded-full border border-[#E2DBD0] focus:border-[#6B7B3E] focus:outline-none transition-all shadow-2xs"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D928E] pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls: Login / Admin, Cart, and "Únete al club" Button */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            
            {/* Account / Admin Portal Button */}
            <button
              id="open-admin-portal-button"
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500'
                  : 'text-[#4A4F4C] hover:text-[#1C1F1E] hover:bg-[#F5F2EB]'
              }`}
              title={isAdminLoggedIn ? 'Panel de Administración (Conectado)' : 'Cuenta / Iniciar Sesión'}
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">
                {isAdminLoggedIn ? 'Admin' : 'Mi Cuenta'}
              </span>
            </button>

            {/* Shopping Cart Trigger */}
            <button
              id="open-cart-button"
              onClick={onOpenCart}
              className="flex items-center gap-2 py-1.5 px-3 rounded-full text-xs font-semibold text-[#1C1F1E] hover:bg-[#F5F2EB] transition-colors relative cursor-pointer"
              title="Ver carrito de compras"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#1C1F1E]" />
                {cartCount > 0 && (
                  <span
                    id="cart-badge-count"
                    className="absolute -top-1.5 -right-2 bg-[#6B7B3E] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-2xs"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">Carrito</span>
            </button>

            {/* Club Lunary Pill Button (matching "Join the pack" in reference) */}
            <button
              id="join-the-pack-pill-btn"
              onClick={() => {
                const el = document.getElementById('catalog-products-container');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#6B7B3E] hover:bg-[#586731] text-white text-xs font-bold transition-all shadow-2xs hover:scale-102 cursor-pointer"
            >
              <span>🐾</span>
              <span>Club Lunary</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#1C1F1E] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Search Bar if on mobile screen */}
        <div className="sm:hidden pb-3">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar en Lunary..."
              className="w-full bg-[#F5F2EB] text-xs text-[#1C1F1E] placeholder:text-[#8D928E] pl-9 pr-8 py-2 rounded-full border border-[#E2DBD0] focus:border-[#6B7B3E] focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8D928E]" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. Sub-Navigation Bar matching reference image secondary navigation */}
      <div className="hidden md:block border-t border-[#EAE3D6] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 text-xs lg:text-[13px] font-semibold text-[#4A4F4C]">
            
            {/* Left Nav Links */}
            <div className="flex items-center gap-6 lg:gap-8">
              <button
                onClick={() => handleNavClick('catalog')}
                className={`transition-colors py-2 cursor-pointer ${
                  activeSection === 'catalog' && !selectedPetType
                    ? 'text-[#1C1F1E] font-bold border-b-2 border-[#6B7B3E]'
                    : 'hover:text-[#1C1F1E]'
                }`}
              >
                Ver todo
              </button>

              <button
                onClick={() => {
                  onSelectPetType('perro');
                  handleNavClick('catalog');
                }}
                className={`transition-colors py-2 cursor-pointer ${
                  selectedPetType === 'perro'
                    ? 'text-[#6B7B3E] font-bold border-b-2 border-[#6B7B3E]'
                    : 'hover:text-[#1C1F1E]'
                }`}
              >
                🐶 Perros
              </button>

              <button
                onClick={() => {
                  onSelectPetType('gato');
                  handleNavClick('catalog');
                }}
                className={`transition-colors py-2 cursor-pointer ${
                  selectedPetType === 'gato'
                    ? 'text-[#B96A4C] font-bold border-b-2 border-[#B96A4C]'
                    : 'hover:text-[#1C1F1E]'
                }`}
              >
                🐱 Gatos
              </button>

              <button
                onClick={handleCategoriesClick}
                className="hover:text-[#1C1F1E] transition-colors py-2 flex items-center gap-1 cursor-pointer"
              >
                <span>Categorías</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8D928E]" />
              </button>

              <button
                onClick={() => handleNavClick('about')}
                className={`transition-colors py-2 cursor-pointer ${
                  activeSection === 'about'
                    ? 'text-[#1C1F1E] font-bold border-b-2 border-[#6B7B3E]'
                    : 'hover:text-[#1C1F1E]'
                }`}
              >
                Nosotros
              </button>

              <button
                onClick={() => handleNavClick('blog')}
                className={`transition-colors py-2 cursor-pointer ${
                  activeSection === 'blog'
                    ? 'text-[#1C1F1E] font-bold border-b-2 border-[#6B7B3E]'
                    : 'hover:text-[#1C1F1E]'
                }`}
              >
                Blog
              </button>

              <button
                onClick={() => handleNavClick('contact')}
                className={`transition-colors py-2 cursor-pointer ${
                  activeSection === 'contact'
                    ? 'text-[#1C1F1E] font-bold border-b-2 border-[#6B7B3E]'
                    : 'hover:text-[#1C1F1E]'
                }`}
              >
                Contacto
              </button>
            </div>

            {/* Right Tools & Services Links */}
            <div className="flex items-center gap-4 lg:gap-5">
              {onOpenCalculator && (
                <button
                  onClick={onOpenCalculator}
                  className="hover:text-[#6B7B3E] transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>🥣</span>
                  <span>Calculadora</span>
                </button>
              )}

              {onOpenTracker && (
                <button
                  onClick={onOpenTracker}
                  className="hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>📦</span>
                  <span>Rastrear Pedido</span>
                </button>
              )}

              {onOpenVirtualVet && (
                <button
                  onClick={onOpenVirtualVet}
                  className="hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>🩺</span>
                  <span>Veterinario AI</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EAE3D6] bg-white px-5 py-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-2.5 text-sm font-semibold text-[#1C1F1E]">
            <button
              onClick={() => handleNavClick('catalog')}
              className="text-left py-2 border-b border-stone-100 flex items-center justify-between"
            >
              <span>Ver Catálogo Completo</span>
              <span>→</span>
            </button>
            <div className="grid grid-cols-2 gap-2 py-1">
              <button
                onClick={() => {
                  onSelectPetType('perro');
                  handleNavClick('catalog');
                }}
                className={`p-2 rounded-xl text-center border font-bold text-xs ${
                  selectedPetType === 'perro'
                    ? 'bg-[#EDF3E8] border-[#6B7B3E] text-[#6B7B3E]'
                    : 'bg-[#FAF8F5] border-[#EAE3D6] text-[#4A4F4C]'
                }`}
              >
                🐶 Sección Perros
              </button>
              <button
                onClick={() => {
                  onSelectPetType('gato');
                  handleNavClick('catalog');
                }}
                className={`p-2 rounded-xl text-center border font-bold text-xs ${
                  selectedPetType === 'gato'
                    ? 'bg-[#FAF0E7] border-[#B96A4C] text-[#B96A4C]'
                    : 'bg-[#FAF8F5] border-[#EAE3D6] text-[#4A4F4C]'
                }`}
              >
                🐱 Sección Gatos
              </button>
            </div>
            <button
              onClick={handleCategoriesClick}
              className="text-left py-2 border-b border-stone-100 flex items-center justify-between"
            >
              <span>Explorar Categorías</span>
              <ChevronDown className="w-4 h-4 text-stone-400" />
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="text-left py-2 border-b border-stone-100"
            >
              Sobre Nosotros
            </button>
            <button
              onClick={() => handleNavClick('blog')}
              className="text-left py-2 border-b border-stone-100"
            >
              Blog & Consejos
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-left py-2 border-b border-stone-100"
            >
              Contacto & WhatsApp
            </button>
          </div>

          {/* Interactive Tools in mobile menu */}
          <div className="pt-2 border-t border-stone-100 grid grid-cols-3 gap-2">
            {onOpenCalculator && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCalculator();
                }}
                className="p-2 rounded-xl bg-[#F5F2EB] text-center text-xs font-semibold text-[#1C1F1E]"
              >
                🥣 Calculadora
              </button>
            )}
            {onOpenTracker && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTracker();
                }}
                className="p-2 rounded-xl bg-[#EBF5FF] text-center text-xs font-semibold text-[#033B69]"
              >
                📦 Rastrear
              </button>
            )}
            {onOpenVirtualVet && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenVirtualVet();
                }}
                className="p-2 rounded-xl bg-emerald-50 text-center text-xs font-semibold text-emerald-900"
              >
                🩺 Vet AI
              </button>
            )}
          </div>
        </div>
      )}

    </header>
  );
};
