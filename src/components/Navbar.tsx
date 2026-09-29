import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  ChevronDown,
  Phone,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Heart,
  Dog,
  Cat,
  Lock,
} from 'lucide-react';
import { ContactInfo, PetType } from '../types';
import { formatPhoneNumber } from '../utils/formatters';

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
  const [showSearchModal, setShowSearchModal] = useState(false);

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ECE5DD] shadow-xs">
      {/* Top Notification Announcement Bar */}
      <div
        id="top-announcement-bar"
        className="bg-[#1A2620] text-[#EFEBE4] px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center text-center overflow-hidden border-b border-[#283830]"
      >
        <div className="flex items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-[13px] tracking-wide text-white/90">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span>🚚</span> Envío gratis en compras superiores a $150.000 COP
          </span>
          <span className="text-white/40 hidden sm:inline">|</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-medium">
            <span>🤍</span> Hecho con amor para ellos <span>🐾</span>
          </span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24 gap-4">
          
          {/* Brand Logo - Exact layout from Reference Image */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="brand-logo-button"
              onClick={() => handleNavClick('catalog')}
              className="flex flex-col items-center group text-left pt-1 focus:outline-none"
            >
              {/* LUNARY with paw on top-right */}
              <div className="relative flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-black tracking-[0.24em] text-[#1C1F1E] font-sans leading-none pl-1 group-hover:text-[#B97A48] transition-colors select-none">
                  LUNARY
                </span>
                <span className="absolute -top-3.5 right-0 text-sm select-none text-[#1C1F1E] group-hover:scale-110 transition-transform">
                  🐾
                </span>
              </div>
              
              {/* —— WORLD PETS —— */}
              <div className="w-full flex items-center justify-center gap-1.5 mt-1">
                <span className="h-[1.5px] w-3.5 bg-[#1C1F1E]/80"></span>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.22em] text-[#1C1F1E] uppercase leading-none pl-0.5 select-none whitespace-nowrap">
                  WORLD PETS
                </span>
                <span className="h-[1.5px] w-3.5 bg-[#1C1F1E]/80"></span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links (Center) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-9">
            <button
              id="nav-inicio"
              onClick={() => handleNavClick('catalog')}
              className="relative py-2 text-sm lg:text-[15px] font-semibold transition-colors group"
            >
              <span className={activeSection === 'catalog' ? 'text-[#1C1F1E] font-bold' : 'text-[#4A4F4C] hover:text-[#1C1F1E]'}>
                Inicio
              </span>
              {activeSection === 'catalog' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-[#C68748] rounded-full" />
              )}
            </button>

            <button
              id="nav-tienda"
              onClick={() => handleNavClick('catalog')}
              className="py-2 text-sm lg:text-[15px] font-semibold text-[#4A4F4C] hover:text-[#1C1F1E] transition-colors"
            >
              Tienda
            </button>

            <button
              id="nav-categorias"
              onClick={handleCategoriesClick}
              className="py-2 text-sm lg:text-[15px] font-semibold text-[#4A4F4C] hover:text-[#1C1F1E] flex items-center gap-1 transition-colors group"
            >
              <span>Categorías</span>
              <ChevronDown className="w-4 h-4 text-[#7C827E] group-hover:text-[#1C1F1E] transition-transform group-hover:translate-y-0.5" />
            </button>

            <button
              id="nav-nosotros"
              onClick={() => handleNavClick('about')}
              className="relative py-2 text-sm lg:text-[15px] font-semibold transition-colors"
            >
              <span className={activeSection === 'about' ? 'text-[#1C1F1E] font-bold' : 'text-[#4A4F4C] hover:text-[#1C1F1E]'}>
                Nosotros
              </span>
              {activeSection === 'about' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-[#C68748] rounded-full" />
              )}
            </button>

            <button
              id="nav-blog"
              onClick={() => handleNavClick('blog')}
              className="relative py-2 text-sm lg:text-[15px] font-semibold transition-colors"
            >
              <span className={activeSection === 'blog' ? 'text-[#1C1F1E] font-bold' : 'text-[#4A4F4C] hover:text-[#1C1F1E]'}>
                Blog
              </span>
              {activeSection === 'blog' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-[#C68748] rounded-full" />
              )}
            </button>

            <button
              id="nav-contacto"
              onClick={() => handleNavClick('contact')}
              className="relative py-2 text-sm lg:text-[15px] font-semibold transition-colors"
            >
              <span className={activeSection === 'contact' ? 'text-[#1C1F1E] font-bold' : 'text-[#4A4F4C] hover:text-[#1C1F1E]'}>
                Contacto
              </span>
              {activeSection === 'contact' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-[#C68748] rounded-full" />
              )}
            </button>

            {onOpenCalculator && (
              <button
                id="nav-food-calculator-btn"
                onClick={onOpenCalculator}
                className="py-1.5 px-3 rounded-full text-xs font-bold bg-[#FAF6F0] border border-[#DED7CB] hover:bg-[#EFE9DF] text-[#1C1F1E] flex items-center gap-1.5 shadow-2xs transition-all hover:scale-103"
                title="Calculadora de Porciones de Alimento"
              >
                <span>🥣</span>
                <span>Calculadora</span>
              </button>
            )}

            {onOpenTracker && (
              <button
                id="nav-order-tracker-btn"
                onClick={onOpenTracker}
                className="py-1.5 px-3 rounded-full text-xs font-bold bg-[#EBF5FF] border border-[#BBE3FB] hover:bg-[#D9EDFE] text-[#033B69] flex items-center gap-1.5 shadow-2xs transition-all hover:scale-103"
                title="Rastrear Estado de Pedido"
              >
                <span>📦</span>
                <span>Rastrear Pedido</span>
              </button>
            )}

            {onOpenVirtualVet && (
              <button
                id="nav-virtual-vet-btn"
                onClick={onOpenVirtualVet}
                className="py-1.5 px-3 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 flex items-center gap-1.5 shadow-2xs transition-all hover:scale-103"
                title="Asesor Veterinario y Nutricional con IA"
              >
                <span>🩺</span>
                <span>Veterinario AI</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons: Search, User / Admin, Cart */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Search Icon Button */}
            <button
              id="navbar-search-btn"
              onClick={() => setShowSearchModal(!showSearchModal)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#1C1F1E] hover:bg-[#F2ECE3] transition-colors"
              aria-label="Buscar productos"
              title="Buscar en la tienda"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User / Admin Portal Button */}
            <button
              id="open-admin-portal-button"
              onClick={onOpenAdmin}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${
                isAdminLoggedIn
                  ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500'
                  : 'text-[#1C1F1E] hover:bg-[#F2ECE3]'
              }`}
              title={isAdminLoggedIn ? 'Panel de Administración (Conectado)' : 'Cuenta / Iniciar Sesión Administrador'}
              aria-label="Cuenta de administrador"
            >
              <User className="w-5 h-5" />
              {isAdminLoggedIn && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            {/* Shopping Cart Drawer Trigger */}
            <button
              id="open-cart-button"
              onClick={() => onOpenCart()}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#1C1F1E] hover:bg-[#F2ECE3] transition-colors"
              aria-label="Abrir carrito de compras"
              title="Carrito de compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  id="cart-badge-count"
                  className="absolute -top-0.5 -right-0.5 bg-[#C68748] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu hamburger */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-[#1C1F1E] hover:bg-[#F2ECE3] transition-colors"
              aria-label="Abrir menú de navegación móvil"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Inline Search Bar (Expands smoothly on click or search active) */}
        {(showSearchModal || searchQuery) && (
          <div className="pb-3 pt-1 animate-in fade-in slide-in-from-top-2">
            <div className="relative w-full max-w-xl mx-auto">
              <input
                id="search-input-desktop"
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar alimentos, juguetes, camas, shampoo, accesorios..."
                className="w-full bg-[#FAF8F5] focus:bg-white text-[#1C1F1E] placeholder:text-[#8E9390] text-sm pl-10 pr-10 py-2.5 rounded-full border border-[#DDD5C9] focus:border-[#1E2B24] focus:ring-2 focus:ring-[#1E2B24]/10 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-[#8E9390] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                id="close-search-btn"
                onClick={() => {
                  onSearchChange('');
                  setShowSearchModal(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707572] hover:text-[#1C1F1E] text-xs bg-[#EAE3D6] hover:bg-[#DFD5C6] rounded-full w-5 h-5 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Pet Filter Pills (Todos / Perros / Gatos) */}
        <div className="py-2.5 border-t border-[#ECE5DD] flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold text-[#707572] uppercase tracking-wider hidden sm:inline mr-1">
              Ver para:
            </span>
            <button
              id="filter-pet-ambos"
              onClick={() => onSelectPetType('ambos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPetType === 'ambos'
                  ? 'bg-[#1E2B24] text-white shadow-xs scale-102'
                  : 'bg-[#EFE9DF] text-[#4F5551] hover:bg-[#E4DDD1]'
              }`}
            >
              <span>🐾</span>
              <span>Todos</span>
            </button>
            <button
              id="filter-pet-perro"
              onClick={() => onSelectPetType('perro')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPetType === 'perro'
                  ? 'bg-[#B97A48] text-white shadow-xs scale-102 ring-2 ring-[#B97A48]/30'
                  : 'bg-[#F6EFE6] text-[#7A4B23] hover:bg-[#EEDDCC] border border-[#E3D3C1]'
              }`}
            >
              <Dog className="w-3.5 h-3.5" />
              <span>🐶 Perros</span>
            </button>
            <button
              id="filter-pet-gato"
              onClick={() => onSelectPetType('gato')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPetType === 'gato'
                  ? 'bg-[#4F6457] text-white shadow-xs scale-102 ring-2 ring-[#4F6457]/30'
                  : 'bg-[#EFF3F0] text-[#365042] hover:bg-[#E0E9E3] border border-[#D1DED6]'
              }`}
            >
              <Cat className="w-3.5 h-3.5" />
              <span>🐱 Gatos</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-[#707572]">
            <span className="flex items-center gap-1 text-[#2B4E3C]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2B4E3C]" />
              Pago 100% Seguro por Wompi
            </span>
            <span className="flex items-center gap-1 text-[#8C542B]">
              <Heart className="w-3.5 h-3.5 text-[#B97A48] fill-[#B97A48]" />
              Calidad Garantizada
            </span>
          </div>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="md:hidden border-t border-[#ECE5DD] bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2"
        >
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              id="mobile-nav-inicio"
              onClick={() => handleNavClick('catalog')}
              className={`p-3 rounded-xl text-left text-sm font-bold border transition-colors ${
                activeSection === 'catalog'
                  ? 'bg-[#F4EFE6] border-[#C68748] text-[#1C1F1E]'
                  : 'bg-[#FAF8F5] border-transparent text-[#4A4F4C]'
              }`}
            >
              🏠 Inicio
            </button>
            <button
              id="mobile-nav-tienda"
              onClick={() => handleNavClick('catalog')}
              className="p-3 rounded-xl text-left text-sm font-semibold bg-[#FAF8F5] text-[#4A4F4C]"
            >
              🛍️ Tienda
            </button>
            <button
              id="mobile-nav-categorias"
              onClick={handleCategoriesClick}
              className="p-3 rounded-xl text-left text-sm font-semibold bg-[#FAF8F5] text-[#4A4F4C]"
            >
              📂 Categorías
            </button>
            <button
              id="mobile-nav-nosotros"
              onClick={() => handleNavClick('about')}
              className="p-3 rounded-xl text-left text-sm font-semibold bg-[#FAF8F5] text-[#4A4F4C]"
            >
              🐾 Nosotros
            </button>
            <button
              id="mobile-nav-blog"
              onClick={() => handleNavClick('blog')}
              className="p-3 rounded-xl text-left text-sm font-semibold bg-[#FAF8F5] text-[#4A4F4C]"
            >
              📖 Blog
            </button>
            <button
              id="mobile-nav-contacto"
              onClick={() => handleNavClick('contact')}
              className="p-3 rounded-xl text-left text-sm font-semibold bg-[#FAF8F5] text-[#4A4F4C]"
            >
              📞 Contacto
            </button>
            {onOpenCalculator && (
              <button
                id="mobile-nav-calculator"
                onClick={() => {
                  onOpenCalculator();
                  setMobileMenuOpen(false);
                }}
                className="col-span-2 p-3 rounded-xl text-left text-sm font-bold bg-[#FAF6F0] border border-[#DED7CB] text-[#1C1F1E] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>🥣</span>
                  <span>Calculadora de Racionamiento</span>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full font-bold">NUEVO</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-[#ECE5DD] flex flex-col gap-2">
            <a
              id="mobile-whatsapp-direct-link"
              href={`https://wa.me/57${(contactInfo?.whatsapp || '3214231616').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 bg-[#23382D] text-white rounded-xl font-bold text-sm"
            >
              <span>WhatsApp: {formatPhoneNumber(contactInfo?.whatsapp)}</span>
            </a>
            <button
              id="mobile-admin-access-btn"
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#1E2B24] text-white rounded-xl font-bold text-sm"
            >
              <Lock className="w-4 h-4 text-[#D8A77E]" />
              <span>{isAdminLoggedIn ? 'Panel de Administración' : 'Acceso Administrador'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
