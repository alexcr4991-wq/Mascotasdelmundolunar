import React, { useState } from 'react';
import {
  X,
  Calculator,
  Dog,
  Cat,
  Sparkles,
  ShoppingBag,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Info,
  Scale,
  RotateCw,
} from 'lucide-react';
import { PetType, Product } from '../types';
import { formatCOP, formatPhoneNumber } from '../utils/formatters';

interface FoodCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  whatsappPhone: string;
  onAddToCart: (product: Product, quantity: number) => void;
  preSelectedProduct?: Product | null;
}

export const FoodCalculatorModal: React.FC<FoodCalculatorModalProps> = ({
  isOpen,
  onClose,
  products,
  whatsappPhone,
  onAddToCart,
  preSelectedProduct,
}) => {
  const [petType, setPetType] = useState<PetType>(preSelectedProduct?.petType === 'gato' ? 'gato' : 'perro');
  const [weightKg, setWeightKg] = useState<number>(petType === 'gato' ? 4 : 12);
  const [lifeStage, setLifeStage] = useState<'cachorro' | 'adulto' | 'senior'>('adulto');
  const [activityLevel, setActivityLevel] = useState<'baja' | 'moderada' | 'alta'>('moderada');
  const [sackWeightKg, setSackWeightKg] = useState<number>(7);
  const [selectedProductId, setSelectedProductId] = useState<string>(preSelectedProduct?.id || '');

  if (!isOpen) return null;

  // Filter food products matching pet type
  const foodProducts = products.filter(
    (p) => p.category.toLowerCase() === 'alimentos' && (p.petType === petType || p.petType === 'ambos')
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId) || foodProducts[0];

  // Derive bag weight from product if selected
  const activeBagWeight = selectedProduct
    ? (selectedProduct.name.includes('25') ? 25
      : selectedProduct.name.includes('15') ? 15
      : selectedProduct.name.includes('8') ? 8
      : selectedProduct.name.includes('7') ? 7
      : selectedProduct.name.includes('3') ? 3
      : selectedProduct.name.includes('1.5') ? 1.5
      : sackWeightKg)
    : sackWeightKg;

  // Nutritional calculation formulas (Gram standard in veterinary nutrition: RER / MER)
  // Perro: ~2.5% - 3.5% peso corporal según actividad y etapa
  // Gato: ~45g - 80g según peso
  let dailyGrams = 0;
  if (petType === 'perro') {
    let multiplier = 22; // base g por kg
    if (lifeStage === 'cachorro') multiplier = 32;
    if (lifeStage === 'senior') multiplier = 19;
    if (activityLevel === 'alta') multiplier += 4;
    if (activityLevel === 'baja') multiplier -= 3;
    dailyGrams = Math.round(weightKg * multiplier);
  } else {
    // Gato
    let multiplier = 13;
    if (lifeStage === 'cachorro') multiplier = 18;
    if (lifeStage === 'senior') multiplier = 11;
    if (activityLevel === 'alta') multiplier += 2;
    if (activityLevel === 'baja') multiplier -= 2;
    dailyGrams = Math.round(weightKg * multiplier + 15);
  }

  // Safety boundaries
  dailyGrams = Math.max(30, Math.min(dailyGrams, 950));

  // Sack duration calculation in days
  const totalGramsInSack = activeBagWeight * 1000;
  const daysDuration = Math.max(1, Math.round(totalGramsInSack / dailyGrams));
  const monthsDuration = (daysDuration / 30).toFixed(1);

  // Daily cost calculation
  const productPrice = selectedProduct?.price || 110000;
  const costPerDay = Math.round(productPrice / daysDuration);
  const mealsPerDay = lifeStage === 'cachorro' ? 3 : 2;
  const gramsPerMeal = Math.round(dailyGrams / mealsPerDay);

  const handleSendWhatsAppConsultation = () => {
    const text = `¡Hola Lunary World Pets! 🐾 Usé su Calculadora de Racionamiento:\n\n` +
      `🐶 Tipo: ${petType === 'perro' ? 'Perro' : 'Gato'} (${lifeStage})\n` +
      `⚖️ Peso: ${weightKg} kg (Actividad: ${activityLevel})\n` +
      `🍲 Porción calculada: ${dailyGrams} g/día (${mealsPerDay} comidas de ${gramsPerMeal}g)\n` +
      `📦 Bulto consultado: ${selectedProduct ? selectedProduct.name : `Bulto de ${activeBagWeight} kg`} (${formatCOP(productPrice)})\n` +
      `⏳ Duración estimada: ${daysDuration} días (aprox. ${monthsDuration} meses)\n` +
      `💰 Costo diario: ${formatCOP(costPerDay)}/día\n\n` +
      `¿Tienen disponibilidad para envío a domicilio? Muchas gracias!`;

    const url = `https://wa.me/57${(whatsappPhone || '3214231616').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddAndClose = () => {
    if (selectedProduct) {
      onAddToCart(selectedProduct, 1);
      onClose();
    }
  };

  return (
    <div
      id="food-calculator-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="food-calculator-container"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#ECE5DD] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#18231E] text-white flex items-center justify-between border-b border-[#2A3B33]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B97A48] text-white flex items-center justify-center font-bold shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Calculadora de Racionamiento & Duración de Bultos
              </h3>
              <p className="text-xs text-slate-300">
                Calcula la porción diaria exacta para tu mascota y cuántos días te rendirá el bulto
              </p>
            </div>
          </div>

          <button
            id="close-calculator-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[78vh]">
          {/* Pet Type Switch */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1C1F1E]">
              1. ¿Para qué consentido es el alimento?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPetType('perro');
                  if (weightKg < 5) setWeightKg(12);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold text-xs transition-all ${
                  petType === 'perro'
                    ? 'bg-[#1C2722] text-white border-[#1C2722] shadow-sm'
                    : 'bg-[#FAF8F5] text-[#5F6360] border-[#E8E2D8] hover:bg-white'
                }`}
              >
                <Dog className="w-4 h-4" />
                <span>🐶 Perro</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPetType('gato');
                  if (weightKg > 10) setWeightKg(4);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold text-xs transition-all ${
                  petType === 'gato'
                    ? 'bg-[#1C2722] text-white border-[#1C2722] shadow-sm'
                    : 'bg-[#FAF8F5] text-[#5F6360] border-[#E8E2D8] hover:bg-white'
                }`}
              >
                <Cat className="w-4 h-4" />
                <span>🐱 Gato</span>
              </button>
            </div>
          </div>

          {/* Weight & Life Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Weight Slider */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#1C1F1E] flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#B97A48]" />
                  Peso de tu mascota:
                </span>
                <span className="text-sm font-black text-[#B97A48] bg-white px-2 py-0.5 rounded-lg border border-[#E8E2D8]">
                  {weightKg} kg
                </span>
              </div>
              <input
                type="range"
                min={petType === 'gato' ? 1 : 2}
                max={petType === 'gato' ? 12 : 55}
                step={petType === 'gato' ? 0.5 : 1}
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                className="w-full accent-[#B97A48] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7C827E]">
                <span>{petType === 'gato' ? '1 kg' : '2 kg'} (Mini)</span>
                <span>{petType === 'gato' ? '6 kg' : '25 kg'} (Medio)</span>
                <span>{petType === 'gato' ? '12 kg' : '55 kg'} (Grande)</span>
              </div>
            </div>

            {/* Life stage & activity */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] space-y-2">
              <div>
                <label className="block text-xs font-bold text-[#1C1F1E] mb-1">
                  Etapa de vida:
                </label>
                <select
                  value={lifeStage}
                  onChange={(e) => setLifeStage(e.target.value as any)}
                  className="w-full bg-white border border-[#DED7CB] rounded-xl px-2.5 py-1.5 text-xs text-[#1C1F1E] font-medium outline-none"
                >
                  <option value="cachorro">{petType === 'perro' ? '🐕 Cachorro (2 a 12 meses)' : '🐱 Gatito / Kitten (2 a 12 meses)'}</option>
                  <option value="adulto">🐾 Adulto (1 a 7 años)</option>
                  <option value="senior">👑 Senior / Maduro (+7 años)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1F1E] mb-1">
                  Nivel de actividad:
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full bg-white border border-[#DED7CB] rounded-xl px-2.5 py-1.5 text-xs text-[#1C1F1E] font-medium outline-none"
                >
                  <option value="baja">🛋️ Sedentario / Paseos cortos</option>
                  <option value="moderada">🚶‍♂️ Moderado / Paseo diario 30-60 min</option>
                  <option value="alta">⚡ Muy Activo / Corre y juega bastante</option>
                </select>
              </div>
            </div>
          </div>

          {/* Select Food or Bag */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1C1F1E]">
              2. Selecciona el bulto de alimento que deseas calcular:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-white border border-[#DED7CB] rounded-2xl px-3.5 py-2.5 text-xs text-[#1C1F1E] font-bold outline-none shadow-xs"
            >
              {foodProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCOP(p.price)}
                </option>
              ))}
            </select>
          </div>

          {/* RESULTS CARD (HIGH CONTRAST & BEAUTIFULLY STYLED) */}
          <div className="bg-[#1C2722] text-white p-4 sm:p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Resultado Nutricional Personalizado
              </span>
              <span className="text-[11px] text-white/70">
                Basado en {weightKg} kg ({lifeStage})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Daily Grams */}
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                <span className="text-[11px] text-slate-300 block font-medium">Porción Diaria</span>
                <strong className="text-xl sm:text-2xl font-black text-amber-400">{dailyGrams} g</strong>
                <span className="text-[10px] text-slate-300 block mt-0.5">al día</span>
              </div>

              {/* Meals distribution */}
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                <span className="text-[11px] text-slate-300 block font-medium">Por Comida</span>
                <strong className="text-xl sm:text-2xl font-black text-white">{gramsPerMeal} g</strong>
                <span className="text-[10px] text-slate-300 block mt-0.5">({mealsPerDay} tomas/día)</span>
              </div>

              {/* Sack Duration */}
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-2xl">
                <span className="text-[11px] text-emerald-300 block font-bold">Duración del Bulto</span>
                <strong className="text-xl sm:text-2xl font-black text-emerald-300">~{daysDuration}</strong>
                <span className="text-[10px] text-emerald-200 block mt-0.5">días ({monthsDuration} meses)</span>
              </div>

              {/* Daily Cost */}
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                <span className="text-[11px] text-slate-300 block font-medium">Costo por Día</span>
                <strong className="text-lg sm:text-xl font-black text-white">{formatCOP(costPerDay)}</strong>
                <span className="text-[10px] text-slate-300 block mt-0.5">pesos colombianos</span>
              </div>
            </div>

            {/* Smart Auto-delivery recommendation */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-slate-200 leading-snug">
                  <strong>Recomendación Lunary:</strong> Programa tu entrega cada <strong>{Math.max(15, Math.floor(daysDuration / 5) * 5)} días</strong> y ahorra un <strong>5% fijo</strong> en cada bulto.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {selectedProduct && (
              <button
                type="button"
                id="calc-add-to-cart-btn"
                onClick={handleAddAndClose}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-101"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Añadir Bulto al Carrito ({formatCOP(selectedProduct.price)})</span>
              </button>
            )}

            <button
              type="button"
              id="calc-whatsapp-consult-btn"
              onClick={handleSendWhatsAppConsultation}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-101"
            >
              <Send className="w-4 h-4" />
              <span>Pedir Asesoría por WhatsApp ({formatPhoneNumber(whatsappPhone)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
