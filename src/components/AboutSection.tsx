import React from 'react';
import { Heart, ShieldCheck, MessageCircleHeart, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { AboutContent, ContactInfo } from '../types';

interface AboutSectionProps {
  aboutContent: AboutContent;
  contactInfo: ContactInfo;
  onExploreCatalog: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  aboutContent,
  contactInfo,
  onExploreCatalog,
}) => {
  return (
    <div id="about-us-section" className="py-12 sm:py-16 bg-[#FAF8F5] space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Story and Mission Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE7DF] text-[#1C1F1E] text-xs font-bold uppercase tracking-wider">
              <span>🐾 Sobre Nosotros</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1F1E] leading-tight">
              {aboutContent.title}
            </h2>

            <p className="text-sm sm:text-base text-[#5E6360] leading-relaxed">
              {aboutContent.subtitle}
            </p>

            <div className="bg-white p-5 rounded-3xl border border-[#ECE5DD] shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase text-[#B97A48] tracking-wider">
                Nuestra Misión
              </h3>
              <p className="text-xs sm:text-sm text-[#4E5250] leading-relaxed">
                {aboutContent.mission}
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#ECE5DD] shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase text-[#B97A48] tracking-wider">
                Nuestra Visión
              </h3>
              <p className="text-xs sm:text-sm text-[#4E5250] leading-relaxed">
                {aboutContent.vision}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img
                src={aboutContent.bannerImage}
                alt="Nosotros y Mascotas"
                className="w-full h-80 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 text-white">
                <div>
                  <span className="text-xs uppercase font-bold text-amber-200 tracking-wider block">
                    Pasión por los animales
                  </span>
                  <h4 className="text-lg font-bold">Amor, respeto y nutrición honesta</h4>
                </div>
              </div>
            </div>

            {/* Story excerpt */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#ECE5DD] text-xs sm:text-sm text-[#5E6360] leading-relaxed shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1C1F1E]">📖 Nuestra Historia</span>
              </div>
              <p className="whitespace-pre-line text-[#4E5250] leading-relaxed">
                {aboutContent.story}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {aboutContent.stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-3xl border border-[#ECE5DD] text-center shadow-xs space-y-1"
            >
              <div className="text-2xl sm:text-3xl font-black text-[#1C1F1E] tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-[#7A807C]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Core Values */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold text-[#1C1F1E]">Nuestros Valores</h3>
            <p className="text-xs sm:text-sm text-[#6C716E]">
              Lo que nos motiva cada día para ofrecerte el mejor servicio en Colombia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aboutContent.values.map((val, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-3xl border border-[#ECE5DD] space-y-2.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] border border-[#ECE5DD] flex items-center justify-center text-[#B97A48]">
                  {idx === 0 && <Heart className="w-5 h-5 fill-[#B97A48]" />}
                  {idx === 1 && <ShieldCheck className="w-5 h-5" />}
                  {idx === 2 && <MessageCircleHeart className="w-5 h-5" />}
                  {idx === 3 && <Truck className="w-5 h-5" />}
                </div>
                <h4 className="text-sm font-bold text-[#1C1F1E]">{val.title}</h4>
                <p className="text-xs text-[#6A6F6C] leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
