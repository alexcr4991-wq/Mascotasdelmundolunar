import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, RefreshCw, Truck, FileText, Lock, CheckCircle2 } from 'lucide-react';
import { ContactInfo } from '../types';

export type LegalPolicyTab = 'returns' | 'shipping' | 'terms' | 'privacy';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalPolicyTab;
  contactInfo: ContactInfo;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'returns',
  contactInfo,
}) => {
  const [activeTab, setActiveTab] = useState<LegalPolicyTab>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-[#1C2722] text-white px-6 py-5 flex items-center justify-between border-b border-[#26372F]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Centro de Transparencia y Políticas Legales
                </h3>
                <p className="text-xs text-slate-300">
                  {contactInfo.storeName} • Comercio Electrónico Seguro en Colombia
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Policy Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-semibold scrollbar-none">
            <button
              onClick={() => setActiveTab('returns')}
              className={`flex items-center gap-2 px-5 py-3.5 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'returns'
                  ? 'border-[#B97A48] text-[#B97A48] bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Devoluciones y Reembolsos
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`flex items-center gap-2 px-5 py-3.5 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'shipping'
                  ? 'border-[#B97A48] text-[#B97A48] bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              Envíos y Tiempos de Entrega
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 px-5 py-3.5 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'terms'
                  ? 'border-[#B97A48] text-[#B97A48] bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Términos del Servicio
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-5 py-3.5 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'privacy'
                  ? 'border-[#B97A48] text-[#B97A48] bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4" />
              Privacidad y Datos
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto text-sm text-slate-700 space-y-5 leading-relaxed">
            {activeTab === 'returns' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <RefreshCw className="w-5 h-5 text-[#B97A48]" />
                  <h4>Política de Devoluciones, Garantías y Reembolsos</h4>
                </div>
                <p>
                  En <strong>{contactInfo.storeName}</strong> la satisfacción y seguridad de tu mascota es nuestra prioridad. De acuerdo con el Estatuto del Consumidor en Colombia (Ley 1480 de 2011), todos nuestros clientes cuentan con el derecho de retracto y garantía legal:
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2 text-amber-900">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" />
                    Plazo de Garantía y Retracto:
                  </p>
                  <p>
                    Tienes hasta <strong>30 días calendario</strong> posteriores a la entrega para solicitar cambio o reembolso por garantía de fábrica, y hasta <strong>5 días hábiles</strong> para ejercer el derecho de retracto en compras a distancia.
                  </p>
                </div>
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Condiciones para devoluciones:</h5>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>El producto debe encontrarse sin uso, en su empaque original, con todas sus etiquetas y sellos intactos.</li>
                  <li>Por razones de higiene y salubridad veterinaria, los alimentos abiertos o productos sanitarios de uso íntimo no admiten devolución una vez roto su sello de fábrica, salvo defecto comprobado de calidad.</li>
                  <li>Si el producto llega con algún defecto de transporte o daño de fábrica, el flete de retorno y reposición correrá 100% por cuenta de {contactInfo.storeName}.</li>
                </ul>
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Proceso de Reembolso:</h5>
                <p className="text-xs text-slate-600">
                  Una vez recibido e inspeccionado el producto devuelto en bodega, el reembolso total de tu dinero se realiza a través de transferencia bancaria directa (Bancolombia o reversión a través de la pasarela oficial de pagos Wompi) en un plazo no mayor a 3 a 5 días hábiles.
                </p>
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-500">
                  Para iniciar una devolución, escríbenos a nuestro canal oficial de WhatsApp al <strong>+57 {contactInfo.whatsapp}</strong> o al correo <strong>{contactInfo.email}</strong> indicando tu número de pedido.
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <h4>Política de Envíos, Despachos y Tiempos de Entrega</h4>
                </div>
                <p>
                  Despachamos pedidos a todos los municipios y ciudades de Colombia a través de las principales empresas transportadoras autorizadas (Servientrega, Interrapidísimo, Envia y Coordinadora).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <p className="font-bold text-slate-900 mb-1">Ciudades Principales</p>
                    <p className="text-slate-600">Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, Pereira: <strong>1 a 3 días hábiles</strong>.</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <p className="font-bold text-slate-900 mb-1">Resto del País y Zonas Especiales</p>
                    <p className="text-slate-600">Ciudades intermedias y trayectos especiales: <strong>2 a 5 días hábiles</strong>.</p>
                  </div>
                </div>
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Tarifas y Envíos Gratis:</h5>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li><strong>Envío Gratis:</strong> En compras iguales o superiores a <strong>$150.000 COP</strong> aplicables en cobertura estándar nacional.</li>
                  <li><strong>Tarifa Plana Estándar:</strong> Pedidos inferiores a dicho monto tienen una tarifa de envío accesible calculada transparentemente en el carrito de compras antes de pagar.</li>
                  <li><strong>Número de Guía:</strong> Tan pronto tu pedido es entregado a la transportadora, recibirás tu número de guía y enlace de rastreo en tiempo real por WhatsApp y correo electrónico.</li>
                </ul>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4>Términos y Condiciones Generales del Servicio</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bienvenido a la tienda online de <strong>{contactInfo.storeName}</strong>. Al navegar y realizar transacciones en este sitio web, aceptas los presentes términos y condiciones comerciales que rigen bajo las leyes vigentes de la República de Colombia.
                </p>
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">1. Precios y Moneda:</h5>
                <p className="text-xs text-slate-600">
                  Todos los precios de los productos están expresados en <strong>Pesos Colombianos (COP)</strong> e incluyen los impuestos de ley aplicables. Nos reservamos el derecho de modificar promociones y listas de precios sin previo aviso, respetando siempre los precios vigentes al momento de formalizar el pago.
                </p>
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">2. Medios de Pago y Despacho a Domicilio:</h5>
                <p className="text-xs text-slate-600">
                  Aceptamos pagos directos y encriptados a través de la pasarela certificada <strong>Wompi (Bancolombia)</strong> con tarjetas de crédito (Visa, Mastercard, American Express), débito por PSE (todos los bancos) y transferencias directas Bancolombia. En ningún momento {contactInfo.storeName} almacena ni tiene acceso a los números completos de tus tarjetas bancarias. <strong>Todos los despachos a domicilio se programan y envían inmediatamente tras la confirmación y aprobación exitosa del pago en la pasarela Wompi.</strong>
                </p>
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">3. Disponibilidad de Inventario:</h5>
                <p className="text-xs text-slate-600">
                  Todos los productos exhibidos en catálogo corresponden a existencias reales. En el improbable caso de agotamiento imprevisto de inventario tras realizar una orden, nos pondremos en contacto inmediato para ofrecer una alternativa equivalente o la devolución inmediata del 100% de tu dinero.
                </p>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Lock className="w-5 h-5 text-purple-600" />
                  <h4>Política de Privacidad y Tratamiento de Datos (Habeas Data)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong> y el Decreto 1377 de 2013 de la República de Colombia sobre Protección de Datos Personales, <strong>{contactInfo.storeName}</strong> garantiza la confidencialidad, seguridad y debido uso de la información que nos suministras al realizar tus compras.
                </p>
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Finalidad de la Información:</h5>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                  <li>Procesar y facturar adecuadamente los pedidos de compra realizados en la tienda.</li>
                  <li>Coordinar las entregas físicas con las empresas de logística y transporte nacional.</li>
                  <li>Enviar notificaciones de estado de la orden y números de seguimiento vía WhatsApp y correo.</li>
                  <li>Brindar soporte al cliente y resolver solicitudes de garantía.</li>
                </ul>
                <p className="text-xs text-slate-600">
                  Nunca vendemos, alquilamos ni compartimos tus datos personales con terceros para fines ajenos al cumplimiento de tu pedido. Como titular de los datos, tienes derecho en cualquier momento a conocer, actualizar, rectificar o solicitar la supresión de tu información escribiéndonos a <strong>{contactInfo.email}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Footer Contact & Identification */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">{contactInfo.storeName}</span> • NIT / Régimen Simplificado Colombia • WhatsApp: +57 {contactInfo.whatsapp}
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#1C2722] text-white font-bold hover:bg-[#2A3B34] transition-colors text-xs"
            >
              Entendido y Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
