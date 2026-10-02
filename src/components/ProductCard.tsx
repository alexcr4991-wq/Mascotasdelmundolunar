import React, { useState } from 'react';
import { Heart, Star, ShoppingBag, MessageCircle, Eye, Check, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, ProductVariant } from '../types';
import { formatCOP, buildProductInquiryWhatsAppUrl, getProductShareUrl } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  whatsappPhone: string;
  onAddToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  onQuickView: (product: Product) => void;
  onDirectBuy: (product: Product, quantity?: number, variant?: ProductVariant) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  whatsappPhone,
  onAddToCart,
  onQuickView,
  onDirectBuy,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Manage selected variant if available
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return product.variants?.[0]?.id || '';
  });

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0];

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const isVariantInStock = selectedVariant ? (selectedVariant.stockCount === undefined || selectedVariant.stockCount > 0) : product.inStock;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1, selectedVariant);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleDirectBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDirectBuy(product, 1, selectedVariant);
  };

  // Calculate discount percentage if original price exists
  const discountPercent = currentOriginalPrice && currentOriginalPrice > currentPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : null;

  return (
    <motion.div
      id={`product-card-${product.id}`}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onQuickView(product)}
      className="group bg-[#FAF7F2] hover:bg-white rounded-3xl p-3 sm:p-4 border border-[#ECE4D8] hover:border-[#D6CCA] hover:shadow-md hover:shadow-stone-900/5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      {/* Top Row: Clean Editorial Badges & Heart / Share Actions */}
      <div className="flex items-center justify-between gap-1.5 mb-2 relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {discountPercent ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D45942] text-white shadow-2xs">
              -{discountPercent}%
            </span>
          ) : product.isFeatured ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C59B27] text-white shadow-2xs uppercase tracking-wider">
              Bestseller
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8EDE4] text-[#556942] uppercase tracking-wider">
              {product.petType === 'perro' ? '🐶 Perro' : product.petType === 'gato' ? '🐱 Gato' : '🐾 Mascotas'}
            </span>
          )}

          {!isVariantInStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              Agotado
            </span>
          )}
        </div>

        {/* Action icons: Share Link & Favorite Heart */}
        <div className="flex items-center gap-1 shrink-0">
          <motion.button
            type="button"
            id={`card-copy-link-btn-${product.id}`}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={(e) => {
              e.stopPropagation();
              const url = getProductShareUrl(product.id);
              navigator.clipboard.writeText(url);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'text-[#6F7571] hover:text-[#1C1F1E] bg-white hover:bg-stone-50 border border-stone-200/60 shadow-2xs'
            }`}
            title="Copiar enlace del producto"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </motion.button>

          <motion.button
            type="button"
            id={`favorite-btn-${product.id}`}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
              isLiked
                ? 'text-rose-500 bg-rose-50 border border-rose-200'
                : 'text-[#8E9490] hover:text-rose-500 bg-white hover:bg-stone-50 border border-stone-200/60 shadow-2xs'
            }`}
            title="Guardar en favoritos"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Product Image Container with Clean Dropdown Effect */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white flex items-center justify-center p-2 mb-2.5 sm:mb-3 border border-[#EFEBE4]">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80'}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Quick View Button overlay on hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center">
          <span className="bg-white/95 text-[#1C1F1E] text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Ver detalles
          </span>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Presentation metadata */}
          <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-[#8C908D] mb-1">
            <span className="uppercase tracking-wider truncate font-bold text-[#6D726F]">
              {product.brand || product.category}
            </span>
            {!hasVariants && product.weightOrSize && (
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#EFE9DF] text-[#4A504C] font-bold text-[10px]">
                {product.weightOrSize}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-bold text-[#1C1F1E] leading-snug line-clamp-2 mb-1.5 group-hover:text-[#6B7B3E] transition-colors">
            {product.name}
          </h3>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
            <span className="text-[11px] text-[#787D7A] font-medium">
              ({product.rating ? Math.round(product.rating * 5 + 10) : 24})
            </span>
          </div>

          {/* Variants Selector Pills if product has presentations */}
          {hasVariants && product.variants && product.variants.length > 0 && (
            <div
              className="mb-2 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-[#6D726F]">
                <span className="truncate">Opciones:</span>
                <span className="text-[#6B7B3E] font-black truncate max-w-[80px] sm:max-w-none text-right">
                  {selectedVariant?.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product.variants.map((v) => {
                  const isSel = v.id === (selectedVariant?.id || selectedVariantId);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVariantId(v.id);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        isSel
                          ? 'bg-[#1C1F1E] text-white shadow-2xs'
                          : 'bg-white text-[#4A504C] border border-[#DDD5C9] hover:border-[#1C1F1E]'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pricing and Action Buttons */}
        <div className="pt-2 border-t border-[#EDE7DE]/80">
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-base sm:text-lg font-black text-[#1C1F1E]">
              {formatCOP(currentPrice)}
            </span>
            <span className="text-[10px] font-semibold text-[#8B908D]">COP</span>
            {currentOriginalPrice && (
              <span className="text-xs text-[#9B9E9C] line-through ml-auto">
                {formatCOP(currentOriginalPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart + Buy Now Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <motion.button
              id={`add-to-cart-${product.id}`}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              disabled={!isVariantInStock}
              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                justAdded
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-[#EAE4D9] hover:bg-[#DFD8CC] text-[#1C1F1E]'
              }`}
              title="Agregar al carrito"
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Listo!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#6B7B3E]" />
                  <span>Al Carrito</span>
                </>
              )}
            </motion.button>

            <motion.button
              id={`buy-now-${product.id}`}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDirectBuy}
              disabled={!isVariantInStock}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold bg-[#6B7B3E] hover:bg-[#586731] text-white shadow-2xs transition-all cursor-pointer"
              title="Comprar de inmediato con Wompi o WhatsApp"
            >
              <span>Comprar</span>
              <span>⚡</span>
            </motion.button>
          </div>

          {/* Direct WhatsApp Inquiry Link */}
          <a
            id={`whatsapp-inquiry-${product.id}`}
            href={buildProductInquiryWhatsAppUrl(whatsappPhone, {
              ...product,
              name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
              price: currentPrice,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-[#4D633C] hover:text-[#2D3F22] hover:underline"
          >
            <MessageCircle className="w-3 h-3 text-[#4D633C]" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
};
