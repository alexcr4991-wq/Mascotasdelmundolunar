import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ShoppingBag, MessageCircle, Heart, Check, Truck, ShieldCheck, Tag, Layers, Share2, Copy, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { formatCOP, buildProductInquiryWhatsAppUrl, getProductShareUrl } from '../utils/formatters';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  whatsappPhone: string;
  onAddToCart: (product: Product, quantity: number, variant?: ProductVariant) => void;
  onDirectBuy: (product: Product, quantity: number, variant?: ProductVariant) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
  whatsappPhone,
  onAddToCart,
  onDirectBuy,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        setSelectedVariantId(product.variants[0].id);
      } else {
        setSelectedVariantId('');
      }
      setQuantity(1);
      setActiveImageIndex(0);
    }
  }, [product]);

  if (!product) return null;

  // Gather all available product images (main imageUrl + additionalImages)
  const allImages = [
    product.imageUrl,
    ...(Array.isArray(product.additionalImages) ? product.additionalImages : []),
  ].filter(Boolean);

  const activeImage = allImages[activeImageIndex] || product.imageUrl;

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const selectedVariant = hasVariants
    ? product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0]
    : undefined;

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const isVariantInStock = selectedVariant
    ? (selectedVariant.stockCount === undefined || selectedVariant.stockCount > 0)
    : product.inStock;

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedVariant);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuy = () => {
    onDirectBuy(product, quantity, selectedVariant);
  };

  const discountPercent = currentOriginalPrice && currentOriginalPrice > currentPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : null;

  return (
    <motion.div
      id="product-quickview-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        id="product-quickview-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-3xl w-full overflow-hidden border-t sm:border border-[#ECE5DD] shadow-2xl relative max-h-[92vh] sm:max-h-[90vh] flex flex-col"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-[#DED7CB] rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

        <button
          id="close-quickview-btn"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#1C1F1E] flex items-center justify-center shadow-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto flex-1">
          {/* Left Column: Product Image Gallery & Carousel */}
          <div className="p-4 sm:p-6 bg-[#FAF8F5] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#ECE5DD] relative min-h-[260px] sm:min-h-auto">
            
            {/* Discount Badge */}
            {discountPercent && (
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-[#D48B4B] text-white shadow-xs">
                -{discountPercent}% OFF
              </span>
            )}

            {/* Main Image Viewer */}
            <div className="relative flex-1 flex items-center justify-center p-4 my-auto">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-56 sm:max-h-72 w-full object-contain transition-all duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Prev / Next Arrows if multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#1C1F1E] flex items-center justify-center shadow-md cursor-pointer transition-all"
                    title="Foto anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#1C1F1E] flex items-center justify-center shadow-md cursor-pointer transition-all"
                    title="Siguiente foto"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip for Multi-Photo Sliding / Angles / Colors */}
            {allImages.length > 1 && (
              <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={`thumb-${idx}`}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden bg-white border-2 transition-all cursor-pointer shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-[#6B7B3E] ring-2 ring-[#6B7B3E]/30 scale-105'
                        : 'border-[#DED7CB] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Vista ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="p-4 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#EFE9DF] text-[#696F6B] uppercase">
                  {product.category}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#8C918E]">
                  {product.petType === 'perro' ? '🐶 Para Perros' : product.petType === 'gato' ? '🐱 Para Gatos' : '🐾 Perros y Gatos'}
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-bold text-[#1C1F1E] leading-snug">
                {product.name}
              </h2>

              <div className="flex items-center gap-1.5">
                <div className="flex text-[#D99A46]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#D99A46]" />
                  ))}
                </div>
                <span className="text-[11px] sm:text-xs text-[#7B807C] font-semibold">
                  (5.0 • 32 reseñas de clientes felices)
                </span>
              </div>

              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-xl sm:text-2xl font-black text-[#1C1F1E]">
                  {formatCOP(currentPrice)}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#7E8380]">COP</span>
                {currentOriginalPrice && (
                  <span className="text-xs sm:text-sm text-[#9C9F9D] line-through ml-2">
                    {formatCOP(currentOriginalPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#5C625F] leading-relaxed pt-1">
                {product.description || 'Producto seleccionado con amor para el bienestar de tu mascota en Lunary World Pets.'}
              </p>

              {/* Variants Selector if available */}
              {hasVariants && product.variants && product.variants.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C1F1E]">
                    Selecciona una presentación o medida:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSel = v.id === selectedVariantId;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#1C2722] text-white shadow-xs'
                              : 'bg-[#FAF8F5] text-[#4A504C] border border-[#DDD5C9] hover:border-[#1C2722]'
                          }`}
                        >
                          {v.name} ({formatCOP(v.price)})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#ECE5DD] space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#DDD5C9] rounded-xl bg-[#FAF8F5] p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white font-bold text-sm text-[#1C1F1E] shadow-2xs hover:bg-stone-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-[#1C1F1E]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white font-bold text-sm text-[#1C1F1E] shadow-2xs hover:bg-stone-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAdd}
                  disabled={!isVariantInStock}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                    justAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#EFE9DF] hover:bg-[#E4DDD1] text-[#1C1F1E]'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Agregado al Carrito!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#6B7B3E]" />
                      <span>Agregar al Carrito</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Direct Buy Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleBuy}
                disabled={!isVariantInStock}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black bg-[#6B7B3E] hover:bg-[#586731] text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Comprar de inmediato ⚡</span>
              </motion.button>

              {/* WhatsApp direct inquiry */}
              <a
                href={buildProductInquiryWhatsAppUrl(whatsappPhone, {
                  ...product,
                  name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
                  price: currentPrice,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-[#2B4E3C] hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#2B4E3C]" />
                <span>¿Dudas sobre este producto? Escríbenos por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
