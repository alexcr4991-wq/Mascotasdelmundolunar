import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Star, ShoppingBag, MessageCircle, Heart, Check, Truck, ShieldCheck, Tag, Layers, Share2, Copy, ExternalLink } from 'lucide-react';
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

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    } else {
      setSelectedVariantId('');
    }
    setQuantity(1);
  }, [product]);

  if (!product) return null;

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const selectedVariant = hasVariants
    ? product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0]
    : undefined;

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const isVariantInStock = selectedVariant
    ? (selectedVariant.stockCount === undefined || selectedVariant.stockCount > 0)
    : product.inStock;

  const [isRedirectingToWompi, setIsRedirectingToWompi] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedVariant);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuy = () => {
    setIsRedirectingToWompi(true);
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
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#1C1F1E] flex items-center justify-center shadow-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto flex-1">
          {/* Left Column: Big Product Image */}
          <div className="p-4 sm:p-8 bg-[#FAF8F5] flex items-center justify-center border-b md:border-b-0 md:border-r border-[#ECE5DD] relative min-h-[200px] sm:min-h-auto">
            {discountPercent && (
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black bg-[#D48B4B] text-white shadow-xs">
                -{discountPercent}% OFF
              </span>
            )}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-52 sm:max-h-72 w-full object-contain hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
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

              <p className="text-xs sm:text-sm text-[#5B605D] leading-relaxed">
                {product.description || 'Producto seleccionado de alta calidad para consentir a tu mascota.'}
              </p>

              {/* Variant Selector */}
              {hasVariants && product.variants && product.variants.length > 0 ? (
                <div className="p-2.5 sm:p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE5DD] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1C1F1E]">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#B97A48]" />
                      Selecciona Presentación / Tamaño / Peso:
                    </span>
                    <span className="text-[#B97A48] font-black">{selectedVariant?.name}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {product.variants.map((v) => {
                      const isSel = v.id === (selectedVariant?.id || selectedVariantId);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            isSel
                              ? 'border-[#1C2722] bg-[#1C2722] text-white shadow-xs'
                              : 'border-[#DED7CB] bg-white text-[#1C1F1E] hover:border-[#1C2722] hover:bg-[#FDFCFB]'
                          }`}
                        >
                          <p className={`text-xs font-bold ${isSel ? 'text-white' : 'text-[#1C1F1E]'}`}>{v.name}</p>
                          <p className={`text-[11px] font-black mt-0.5 ${isSel ? 'text-[#FFD8A8]' : 'text-[#B97A48]'}`}>
                            {formatCOP(v.price)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                product.weightOrSize && (
                  <div className="flex items-center gap-1.5 text-xs text-[#5B605D] pt-1">
                    <Tag className="w-3.5 h-3.5 text-[#B97A48]" />
                    <span>Presentación fija: <strong>{product.weightOrSize}</strong></span>
                  </div>
                )
              )}
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-3 pt-3 border-t border-[#ECE5DD] bg-white sticky bottom-0 z-10 pb-2 sm:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#1C1F1E]">Cantidad:</span>
                <div className="flex items-center border border-[#DDD5C9] rounded-xl overflow-hidden bg-[#FAF8F5]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-sm font-bold text-[#1C1F1E] hover:bg-[#EFE9DF]"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-sm font-bold text-[#1C1F1E] hover:bg-[#EFE9DF]"
                  >
                    +
                  </button>
                </div>
                <span className={`text-[11px] sm:text-xs font-semibold ml-auto ${isVariantInStock ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isVariantInStock ? '✓ Disponible' : '✗ Agotado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="quickview-add-cart-btn"
                  onClick={handleAdd}
                  disabled={!isVariantInStock}
                  className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                    justAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#EAE3D7] hover:bg-[#DCD4C6] text-[#1C1F1E]'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>¡Añadido!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Al Carrito</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="quickview-buy-now-btn"
                  onClick={handleBuy}
                  disabled={!isVariantInStock || isRedirectingToWompi}
                  className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-[#1C2722] hover:bg-[#2B3B34] text-white shadow-md flex items-center justify-center gap-1.5 sm:gap-2 hover:scale-101 disabled:opacity-75 cursor-pointer transition-all"
                >
                  {isRedirectingToWompi ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                      <span>Pasando a PSE...</span>
                    </>
                  ) : (
                    <>
                      <span className="bg-[#002D72] text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none shadow-2xs">PSE</span>
                      <span>Pago PSE</span>
                      <span className="text-amber-300">⚡</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct WhatsApp ask */}
              <a
                href={buildProductInquiryWhatsAppUrl(whatsappPhone, {
                  ...product,
                  name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
                  price: currentPrice,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 sm:py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pedir o consultar por WhatsApp ({whatsappPhone || '3214231616'})</span>
              </a>

              {/* Extra Social Actions: Copy Direct Link */}
              <div className="pt-1 border-t border-[#ECE5DD]">
                <button
                  type="button"
                  id="quickview-copy-link-btn"
                  onClick={() => {
                    const url = getProductShareUrl(product.id);
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-[#FAF8F5] border-[#DDD5C9] text-[#1C1F1E] hover:bg-[#F2ECE3]'
                  }`}
                  title="Copiar link directo de este producto"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Enlace Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#B97A48]" />
                      <span>Copiar Enlace Directo para WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
