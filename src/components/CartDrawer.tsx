import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Building2,
  Smartphone,
  Truck,
  RotateCcw,
  ExternalLink,
  Lock,
  MapPin,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, ContactInfo, Order, PaymentMethod } from '../types';
import { formatCOP, buildOrderWhatsAppUrl, formatPhoneNumber } from '../utils/formatters';
import { addStoredCustomerLead, calculateDeliveryFee, isDeliveryBogota, getStoredCustomerCheckoutProfile, saveStoredCustomerCheckoutProfile } from '../services/storage';
import { fetchWompiConfig, createDynamicWompiPaymentUrl, launchWompiCheckout } from '../services/wompiService';

export type CheckoutStep = 'cart' | 'customer_info' | 'order_review' | 'wompi_processing' | 'confirmed';

export const VALID_CHECKOUT_STEPS: readonly CheckoutStep[] = [
  'cart',
  'customer_info',
  'order_review',
  'wompi_processing',
  'confirmed',
];

export function sanitizeCheckoutStep(raw: unknown): CheckoutStep {
  if (typeof raw === 'string' && VALID_CHECKOUT_STEPS.includes(raw as CheckoutStep)) {
    return raw as CheckoutStep;
  }
  return 'cart';
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  contactInfo: ContactInfo;
  onUpdateQuantity: (itemKey: string, quantity: number) => void;
  onRemoveItem: (itemKey: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order) => void;
  onOpenInvoice?: (order: Order) => void;
  initialStep?: CheckoutStep;
  checkoutBanner?: string | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  contactInfo,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
  onOpenInvoice,
  initialStep,
  checkoutBanner,
}) => {
  // Flow steps: cart -> customer_info -> order_review -> payment -> confirmed
  const [step, setStep] = useState<CheckoutStep>(() => sanitizeCheckoutStep(initialStep));

  // Customer Shipping & Contact Details (Pre-filled from stored profile if available)
  const [customerName, setCustomerName] = useState(() => getStoredCustomerCheckoutProfile()?.name || '');
  const [customerEmail, setCustomerEmail] = useState(() => getStoredCustomerCheckoutProfile()?.email || '');
  const [customerPhone, setCustomerPhone] = useState(() => getStoredCustomerCheckoutProfile()?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(() => getStoredCustomerCheckoutProfile()?.address || '');
  const [customerCity, setCustomerCity] = useState(() => getStoredCustomerCheckoutProfile()?.city || 'Bogotá D.C.');
  const [deliveryZone, setDeliveryZone] = useState<'bogota' | 'nacional'>(() => getStoredCustomerCheckoutProfile()?.deliveryZone || 'bogota');
  const [customerNotes, setCustomerNotes] = useState(() => getStoredCustomerCheckoutProfile()?.notes || '');
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState('cada_30_dias');

  // Payment Selection State (Exclusive Official Wompi Gateway)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wompi');
  const [paymentReference, setPaymentReference] = useState('');

  // Wompi Gateway State
  const [wompiEnv, setWompiEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [isProcessingWompi, setIsProcessingWompi] = useState(false);
  const [wompiErrorMessage, setWompiErrorMessage] = useState<string | null>(null);

  // Order Result State
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync step and stored profile whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setStep(sanitizeCheckoutStep(initialStep));
      const p = getStoredCustomerCheckoutProfile();
      if (p) {
        if (p.name && !customerName) setCustomerName(p.name);
        if (p.email && !customerEmail) setCustomerEmail(p.email);
        if (p.phone && !customerPhone) setCustomerPhone(p.phone);
        if (p.address && !customerAddress) setCustomerAddress(p.address);
        if (p.city && (!customerCity || customerCity === 'Bogotá D.C.')) setCustomerCity(p.city);
        if (p.deliveryZone) setDeliveryZone(p.deliveryZone);
      }
      fetchWompiConfig().then((cfg) => {
        setWompiEnv(cfg.environment);
      });
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  // Helpers for items with variants
  const getItemKey = (item: CartItem) =>
    item.selectedVariant ? `${item.product.id}_${item.selectedVariant.id}` : item.product.id;

  const getItemUnitPrice = (item: CartItem) =>
    item.selectedVariant ? item.selectedVariant.price : item.product.price;

  // Dynamic Pricing & Delivery Calculations
  const feeBogota = Number(contactInfo.shippingFeeBogota ?? 6500);
  const feeNational = Number(contactInfo.shippingFeeNational ?? 13500);

  const subtotal = cart.reduce((acc, item) => acc + getItemUnitPrice(item) * item.quantity, 0);
  const discountAmount = isSubscription ? Math.round(subtotal * 0.05) : 0;
  const subtotalAfterDiscount = subtotal - discountAmount;

  const deliveryCalc = calculateDeliveryFee(
    subtotalAfterDiscount,
    deliveryZone === 'bogota' ? 'bogota' : customerCity || 'nacional',
    contactInfo
  );
  const isFreeShipping = cart.length > 0 && deliveryCalc.isFree;
  const deliveryFee = cart.length === 0 ? 0 : deliveryCalc.fee;
  const grandTotal = subtotalAfterDiscount + deliveryFee;

  const handleCityChange = (newCity: string) => {
    setCustomerCity(newCity);
    if (isDeliveryBogota(newCity)) {
      setDeliveryZone('bogota');
    } else if (newCity.trim().length > 2) {
      setDeliveryZone('nacional');
    }
  };

  const handleZoneSelect = (zone: 'bogota' | 'nacional') => {
    setDeliveryZone(zone);
    if (zone === 'bogota') {
      if (!customerCity || !isDeliveryBogota(customerCity)) {
        setCustomerCity('Bogotá D.C.');
      }
    } else {
      if (isDeliveryBogota(customerCity)) {
        setCustomerCity('');
      }
    }
  };

  // Step 2 Validation: Customer Info
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || !customerEmail.trim()) {
      alert('Por favor completa tu nombre, correo electrónico, teléfono y dirección de entrega.');
      return;
    }
    saveStoredCustomerCheckoutProfile({
      name: customerName.trim(),
      email: customerEmail.trim(),
      phone: customerPhone.trim(),
      address: customerAddress.trim(),
      city: customerCity.trim() || (deliveryZone === 'bogota' ? 'Bogotá D.C.' : 'Colombia (Nacional)'),
      deliveryZone,
      notes: customerNotes.trim(),
    });
    setStep('order_review');
  };

  // Main Payment Launcher (Triggered by "Pagar ahora" in Step 3 Order Review)
  const handleExecutePayment = async () => {
    setWompiErrorMessage(null);

    // Generate unique order number (e.g. LUN-849201)
    const uniqueOrderNumber = `LUN-${Math.floor(100000 + Math.random() * 900000)}`;

    const finalCity = customerCity.trim() || (deliveryZone === 'bogota' ? 'Bogotá D.C.' : 'Colombia (Nacional)');

    const orderBase: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: uniqueOrderNumber,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customerCity: finalCity,
      deliveryZone: deliveryZone,
      customerNotes: isSubscription
        ? `${customerNotes ? customerNotes + ' | ' : ''}Auto-Envío Programado: ${
            subscriptionPlan === 'cada_30_dias'
              ? 'Cada 30 días'
              : subscriptionPlan === 'cada_45_dias'
              ? 'Cada 45 días'
              : 'Cada 60 días'
          }`
        : customerNotes.trim(),
      items: cart.map((item) => {
        const unitPrice = getItemUnitPrice(item);
        return {
          productId: item.product.id,
          productName: item.product.name,
          variantName: item.selectedVariant?.name,
          price: unitPrice,
          quantity: item.quantity,
          total: unitPrice * item.quantity,
          imageUrl: item.product.imageUrl,
        };
      }),
      subtotal,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      deliveryFee,
      total: grandTotal,
      isSubscription,
      subscriptionPlan: isSubscription ? subscriptionPlan : undefined,
      paymentMethod,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };

    // Flow A: Wompi Gateway (Direct Official Link: Cards, PSE, Bancolombia with PRE-FILLED EXACT AMOUNT)
    if (paymentMethod === 'wompi') {
      setIsSubmitting(true);
      let dynamicWompiUrl = '';

      try {
        // Generate secure dynamic checkout URL with exact locked amount in cents
        dynamicWompiUrl = await createDynamicWompiPaymentUrl({
          orderNumber: uniqueOrderNumber,
          totalCOP: grandTotal,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          customerCity: finalCity,
        });
      } catch (err) {
        console.warn('Error generando URL dinámica de Wompi con monto predeterminado:', err);
        const safeAmount = Math.round(Math.max(1000, Number(grandTotal) || 0) * 100);
        dynamicWompiUrl = `https://checkout.wompi.co/p/?public-key=pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6&currency=COP&amount-in-cents=${safeAmount}&reference=${encodeURIComponent(uniqueOrderNumber)}`;
      }

      // Safety: NEVER send a customer to an empty $0 VPOS link
      if (!dynamicWompiUrl || !dynamicWompiUrl.startsWith('http')) {
        const safeAmount = Math.round(Math.max(1000, Number(grandTotal) || 0) * 100);
        dynamicWompiUrl = `https://checkout.wompi.co/p/?public-key=pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6&currency=COP&amount-in-cents=${safeAmount}&reference=${encodeURIComponent(uniqueOrderNumber)}`;
      }

      const wompiOrder: Order = {
        ...orderBase,
        paymentMethod: 'wompi',
        status: 'pendiente',
        wompiPaymentUrl: dynamicWompiUrl,
        wompiPaymentMethodType: 'Pasarela Oficial Wompi',
      };

      // Save customer lead
      addStoredCustomerLead({
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || undefined,
        city: finalCity,
        message: `Pedido iniciado #${uniqueOrderNumber} por ${formatCOP(grandTotal)} (${cart.length} productos) - Envío ${deliveryZone === 'bogota' ? 'Bogotá' : 'Nacional'}.`,
        status: 'nuevo',
        source: 'checkout_wompi',
        createdAt: new Date().toISOString(),
      });

      // Update state and notify store
      setCreatedOrder(wompiOrder);
      onOrderCompleted(wompiOrder);
      setIsSubmitting(false);
      setStep('confirmed');
      triggerCelebrationConfetti();

      // Open official dynamic Wompi Checkout with preloaded amount
      // On mobile browsers (Chrome Android / Safari iOS), async window.open is blocked as a popup.
      // If the popup is blocked, redirect smoothly using window.location.href so the customer lands on the pre-filled payment screen.
      try {
        const paymentWin = window.open(dynamicWompiUrl, '_blank');
        if (!paymentWin || paymentWin.closed || typeof paymentWin.closed === 'undefined') {
          // Mobile browser popup blocked: redirect directly
          window.location.href = dynamicWompiUrl;
        }
      } catch (e) {
        window.location.href = dynamicWompiUrl;
      }
      return;
    }

    // Fallback: Finalize manual order
    finalizeManualOrder(orderBase, paymentMethod);
  };

  const finalizeManualOrder = (orderBase: Order, method: PaymentMethod) => {
    setIsSubmitting(true);
    const finalOrder: Order = {
      ...orderBase,
      paymentMethod: method,
      paymentReference: paymentReference.trim() || undefined,
      status: 'pendiente',
    };

    setTimeout(() => {
      onOrderCompleted(finalOrder);
      setCreatedOrder(finalOrder);
      setStep('confirmed');
      setIsSubmitting(false);
      triggerCelebrationConfetti();
    }, 600);
  };

  const triggerCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleSendWhatsAppOrder = () => {
    if (!createdOrder) return;
    const url = buildOrderWhatsAppUrl(contactInfo.whatsapp, {
      customerName: createdOrder.customerName,
      customerPhone: createdOrder.customerPhone,
      customerAddress: createdOrder.customerAddress,
      customerCity: createdOrder.customerCity,
      items: createdOrder.items,
      total: createdOrder.total,
      deliveryFee: createdOrder.deliveryFee,
      paymentMethod: createdOrder.paymentMethod,
      paymentReference: createdOrder.paymentReference || createdOrder.wompiTransactionId,
      wompiPaymentLink: contactInfo.wompiPaymentLink,
      customerNotes: createdOrder.customerNotes,
    });
    window.open(url, '_blank');
  };

  // Ensure currentStep is strictly valid to prevent any blank screen on mobile or desktop
  const currentStep: CheckoutStep = sanitizeCheckoutStep(step);

  return (
    <div
      id="cart-drawer-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      <div
        id="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Header with Navigation Breadcrumbs */}
        <div className="p-4 sm:p-5 border-b border-[#ECE6DE] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1C2722] text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1C1F1E]">
                {currentStep === 'cart' && `Tu Carrito (${cart.reduce((a, b) => a + b.quantity, 0)})`}
                {currentStep === 'customer_info' && '1. Datos de Entrega'}
                {currentStep === 'order_review' && '2. Resumen & Pago PSE (Wompi)'}
                {currentStep === 'wompi_processing' && 'Redirigiendo a PSE...'}
                {currentStep === 'confirmed' && 'Estado de tu Compra'}
              </h2>
              <p className="text-xs text-[#7B807C]">
                {currentStep === 'cart' && 'Revisa tus productos y cantidades'}
                {currentStep === 'customer_info' && 'Indica dónde recibirás tu pedido'}
                {currentStep === 'order_review' && 'Verifica los valores y procede al pago seguro con PSE'}
                {currentStep === 'wompi_processing' && 'Pasarela oficial protegida por Bancolombia'}
                {currentStep === 'confirmed' && 'Comprobante y acceso al pago'}
              </p>
            </div>
          </div>

          <button
            id="close-cart-drawer-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#EFE9DF] hover:bg-[#E2DACD] text-[#1C1F1E] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Multi-Step Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Checkout Banner for direct purchase */}
          {checkoutBanner && currentStep !== 'confirmed' && (
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2 shadow-2xs animate-in fade-in">
              <span className="text-amber-600 font-black text-sm leading-none mt-0.5">⚡</span>
              <div className="leading-snug">
                <strong className="block font-bold text-amber-950">Compra Directa con PSE</strong>
                <span>{checkoutBanner}</span>
              </div>
            </div>
          )}
          
          {/* ========================================================
              STEP 1: CARRITO DE COMPRAS
             ======================================================== */}
          {currentStep === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-[#FAF6F0] flex items-center justify-center mx-auto text-4xl shadow-inner">
                    🐾
                  </div>
                  <h3 className="text-lg font-bold text-[#1C1F1E]">Tu carrito está vacío</h3>
                  <p className="text-sm text-[#737874] max-w-xs mx-auto">
                    Añade alimentos nutritivos, juguetes interactivos o accesorios para consentir a tu mascota.
                  </p>
                  <button
                    id="cart-empty-explore-btn"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-full bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-sm shadow-md transition-transform active:scale-95"
                  >
                    Explorar la Tienda
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Free shipping progress bar & Delivery Estimation */}
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DC] text-xs space-y-2.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-[#1C1F1E]">
                        {isFreeShipping
                          ? '🎉 ¡Tienes Envío GRATIS a Colombia!'
                          : `Faltan ${formatCOP(contactInfo.freeShippingMinimum - subtotal)} para Envío Gratis`}
                      </span>
                      <span className="text-[#B97A48]">Meta: {formatCOP(contactInfo.freeShippingMinimum)}</span>
                    </div>
                    <div className="w-full bg-[#E5DFD4] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1C2722] h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (subtotal / contactInfo.freeShippingMinimum) * 100)}%`,
                        }}
                      />
                    </div>

                    {/* Quick Delivery Zone Switcher */}
                    <div className="pt-1 border-t border-[#ECE5DC]/70">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#666B67] mb-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#B97A48]" /> Destino del Envío:
                        </span>
                        <span className="text-[#1C1F1E] font-bold">
                          {isFreeShipping ? '¡GRATIS!' : deliveryZone === 'bogota' ? `${formatCOP(feeBogota)} (Bogotá)` : `${formatCOP(feeNational)} (Nacional)`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleZoneSelect('bogota')}
                          className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-between ${
                            deliveryZone === 'bogota'
                              ? 'bg-[#1C2722] text-white border-[#1C2722] shadow-xs'
                              : 'bg-white text-[#1C1F1E] border-[#DED7CB] hover:bg-[#F2ECE1]'
                          }`}
                        >
                          <span>📍 Bogotá</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${deliveryZone === 'bogota' ? 'bg-white/20 text-white' : 'bg-[#EFE9DF] text-[#74451D]'}`}>
                            {isFreeShipping ? 'Gratis' : formatCOP(feeBogota)}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoneSelect('nacional')}
                          className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-between ${
                            deliveryZone === 'nacional'
                              ? 'bg-[#1C2722] text-white border-[#1C2722] shadow-xs'
                              : 'bg-white text-[#1C1F1E] border-[#DED7CB] hover:bg-[#F2ECE1]'
                          }`}
                        >
                          <span>🚚 Fuera de Bogotá</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${deliveryZone === 'nacional' ? 'bg-white/20 text-white' : 'bg-[#EFE9DF] text-[#74451D]'}`}>
                            {isFreeShipping ? 'Gratis' : formatCOP(feeNational)}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of items */}
                  {cart.map((item) => {
                    const itemKey = getItemKey(item);
                    const unitPrice = getItemUnitPrice(item);
                    return (
                      <div
                        key={itemKey}
                        className="flex gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE6DE] items-center justify-between"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-xl object-cover bg-white shrink-0 border border-[#ECE5DD]"
                        />

                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#1C1F1E] truncate">
                            {item.product.name}
                          </h4>
                          
                          {item.selectedVariant && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#EFE9DF] text-[#74451D] text-[10px] font-extrabold">
                              {item.selectedVariant.name}
                            </span>
                          )}

                          <div className="text-xs font-extrabold text-[#B97A48] mt-0.5">
                            {formatCOP(unitPrice)}
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              id={`decrease-qty-${itemKey}`}
                              onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-[#DDD5C9] flex items-center justify-center text-[#1C1F1E] hover:bg-[#EFE9DF]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              id={`increase-qty-${itemKey}`}
                              onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-[#DDD5C9] flex items-center justify-center text-[#1C1F1E] hover:bg-[#EFE9DF]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <button
                          id={`remove-item-${itemKey}`}
                          onClick={() => onRemoveItem(itemKey)}
                          className="text-[#999E9B] hover:text-rose-600 p-1.5 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Programar Auto-Envío Periódico */}
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#DED7CB] space-y-2.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSubscription}
                        onChange={(e) => setIsSubscription(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#1C2722] rounded cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#1C1F1E]">
                          <span>🔄 Programar Auto-Envío Mensual</span>
                          <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-md">
                            -5% EXTRA
                          </span>
                        </div>
                        <p className="text-[#686D6A] text-[11px] mt-0.5">
                          Recibe tu bulto de alimento periódicamente sin preocuparte por quedarte sin comida.
                        </p>
                      </div>
                    </label>

                    {isSubscription && (
                      <div className="pl-6 pt-1 flex items-center gap-2 text-xs">
                        <span className="text-[#787E7A] text-[11px]">Frecuencia:</span>
                        <select
                          value={subscriptionPlan}
                          onChange={(e) => setSubscriptionPlan(e.target.value)}
                          className="bg-white border border-[#DED7CB] rounded-xl px-2 py-1 text-xs font-semibold text-[#1C1F1E] outline-none"
                        >
                          <option value="cada_30_dias">Cada 30 días (Recomendado)</option>
                          <option value="cada_45_dias">Cada 45 días</option>
                          <option value="cada_60_dias">Cada 60 días</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================
              STEP 2: DATOS DEL CLIENTE Y DIRECCIÓN DE ENTREGA
             ======================================================== */}
          {currentStep === 'customer_info' && (
            <form onSubmit={handleProceedToReview} className="space-y-4">
              <div className="bg-[#FAF8F5] p-4 rounded-3xl border border-[#ECE5DD] space-y-3.5">
                <div className="flex items-center gap-2 border-b border-[#ECE5DD] pb-2">
                  <Truck className="w-4 h-4 text-[#1C2722]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1F1E]">
                    Información para la Entrega
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    id="checkout-customer-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Carolina Gómez"
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#1C1F1E]">
                    Ciudad / Municipio de Entrega *
                  </label>

                  {/* Fast Delivery Zone Picker Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerCity('Bogotá D.C.');
                        setDeliveryZone('bogota');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                        deliveryZone === 'bogota'
                          ? 'bg-[#1C2722] text-white border-[#1C2722] shadow-xs'
                          : 'bg-white text-[#1C1F1E] border-[#DED7CB] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <span className="flex items-center gap-1">📍 Bogotá D.C.</span>
                      <span className="text-[11px] opacity-90">
                        {isFreeShipping ? '¡Gratis!' : formatCOP(feeBogota)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isDeliveryBogota(customerCity)) {
                          setCustomerCity('');
                        }
                        setDeliveryZone('nacional');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                        deliveryZone === 'nacional'
                          ? 'bg-[#1C2722] text-white border-[#1C2722] shadow-xs'
                          : 'bg-white text-[#1C1F1E] border-[#DED7CB] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <span className="flex items-center gap-1">🚚 Fuera de Bogotá</span>
                      <span className="text-[11px] opacity-90">
                        {isFreeShipping ? '¡Gratis!' : formatCOP(feeNational)}
                      </span>
                    </button>
                  </div>

                  <input
                    id="checkout-customer-city"
                    type="text"
                    required
                    value={customerCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    placeholder={
                      deliveryZone === 'bogota'
                        ? 'Ej. Bogotá D.C., Chapinero, Usaquén, Suba, Kennedy...'
                        : 'Ej. Medellín, Cali, Barranquilla, Bucaramanga, Pereira, Cartagena...'
                    }
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                  />

                  {/* Active Shipping Fee Alert Badge */}
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                      isFreeShipping
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                        : deliveryZone === 'bogota'
                        ? 'bg-amber-50/90 border-amber-200/90 text-amber-950'
                        : 'bg-orange-50 border-orange-200 text-orange-950'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 shrink-0 text-[#1C1F1E]" />
                      <span>
                        {isFreeShipping
                          ? '🎉 ¡Calificas para Envío Gratis a toda Colombia!'
                          : deliveryZone === 'bogota'
                          ? 'Tarifa local dentro de Bogotá:'
                          : 'Tarifa nacional fuera de Bogotá:'}
                      </span>
                    </div>
                    <span className="font-extrabold text-sm">
                      {isFreeShipping ? 'GRATIS' : formatCOP(deliveryFee)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      id="checkout-customer-phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej. 3101234567"
                      className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      id="checkout-customer-email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Dirección de Entrega Completa (Calle, Carrera, Apto / Casa) *
                  </label>
                  <input
                    id="checkout-customer-address"
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Ej. Calle 123 # 45-67 Torre 2 Apto 301"
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Notas adicionales para el domiciliario (Opcional)
                  </label>
                  <input
                    id="checkout-customer-notes"
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Ej. Dejar en portería o timbrar fuerte"
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 rounded-2xl border border-[#DED7CB] text-xs font-bold text-[#1C1F1E] hover:bg-[#FAF8F5]"
                >
                  Volver al carrito
                </button>

                <button
                  type="submit"
                  id="submit-customer-info-btn"
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-101 cursor-pointer"
                >
                  <span className="bg-[#002D72] text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none shadow-2xs">PSE</span>
                  <span>Continuar a Pago PSE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================
              STEP 3: RESUMEN DEL PEDIDO & ELECCIÓN DE PAGO (PAGAR AHORA)
             ======================================================== */}
          {currentStep === 'order_review' && (
            <div className="space-y-4">
              {wompiErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Aviso de la pasarela:</strong>
                    <span>{wompiErrorMessage}</span>
                  </div>
                </div>
              )}

              {/* Products Summary Box */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-3xl border border-[#ECE5DD] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-2">
                  <span className="text-xs font-bold text-[#1C1F1E] uppercase tracking-wider">
                    📦 Productos Seleccionados ({cart.reduce((a, b) => a + b.quantity, 0)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="text-[11px] font-bold text-[#B97A48] hover:underline"
                  >
                    Modificar
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const itemKey = getItemKey(item);
                    const unitPrice = getItemUnitPrice(item);
                    return (
                      <div key={itemKey} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-8 h-8 rounded-lg object-cover bg-white border border-[#E5DFD4] shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="truncate block text-[#1C1F1E] font-medium">
                              {item.quantity}x {item.product.name}
                            </span>
                            {item.selectedVariant && (
                              <span className="text-[10px] text-[#B97A48] font-bold block">
                                {item.selectedVariant.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-[#1C1F1E] shrink-0">
                          {formatCOP(unitPrice * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping info preview */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-3xl border border-[#ECE5DD] space-y-1.5 text-xs">
                <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-1.5">
                  <span className="font-bold text-[#1C1F1E]">📍 Dirección de Entrega</span>
                  <button
                    type="button"
                    onClick={() => setStep('customer_info')}
                    className="text-[11px] font-bold text-[#B97A48] hover:underline"
                  >
                    Editar datos
                  </button>
                </div>
                <div className="text-[#5F6360] space-y-0.5">
                  <p>
                    <strong className="text-[#1C1F1E]">{customerName}</strong> • {customerPhone}
                  </p>
                  <p>{customerAddress}, {customerCity}</p>
                  <p className="text-[11px] text-[#7E8380]">{customerEmail}</p>
                </div>
              </div>

              {/* Payment Method Presentation (Exclusively Wompi official gateway) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1C1F1E]">
                    Método de Pago Seguro:
                  </label>
                  {wompiEnv === 'sandbox' && (
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      Modo Pruebas (Sandbox)
                    </span>
                  )}
                </div>

                {/* Exclusive Official PSE & Wompi Payment Gateway Card */}
                <div className="p-4 rounded-2xl border-2 bg-[#F2ECE1] border-[#1C2722] shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span className="text-xs sm:text-sm font-extrabold text-[#1C1F1E]">
                        Pasarela Oficial PSE / Wompi Bancolombia
                      </span>
                    </div>
                    <span className="text-[10px] font-black bg-[#1C2722] text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 100% SEGURO
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5E6360] leading-relaxed">
                    Al presionar <strong>Pago PSE</strong>, serás dirigido a la pasarela oficial y segura con el monto exacto de <strong>{formatCOP(grandTotal)}</strong> para pagar con:
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] font-bold text-[#1C1F1E]">
                    <div className="bg-white p-2 rounded-xl border-2 border-[#002D72] flex items-center gap-1.5 justify-center shadow-xs">
                      <span className="bg-[#002D72] text-white text-[9px] font-black px-1 rounded">PSE</span>
                      <span className="text-[#002D72]">Todos los bancos</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#DDD5C9] flex items-center gap-1.5 justify-center shadow-2xs">
                      <span className="text-amber-800">🟡 Bancolombia</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#DDD5C9] flex items-center gap-1.5 justify-center shadow-2xs">
                      <span>💳 Tarjetas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Final Box */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#686D6A]">
                  <span>Subtotal productos:</span>
                  <span className="font-semibold text-[#1C1F1E]">{formatCOP(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento Auto-Envío (-5%):</span>
                    <span>-{formatCOP(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#686D6A]">
                  <span>
                    Envío ({deliveryZone === 'bogota' ? 'Dentro de Bogotá' : 'Fuera de Bogotá / Nacional'}):
                  </span>
                  <span className="font-semibold text-[#1C1F1E]">
                    {deliveryFee === 0 ? <strong className="text-emerald-700">¡GRATIS!</strong> : formatCOP(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#1C1F1E] border-t border-[#ECE5DD] pt-2">
                  <span>Total a Pagar:</span>
                  <span className="text-base text-[#B97A48]">{formatCOP(grandTotal)}</span>
                </div>
              </div>

              {/* PROMINENT "PAGO PSE" ACTION BUTTON */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  id="pay-now-btn"
                  onClick={handleExecutePayment}
                  disabled={isSubmitting || isProcessingWompi}
                  className="w-full py-4 px-6 rounded-2xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-extrabold text-base shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span className="bg-[#002D72] text-white text-[11px] font-black px-2 py-0.5 rounded tracking-wider shadow-xs">
                    PSE
                  </span>
                  <span>
                    {isSubmitting ? 'Redirigiendo a PSE...' : `Pago PSE • ${formatCOP(grandTotal)}`}
                  </span>
                  <ExternalLink className="w-5 h-5 text-amber-300" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7A7F7C]">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Transacción cifrada y protegida por pasarela oficial Wompi Bancolombia</span>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('customer_info')}
                  className="text-xs font-semibold text-[#666B67] hover:text-[#1C1F1E] text-center block w-full py-1 hover:underline"
                >
                  ← Modificar datos de entrega
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP: PSE / WOMPI LOADING & PROCESSING STATE
             ======================================================== */}
          {currentStep === 'wompi_processing' && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-[#1C2722] border-t-transparent animate-spin mx-auto" />
              <h3 className="text-base font-bold text-[#1C1F1E]">Redirigiendo a Pasarela Segura PSE...</h3>
              <p className="text-xs text-[#6D726F] max-w-xs mx-auto">
                Se abrirá el Checkout oficial de Wompi Bancolombia para procesar tu pago con PSE (cualquier banco), Bancolombia o Tarjeta Débito/Crédito.
              </p>
              <button
                type="button"
                onClick={() => setStep('order_review')}
                className="text-xs text-[#B97A48] font-bold underline pt-2 block mx-auto"
              >
                Volver a la selección de pagos
              </button>
            </div>
          )}

          {/* ========================================================
              STEP 4: RESULTADO DEL PAGO & CONFIRMACIÓN DEL PEDIDO
             ======================================================== */}
          {currentStep === 'confirmed' && (
            createdOrder ? (
              <div className="space-y-4 text-center py-4 animate-in zoom-in-95">
                {/* Payment Result Badge */}
                {createdOrder.status === 'pagado' || createdOrder.wompiStatus === 'APPROVED' ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : createdOrder.wompiStatus === 'DECLINED' || createdOrder.wompiStatus === 'ERROR' ? (
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
                  <AlertCircle className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                  <Clock className="w-10 h-10" />
                </div>
              )}

              <div className="space-y-1">
                {createdOrder.status === 'pagado' || createdOrder.wompiStatus === 'APPROVED' ? (
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                    🎉 ¡PAGO APROBADO EXITOSAMENTE!
                  </span>
                ) : createdOrder.wompiStatus === 'DECLINED' ? (
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-widest">
                    ⚠️ PAGO RECHAZADO POR LA ENTIDAD
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                    ⏳ PEDIDO REGISTRADO (PENDIENTE DE PAGO)
                  </span>
                )}

                <h3 className="text-xl font-black text-[#1C1F1E]">
                  Pedido #{createdOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#6A6F6B] max-w-sm mx-auto">
                  {createdOrder.status === 'pagado'
                    ? `Tu pago fue validado oficialmente. Despacharemos a ${createdOrder.customerCity}.`
                    : `Hemos guardado los detalles para tu despacho a ${createdOrder.customerCity}.`}
                </p>
              </div>

              {/* Order summary details */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6A6F6B]">Estado del Pago:</span>
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded text-[11px] ${
                      createdOrder.status === 'pagado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : createdOrder.wompiStatus === 'DECLINED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {createdOrder.status === 'pagado'
                      ? 'APROBADO (PAGADO)'
                      : createdOrder.wompiStatus === 'DECLINED'
                      ? 'RECHAZADO'
                      : 'PENDIENTE'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#6A6F6B]">Cliente:</span>
                  <span className="font-bold text-[#1C1F1E]">{createdOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A6F6B]">Teléfono:</span>
                  <span className="font-bold text-[#1C1F1E]">{createdOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A6F6B]">Dirección:</span>
                  <span className="font-bold text-[#1C1F1E]">{createdOrder.customerAddress}</span>
                </div>
                <div className="flex justify-between border-t border-[#ECE5DD] pt-2">
                  <span className="text-[#6A6F6B]">Total:</span>
                  <span className="font-extrabold text-[#B97A48] text-sm">
                    {formatCOP(createdOrder.total)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#6A6F6B]">Método:</span>
                  <span className="font-bold text-[#1C1F1E] uppercase">
                    {createdOrder.paymentMethod === 'wompi'
                      ? `Wompi (${createdOrder.wompiPaymentMethodType || 'Pasarela'})`
                      : createdOrder.paymentMethod}
                  </span>
                </div>

                {createdOrder.wompiTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-[#6A6F6B]">ID Transacción Wompi:</span>
                    <span className="font-mono text-emerald-700 font-bold text-[11px]">
                      {createdOrder.wompiTransactionId}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {createdOrder.paymentMethod === 'wompi' && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 p-4 rounded-2xl space-y-2.5 text-left shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          1
                        </span>
                        <strong className="text-xs sm:text-sm font-bold text-amber-950">
                          Dirigido a la Pasarela Oficial PSE / Wompi
                        </strong>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Pago Seguro
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-tight">
                      Monto cargado automáticamente: <strong>{formatCOP(createdOrder.total)}</strong>. Acepta <strong>Bancolombia, PSE y Tarjetas Débito/Crédito</strong>.
                    </p>
                    <a
                      href={
                        createdOrder.wompiPaymentUrl ||
                        `https://checkout.wompi.co/p/?public-key=pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6&currency=COP&amount-in-cents=${Math.round(Math.max(1000, createdOrder.total) * 100)}&reference=${encodeURIComponent(createdOrder.orderNumber)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] active:scale-98 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                    >
                      <span className="bg-[#002D72] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">PSE</span>
                      <span>Ir a Pago PSE Ahora ({formatCOP(createdOrder.total)}) ↗</span>
                    </a>
                  </div>
                )}

                <div className="space-y-1.5">
                  {createdOrder.paymentMethod === 'wompi' && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5F6360] px-1">
                      <span className="w-5 h-5 rounded-full bg-[#1C2722] text-white flex items-center justify-center text-[10px] shrink-0">
                        2
                      </span>
                      <span>Notifica tu orden por WhatsApp:</span>
                    </div>
                  )}

                  <button
                    type="button"
                    id="send-order-whatsapp-btn"
                    onClick={handleSendWhatsAppOrder}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:scale-101 transition-transform"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Confirmación a WhatsApp ({formatPhoneNumber(contactInfo.whatsapp)})</span>
                  </button>
                </div>

                {onOpenInvoice && (
                  <button
                    type="button"
                    id="open-order-invoice-btn"
                    onClick={() => {
                      onOpenInvoice(createdOrder);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white border border-[#DED7CB] hover:bg-[#FAF8F5] text-[#1C1F1E] font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span>🧾 Ver y Descargar Comprobante / Factura Digital</span>
                  </button>
                )}

                {createdOrder.wompiStatus === 'DECLINED' && (
                  <button
                    type="button"
                    onClick={() => setStep('order_review')}
                    className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Intentar con otro medio de pago</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClearCart();
                  setStep('cart');
                  onClose();
                }}
                className="text-xs font-semibold text-[#1C1F1E] hover:underline pt-2 block mx-auto"
              >
                Seguir explorando la tienda
              </button>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-sm text-[#6A6F6B]">No se encontró información del pedido activo.</p>
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="px-4 py-2 rounded-xl bg-[#1C2722] text-white text-xs font-bold"
              >
                Volver al Carrito
              </button>
            </div>
          ))}

        </div>

        {/* Bottom Bar (Only in Step 1 Cart) */}
        {currentStep === 'cart' && cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#ECE6DE] bg-[#FAF8F5] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#686D6A]">
                <span>Subtotal productos:</span>
                <span className="font-semibold text-[#1C1F1E]">{formatCOP(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Descuento Auto-Envío (-5%):</span>
                  <span>-{formatCOP(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#686D6A]">
                <span>
                  Envío ({deliveryZone === 'bogota' ? 'Bogotá' : 'Fuera de Bogotá'}):
                </span>
                <span className="font-semibold text-[#1C1F1E]">
                  {deliveryFee === 0 ? <strong className="text-emerald-700">¡GRATIS!</strong> : formatCOP(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#1C1F1E] border-t border-[#ECE5DD] pt-2">
                <span>Total a Pagar:</span>
                <span className="text-base text-[#B97A48]">{formatCOP(grandTotal)}</span>
              </div>
            </div>

            <button
              id="proceed-to-checkout-btn"
              onClick={() => setStep('customer_info')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:scale-101 transition-all cursor-pointer"
            >
              <span>Finalizar Compra • Proceder al Pago</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
