import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Category } from '../types';

// Import pristine studio product images matching the reference image
import plushDuckImg from '../assets/images/plush_duck_toy_1787371833840.jpg';
import orthopedicDogBedImg from '../assets/images/orthopedic_dog_bed_1787371862630.jpg';
import tacticalK9HarnessImg from '../assets/images/tactical_k9_harness_1787371848403.jpg';
import petCarrierBagImg from '../assets/images/pet_carrier_bag_1787372001295.jpg';
import groomingGloveBrushImg from '../assets/images/grooming_brush_glove_1787371940614.jpg';
import catFoodBagImg from '../assets/images/cat_food_bag_1787031439384.jpg';
import beefJerkySnacksImg from '../assets/images/beef_jerky_snacks_1787372104607.jpg';
import stainlessBowlImg from '../assets/images/stainless_pet_bowl_1787371926476.jpg';

interface CategoryRowProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

// Pastel color palette and pristine photo matching each card in reference image
interface CategoryDisplayItem {
  slug: string;
  name: string;
  englishSub?: string;
  bgClass: string;
  borderClass: string;
  image: string;
}

const CATEGORY_STYLE_MAP: Record<string, { bgClass: string; borderClass: string; image: string }> = {
  alimentos: {
    bgClass: 'bg-[#EAEBE1] hover:bg-[#E2E4D6]',
    borderClass: 'border-[#DFE2D4]',
    image: catFoodBagImg,
  },
  juguetes: {
    bgClass: 'bg-[#FFF6DC] hover:bg-[#FEEFC8]',
    borderClass: 'border-[#F8ECC6]',
    image: plushDuckImg,
  },
  camas: {
    bgClass: 'bg-[#F4ECE3] hover:bg-[#EEE1D4]',
    borderClass: 'border-[#EAE0D3]',
    image: orthopedicDogBedImg,
  },
  higiene: {
    bgClass: 'bg-[#EAF0EE] hover:bg-[#DFEBE7]',
    borderClass: 'border-[#DBE7E3]',
    image: groomingGloveBrushImg,
  },
  accesorios: {
    bgClass: 'bg-[#F3E6E6] hover:bg-[#EBD8D8]',
    borderClass: 'border-[#E7D3D3]',
    image: tacticalK9HarnessImg,
  },
  snacks: {
    bgClass: 'bg-[#F5EFE3] hover:bg-[#ECE3D2]',
    borderClass: 'border-[#E9DEC9]',
    image: beefJerkySnacksImg,
  },
};

// Fallback visual tiles to complete the 8-grid if fewer than 8 categories are stored
const EXTRA_TILES: CategoryDisplayItem[] = [
  {
    slug: 'accesorios',
    name: 'Transporte & Viaje',
    englishSub: 'Crates & Carriers',
    bgClass: 'bg-[#ECEBF2] hover:bg-[#DFDEE9]',
    borderClass: 'border-[#DBD9E6]',
    image: petCarrierBagImg,
  },
  {
    slug: 'alimentos',
    name: 'Comederos & Bebederos',
    englishSub: 'Bowls & Feeders',
    bgClass: 'bg-[#E7F0EB] hover:bg-[#DCE9E2]',
    borderClass: 'border-[#D4E3DB]',
    image: stainlessBowlImg,
  },
];

export const CategoryRow: React.FC<CategoryRowProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  // Construct the full 8 category display items matching the 4x2 grid in reference image
  const displayItems: CategoryDisplayItem[] = categories.map((cat) => {
    const style = CATEGORY_STYLE_MAP[cat.slug] || {
      bgClass: 'bg-[#F5EFE3] hover:bg-[#ECE3D2]',
      borderClass: 'border-[#E9DEC9]',
      image: plushDuckImg,
    };
    return {
      slug: cat.slug,
      name: cat.name,
      bgClass: style.bgClass,
      borderClass: style.borderClass,
      image: style.image,
    };
  });

  // If there are 6 items, append 2 curated tiles to make a perfect 8-item grid (4x2)
  if (displayItems.length < 8) {
    EXTRA_TILES.forEach((extra) => {
      if (displayItems.length < 8) {
        displayItems.push(extra);
      }
    });
  }

  return (
    <section id="categories-preview-section" className="py-8 sm:py-12 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching "Shop by category" in Reference Image */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7B3E] block mb-1">
              Catálogo Completo
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#1C1F1E] tracking-tight">
              Comprar por categoría
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#737874]">
            Encuentra todo lo que tu peludo necesita en un solo lugar
          </p>
        </div>

        {/* 8-Tile Bento / Category Grid: 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
          {displayItems.map((item, idx) => {
            const isSelected = selectedCategory === item.slug;

            return (
              <motion.button
                key={`${item.slug}-${idx}`}
                id={`category-card-${item.slug}-${idx}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCategory(isSelected ? null : item.slug)}
                className={`group relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[195px] border transition-all duration-300 text-left overflow-hidden cursor-pointer shadow-xs ${
                  item.bgClass
                } ${item.borderClass} ${
                  isSelected ? 'ring-2 ring-[#6B7B3E] shadow-md' : ''
                }`}
              >
                {/* Centered Clean Product Photo */}
                <div className="flex-1 flex items-center justify-center py-1 sm:py-2">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Bottom Row: Category Name on Left, Arrow -> on Right */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5">
                  <span className="text-xs sm:text-sm font-bold text-[#1C1F1E] group-hover:text-[#6B7B3E] transition-colors truncate">
                    {item.name}
                  </span>
                  
                  <div className="w-6 h-6 rounded-full bg-white/70 group-hover:bg-white flex items-center justify-center text-[#1C1F1E] group-hover:text-[#6B7B3E] transition-all shrink-0 shadow-2xs group-hover:translate-x-0.5">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Clear filter indicator if category is active */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center justify-between text-xs text-[#5F6360] bg-white px-4 py-2.5 rounded-2xl border border-[#EAE3D6] shadow-2xs"
          >
            <span>
              Filtrando por categoría: <strong className="text-[#1C1F1E] uppercase">{selectedCategory}</strong>
            </span>
            <button
              id="clear-category-filter-btn"
              onClick={() => onSelectCategory(null)}
              className="text-[#6B7B3E] font-bold hover:underline cursor-pointer"
            >
              Mostrar todas las categorías (✕ Limpiar filtro)
            </button>
          </motion.div>
        )}

      </div>
    </section>
  );
};
