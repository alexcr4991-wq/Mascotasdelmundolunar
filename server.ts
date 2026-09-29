import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Server-side Gemini AI lazy initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

const app = express();
const PORT = 3000;

// Security & trust headers for search engines and Google Ads scanners
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Google Search Console verification endpoints (instant response)
app.get(['/googledc2c0d48d4a48cd0.html', '/catalogo/googledc2c0d48d4a48cd0.html'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send('google-site-verification: googledc2c0d48d4a48cd0.html');
});

// Generic Google Search Console verification files handler
app.get(['/google:hash.html', '/catalogo/google:hash.html'], (req, res) => {
  const code = req.params.hash;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`google-site-verification: google${code}.html`);
});

// Body parsers
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Persistent server config file path
const SERVER_CONFIG_PATH = path.join(process.cwd(), 'wompi-server-config.json');

// Default Production public key for Colombian merchants using Wompi
const DEFAULT_PRODUCTION_PUBLIC_KEY = 'pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6';

// Dynamic configuration state (loaded from disk if exists, then env vars)
let diskConfig: any = {};
try {
  if (fs.existsSync(SERVER_CONFIG_PATH)) {
    diskConfig = JSON.parse(fs.readFileSync(SERVER_CONFIG_PATH, 'utf-8'));
  }
} catch (e) {
  console.warn('No se pudo leer wompi-server-config.json:', e);
}

const dynamicWompiConfig = {
  environment: (diskConfig.environment || (process.env.WOMPI_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production')) as 'sandbox' | 'production',
  publicKey: (diskConfig.publicKey || process.env.WOMPI_PUBLIC_KEY || DEFAULT_PRODUCTION_PUBLIC_KEY).trim(),
  privateKey: (diskConfig.privateKey || process.env.WOMPI_PRIVATE_KEY || '').trim(),
  integritySecret: (diskConfig.integritySecret || process.env.WOMPI_INTEGRITY_SECRET || '').trim(),
  eventsSecret: (diskConfig.eventsSecret || process.env.WOMPI_EVENTS_SECRET || '').trim(),
  paymentLink: (diskConfig.paymentLink || process.env.WOMPI_PAYMENT_LINK || 'https://checkout.wompi.co/l/VPOS_Qn5COa').trim(),
};

function saveConfigToDisk(): void {
  try {
    fs.writeFileSync(SERVER_CONFIG_PATH, JSON.stringify(dynamicWompiConfig, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error guardando wompi-server-config.json en disco:', err);
  }
}

// Ensure config file is saved on disk with production mode and public key enabled
saveConfigToDisk();

function getWompiEnvironment(): 'sandbox' | 'production' {
  return dynamicWompiConfig.environment;
}

function getWompiPublicKey(): string {
  if (dynamicWompiConfig.publicKey && dynamicWompiConfig.publicKey.trim() !== '') {
    return dynamicWompiConfig.publicKey.trim();
  }
  return DEFAULT_PRODUCTION_PUBLIC_KEY;
}

function getWompiPrivateKey(): string {
  return dynamicWompiConfig.privateKey;
}

function getWompiIntegritySecret(): string {
  if (dynamicWompiConfig.integritySecret && dynamicWompiConfig.integritySecret.trim() !== '') {
    return dynamicWompiConfig.integritySecret.trim();
  }
  return '';
}

function getWompiEventsSecret(): string {
  return dynamicWompiConfig.eventsSecret || dynamicWompiConfig.integritySecret || '';
}

// In-memory confirmed transactions storage (complements client-side persistent storage and ensures idempotency)
interface ConfirmedTransaction {
  id: string;
  reference: string;
  amountInCents: number;
  currency: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  paymentMethodType?: string;
  customerEmail?: string;
  updatedAt: string;
}

const verifiedTransactionsMap = new Map<string, ConfirmedTransaction>();

// ==========================================
// SEO Sitemap & Robots.txt for Search Engines
// ==========================================
// Dynamic fallback for any Google verification HTML file requested by Search Console or Merchant Center
app.get('/google*.html', (req: Request, res: Response) => {
  const fileName = req.path.replace(/^\//, '');
  const token = fileName.replace(/^google/, '').replace(/\.html$/, '');
  res.header('Content-Type', 'text/html; charset=utf-8');
  res.send(`google-site-verification: ${token}`);
});

app.get('/robots.txt', (req: Request, res: Response) => {
  const robots = `User-agent: *
Allow: /
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let products: any[] = [];
    try {
      if (fs.existsSync(PRODUCTS_DB_FILE)) {
        products = JSON.parse(fs.readFileSync(PRODUCTS_DB_FILE, 'utf-8'));
      }
    } catch {}

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/calculadora</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/nosotros</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contacto</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

    products.forEach((p) => {
      xml += `
  <url>
    <loc>${baseUrl}/producto/${p.id}</loc>
    <lastmod>${new Date(p.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Error generando sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});


// ==========================================
// 2. Wompi Public Configuration Endpoint
// ==========================================
app.get('/api/wompi/config', (req: Request, res: Response) => {
  const env = getWompiEnvironment();
  const publicKey = getWompiPublicKey();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;

  res.json({
    environment: env,
    publicKey: publicKey,
    isCustomConfigured: Boolean(dynamicWompiConfig.publicKey && dynamicWompiConfig.publicKey.trim() !== ''),
    paymentLink: dynamicWompiConfig.paymentLink || 'https://checkout.wompi.co/l/VPOS_Qn5COa',
    webhookUrl: `${appUrl}/api/wompi/webhook`,
    redirectUrl: `${appUrl}?wompi_return=true`,
    allowedPaymentMethods: ['CARD', 'NEQUI', 'PSE', 'BANCOLOMBIA_TRANSFER'],
  });
});

// ==========================================
// 2.1 Wompi Admin Configuration Endpoints
// ==========================================
app.get('/api/wompi/admin-config', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;

  res.json({
    environment: dynamicWompiConfig.environment,
    publicKey: dynamicWompiConfig.publicKey,
    privateKey: dynamicWompiConfig.privateKey ? dynamicWompiConfig.privateKey : '',
    hasPrivateKey: Boolean(dynamicWompiConfig.privateKey),
    integritySecret: dynamicWompiConfig.integritySecret ? dynamicWompiConfig.integritySecret : '',
    hasIntegritySecret: Boolean(dynamicWompiConfig.integritySecret),
    eventsSecret: dynamicWompiConfig.eventsSecret ? dynamicWompiConfig.eventsSecret : '',
    hasEventsSecret: Boolean(dynamicWompiConfig.eventsSecret),
    paymentLink: dynamicWompiConfig.paymentLink,
    webhookUrl: `${appUrl}/api/wompi/webhook`,
    redirectUrl: `${appUrl}?wompi_return=true`,
  });
});

app.post('/api/wompi/admin-config', (req: Request, res: Response) => {
  try {
    const {
      environment,
      publicKey,
      privateKey,
      integritySecret,
      eventsSecret,
      paymentLink,
    } = req.body;

    if (environment === 'production' || environment === 'sandbox') {
      dynamicWompiConfig.environment = environment;
    }

    if (typeof publicKey === 'string') {
      dynamicWompiConfig.publicKey = publicKey.trim();
    }
    if (typeof privateKey === 'string') {
      dynamicWompiConfig.privateKey = privateKey.trim();
    }
    if (typeof integritySecret === 'string') {
      dynamicWompiConfig.integritySecret = integritySecret.trim();
    }
    if (typeof eventsSecret === 'string') {
      dynamicWompiConfig.eventsSecret = eventsSecret.trim();
    }
    if (typeof paymentLink === 'string' && paymentLink.trim()) {
      dynamicWompiConfig.paymentLink = paymentLink.trim();
    }

    saveConfigToDisk();

    res.json({
      success: true,
      message: 'Configuración de Wompi actualizada exitosamente en el servidor.',
      config: {
        environment: dynamicWompiConfig.environment,
        publicKey: dynamicWompiConfig.publicKey,
        hasPrivateKey: Boolean(dynamicWompiConfig.privateKey),
        hasIntegritySecret: Boolean(dynamicWompiConfig.integritySecret),
        hasEventsSecret: Boolean(dynamicWompiConfig.eventsSecret),
        paymentLink: dynamicWompiConfig.paymentLink,
      },
    });
  } catch (err: any) {
    console.error('Error actualizando configuración Wompi:', err);
    res.status(500).json({ error: 'Error al actualizar la configuración de Wompi.' });
  }
});

// Endpoint to test merchant credentials with Wompi API
app.post('/api/wompi/test-connection', async (req: Request, res: Response) => {
  try {
    const env = (req.body?.environment || dynamicWompiConfig.environment) as 'sandbox' | 'production';
    const pubKey = (req.body?.publicKey || getWompiPublicKey()).trim();
    const prvKey = (req.body?.privateKey || getWompiPrivateKey()).trim();
    const wompiApiBase = env === 'production' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';

    if (!pubKey) {
      res.json({
        success: false,
        warning: true,
        message: 'No has ingresado ninguna llave pública para verificar.',
      });
      return;
    }

    // Verify key format
    const isProdKey = pubKey.startsWith('pub_prod_');
    const isTestKey = pubKey.startsWith('pub_test_');

    if (env === 'production' && !isProdKey) {
      res.json({
        success: false,
        warning: true,
        message: `El ambiente seleccionado es PRODUCCIÓN pero la llave pública ingresada no comienza con "pub_prod_".`,
        details: { environment: env, publicKey: pubKey },
      });
      return;
    }

    if (env === 'sandbox' && !isTestKey) {
      res.json({
        success: false,
        warning: true,
        message: `El ambiente seleccionado es SANDBOX pero la llave pública ingresada no comienza con "pub_test_".`,
        details: { environment: env, publicKey: pubKey },
      });
      return;
    }

    // Call Wompi merchant public check with complete headers
    try {
      const response = await fetch(`${wompiApiBase}/merchants/${encodeURIComponent(pubKey)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache',
        },
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { rawText: responseText };
      }

      if (response.ok && data?.data) {
        res.json({
          success: true,
          message: `✅ Conexión exitosa con Wompi ${env.toUpperCase()}. Comercio: "${data?.data?.name || 'Comercio Verificado'}"`,
          merchant: data?.data?.name,
          environment: env,
          currency: data?.data?.currency || 'COP',
          acceptedPaymentMethods: data?.data?.accepted_payment_methods || [],
        });
        return;
      }

      if (response.status === 403) {
        res.json({
          success: false,
          statusCode: 403,
          message: `Wompi respondió con estado 403 (No autorizado / Inactivo).`,
          error: data,
          diagnostic: [
            '1. Tu cuenta en Wompi puede estar todavía en proceso de validación o activación de documentos por parte del equipo de Bancolombia / Wompi.',
            '2. Ingresa a https://dashboard.wompi.co y verifica que en la esquina superior diga "Producción" y no tengas avisos pendientes de verificación de cuenta bancaria.',
            '3. Asegúrate de haber copiado la Llave Pública completa (debe iniciar exactamente con "pub_prod_").',
            '4. Nota: Si tu cuenta aún no está activa en Producción, puedes activar "Modo Sandbox" (pub_test_...) para realizar pruebas mientras Wompi aprueba tu cuenta real.',
          ],
          environment: env,
        });
        return;
      }

      res.json({
        success: false,
        statusCode: response.status,
        message: `Wompi respondió con estado ${response.status}. ${data?.error?.reason || data?.error?.type || 'Verifica que la llave sea correcta.'}`,
        error: data,
        environment: env,
      });
    } catch (fetchErr: any) {
      res.json({
        success: false,
        message: `No se pudo contactar a la API de Wompi (${fetchErr.message}). Verifica tu conexión.`,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Error al probar conexión con Wompi.' });
  }
});

// ==========================================
// 3. Signature & Integrity Generator Endpoint
// Generates the SHA-256 integrity hash required by Wompi
// Formula: SHA256(reference + amountInCents + currency + integritySecret)
// ==========================================
app.post('/api/wompi/signature', (req: Request, res: Response) => {
  try {
    const { reference, amountInCents, currency = 'COP', expirationTime } = req.body;

    if (!reference || typeof amountInCents !== 'number') {
      res.status(400).json({ error: 'Parámetros inválidos: reference y amountInCents son obligatorios.' });
      return;
    }

    const integritySecret = getWompiIntegritySecret();
    const hasIntegritySecret = Boolean(integritySecret && integritySecret.length > 0);
    
    let signature: string | null = null;
    if (hasIntegritySecret) {
      // Build concatenated string as specified by Wompi docs: reference + amountInCents + currency + (expirationTime) + integritySecret
      let stringToHash = `${reference}${amountInCents}${currency}`;
      if (expirationTime) {
        stringToHash += expirationTime;
      }
      stringToHash += integritySecret;
      signature = crypto.createHash('sha256').update(stringToHash).digest('hex');
    }

    res.json({
      success: true,
      hasIntegritySecret,
      reference,
      amountInCents,
      currency,
      signature,
      publicKey: getWompiPublicKey(),
      environment: getWompiEnvironment(),
    });
  } catch (err: any) {
    console.error('Error generating Wompi integrity signature:', err);
    res.status(500).json({ error: 'Error al generar la firma de integridad de Wompi.' });
  }
});

// ==========================================
// 3.5 Create Pre-Determined Wompi Payment Link
// Creates an official Wompi link with locked, pre-determined amount so customers never type $0
// ==========================================
app.post('/api/wompi/create-payment-link', async (req: Request, res: Response) => {
  try {
    const {
      reference,
      amountInCents,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      originUrl,
    } = req.body;

    const safeAmount = typeof amountInCents === 'number' && !isNaN(amountInCents) && amountInCents > 0
      ? Math.round(amountInCents)
      : 0;

    if (!reference || safeAmount <= 0) {
      res.status(400).json({ error: 'Referencia y monto en centavos válidos son obligatorios.' });
      return;
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseAppUrl = originUrl || process.env.APP_URL || `${protocol}://${host}`;
    const redirectUrl = `${baseAppUrl}${baseAppUrl.includes('?') ? '&' : '?'}wompi_ref=${encodeURIComponent(reference)}`;

    const env = getWompiEnvironment();
    const privateKey = getWompiPrivateKey();
    const publicKey = getWompiPublicKey();
    const integritySecret = getWompiIntegritySecret();

    // 1. Primary Strategy: Create official Wompi payment link via Wompi API with private key
    // This stores amount_in_cents directly on Wompi servers. The customer sees the exact amount pre-filled!
    if (privateKey) {
      const wompiApiBase = env === 'production' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';
      try {
        const clientDescParts: string[] = [];
        if (customerName) clientDescParts.push(String(customerName).trim());
        if (customerPhone) clientDescParts.push(String(customerPhone).trim());
        if (customerCity) clientDescParts.push(String(customerCity).trim());
        const descSuffix = clientDescParts.length > 0 ? ` (${clientDescParts.join(' - ')})` : '';

        const apiPayload = {
          name: `Pedido #${reference}`,
          description: `Lunary World Pets - Pedido #${reference}${descSuffix}`.substring(0, 240),
          single_use: true,
          collect_shipping: false,
          currency: 'COP',
          amount_in_cents: safeAmount,
          sku: reference.substring(0, 36),
          redirect_url: redirectUrl,
        };

        const apiRes = await fetch(`${wompiApiBase}/payment_links`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${privateKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiPayload),
        });

        if (apiRes.ok) {
          const apiData: any = await apiRes.json();
          const linkId = apiData?.data?.id;
          if (linkId) {
            const wompiLinkUrl = `https://checkout.wompi.co/l/${linkId}`;
            console.log(`[WOMPI LINK CREATED] #${reference} -> ${wompiLinkUrl} (${safeAmount} cents)`);
            res.json({
              success: true,
              type: 'payment_link',
              url: wompiLinkUrl,
              id: linkId,
              reference,
              amountInCents: safeAmount,
            });
            return;
          }
        } else {
          const errBody = await apiRes.text();
          console.warn(`[WOMPI API WARNING] Error creando link nativo (${apiRes.status}):`, errBody);
        }
      } catch (apiErr) {
        console.warn('[WOMPI API ERROR] Excepción creando payment_link:', apiErr);
      }
    }

    // 2. Secondary Strategy: Generate Web Checkout URL (/p/) with integrity signature & amount-in-cents
    let signature: string | null = null;
    if (integritySecret) {
      const stringToHash = `${reference}${safeAmount}COP${integritySecret}`;
      signature = crypto.createHash('sha256').update(stringToHash).digest('hex');
    }

    const cleanPhone = (customerPhone ? String(customerPhone) : '').replace(/\D/g, '') || '3000000000';
    const emailParam = customerEmail ? `&customer-data:email=${encodeURIComponent(String(customerEmail).trim())}` : '';
    const nameParam = customerName ? `&customer-data:full-name=${encodeURIComponent(String(customerName).trim())}` : '';
    const phoneParam = `&customer-data:phone-number=${encodeURIComponent(cleanPhone)}`;
    const signatureParam = signature ? `&signature:integrity=${encodeURIComponent(signature)}` : '';

    const webCheckoutUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${safeAmount}&reference=${encodeURIComponent(reference)}${signatureParam}&redirect-url=${encodeURIComponent(redirectUrl)}${emailParam}${nameParam}${phoneParam}`;

    res.json({
      success: true,
      type: 'web_checkout',
      url: webCheckoutUrl,
      reference,
      amountInCents: safeAmount,
    });
  } catch (err: any) {
    console.error('Error in /api/wompi/create-payment-link:', err);
    res.status(500).json({ error: 'Error al generar enlace de pago con monto predeterminado.' });
  }
});

// ==========================================
// 4. Verify Transaction Status with Wompi API
// Queries Wompi servers directly using transaction ID or order reference
// ==========================================
app.get('/api/wompi/transaction/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: 'ID de transacción o Referencia requerido.' });
    return;
  }

  // Check in-memory verified cache first (by ID or reference)
  if (verifiedTransactionsMap.has(id)) {
    const cached = verifiedTransactionsMap.get(id)!;
    res.json({
      success: true,
      transaction: cached,
      source: 'verified_cache',
    });
    return;
  }

  for (const [_, tx] of verifiedTransactionsMap.entries()) {
    if (tx.reference === id) {
      res.json({
        success: true,
        transaction: tx,
        source: 'verified_cache_reference',
      });
      return;
    }
  }

  const env = getWompiEnvironment();
  const baseUrl = env === 'production' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';
  const privateKey = getWompiPrivateKey();
  const publicKey = getWompiPublicKey();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (privateKey) {
      headers['Authorization'] = `Bearer ${privateKey}`;
    } else if (publicKey) {
      headers['Authorization'] = `Bearer ${publicKey}`;
    }

    // If param looks like transaction ID or general ID query directly
    let wompiRes = await fetch(`${baseUrl}/transactions/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers,
    });

    if (!wompiRes.ok && id.startsWith('LUN-')) {
      // If reference was passed instead of transaction ID, try querying transactions by reference if supported
      wompiRes = await fetch(`${baseUrl}/transactions?reference=${encodeURIComponent(id)}`, {
        method: 'GET',
        headers,
      });
    }

    if (!wompiRes.ok) {
      // In sandbox mode or if not found on remote, if transaction was simulated
      if (id.startsWith('mock_') || id.startsWith('sim_')) {
        res.json({
          success: true,
          transaction: {
            id,
            reference: 'LUN-MOCK',
            amountInCents: 10000000,
            currency: 'COP',
            status: 'APPROVED',
            paymentMethodType: 'NEQUI',
            updatedAt: new Date().toISOString(),
          },
          source: 'sandbox_simulation',
        });
        return;
      }

      res.status(wompiRes.status).json({
        success: false,
        error: `Wompi API error (${wompiRes.status}): ${wompiRes.statusText}`,
      });
      return;
    }

    const data: any = await wompiRes.json();
    let tx = data?.data;

    if (Array.isArray(tx)) {
      tx = tx[0];
    }

    if (!tx) {
      res.status(404).json({ success: false, error: 'Transacción no encontrada en Wompi.' });
      return;
    }

    const verifiedTx: ConfirmedTransaction = {
      id: tx.id,
      reference: tx.reference,
      amountInCents: tx.amount_in_cents,
      currency: tx.currency || 'COP',
      status: tx.status, // 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR', 'PENDING'
      paymentMethodType: tx.payment_method_type,
      customerEmail: tx.customer_email,
      updatedAt: tx.created_at || new Date().toISOString(),
    };

    verifiedTransactionsMap.set(tx.id, verifiedTx);

    res.json({
      success: true,
      transaction: verifiedTx,
      source: 'wompi_api',
    });
  } catch (err: any) {
    console.error(`Error querying transaction ${id} from Wompi:`, err);
    res.status(500).json({ error: 'Error al consultar la pasarela de pagos Wompi.' });
  }
});

// ==========================================
// 5. Wompi Webhook Endpoint
// Receives asynchronous payment confirmation events from Wompi
// ==========================================
app.post('/api/wompi/webhook', (req: Request, res: Response) => {
  try {
    const body = req.body;
    console.log('[WOMPI WEBHOOK RECEIVED]', JSON.stringify(body, null, 2));

    const { event, data, signature, timestamp } = body || {};

    if (!event || !data?.transaction) {
      res.status(400).json({ error: 'Formato de evento de Webhook Wompi inválido.' });
      return;
    }

    const tx = data.transaction;
    const eventsSecret = getWompiEventsSecret();

    // Verify webhook event checksum if signature is provided
    if (signature && signature.checksum && signature.properties) {
      const properties: string[] = signature.properties;
      let values = '';
      for (const prop of properties) {
        // Properties are in dot notation like 'transaction.id', 'transaction.status', 'transaction.amount_in_cents'
        const parts = prop.split('.');
        let val: any = data;
        for (const part of parts) {
          val = val?.[part];
        }
        values += (val !== undefined && val !== null ? String(val) : '');
      }
      values += String(timestamp || '');
      values += eventsSecret;

      const calculatedChecksum = crypto.createHash('sha256').update(values).digest('hex');

      if (calculatedChecksum.toLowerCase() !== signature.checksum.toLowerCase()) {
        console.warn('[WOMPI WEBHOOK] Checksum verification failed. Event might be unverified, but logged in sandbox.');
      } else {
        console.log('[WOMPI WEBHOOK] Checksum cryptographic verification PASSED.');
      }
    }

    // Register confirmed transaction state
    const confirmed: ConfirmedTransaction = {
      id: tx.id,
      reference: tx.reference,
      amountInCents: tx.amount_in_cents,
      currency: tx.currency || 'COP',
      status: tx.status,
      paymentMethodType: tx.payment_method_type,
      customerEmail: tx.customer_email,
      updatedAt: new Date().toISOString(),
    };

    verifiedTransactionsMap.set(tx.id, confirmed);

    // Automatically update order status in server orders database
    updateOrderInServerDb(tx.reference, {
      status: tx.status === 'APPROVED' ? 'pagado' : tx.status === 'DECLINED' ? 'rechazado' : 'pendiente',
      wompiStatus: tx.status,
      wompiTransactionId: tx.id,
      wompiPaymentMethodType: tx.payment_method_type,
    });

    res.status(200).json({ received: true, status: tx.status, reference: tx.reference });
  } catch (err: any) {
    console.error('Error processing Wompi webhook:', err);
    res.status(500).json({ error: 'Error interno procesando webhook de Wompi.' });
  }
});

// ==========================================
// 6. Confirm Order Status API
// Endpoint for frontend to verify if a payment has been officially approved
// ==========================================
app.post('/api/orders/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { orderNumber, transactionId } = req.body;

    if (!orderNumber && !transactionId) {
      res.status(400).json({ error: 'orderNumber o transactionId requeridos.' });
      return;
    }

    // Check if we have verified transaction by ID
    if (transactionId && verifiedTransactionsMap.has(transactionId)) {
      const tx = verifiedTransactionsMap.get(transactionId)!;
      res.json({
        success: true,
        orderNumber: tx.reference,
        status: tx.status,
        isPaid: tx.status === 'APPROVED',
        transactionId: tx.id,
        paymentMethodType: tx.paymentMethodType,
      });
      return;
    }

    // If transactionId is given, query Wompi API directly
    if (transactionId) {
      const env = getWompiEnvironment();
      const baseUrl = env === 'production' ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';
      const privateKey = getWompiPrivateKey() || getWompiPublicKey();

      try {
        const wompiRes = await fetch(`${baseUrl}/transactions/${transactionId}`, {
          headers: privateKey ? { Authorization: `Bearer ${privateKey}` } : {},
        });

        if (wompiRes.ok) {
          const json: any = await wompiRes.json();
          const tx = json?.data;
          if (tx) {
            const confirmed: ConfirmedTransaction = {
              id: tx.id,
              reference: tx.reference,
              amountInCents: tx.amount_in_cents,
              currency: tx.currency || 'COP',
              status: tx.status,
              paymentMethodType: tx.payment_method_type,
              customerEmail: tx.customer_email,
              updatedAt: new Date().toISOString(),
            };
            verifiedTransactionsMap.set(tx.id, confirmed);

            // Also update order in persistent server store if present
            updateOrderInServerDb(tx.reference, {
              status: tx.status === 'APPROVED' ? 'pagado' : tx.status === 'DECLINED' ? 'rechazado' : 'pendiente',
              wompiStatus: tx.status,
              wompiTransactionId: tx.id,
              wompiPaymentMethodType: tx.payment_method_type,
            });

            res.json({
              success: true,
              orderNumber: tx.reference,
              status: tx.status,
              isPaid: tx.status === 'APPROVED',
              transactionId: tx.id,
              paymentMethodType: tx.payment_method_type,
            });
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching transaction directly:', e);
      }
    }

    // If still in sandbox and testing reference
    res.json({
      success: true,
      orderNumber,
      status: 'PENDING',
      isPaid: false,
      message: 'Pendiente por confirmación de la pasarela de pagos.',
    });
  } catch (err: any) {
    console.error('Error confirming order payment:', err);
    res.status(500).json({ error: 'Error al confirmar el estado de pago del pedido.' });
  }
});

// ==========================================
// 7. Persistent Orders & Sales History Server Storage
// Ensures orders NEVER get lost even if browser storage is wiped
// ==========================================
const ORDERS_DB_FILE = path.join(process.cwd(), 'patitas-orders-database.json');

function loadOrdersFromDisk(): any[] {
  try {
    if (fs.existsSync(ORDERS_DB_FILE)) {
      const raw = fs.readFileSync(ORDERS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error leyendo patitas-orders-database.json:', err);
  }
  return [];
}

function saveOrdersToDisk(orders: any[]): void {
  try {
    fs.writeFileSync(ORDERS_DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando pedidos en patitas-orders-database.json:', err);
  }
}

function updateOrderInServerDb(orderNumberOrId: string, updates: Partial<any>): boolean {
  try {
    const orders = loadOrdersFromDisk();
    let updated = false;
    const newOrders = orders.map((o) => {
      if (o.orderNumber === orderNumberOrId || o.id === orderNumberOrId) {
        updated = true;
        return { ...o, ...updates, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    if (updated) {
      saveOrdersToDisk(newOrders);
      return true;
    }
  } catch (e) {
    console.error('Error actualizando pedido en servidor:', e);
  }
  return false;
}

// GET all orders from server disk
app.get('/api/orders', (req: Request, res: Response) => {
  const orders = loadOrdersFromDisk();
  res.json({ success: true, orders, count: orders.length });
});

// POST a new or updated order to server disk (idempotent, merges by orderNumber or id)
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const order = req.body;
    if (!order || (!order.id && !order.orderNumber)) {
      res.status(400).json({ error: 'Datos de orden inválidos' });
      return;
    }

    const currentOrders = loadOrdersFromDisk();
    const existingIndex = currentOrders.findIndex(
      (o) => (order.id && o.id === order.id) || (order.orderNumber && o.orderNumber === order.orderNumber)
    );

    let updatedList: any[];
    if (existingIndex >= 0) {
      updatedList = [...currentOrders];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        ...order,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedList = [order, ...currentOrders];
    }

    saveOrdersToDisk(updatedList);
    console.log(`[Orders Server DB] Pedido #${order.orderNumber || order.id} guardado con éxito. Total pedidos: ${updatedList.length}`);

    res.json({ success: true, order, totalOrders: updatedList.length });
  } catch (err: any) {
    console.error('Error al guardar pedido en servidor:', err);
    res.status(500).json({ error: 'Error al persistir pedido en el servidor' });
  }
});

// Bulk sync orders
app.post('/api/orders/bulk-sync', (req: Request, res: Response) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      res.status(400).json({ error: 'Se esperaba un arreglo de órdenes.' });
      return;
    }

    const currentOrders = loadOrdersFromDisk();
    const map = new Map<string, any>();

    // Put current server orders first
    currentOrders.forEach((o) => {
      const key = o.orderNumber || o.id;
      if (key) map.set(key, o);
    });

    // Merge incoming orders without losing older data
    orders.forEach((o) => {
      const key = o.orderNumber || o.id;
      if (key) {
        const existing = map.get(key);
        map.set(key, existing ? { ...existing, ...o } : o);
      }
    });

    const mergedList = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    saveOrdersToDisk(mergedList);
    res.json({ success: true, count: mergedList.length, orders: mergedList });
  } catch (err: any) {
    console.error('Error en bulk-sync de pedidos:', err);
    res.status(500).json({ error: 'Error en sincronización masiva.' });
  }
});

// ==========================================
// 8. Persistent Products Catalog Server Storage
// Ensures custom products and images NEVER disappear on page reload or cache clear
// And ensures deleted products are NEVER resurrected!
// ==========================================
const PRODUCTS_DB_FILE = path.join(process.cwd(), 'patitas-products-database.json');
const DELETED_PRODUCTS_DB_FILE = path.join(process.cwd(), 'patitas-deleted-products.json');

function loadDeletedIdsFromDisk(): string[] {
  try {
    if (fs.existsSync(DELETED_PRODUCTS_DB_FILE)) {
      const raw = fs.readFileSync(DELETED_PRODUCTS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error leyendo patitas-deleted-products.json:', err);
  }
  return [];
}

function saveDeletedIdsToDisk(ids: string[]): void {
  try {
    const unique = Array.from(new Set(ids));
    fs.writeFileSync(DELETED_PRODUCTS_DB_FILE, JSON.stringify(unique, null, 2), 'utf-8');
    console.log(`[Deleted Products DB] ${unique.length} IDs eliminados guardados en disco.`);
  } catch (err) {
    console.error('Error guardando IDs eliminados en disco:', err);
  }
}

function addDeletedIdToDisk(id: string): void {
  const current = loadDeletedIdsFromDisk();
  if (!current.includes(id)) {
    current.push(id);
    saveDeletedIdsToDisk(current);
  }
}

function addMultipleDeletedIdsToDisk(ids: string[]): void {
  const current = new Set(loadDeletedIdsFromDisk());
  ids.forEach((id) => current.add(id));
  saveDeletedIdsToDisk(Array.from(current));
}

function removeDeletedIdFromDisk(id: string): void {
  const current = loadDeletedIdsFromDisk();
  const filtered = current.filter((item) => item !== id);
  if (filtered.length !== current.length) {
    saveDeletedIdsToDisk(filtered);
  }
}

function loadProductsFromDisk(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_DB_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deletedSet = new Set(loadDeletedIdsFromDisk());
        return parsed.filter((p) => !deletedSet.has(p.id));
      }
    }
  } catch (err) {
    console.warn('Error leyendo patitas-products-database.json:', err);
  }
  return [];
}

function saveProductsToDisk(products: any[]): void {
  try {
    const deletedSet = new Set(loadDeletedIdsFromDisk());
    const filtered = products.filter((p) => !deletedSet.has(p.id));
    fs.writeFileSync(PRODUCTS_DB_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    console.log(`[Products Server DB] ${filtered.length} productos respaldados en disco con éxito.`);
  } catch (err) {
    console.error('Error guardando productos en patitas-products-database.json:', err);
  }
}

// GET all products from server disk (filtered against deleted IDs)
app.get('/api/products', (req: Request, res: Response) => {
  const products = loadProductsFromDisk();
  res.json({ success: true, products, count: products.length });
});

// GET deleted product IDs
app.get('/api/products/deleted-ids', (req: Request, res: Response) => {
  const deletedIds = loadDeletedIdsFromDisk();
  res.json({ success: true, deletedIds });
});

// POST register deleted product IDs
app.post('/api/products/deleted-ids', (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (Array.isArray(ids)) {
      addMultipleDeletedIdsToDisk(ids);
      // Also clean up products DB
      const current = loadProductsFromDisk();
      const idSet = new Set(ids);
      const remaining = current.filter((p) => !idSet.has(p.id));
      saveProductsToDisk(remaining);
      res.json({ success: true, deletedIds: loadDeletedIdsFromDisk() });
      return;
    }
    res.status(400).json({ error: 'Se esperaba un arreglo de IDs' });
  } catch (err) {
    res.status(500).json({ error: 'Error registrando IDs eliminados' });
  }
});

// POST save a single new or edited product
app.post('/api/products', (req: Request, res: Response) => {
  try {
    const product = req.body;
    if (!product || !product.id) {
      res.status(400).json({ error: 'Producto inválido o sin ID' });
      return;
    }

    // If product is created/edited, remove from deleted list
    removeDeletedIdFromDisk(product.id);

    const current = loadProductsFromDisk();
    const index = current.findIndex((p) => p.id === product.id);

    let updated: any[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...updated[index], ...product, updatedAt: new Date().toISOString() };
    } else {
      updated = [product, ...current];
    }

    saveProductsToDisk(updated);
    res.json({ success: true, product, totalProducts: updated.length });
  } catch (err: any) {
    console.error('Error al guardar producto en servidor:', err);
    res.status(500).json({ error: 'Error al persistir producto en el servidor' });
  }
});

// POST Bulk sync products (merges and saves entire catalog safely)
app.post('/api/products/bulk-sync', (req: Request, res: Response) => {
  try {
    const { products, overwrite } = req.body;
    if (!Array.isArray(products)) {
      res.status(400).json({ error: 'Se esperaba un arreglo de productos' });
      return;
    }

    if (overwrite) {
      // With overwrite, any product not present in 'products' that was in disk should be considered deleted if it's missing
      const previous = loadProductsFromDisk();
      const newIds = new Set(products.map((p: any) => p.id));
      const removedIds = previous.filter((p) => !newIds.has(p.id)).map((p) => p.id);
      if (removedIds.length > 0) {
        addMultipleDeletedIdsToDisk(removedIds);
      }
      saveProductsToDisk(products);
      res.json({ success: true, count: products.length, products });
      return;
    }

    const current = loadProductsFromDisk();
    const deletedSet = new Set(loadDeletedIdsFromDisk());
    const map = new Map<string, any>();

    // Current disk items
    current.forEach((p) => {
      if (p.id && !deletedSet.has(p.id)) map.set(p.id, p);
    });

    // Merge incoming
    products.forEach((p) => {
      if (p.id && !deletedSet.has(p.id)) {
        const existing = map.get(p.id);
        map.set(p.id, existing ? { ...existing, ...p } : p);
      }
    });

    const mergedList = Array.from(map.values());
    saveProductsToDisk(mergedList);
    res.json({ success: true, count: mergedList.length, products: mergedList });
  } catch (err: any) {
    console.error('Error en bulk-sync de productos:', err);
    res.status(500).json({ error: 'Error en sincronización masiva de productos' });
  }
});

// POST bulk delete products
app.post('/api/products/bulk-delete', (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'Se esperaba un arreglo de IDs' });
      return;
    }
    addMultipleDeletedIdsToDisk(ids);
    const current = loadProductsFromDisk();
    const idSet = new Set(ids);
    const filtered = current.filter((p) => !idSet.has(p.id));
    saveProductsToDisk(filtered);
    res.json({ success: true, count: filtered.length, deletedCount: ids.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar productos en lote' });
  }
});

// DELETE single product from server
app.delete('/api/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id) {
      addDeletedIdToDisk(id);
      const current = loadProductsFromDisk();
      const filtered = current.filter((p) => p.id !== id);
      saveProductsToDisk(filtered);
      res.json({ success: true, count: filtered.length, deletedId: id });
      return;
    }
    res.status(400).json({ error: 'ID de producto requerido' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// ==========================================
// 9. Persistent Store Settings Server Storage
// Saves store contact info, shipping fees, Wompi keys, etc. to disk
// ==========================================
const SETTINGS_DB_FILE = path.join(process.cwd(), 'patitas-settings-database.json');
const CATEGORIES_DB_FILE = path.join(process.cwd(), 'patitas-categories-database.json');
const LEADS_DB_FILE = path.join(process.cwd(), 'patitas-leads-database.json');
const REVIEWS_DB_FILE = path.join(process.cwd(), 'patitas-reviews-database.json');
const BLOG_DB_FILE = path.join(process.cwd(), 'patitas-blog-database.json');

function loadJsonFromDisk(filePath: string, fallback: any = null): any {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Error leyendo ${path.basename(filePath)}:`, err);
  }
  return fallback;
}

function saveJsonToDisk(filePath: string, data: any): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error guardando ${path.basename(filePath)}:`, err);
  }
}

function loadSettingsFromDisk(): any {
  return loadJsonFromDisk(SETTINGS_DB_FILE, null);
}

function saveSettingsToDisk(settings: any): void {
  saveJsonToDisk(SETTINGS_DB_FILE, settings);
  console.log('[Settings Server DB] Configuración y tarifas de domicilio guardadas en disco.');
}

app.get('/api/settings', (req: Request, res: Response) => {
  const settings = loadSettingsFromDisk();
  res.json({ success: true, settings });
});

app.post('/api/settings', (req: Request, res: Response) => {
  try {
    const settings = req.body;
    if (settings) {
      saveSettingsToDisk(settings);
      res.json({ success: true, message: 'Configuración guardada en el servidor' });
      return;
    }
    res.status(400).json({ error: 'Datos de configuración vacíos' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

// Categories Endpoints
app.get('/api/categories', (req: Request, res: Response) => {
  const categories = loadJsonFromDisk(CATEGORIES_DB_FILE, []);
  res.json({ success: true, categories });
});

app.post('/api/categories', (req: Request, res: Response) => {
  try {
    const { categories } = req.body;
    if (Array.isArray(categories)) {
      saveJsonToDisk(CATEGORIES_DB_FILE, categories);
      res.json({ success: true, count: categories.length });
      return;
    }
    res.status(400).json({ error: 'Se esperaba un arreglo de categorías' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando categorías' });
  }
});

// Customer Leads Endpoints
app.get('/api/leads', (req: Request, res: Response) => {
  const leads = loadJsonFromDisk(LEADS_DB_FILE, []);
  res.json({ success: true, leads });
});

app.post('/api/leads', (req: Request, res: Response) => {
  try {
    const { leads, lead } = req.body;
    if (Array.isArray(leads)) {
      saveJsonToDisk(LEADS_DB_FILE, leads);
      res.json({ success: true, count: leads.length });
      return;
    }
    if (lead && lead.id) {
      const current = loadJsonFromDisk(LEADS_DB_FILE, []);
      const updated = [lead, ...current.filter((l: any) => l.id !== lead.id)];
      saveJsonToDisk(LEADS_DB_FILE, updated);
      res.json({ success: true, lead });
      return;
    }
    res.status(400).json({ error: 'Datos de prospecto inválidos' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando prospectos' });
  }
});

// Reviews Endpoints
app.get('/api/reviews', (req: Request, res: Response) => {
  const reviews = loadJsonFromDisk(REVIEWS_DB_FILE, []);
  res.json({ success: true, reviews });
});

app.post('/api/reviews', (req: Request, res: Response) => {
  try {
    const { reviews, review } = req.body;
    if (Array.isArray(reviews)) {
      saveJsonToDisk(REVIEWS_DB_FILE, reviews);
      res.json({ success: true, count: reviews.length });
      return;
    }
    if (review && review.id) {
      const current = loadJsonFromDisk(REVIEWS_DB_FILE, []);
      const updated = [review, ...current.filter((r: any) => r.id !== review.id)];
      saveJsonToDisk(REVIEWS_DB_FILE, updated);
      res.json({ success: true, review });
      return;
    }
    res.status(400).json({ error: 'Datos de reseña inválidos' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando reseñas' });
  }
});

// Blog Endpoints
app.get('/api/blog', (req: Request, res: Response) => {
  const posts = loadJsonFromDisk(BLOG_DB_FILE, []);
  res.json({ success: true, posts });
});

app.post('/api/blog', (req: Request, res: Response) => {
  try {
    const { posts } = req.body;
    if (Array.isArray(posts)) {
      saveJsonToDisk(BLOG_DB_FILE, posts);
      res.json({ success: true, count: posts.length });
      return;
    }
    res.status(400).json({ error: 'Se esperaba un arreglo de artículos' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando artículos del blog' });
  }
});

// Comprehensive Full Store Backup API
app.get('/api/backup/export', (req: Request, res: Response) => {
  try {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      products: loadProductsFromDisk(),
      deletedProductIds: loadDeletedIdsFromDisk(),
      orders: loadOrdersFromDisk(),
      settings: loadSettingsFromDisk(),
      categories: loadJsonFromDisk(CATEGORIES_DB_FILE, []),
      leads: loadJsonFromDisk(LEADS_DB_FILE, []),
      reviews: loadJsonFromDisk(REVIEWS_DB_FILE, []),
      blog: loadJsonFromDisk(BLOG_DB_FILE, []),
    };
    res.json({ success: true, backup });
  } catch (err) {
    res.status(500).json({ error: 'Error generando exportación completa' });
  }
});

// ==========================================
// Marketing & Growth AI Generator (Gemini 3.8 Flash)
// Generates zero-cost organic marketing campaigns for Facebook, WhatsApp, Marketplace & TikTok
// ==========================================
app.post('/api/marketing/generate-ad', async (req: Request, res: Response) => {
  try {
    const {
      channel = 'facebook',
      productName,
      productPrice,
      originalPrice,
      productCategory,
      productPetType,
      productDescription,
      city = 'Bogotá y envíos a toda Colombia',
      phone = '312 345 6789',
      freeShipping = true,
      customNote = '',
      tone = 'persuasivo',
    } = req.body;

    const formattedPrice = productPrice
      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(productPrice)
      : '$45.000 COP';

    const ai = getGenAI();

    if (ai) {
      try {
        const prompt = `Actúa como un experto en Growth Marketing, Copywriting de Respuesta Directa y Ventas Orgánicas para E-commerce de Mascotas en Colombia.
Tu objetivo es redactar un anuncio o guión extremadamente persuasivo, magnético y orientado a ventas inmediatas SIN PAGAR PUBLICIDAD para la tienda "Lunary World Pets".

DATOS DE LA CAMPAÑA:
- Canal objetivo: ${channel} (opciones: facebook_post, facebook_marketplace, whatsapp_broadcast, tiktok_reels, organic_growth_plan)
- Producto o Enfoque: ${productName || 'Catálogo General de Lunary World Pets (Alimentos, Accesorios y Juguetes)'}
- Precio: ${formattedPrice} ${originalPrice ? `(Antes: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(originalPrice)})` : ''}
- Categoría / Tipo de Mascota: ${productCategory || 'Mascotas'} - ${productPetType || 'Perros y Gatos'}
- Descripción del producto: ${productDescription || 'Calidad garantizada, bienestar para tu mascota y entrega rápida.'}
- Ciudad y cobertura: ${city}
- Teléfono/WhatsApp de pedidos: ${phone}
- Beneficio de envío: ${freeShipping ? 'Envío a domicilio asegurado tras pago seguro con Pasarela Wompi / PSE' : 'Envíos a todo el país'}
- Tono deseado: ${tone} (Persuasivo y vendedor, con empatía hacia las mascotas)
- Detalle adicional: ${customNote || 'Enfocado en cerrar ventas hoy mismo'}
- REGLA DE PAGO OBLIGATORIA: En Lunary World Pets NUNCA hay pago contraentrega. Todos los pagos se realizan primero de forma 100% segura a través de la pasarela oficial Wompi (PSE, Bancolombia, Nequi, Tarjetas) y posteriormente se entrega a domicilio. NO menciones pago contra entrega en ningún caso.

REQUISITOS SEGÚN EL CANAL:
1. Si el canal es "facebook_post": Redacta un post para grupos de Facebook de amantes de perros/gatos y compra-venta local. Título gancho con emojis, dolor/deseo del dueño, características y beneficios claros, precio de oferta, garantía, y llamado a la acción claro para escribir al WhatsApp ${phone}.
2. Si el canal es "facebook_marketplace": Redacta un título SEO de alto impacto (ej. cómo busca la gente en Marketplace: Producto + Ciudad + Entrega) + descripción directa estructurada: Estado (Nuevo), Precio, Ubicación, Métodos de entrega, y llamado urgente a enviar mensaje por Messenger o WhatsApp.
3. Si el canal es "whatsapp_broadcast": Redacta un mensaje para Estados o Grupos de WhatsApp. Corto, visualmente limpio, con emojis, sentido de escasez (cupos/unidades limitadas) y link o llamado para responder al chat de inmediato.
4. Si el canal es "tiktok_reels": Estructura un guión viral de 30 a 45 segundos dividido en: [Segundo 0-3: Gancho auditivo/visual que detiene el scroll], [Segundo 3-15: Problema común de dueños de mascotas], [Segundo 15-25: Demostración y solución con el producto], [Segundo 25-30: Llamado a la acción para pedir en el enlace del perfil o WhatsApp].
5. Si el canal es "organic_growth_plan": Proporciona 3 tácticas 100% gratuitas paso a paso para conseguir ventas hoy en Colombia usando Marketplace, grupos locales y alianzas sin gastar $1.

Responde ÚNICAMENTE con el texto final listo para copiar y publicar (incluye emojis, espaciado atractivo y llamado a la acción).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const text = response.text?.trim();
        if (text) {
          res.json({ success: true, text, usedAi: true });
          return;
        }
      } catch (geminiErr: any) {
        console.warn('[Gemini Marketing API] Error llamando a Gemini, usando generador inteligente local:', geminiErr?.message || geminiErr);
      }
    }

    // High-converting fallback generator tailored to Colombia commerce
    let fallbackText = '';
    const name = productName || 'Alimento y Accesorios Premium para Mascotas';
    const cleanPhone = (phone || '3123456789').replace(/\D/g, '');

    if (channel === 'facebook_marketplace') {
      fallbackText = `🛍️ TÍTULO RECOMENDADO PARA MARKETPLACE:
${name} - ¡Nuevo! Domicilio en ${city} 🐾

📝 DESCRIPCIÓN PARA MARKETPLACE:
¡Consiente a tu peludito con la mejor calidad al mejor precio! 🐶🐱

✨ Estado: 100% Nuevo en empaque sellado original
💰 Precio de Oferta: ${formattedPrice}
📍 Ubicación: ${city} (Envíos a domicilio y entrega rápida)
🛵 Métodos de Pago: Pasarela Segura Wompi (PSE todos los bancos, Nequi, Tarjetas, Bancolombia). Despacho a domicilio 📦

📦 ¿Qué incluye?
${productDescription || 'Producto de alta durabilidad y nutrición/cuidado garantizado.'}

⚡ ¡POCAS UNIDADES DISPONIBLES!
Escríbeme un mensaje directo aquí en Marketplace o al WhatsApp: wa.me/57${cleanPhone} para coordinar tu entrega hoy mismo 🐾📲`;
    } else if (channel === 'whatsapp_broadcast') {
      fallbackText = `🐾 ¡OFERTA RELÁMPAGO PARA TU PELUDITO! 🐶🐱

¿Buscando lo mejor para tu consentido? Llegó a *Lunary World Pets*:
🌟 *${name}*

🔥 *Solo por hoy:* ${formattedPrice} ${originalPrice ? `(Precio normal: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(originalPrice)})` : ''}
🛵 Envíos rápidos en ${city}
💳 Aceptamos Nequi, Bancolombia, PSE y tarjetas

👇 ¡Pide el tuyo antes de que se agote el stock!
📲 Escríbeme tocando aquí: wa.me/57${cleanPhone}?text=Hola!%20Quiero%20pedir%20el%20${encodeURIComponent(name)}`;
    } else if (channel === 'tiktok_reels') {
      fallbackText = `🎬 GUIÓN VIRAL PARA TIKTOK / REEL (30 SEGUNDOS) 🐶🎥

⏱️ [0:00 - 0:03] GANCHO (Detener el scroll):
(Muestra a tu perro o gato haciendo cara triste o mirando un plato vacío/juguete roto)
Texto en pantalla: "Si tienes un peludito en casa, TIENES que ver esto antes de que cometas este error... 🚨"

⏱️ [0:03 - 0:12] EL PROBLEMA:
Voz en off: "¿Sabías que la mayoría de los productos comunes para mascotas no duran o no les dan el bienestar que merecen? Muchas veces terminas gastando el doble..."

⏱️ [0:12 - 0:22] LA SOLUCIÓN (Muestra el producto):
(Tomas en primer plano de ${name}, abriéndolo o tu mascota disfrutándolo)
Voz en off: "Por eso descubrí ${name} en Lunary World Pets. Mira la calidad de los materiales y cómo le encanta. Además rinde muchísimo y cuida su salud."

⏱️ [0:22 - 0:30] OFERTA Y LLAMADO A LA ACCIÓN:
Texto en pantalla: "¡Solo ${formattedPrice}! Envíos en Colombia 🛵"
Voz en off: "Está en súper oferta hoy a solo ${formattedPrice} con domicilio en Colombia. Toca el link de mi perfil o escríbenos al WhatsApp para pedir el tuyo hoy."`;
    } else if (channel === 'organic_growth_plan') {
      fallbackText = `🚀 PLAN ORGÁNICO GRATIS: CÓMO CONSEGUIR 10 CLIENTES HOY SIN PAGAR PUBLICIDAD

1️⃣ LA ESTRATEGIA MARKETPLACE DE FACEBOOK (Tu canal #1):
• Publica de 3 a 5 productos estrella en Facebook Marketplace usando títulos con intención de búsqueda (Ej: "${name} Bogotá Domicilio").
• Marketplace le muestra tu producto a personas que viven cerca y que ya están buscando comprar ahora mismo.
• Responde en menos de 3 minutos cuando te pregunten "¿Sigue disponible?": "¡Hola! Sí señor(a), está disponible nuevo en caja. ¿En qué barrio te encuentras para coordinar el domicilio?".

2️⃣ GRUPOS DE FACEBOOK DE BARRIO Y MASCOTAS:
• Entra a 5 grupos locales (ej: "Amantes de los Perros Bogotá", "Mascotas Suba / Medellín / Cali", "Clasificados tu ciudad").
• En vez de poner un anuncio aburrido, publica una foto linda con el producto y di: "Amigos de la comunidad, tenemos disponibles pocas unidades de ${name} con domicilio gratis hoy. ¿A quién le gustaría consentir a su peludito?".

3️⃣ ALIANZAS A $0 CON NEGOCIOS VECINOS:
• Habla con paseadores de perros del parque de tu zona o peluquerías caninas que no vendan este producto.
• Ofréceles un 10% de comisión por cada vecino que te compre a través de su recomendación. ¡Ellos tienen la confianza del cliente y tú tienes el producto!`;
    } else {
      // Default: facebook_post
      fallbackText = `🐾 ¡ATENCIÓN AMANTES DE LAS MASCOTAS! 🐶🐱❤️

¿Quieres darle lo mejor a tu peludito sin pagar de más? 
En *Lunary World Pets* tenemos en promoción especial:

⭐ *${name}* ⭐

${productDescription ? `✅ ${productDescription}\n` : ''}✅ 100% Calidad garantizada y recomendado para su bienestar
✅ Precio especial de lanzamiento: *${formattedPrice}*
✅ Domicilio rápido en ${city} y envíos a todo el país
✅ Pagos 100% seguros con Pasarela Wompi (PSE, Nequi, Tarjetas o Bancolombia) y despacho a domicilio

🐶 ¡Porque tu mascota merece lo mejor de lo mejor! 🐱

📲 ¿Quieres el tuyo hoy? Escríbenos directamente a WhatsApp:
👉 wa.me/57${cleanPhone}?text=Hola!%20Vi%20la%20promo%20de%20${encodeURIComponent(name)}%20en%20Facebook

💬 O déjanos un comentario y te enviamos toda la información al instante 👇`;
    }

    res.json({ success: true, text: fallbackText, usedAi: false });
  } catch (err: any) {
    console.error('Error generando publicidad de marketing:', err);
    res.status(500).json({ error: 'Error al generar publicidad' });
  }
});

// ==========================================
// Social Studio, SEO & Growth AI (Gemini 3.8 Flash)
// ==========================================

// 1. SEO Generator
app.post('/api/seo/generate-metadata', async (req: Request, res: Response) => {
  try {
    const { productName, productCategory, productDescription } = req.body;
    const ai = getGenAI();

    if (!ai) return res.json({ success: false, error: 'AI unavailable' });

    const prompt = `Actúa como un experto en SEO para tiendas de mascotas en Colombia.
Analiza este producto y genera:
1. Un título optimizado para Google (max 60 carac.).
2. Una meta-descripción persuasiva (max 160 carac.) con un llamado a la acción.
3. Lista de 5-8 palabras clave separadas por comas.

Producto: ${productName}
Categoría: ${productCategory}
Descripción: ${productDescription}

Responde en formato JSON: {"title": "...", "description": "...", "keywords": "..."}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const jsonText = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    res.json({ success: true, metadata: JSON.parse(jsonText) });
  } catch (err) {
    res.status(500).json({ error: 'Error generando SEO' });
  }
});

// 2. Checkout Recovery Generator
app.post('/api/growth/generate-recovery-pitch', async (req: Request, res: Response) => {
  try {
    const { clientName, productName, totalAmount } = req.body;
    const ai = getGenAI();

    if (!ai) return res.json({ success: false, error: 'AI unavailable' });

    const prompt = `Actúa como asesor de ventas de Lunary World Pets. Un cliente dejó un pedido sin pagar.
Redacta un mensaje amable de WhatsApp para recuperar la venta.
Cliente: ${clientName}
Producto: ${productName}
Total: $${Number(totalAmount).toLocaleString('es-CO')}
Incluye un tono cálido, menciona que estamos atentos por si tuvo problemas con el pago (PSE/Wompi), y pregunta si necesita ayuda para finalizar.
Mantenlo corto y profesional.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ success: true, text: response.text?.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Error generando recuperación' });
  }
});

// Social Studio & Competitor Lead Radar AI
app.post('/api/social-studio/generate-stealth-reply', async (req: Request, res: Response) => {
  try {
    const {
      clientQuestion = '¿Dónde consigo comida para perro con domicilio hoy?',
      platform = 'facebook',
      replyStyle = 'public_comment', // 'public_comment' | 'private_dm' | 'whatsapp_pitch' | 'lead_magnet'
      competitorName = 'Competencia o Grupo Local',
      productName = 'Alimento Premium para Perros',
      productPrice = 95000,
      city = 'Bogotá y toda Colombia',
      phone = '3214231616',
      freeShipping = true,
      customBenefit = 'Despacho hoy mismo con empaque sellado de fábrica',
    } = req.body;

    const formattedPrice = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(productPrice) || 95000);

    const cleanPhone = (phone || '3214231616').replace(/\D/g, '');
    const ai = getGenAI();

    if (ai) {
      try {
        const prompt = `Actúa como un estratega de ventas digitales y Social Selling para la tienda de mascotas "Lunary World Pets" en Colombia.
Tu misión es interceptar o responder una consulta de un cliente potencial que está preguntando por productos para su mascota en ${platform} (en una publicación de ${competitorName}), para atraerlo éticamente y cerrar la venta sin parecer spam agresivo.

CONSULTA DEL CLIENTE POTENCIAL:
"${clientQuestion}"

DATOS DE TU OFERTA:
- Producto a ofrecer: ${productName}
- Precio especial: ${formattedPrice}
- Beneficio principal: ${customBenefit}
- Cobertura y entrega: Domicilio rápido en ${city}
- Método de Pago: Pasarela 100% segura Wompi (PSE, Bancolombia, Nequi, Tarjetas)
- WhatsApp de asesoría y pedidos: +57 ${cleanPhone}
- Estilo requerido: ${replyStyle} (opciones: public_comment, private_dm, whatsapp_pitch, lead_magnet)

REGLAS DE ORO:
1. Si el estilo es "public_comment": Escribe un comentario público amigable, respetuoso y de alto valor (máximo 4 líneas). Ejemplo: responder a su duda genuinamente y sugerir con amabilidad que en Lunary World Pets está disponible con entrega hoy.
2. Si el estilo es "private_dm": Redacta un mensaje directo privado (inbox/DM) cercano, educado y con un gancho exclusivo ("Hola! Vi que estabas buscando X en el grupo... te cuento que nosotros lo tenemos...").
3. Si el estilo es "whatsapp_pitch": Redacta un mensaje de WhatsApp directo para cerrar la venta con saludo cálido, foto o ficha del producto, link de compra seguro por Wompi/PSE y disponibilidad de envío a domicilio.
4. Si el estilo es "lead_magnet": Redacta un post anzuelo o tip para publicar en grupos que haga que decenas de dueños de mascotas te pregunten a ti en vez de a la competencia.
5. REGLA ESTRICTA DE PAGO: NUNCA menciones pago contraentrega. Menciona pago 100% seguro por pasarela Wompi (PSE, Nequi, Bancolombia, Tarjetas) y despacho a domicilio.

Genera ÚNICAMENTE el texto listo para copiar y enviar (incluye emojis sutiles y profesionales).`;

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 3500)
        );
        const aiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const response: any = await Promise.race([aiPromise, timeoutPromise]);

        const text = response?.text?.trim();
        if (text) {
          res.json({ success: true, text, usedAi: true });
          return;
        }
      } catch (geminiErr: any) {
        console.warn('[Social Studio API] Fallback local por error de Gemini:', geminiErr?.message || geminiErr);
      }
    }

    // High converting local templates
    let text = '';
    if (replyStyle === 'public_comment') {
      text = `¡Hola! 👋 Vi tu consulta. En *Lunary World Pets* tenemos disponible ${productName} a solo ${formattedPrice}. Tenemos despacho a domicilio rápido en ${city} y compras 100% seguras con pasarela PSE / Wompi. Si gustas te paso la información detallada por WhatsApp al 📲 wa.me/57${cleanPhone} ¡Con gusto te asesoramos! 🐾✨`;
    } else if (replyStyle === 'private_dm') {
      text = `¡Hola! 👋 Te escribo porque vi que estabas buscando información sobre ${productName} en el grupo. En nuestra tienda *Lunary World Pets* lo tenemos disponible 100% original en empaque sellado a ${formattedPrice} con domicilio en ${city}. 

💳 Pagos 100% seguros mediante PSE, Nequi, Bancolombia o Tarjeta (Wompi) y te enviamos tu guía de despacho inmediata. 

¿Para qué perrito/gatito lo necesitas? Con gusto te aparto una unidad si deseas: wa.me/57${cleanPhone} 🐶🐱`;
    } else if (replyStyle === 'whatsapp_pitch') {
      text = `¡Hola! 🐾 Qué gusto saludarte de parte de *Lunary World Pets*. 

Respecto a lo que necesitas:
🌟 *${productName}*
💰 *Precio especial:* ${formattedPrice}
🚚 *Envío:* Domicilio rápido en ${city}
🔒 *Pago:* 100% Seguro por Pasarela Wompi (PSE de cualquier banco, Nequi, Bancolombia y Tarjetas).

¿En qué dirección te gustaría recibirlo para coordinar tu despacho hoy mismo? 🛵📦`;
    } else {
      // lead_magnet
      text = `🐾 PREGUNTA PARA DUEÑOS DE MASCOTAS EN ${city.toUpperCase()} 🐶🐱\n\n¿Sabían que muchos productos comerciales para mascotas no cumplen con los estándares nutricionales o de durabilidad? \n\nEn *Lunary World Pets* armamos una guía rápida y tenemos stock directo de ${productName} a solo ${formattedPrice} con domicilio en tu zona. \n\nDéjame un "YO" en los comentarios y te comparto toda la info con beneficio de envío especial hoy 👇✨`;
    }

    res.json({ success: true, text, usedAi: false });
  } catch (err: any) {
    console.error('Error en /api/social-studio/generate-stealth-reply:', err);
    res.status(500).json({ error: 'Error generando respuesta social' });
  }
});

// ==========================================
// VIRTUAL VET & NUTRITION AI CONSULT
// ==========================================
app.post('/api/virtual-vet/consult', async (req: Request, res: Response) => {
  try {
    const { petType, petAge, question, catalog } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Actúa como un Veterinario y Nutricionista Experto en mascotas (perros y gatos) para la tienda en Colombia "Lunary World Pets". 
El usuario tiene un ${petType} de edad "${petAge}".
Su consulta es: "${question}".

Aquí tienes el catálogo de productos disponibles en la tienda:
${JSON.stringify(catalog)}

Responde de forma amable, profesional, empática y experta en salud animal. 
Identifica cuál de los productos del catálogo es el más adecuado para resolver su duda o condición y devuelve tu respuesta en formato JSON estricto con esta estructura:
{
  "answer": "Tu consejo veterinario detallado y profesional...",
  "recommendedProductId": "ID exacto del producto recomendado del catálogo o null"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.json({ success: true, ...parsed });
      } catch (aiErr) {
        console.warn('Gemini virtual vet fallback:', aiErr);
      }
    }

    // Fallback logic
    let recommendedProductId = catalog && catalog.length > 0 ? catalog[0].id : null;
    let answer = `Hola, como veterinario virtual te sugiero mantener a tu ${petType} con agua fresca y observación detallada.`;
    const q = (question || '').toLowerCase();

    if (q.includes('comida') || q.includes('alimento') || q.includes('concentrado')) {
      answer = `Para un ${petType} de ${petAge}, es fundamental una dieta rica en proteínas y omega-3 para su pelaje y articulaciones. Te recomendamos nuestro alimento super premium disponible en tienda.`;
    } else if (q.includes('pulgas') || q.includes('garrapata')) {
      answer = `Las pulgas y garrapatas pueden causar dermatitis alérgica. Te sugerimos aplicar una pipeta o pastilla antipulgas de acción rápida para protegerlo de inmediato.`;
    }

    res.json({ success: true, answer, recommendedProductId });
  } catch (err: any) {
    console.error('Error en /api/virtual-vet/consult:', err);
    res.status(500).json({ error: 'Error consultando al veterinario virtual' });
  }
});

// ==========================================
// Vite Middleware / Static Serving
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Lunary World Pets Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Wompi Payment Gateway] Environment: ${getWompiEnvironment()}`);
  });
}

startServer();
