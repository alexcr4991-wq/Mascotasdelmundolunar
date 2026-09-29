import React from 'react';
import { Truck, Heart, Award } from 'lucide-react';
import { motion } from 'motion/react';
import petsFamilyHomeImg from '../assets/images/pets_family_home_1787181054220.jpg';
import { ContactInfo } from '../types';

interface HeroBannerProps {
  contactInfo: ContactInfo;
  onExploreCatalog: () => void;
  onExploreAbout: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreCatalog,
  onExploreAbout,
}) => {
  return (
    <section id="hero-banner-section" className="relative bg-[#FAF8F5] overflow-hidden pt-6 pb-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Subtitle, CTA buttons, 3 Feature Guarantees */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-6 sm:space-y-8 z-10"
          >
            <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-5xl lg:text-[3.4rem] font-black text-[#1C1F1E] tracking-tight leading-[1.15]"
              >
                Todo lo que tu <br className="hidden sm:inline" />
                mascota necesita, <br className="hidden sm:inline" />
                lo encuentras{' '}
                <span className="text-[#C68748] relative inline-block">
                  aquí
                  {/* Gentle warm brush underline with animation */}
                  <motion.svg
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.9, delay: 0.4 }}
                    className="absolute -bottom-1.5 sm:-bottom-2.5 left-0 w-full h-2.5 sm:h-3 text-[#C68748]/60"
                    viewBox="0 0 100 12"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 9C25 3 75 3 98 8"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </motion.svg>
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[#5F6360] text-sm sm:text-lg max-w-lg leading-relaxed pt-0.5 mx-auto lg:mx-0"
              >
                Productos de calidad, seleccionados con amor para su bienestar y felicidad.
              </motion.p>
            </div>

            {/* CTA Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5 pt-1"
            >
              <motion.button
                id="hero-go-to-store-btn"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onExploreCatalog}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#1A2620] hover:bg-[#283830] text-white text-xs sm:text-base font-bold shadow-md shadow-[#1A2620]/15 transition-colors cursor-pointer"
              >
                <span>Ir a la tienda</span>
                <span className="text-sm sm:text-base">🐾</span>
              </motion.button>

              <motion.button
                id="hero-about-us-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={onExploreAbout}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white hover:bg-[#F3EFEA] text-[#1C1F1E] text-xs sm:text-base font-bold border border-[#E3DDD5] transition-colors cursor-pointer"
              >
                <span>Conócenos</span>
                <span className="text-xs sm:text-sm text-[#B97A48]">♡</span>
              </motion.button>
            </motion.div>

            {/* 3 Feature Guarantees Row matching the Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="pt-4 sm:pt-8 border-t border-[#ECE5DD] grid grid-cols-3 gap-2 sm:gap-6 text-left"
            >
              
              {/* Feature 1 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-3 p-1.5 rounded-xl bg-white/60 sm:bg-transparent border border-[#ECE5DD]/60 sm:border-0"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EFEBE4] flex items-center justify-center shrink-0 text-[#1C1F1E]">
                  <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-sm font-bold text-[#1C1F1E] leading-snug">
                    Envíos rápidos
                  </h4>
                  <p className="text-[9px] sm:text-xs text-[#737874] leading-tight mt-0.5">
                    a todo Colombia
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-3 p-1.5 rounded-xl bg-white/60 sm:bg-transparent border border-[#ECE5DD]/60 sm:border-0"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EFEBE4] flex items-center justify-center shrink-0 text-[#1C1F1E]">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-sm font-bold text-[#1C1F1E] leading-snug">
                    Productos
                  </h4>
                  <p className="text-[9px] sm:text-xs text-[#737874] leading-tight mt-0.5">
                    de calidad
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-3 p-1.5 rounded-xl bg-white/60 sm:bg-transparent border border-[#ECE5DD]/60 sm:border-0"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EFEBE4] flex items-center justify-center shrink-0 text-[#1C1F1E]">
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B97A48] stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-sm font-bold text-[#1C1F1E] leading-snug">
                    Atención
                  </h4>
                  <p className="text-[9px] sm:text-xs text-[#737874] leading-tight mt-0.5">
                    con amor
                  </p>
                </div>
              </motion.div>

            </motion.div>
          </motion.div>

          {/* Right Column: Unified Cozy Family Pet Photo in a circular round frame with diffuse edges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="lg:col-span-6 relative flex justify-center lg:justify-end items-center"
          >
            <div className="relative w-full max-w-[440px] aspect-square flex items-center justify-center p-2 sm:p-4">
              
              {/* Soft Diffuse Outer Glow / Aura */}
              <div className="absolute inset-4 rounded-full bg-linear-to-tr from-[#3F5447]/40 via-amber-200/30 to-[#B97A48]/30 blur-2xl -z-10 animate-pulse" />
              
              {/* Decorative concentric dashed ring */}
              <div className="absolute inset-2 sm:inset-1 rounded-full border-2 border-dashed border-[#3F5447]/30 pointer-events-none" />

              {/* Floating ambient doodles */}
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="absolute top-2 left-4 text-[#3F5447]/60 text-xl font-mono select-none z-20"
              >
                ♡
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.12, 1], rotate: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut" }}
                className="absolute top-4 right-6 text-amber-700/40 text-2xl select-none z-20"
              >
                🐾
              </motion.div>

              {/* Main Circular Image Frame with Diffuse Feathered Edges */}
              <motion.div
                whileHover={{ scale: 1.025 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full h-full rounded-full overflow-hidden p-2 sm:p-2.5 bg-linear-to-b from-[#3F5447] via-[#2D3E34] to-[#1C2722] shadow-2xl shadow-[#1C2722]/30 flex items-center justify-center"
              >
                {/* Inner round photo container with soft vignette / diffuse mask */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-stone-900 border-2 border-white/40">
                  <img
                    src={petsFamilyHomeImg}
                    alt="Familia de tres mascotas felices juntas en casa con marco redondo y efecto difuminado"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transform hover:scale-106 transition-transform duration-700"
                  />
                  
                  {/* Diffuse Radial Vignette Overlay (Efecto difuminado en bordes) */}
                  <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_0_45px_rgba(0,0,0,0.55)] sm:shadow-[inset_0_0_60px_rgba(0,0,0,0.65)]" />
                  <div className="absolute inset-0 rounded-full pointer-events-none bg-radial from-transparent via-transparent to-[#1C2722]/60" />
                  
                  {/* Subtle warm light gradient at the bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-[#1C2722]/80 via-[#1C2722]/30 to-transparent pointer-events-none" />

                  {/* Micro caption pill inside the round frame */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1A2620]/85 backdrop-blur-xs text-amber-200 text-[11px] font-bold px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-md border border-white/20 whitespace-nowrap z-20">
                    <span>🏡</span>
                    <span>Familia Lunary World Pets</span>
                  </div>
                </div>
              </motion.div>

              {/* Round Stamp / Badge: "LUNARY PET • HECHO CON AMOR •" */}
              <motion.div
                id="hero-lunary-stamp"
                whileHover={{ scale: 1.08, rotate: 6 }}
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute -bottom-2 right-0 sm:right-2 z-30 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#18231E] text-white p-1.5 shadow-2xl flex items-center justify-center border-2 border-[#FAF8F5] cursor-pointer"
              >
                <div className="w-full h-full rounded-full border border-dashed border-amber-200/60 flex flex-col items-center justify-center text-center p-1 relative">
                  <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase text-amber-200">
                    LUNARY PET
                  </span>
                  <span className="text-xl sm:text-2xl my-0.5 select-none">🐾</span>
                  <span className="text-[7px] sm:text-[8px] font-bold tracking-wider text-slate-200 uppercase">
                    HECHO CON AMOR
                  </span>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
