import React from 'react';
import { motion } from 'motion/react';
import { Category } from '../types';

interface CategoryRowProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

// Preset visual category icons & images to match the exact pills in reference image
const CATEGORY_VISUALS: Record<string, { image: string; emoji: string }> = {
  alimentos: {
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=300&q=80',
    emoji: '🥣',
  },
  juguetes: {
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=300&q=80',
    emoji: '🧶',
  },
  higiene: {
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=300&q=80',
    emoji: '🧴',
  },
  camas: {
    image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=300&q=80',
    emoji: '🛏️',
  },
  accesorios: {
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=300&q=80',
    emoji: '🦮',
  },
  snacks: {
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=300&q=80',
    emoji: '🦴',
  },
};

export const CategoryRow: React.FC<CategoryRowProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories-preview-section" className="py-5 sm:py-8 bg-white border-b border-[#F0EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Header indicator */}
        <div className="flex items-center justify-between mb-3 sm:hidden">
          <span className="text-xs font-bold text-[#1C1F1E] flex items-center gap-1.5">
            <span>🐾</span> Categorías Populares
          </span>
          <span className="text-[11px] text-[#8C908D] font-medium">
            Desliza para ver más →
          </span>
        </div>

        {/* Category Pills: Horizontal Swipe on Mobile & Responsive Grid on Desktop */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible no-scrollbar sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-4 pb-2 sm:pb-0 snap-x">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat.slug;
            const visual = CATEGORY_VISUALS[cat.slug] || {
              image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=300&q=80',
              emoji: '🐾',
            };

            return (
              <motion.button
                key={cat.id}
                id={`category-card-${cat.slug}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectCategory(isSelected ? null : cat.slug)}
                className={`group flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 text-left border cursor-pointer shrink-0 sm:shrink min-w-[145px] sm:min-w-0 snap-start ${
                  isSelected
                    ? 'bg-[#EAE4D9] border-[#B97A48] shadow-sm ring-1 ring-[#B97A48]'
                    : 'bg-[#F7F4EE] hover:bg-[#EFE9DF] border-[#EBE3D7]'
                }`}
              >
                {/* Visual Thumbnail */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white shrink-0 shadow-xs flex items-center justify-center p-0.5 border border-[#E5DDD0]">
                  <img
                    src={visual.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-lg sm:text-xl select-none hidden">{visual.emoji}</span>
                </div>

                {/* Label & "Ver más" */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1C1F1E] truncate group-hover:text-[#B97A48] transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-medium text-[#7D827F] flex items-center gap-0.5 mt-0.5">
                    {isSelected ? '✓ Activo' : 'Ver más'}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Filter reset banner if category is currently active */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-between text-xs text-[#5F6360] bg-[#FAF8F5] px-4 py-2 rounded-xl border border-[#ECE5DD]"
          >
            <span>
              Filtrando por categoría: <strong className="text-[#1C1F1E] uppercase">{selectedCategory}</strong>
            </span>
            <button
              id="clear-category-filter-btn"
              onClick={() => onSelectCategory(null)}
              className="text-[#B97A48] font-bold hover:underline cursor-pointer"
            >
              Mostrar todas las categorías
            </button>
          </motion.div>
        )}

      </div>
    </section>
  );
};
