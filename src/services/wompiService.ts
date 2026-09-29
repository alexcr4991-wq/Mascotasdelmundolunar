import { WompiGatewayConfig, WompiAdminCredentials, WompiTransactionVerification } from '../types';

declare global {
  interface Window {
    WidgetCheckout?: any;
  }
}

// Fallback public production key in case backend config is not reachable
const FALLBACK_PUBLIC_KEY = 'pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6';
export const DEFAULT_WOMPI_PAYMENT_LINK = 'https://checkout.wompi.co/l/VPOS_Qn5COa';

export async function fetchWompiConfig(): Promise<WompiGatewayConfig> {
  try {
    const res = await fetch('/api/wompi/config');
    if (!res.ok) throw new Error('No se pudo obtener la configuración de Wompi');
    const data = await res.json();
    return {
      environment: data.environment || 'production',
      publicKey: data.publicKey || FALLBACK_PUBLIC_KEY,
      isConfigured: data.isCustomConfigured || Boolean(data.publicKey),
      paymentLink: data.paymentLink || DEFAULT_WOMPI_PAYMENT_LINK,
      webhookUrl: data.webhookUrl,
      redirectUrl: data.redirectUrl,
    };
  } catch (err) {
    console.warn('Usando configuración Wompi por defecto:', err);
    return {
      environment: 'production',
      publicKey: FALLBACK_PUBLIC_KEY,
      isConfigured: true,
      paymentLink: DEFAULT_WOMPI_PAYMENT_LINK,
    };
  }
}

export async function fetchWompiAdminConfig(): Promise<WompiAdminCredentials> {
  try {
    const res = await fetch('/api/wompi/admin-config');
    if (!res.ok) throw new Error('Error al consultar configuración');
    const data = await res.json();
    return {
      environment: data.environment || 'production',
      publicKey: data.publicKey || FALLBACK_PUBLIC_KEY,
      privateKey: data.privateKey || '',
      integritySecret: data.integritySecret || '',
      eventsSecret: data.eventsSecret || '',
      hasPrivateKey: Boolean(data.hasPrivateKey),
      hasIntegritySecret: Boolean(data.hasIntegritySecret),
      hasEventsSecret: Boolean(data.hasEventsSecret),
      paymentLink: data.paymentLink || DEFAULT_WOMPI_PAYMENT_LINK,
      webhookUrl: data.webhookUrl,
      redirectUrl: data.redirectUrl,
    };
  } catch (err) {
    return {
      environment: 'production',
      publicKey: FALLBACK_PUBLIC_KEY,
      privateKey: '',
      integritySecret: '',
      eventsSecret: '',
      paymentLink: DEFAULT_WOMPI_PAYMENT_LINK,
    };
  }
}

export async function saveWompiAdminConfig(config: Partial<WompiAdminCredentials>): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/wompi/admin-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al guardar la configuración');
    }

    const data = await res.json();
    return { success: true, message: data.message || 'Configuración guardada correctamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error de conexión guardando configuración.' };
  }
}

export async function testWompiConnection(credentials?: {
  environment?: 'sandbox' | 'production';
  publicKey?: string;
  privateKey?: string;
}): Promise<{
  success: boolean;
  message: string;
  warning?: boolean;
  merchant?: string;
  statusCode?: number;
  diagnostic?: string[];
}> {
  try {
    const res = await fetch('/api/wompi/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials || {}),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: `Error al probar conexión: ${err.message}`,
    };
  }
}

export async function generateWompiSignature(params: {
  reference: string;
  amountInCents: number;
  currency?: string;
}): Promise<{ signature: string | null; hasIntegritySecret?: boolean; publicKey: string; environment: string }> {
  const res = await fetch('/api/wompi/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: params.reference,
      amountInCents: params.amountInCents,
      currency: params.currency || 'COP',
    }),
  });

  if (!res.ok) {
    throw new Error('Error generando la firma de integridad en el servidor.');
  }

  return await res.json();
}

export async function verifyWompiTransactionStatus(transactionId: string): Promise<WompiTransactionVerification> {
  try {
    const res = await fetch(`/api/wompi/transaction/${transactionId}`);
    if (!res.ok) {
      return {
        success: false,
        status: 'UNKNOWN',
        message: 'No se pudo verificar la transacción con Wompi.',
      };
    }

    const data = await res.json();
    const tx = data?.transaction;

    return {
      success: true,
      status: tx?.status || 'PENDING',
      transactionId: tx?.id,
      reference: tx?.reference,
      amountInCents: tx?.amountInCents,
      paymentMethodType: tx?.paymentMethodType,
      message:
        tx?.status === 'APPROVED'
          ? '¡Pago Aprobado exitosamente!'
          : tx?.status === 'DECLINED'
          ? 'El pago fue rechazado por la entidad bancaria.'
          : tx?.status === 'PENDING'
          ? 'El pago está en proceso de verificación (PSE / Tarjetas).'
          : 'Transacción procesada.',
    };
  } catch (err: any) {
    console.error('Error al verificar la transacción con el backend:', err);
    return {
      success: false,
      status: 'ERROR',
      message: err.message || 'Error de conexión verificando el pago.',
    };
  }
}

export async function confirmOrderPaymentWithServer(params: {
  orderNumber: string;
  transactionId?: string;
}): Promise<{ isPaid: boolean; status: string; message?: string }> {
  try {
    const res = await fetch('/api/orders/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      return { isPaid: false, status: 'PENDING', message: 'Verificando con pasarela...' };
    }

    const data = await res.json();
    return {
      isPaid: Boolean(data.isPaid),
      status: data.status || 'PENDING',
      message: data.isPaid ? 'Pago confirmado oficialmente por Wompi.' : data.message,
    };
  } catch (err) {
    console.error('Error confirmando pago en servidor:', err);
    return { isPaid: false, status: 'PENDING' };
  }
}

// Loads Wompi Widget dynamically if not already on window
export function ensureWompiWidgetLoaded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.WidgetCheckout) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="checkout.wompi.co/widget.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      setTimeout(() => resolve(Boolean(window.WidgetCheckout)), 2000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('No se pudo cargar el script del Widget de Wompi.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

const COLOMBIA_CITY_REGION_MAP: Record<string, string> = {
  bogota: 'Bogotá D.C.',
  medellin: 'Antioquia',
  cali: 'Valle del Cauca',
  barranquilla: 'Atlántico',
  cartagena: 'Bolívar',
  bucaramanga: 'Santander',
  pereira: 'Risaralda',
  manizales: 'Caldas',
  armenia: 'Quindío',
  cucuta: 'Norte de Santander',
  ibague: 'Tolima',
  santamarta: 'Magdalena',
  villavicencio: 'Meta',
  pasto: 'Nariño',
  monteria: 'Córdoba',
  neiva: 'Huila',
  popayan: 'Cauca',
  valledupar: 'Cesar',
  tunja: 'Boyacá',
  sincelejo: 'Sucre',
  florencia: 'Caquetá',
  riohacha: 'La Guajira',
  quibdo: 'Chocó',
  soacha: 'Cundinamarca',
  bello: 'Antioquia',
  itagui: 'Antioquia',
  envigado: 'Antioquia',
  chia: 'Cundinamarca',
  zipaquira: 'Cundinamarca',
  girardot: 'Cundinamarca',
  facatativa: 'Cundinamarca',
  fusagasuga: 'Cundinamarca',
  mosquera: 'Cundinamarca',
  madrid: 'Cundinamarca',
  funza: 'Cundinamarca',
  soledad: 'Atlántico',
  dosquebradas: 'Risaralda',
  floridablanca: 'Santander',
  giron: 'Santander',
  piedecuesta: 'Santander',
  palmira: 'Valle del Cauca',
  tulua: 'Valle del Cauca',
  buenaventura: 'Valle del Cauca',
  yumbo: 'Valle del Cauca',
  buga: 'Valle del Cauca',
  cartago: 'Valle del Cauca',
  sogamoso: 'Boyacá',
  duitama: 'Boyacá',
  apartado: 'Antioquia',
  rionegro: 'Antioquia',
  turbo: 'Antioquia',
  caucasia: 'Antioquia',
  sabaneta: 'Antioquia',
};

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

export async function createDynamicWompiPaymentUrl(data: {
  orderNumber: string;
  totalCOP: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
}): Promise<string> {
  const safeTotal = Math.max(1000, Number(data.totalCOP) || 0);
  const amountInCents = Math.round(safeTotal * 100);

  // 1. Primary path: Call backend to create official locked Wompi payment link via Wompi API
  try {
    const res = await fetch('/api/wompi/create-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: data.orderNumber,
        amountInCents,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        customerCity: data.customerCity,
        originUrl: typeof window !== 'undefined' ? window.location.origin : '',
      }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result?.url && typeof result.url === 'string') {
        console.log(`[WOMPI URL GENERATED] Link seguro con valor predeterminado (${amountInCents} centavos):`, result.url);
        return result.url;
      }
    }
  } catch (backendErr) {
    console.warn('Backend payment link error, generando URL de checkout firmada con monto predeterminado:', backendErr);
  }

  // 2. Client-side fallback: generate signed Web Checkout URL (/p/) with explicit amount-in-cents
  let pubKey = FALLBACK_PUBLIC_KEY;
  let signature: string | null = null;
  try {
    const sigData = await generateWompiSignature({
      reference: data.orderNumber,
      amountInCents,
      currency: 'COP',
    });
    pubKey = sigData.publicKey || FALLBACK_PUBLIC_KEY;
    signature = sigData.signature;
  } catch (e) {
    console.warn('Signature generation fallback:', e);
  }

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = encodeURIComponent(`${appOrigin}?wompi_ref=${encodeURIComponent(data.orderNumber)}`);

  // Clean phone number (strip non-digits, fallback to 10 digits)
  const rawPhone = (data.customerPhone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.length >= 7 ? rawPhone : '3000000000';

  // Customer data parameters
  const emailParam = data.customerEmail ? `&customer-data:email=${encodeURIComponent(data.customerEmail.trim())}` : '';
  const nameParam = data.customerName ? `&customer-data:full-name=${encodeURIComponent(data.customerName.trim())}` : '';
  const phoneParam = `&customer-data:phone-number=${encodeURIComponent(cleanPhone)}`;

  // Include signature ONLY if an authentic integrity secret is configured on the backend
  const signatureParam = signature ? `&signature:integrity=${encodeURIComponent(signature)}` : '';

  // Crucial: Web Checkout URL ALWAYS includes amount-in-cents so the customer NEVER types $0!
  return `https://checkout.wompi.co/p/?public-key=${pubKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${encodeURIComponent(data.orderNumber)}${signatureParam}&redirect-url=${redirectUrl}${emailParam}${nameParam}${phoneParam}`;
}

export interface WompiCheckoutData {
  orderNumber: string;
  totalCOP: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  onResult: (result: {
    status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING' | 'CLOSED';
    transactionId?: string;
    reference: string;
    paymentMethodType?: string;
  }) => void;
  onError: (errorMsg: string) => void;
}

export async function launchWompiCheckout(data: WompiCheckoutData): Promise<void> {
  try {
    const isLoaded = await ensureWompiWidgetLoaded();
    const amountInCents = Math.round(data.totalCOP * 100);

    // 1. Get backend signature and public key
    const sigData = await generateWompiSignature({
      reference: data.orderNumber,
      amountInCents,
      currency: 'COP',
    });

    if (!window.WidgetCheckout) {
      // Fallback redirection to Wompi Web Checkout if widget script is restricted in iframe/network
      const env = 'checkout.wompi.co';
      const redirectUrl = encodeURIComponent(window.location.origin + '?wompi_ref=' + data.orderNumber);
      const signatureParam = sigData.signature ? `&signature:integrity=${encodeURIComponent(sigData.signature)}` : '';
      const wompiWebUrl = `https://${env}/p/?public-key=${sigData.publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${data.orderNumber}${signatureParam}&redirect-url=${redirectUrl}&customer-data:email=${encodeURIComponent(data.customerEmail)}&customer-data:full-name=${encodeURIComponent(data.customerName)}&customer-data:phone-number=${encodeURIComponent(data.customerPhone)}&shipping-address:address-line-1=${encodeURIComponent(data.customerAddress)}&shipping-address:city=${encodeURIComponent(data.customerCity)}&shipping-address:country=CO`;
      
      window.open(wompiWebUrl, '_blank');
      data.onResult({
        status: 'PENDING',
        reference: data.orderNumber,
      });
      return;
    }

    // 2. Instantiate and launch WidgetCheckout
    const widgetConfig: any = {
      currency: 'COP',
      amountInCents: amountInCents,
      reference: data.orderNumber,
      publicKey: sigData.publicKey,
      redirectUrl: window.location.origin + '?wompi_ref=' + data.orderNumber,
      customerData: {
        email: data.customerEmail,
        fullName: data.customerName,
        phoneNumber: data.customerPhone,
        phoneNumberPrefix: '+57',
        legalId: '1000000000',
        legalIdType: 'CC',
      },
      shippingAddress: {
        addressLine1: data.customerAddress,
        city: data.customerCity,
        phoneNumber: data.customerPhone,
        region: 'Colombia',
        country: 'CO',
      },
    };

    if (sigData.signature) {
      widgetConfig.signature = {
        integrity: sigData.signature,
      };
    }

    const checkout = new window.WidgetCheckout(widgetConfig);

    checkout.open((result: any) => {
      const transaction = result?.transaction;
      if (transaction) {
        data.onResult({
          status: transaction.status,
          transactionId: transaction.id,
          reference: transaction.reference || data.orderNumber,
          paymentMethodType: transaction.payment_method_type,
        });
      } else {
        data.onResult({
          status: 'CLOSED',
          reference: data.orderNumber,
        });
      }
    });
  } catch (err: any) {
    console.error('Error lanzando Wompi Checkout:', err);
    data.onError(err.message || 'Error iniciando la pasarela de pagos.');
  }
}
