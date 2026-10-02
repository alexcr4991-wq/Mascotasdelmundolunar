import React from 'react';
import { Truck, Heart, Award, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import petsFamilyHomeImg from '../assets/images/pets_family_home_1787181054220.jpg';
import { ContactInfo, PetType } from '../types';

interface HeroBannerProps {
  contactInfo: ContactInfo;
  onExploreCatalog: () => void;
  onExploreAbout: () => void;
  onSelectPetType?: (petType: PetType) => void;
  onOpenCalculator?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreCatalog,
  onExploreAbout,
  onSelectPetType,
}) => {
  const handleSelectPet = (petType: PetType) => {
    if (onSelectPetType) {
      onSelectPetType(petType);
    }
    onExploreCatalog();
  };

  return (
    <div id="hero-banner-section" className="bg-[#FAF8F5]">
      {/* 1. Warm Olive Green Announcement Strip matching reference image */}
      <div className="bg-[#6B7B3E] text-white py-2.5 px-4 text-xs sm:text-sm font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
          <span className="text-base select-none">🐾</span>
          <span className="font-semibold tracking-wide">Puntos Lunary ya disponibles</span>
          <span className="hidden sm:inline text-white/60">·</span>
          <span className="text-white/90 hidden sm:inline">
            Gana recompensas y descuentos con cada compra para tu consentido
          </span>
          <button
            onClick={onExploreCatalog}
            className="underline underline-offset-2 ml-1 text-white hover:text-amber-100 font-semibold cursor-pointer"
          >
            Ver catálogo
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pt-8 sm:pb-14">
        {/* 2. Asymmetric Bento Grid matching the Reference Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          
          {/* Bento Card 1: Large Main Hero Card (Left ~7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 bg-[#F4EFE6] border border-[#E9E1D2] rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between min-h-[440px] sm:min-h-[500px] shadow-sm group"
          >
            {/* Background Photography with Warm Golden Lighting & Soft Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={petsFamilyHomeImg}
                alt="Mascotas felices en Lunary World Pets"
                className="w-full h-full object-cover object-[center_28%] sm:object-center transform group-hover:scale-102 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              {/* Soft warm gradient to guarantee text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1F1E]/85 via-[#1C1F1E]/30 to-transparent sm:bg-gradient-to-r sm:from-[#FAF8F5]/95 sm:via-[#FAF8F5]/80 sm:to-transparent pointer-events-none" />
            </div>

            {/* Top Badge: Quiet editorial kicker */}
            <div className="relative z-10 p-6 sm:p-10 pb-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-[#6B7B3E] sm:text-[#55662E] bg-white/90 sm:bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-black/5 shadow-2xs">
                <span>✨</span> Selección Premium para Mascotas
              </span>
            </div>

            {/* Headline, Subtitle and Pill CTA Buttons */}
            <div className="relative z-10 p-6 sm:p-10 pt-16 sm:pt-6 max-w-xl space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-white sm:text-[#1C1F1E] tracking-tight leading-[1.12]">
                  Mascotas felices, <br />
                  vida feliz
                </h1>
                <p className="text-sm sm:text-base text-stone-200 sm:text-[#5A605C] leading-relaxed max-w-md">
                  Alimentos seleccionados, accesorios, juguetes y cuidados esenciales para cada compañero peludo.
                </p>
              </div>

              {/* Two Pill Buttons like reference */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  id="hero-shop-all-pill-btn"
                  onClick={onExploreCatalog}
                  className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#6B7B3E] hover:bg-[#586731] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#6B7B3E]/20 transition-all hover:scale-102 cursor-pointer"
                >
                  Comprar ahora
                </button>
                <button
                  id="hero-explore-species-pill-btn"
                  onClick={onExploreAbout}
                  className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/90 hover:bg-white text-[#1C1F1E] font-bold text-xs sm:text-sm border border-stone-300 sm:border-[#DDD4C7] shadow-xs transition-all hover:scale-102 cursor-pointer"
                >
                  Conocer Lunary
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column Bento Cards (Top: Dogs, Bottom: Cats) */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6 justify-between">
            
            {/* Bento Card 2: Top Right - New arrivals for dogs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#EDF3E8] border border-[#DEE7D7] rounded-[2rem] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[230px] sm:min-h-[245px] shadow-sm group"
            >
              <div className="relative z-10 max-w-[58%] sm:max-w-[62%] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#576D49]">
                  Colección Canina
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1C1F1E] leading-snug">
                  Lo nuevo para perros
                </h3>
                <p className="text-xs text-[#5E685B] leading-relaxed">
                  Juguetes interactivos, snacks y accesorios que amarán día a día.
                </p>
                <div className="pt-2">
                  <button
                    id="hero-shop-dogs-pill-btn"
                    onClick={() => handleSelectPet('perro')}
                    className="px-4 py-2 rounded-full bg-[#6B7B3E] hover:bg-[#586731] text-white text-xs font-bold transition-all shadow-xs hover:scale-103 cursor-pointer"
                  >
                    Ver perros
                  </button>
                </div>
              </div>

              {/* Dog cutout image positioned on right */}
              <div className="absolute right-0 bottom-0 top-0 w-[45%] pointer-events-none flex items-end justify-end overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=500&q=80"
                  alt="Perro feliz jugando con pelota"
                  className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Bento Card 3: Bottom Right - Cozy picks for cats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#FAF0E7] border border-[#F0E0D2] rounded-[2rem] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[230px] sm:min-h-[245px] shadow-sm group"
            >
              {/* Heart icon on top-right */}
              <div className="absolute top-5 right-6 z-20 text-[#B96A4C]/60 text-lg">
                ♡
              </div>

              <div className="relative z-10 max-w-[58%] sm:max-w-[62%] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A65E42]">
                  Rincón Felino
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1C1F1E] leading-snug">
                  Favoritos para gatos
                </h3>
                <p className="text-xs text-[#6F6159] leading-relaxed">
                  Camas acogedoras, rascadores y juguetes para siestas perfectas.
                </p>
                <div className="pt-2">
                  <button
                    id="hero-shop-cats-pill-btn"
                    onClick={() => handleSelectPet('gato')}
                    className="px-4 py-2 rounded-full bg-[#B96A4C] hover:bg-[#A3583C] text-white text-xs font-bold transition-all shadow-xs hover:scale-103 cursor-pointer"
                  >
                    Ver gatos
                  </button>
                </div>
              </div>

              {/* Cat photo positioned on right */}
              <div className="absolute right-0 bottom-0 top-0 w-[45%] pointer-events-none flex items-end justify-end overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=500&q=80"
                  alt="Gatito cómodo durmiendo en cama suave"
                  className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

          </div>

        </div>

        {/* 3. Four Value Propositions Horizontal Bar matching the Reference Image */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[#EAE3D6] grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {/* Feature 1: Paw Points */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EAECE2] flex items-center justify-center text-[#6B7B3E] shrink-0 text-lg">
              🎖️
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1C1F1E] leading-snug">
                Puntos Lunary
              </h4>
              <p className="text-[11px] sm:text-xs text-[#737874] leading-tight">
                Gana en cada compra
              </p>
            </div>
          </div>

          {/* Feature 2: Free Shipping */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EAECE2] flex items-center justify-center text-[#6B7B3E] shrink-0 text-base">
              <Truck className="w-4 h-4 text-[#6B7B3E] stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1C1F1E] leading-snug">
                Envíos rápidos
              </h4>
              <p className="text-[11px] sm:text-xs text-[#737874] leading-tight">
                A toda Colombia
              </p>
            </div>
          </div>

          {/* Feature 3: Easy Returns & Guarantee */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FAF0E7] flex items-center justify-center text-[#B96A4C] shrink-0 text-base">
              <ShieldCheck className="w-4 h-4 text-[#B96A4C] stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1C1F1E] leading-snug">
                Garantía segura
              </h4>
              <p className="text-[11px] sm:text-xs text-[#737874] leading-tight">
                Compras 100% protegidas
              </p>
            </div>
          </div>

          {/* Feature 4: Vet Approved */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EDF3E8] flex items-center justify-center text-[#576D49] shrink-0 text-base">
              <Award className="w-4 h-4 text-[#576D49] stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#1C1F1E] leading-snug">
                Aprobado por expertos
              </h4>
              <p className="text-[11px] sm:text-xs text-[#737874] leading-tight">
                Calidad y bienestar
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
