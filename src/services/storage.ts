import {
  INITIAL_ABOUT_CONTENT,
  INITIAL_ADMIN_CREDENTIALS,
  INITIAL_BLOG_POSTS,
  INITIAL_CATEGORIES,
  INITIAL_CONTACT_INFO,
  INITIAL_REVIEWS,
  SAMPLE_PRODUCTS,
} from '../data/initialData';
import {
  AboutContent,
  AdminCredentials,
  BlogPost,
  Category,
  ContactInfo,
  CustomerLead,
  CustomerReview,
  Order,
  Product,
} from '../types';
import {
  saveAllCloudFirestoreProducts,
  saveCloudFirestoreProduct,
  deleteCloudFirestoreProduct,
  deleteMultipleCloudFirestoreProducts,
  getCloudFirestoreProducts,
  subscribeToCloudFirestoreProducts,
  bootstrapCloudFirestore,
  saveCloudFirestoreCategories,
  subscribeToCloudFirestoreCategories,
  saveCloudFirestoreSettings,
  subscribeToCloudFirestoreSettings,
  saveCloudFirestoreOrder,
  subscribeToCloudFirestoreOrders,
  saveCloudFirestoreLead,
  subscribeToCloudFirestoreLeads,
} from './firestoreSync';

const KEYS = {
  PRODUCTS: 'patitas_products_v3',
  PRODUCTS_ARCHIVE: 'patitas_products_archive_v1',
  DELETED_PRODUCTS: 'patitas_deleted_products_v2',
  CATEGORIES: 'patitas_categories_v1',
  ORDERS: 'patitas_orders_v1',
  ORDERS_ARCHIVE: 'patitas_sales_history_archive_v1',
  CUSTOMER_LEADS: 'patitas_customer_leads_v1',
  REVIEWS: 'patitas_reviews_v1',
  CONTACT_INFO: 'patitas_contact_v1',
  ABOUT: 'patitas_about_v1',
  BLOG: 'patitas_blog_v1',
  ADMIN_CREDENTIALS: 'patitas_admin_cred_v1',
  ADMIN_LOGGED_IN: 'patitas_admin_logged_v1',
  CUSTOMER_PROFILE: 'patitas_customer_profile_v1',
};

export interface CustomerCheckoutProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  deliveryZone: 'bogota' | 'nacional';
  notes?: string;
}

export function getStoredCustomerCheckoutProfile(): CustomerCheckoutProfile | null {
  return safeGet<CustomerCheckoutProfile | null>(KEYS.CUSTOMER_PROFILE, null);
}

export function saveStoredCustomerCheckoutProfile(profile: CustomerCheckoutProfile): void {
  safeSet(KEYS.CUSTOMER_PROFILE, profile);
}

// Safe JSON parser for localStorage
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger custom event for same-window sync
    window.dispatchEvent(new CustomEvent('lunary_storage_update', { detail: { key } }));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Persistent Deleted Product Registry (prevents deleted products from resurrecting)
export function getDeletedProductIds(): Set<string> {
  const ids = safeGet<string[]>(KEYS.DELETED_PRODUCTS, []);
  return new Set(Array.isArray(ids) ? ids : []);
}

export function saveDeletedProductIds(ids: string[] | Set<string>): void {
  const arr = Array.from(ids instanceof Set ? ids : new Set(ids));
  safeSet(KEYS.DELETED_PRODUCTS, arr);
  try {
    fetch('/api/products/deleted-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: arr }),
    }).catch(() => {});
  } catch {}
}

export function markProductAsDeleted(productId: string): void {
  const currentSet = getDeletedProductIds();
  currentSet.add(productId);
  saveDeletedProductIds(currentSet);
}

export function markMultipleProductsAsDeleted(productIds: string[]): void {
  const currentSet = getDeletedProductIds();
  productIds.forEach((id) => currentSet.add(id));
  saveDeletedProductIds(currentSet);
}

export function unmarkProductAsDeleted(productId: string): void {
  const currentSet = getDeletedProductIds();
  if (currentSet.has(productId)) {
    currentSet.delete(productId);
    saveDeletedProductIds(currentSet);
  }
}

export function clearAllDeletedProductIds(): void {
  safeSet(KEYS.DELETED_PRODUCTS, []);
  try {
    fetch('/api/products/deleted-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [] }),
    }).catch(() => {});
  } catch {}
}

// Products
export function getStoredProducts(): Product[] {
  const deletedSet = getDeletedProductIds();

  const current = safeGet<Product[]>(KEYS.PRODUCTS, null as any);
  if (Array.isArray(current)) {
    const filtered = current.filter((p) => p && p.id && !deletedSet.has(p.id));
    return filtered;
  }

  const archive = safeGet<Product[]>(KEYS.PRODUCTS_ARCHIVE, null as any);
  if (Array.isArray(archive)) {
    const filtered = archive.filter((p) => p && p.id && !deletedSet.has(p.id));
    safeSet(KEYS.PRODUCTS, filtered);
    return filtered;
  }

  // First time initialization
  const initial = SAMPLE_PRODUCTS.filter((p) => !deletedSet.has(p.id));
  safeSet(KEYS.PRODUCTS, initial);
  safeSet(KEYS.PRODUCTS_ARCHIVE, initial);
  return initial;
}

export function saveStoredProducts(products: Product[]): void {
  const deletedSet = getDeletedProductIds();
  const timestamp = new Date().toISOString();

  // If saving a list that removed items, add those removed IDs to deletedSet
  const prev = safeGet<Product[]>(KEYS.PRODUCTS, []);
  if (Array.isArray(prev) && prev.length > 0) {
    const newIdSet = new Set(products.map((p) => p.id));
    const removedIds = prev.filter((p) => p && p.id && !newIdSet.has(p.id)).map((p) => p.id);
    if (removedIds.length > 0) {
      removedIds.forEach((id) => deletedSet.add(id));
      saveDeletedProductIds(deletedSet);
    }
  }

  const sanitized = products
    .filter((p) => p && p.id && !deletedSet.has(p.id))
    .map((p) => ({
      ...p,
      updatedAt: p.updatedAt || timestamp,
    }));

  safeSet(KEYS.PRODUCTS, sanitized);
  safeSet(KEYS.PRODUCTS_ARCHIVE, sanitized);

  // Sync to Cloud Firestore (Primary cross-device database)
  saveAllCloudFirestoreProducts(sanitized).catch((err) => {
    console.warn('[Firestore] Error guardando productos en la nube:', err);
  });

  // Sync to server backend disk storage
  try {
    fetch('/api/products/bulk-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: sanitized, overwrite: true }),
    }).catch(() => {});
  } catch {}
}

// Synchronous/Asynchronous Save with direct commit to LocalStorage, Cloud Firestore and Server Disk
export async function persistProductsDefinitively(products: Product[]): Promise<{ success: boolean; count: number; error?: string }> {
  const deletedSet = getDeletedProductIds();
  const timestamp = new Date().toISOString();

  const prepared = products
    .filter((p) => p && p.id && !deletedSet.has(p.id))
    .map((p) => ({
      ...p,
      updatedAt: timestamp, // Mark latest modification
    }));

  // 1. Primary & Secondary LocalStorage
  safeSet(KEYS.PRODUCTS, prepared);
  safeSet(KEYS.PRODUCTS_ARCHIVE, prepared);

  // 2. Cloud Firestore (Primary global cloud source of truth across all devices)
  try {
    await saveAllCloudFirestoreProducts(prepared);
  } catch (cloudErr) {
    console.warn('[Firestore] Error al persistir en Firestore:', cloudErr);
  }

  // 3. Server Disk Storage
  try {
    const serverRes = await fetch('/api/products/bulk-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: prepared, overwrite: true }),
    });
    if (!serverRes.ok) {
      console.warn('[Server DB] Aviso al guardar en disco de servidor:', serverRes.statusText);
    }
  } catch (serverErr) {
    console.warn('[Server DB] Error al persistir en servidor:', serverErr);
  }

  return { success: true, count: prepared.length };
}

export async function deleteStoredProduct(productId: string): Promise<Product[]> {
  markProductAsDeleted(productId);
  const deletedSet = getDeletedProductIds();

  const current = safeGet<Product[]>(KEYS.PRODUCTS, []);
  const updated = current.filter((p) => p && p.id !== productId && !deletedSet.has(p.id));
  
  // Save locally
  safeSet(KEYS.PRODUCTS, updated);
  safeSet(KEYS.PRODUCTS_ARCHIVE, updated);

  // Delete from Cloud Firestore
  try {
    await deleteCloudFirestoreProduct(productId);
  } catch (cloudErr) {
    console.warn('[Firestore] Error al eliminar producto en la nube:', cloudErr);
  }

  // Delete from Server Disk storage
  try {
    await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[Server DB] Error al eliminar producto en servidor:', err);
  }

  return updated;
}

export async function deleteMultipleStoredProducts(productIds: string[]): Promise<Product[]> {
  markMultipleProductsAsDeleted(productIds);
  const deletedSet = getDeletedProductIds();
  const idSet = new Set(productIds);

  const current = safeGet<Product[]>(KEYS.PRODUCTS, []);
  const updated = current.filter((p) => p && !idSet.has(p.id) && !deletedSet.has(p.id));
  
  // Save locally
  safeSet(KEYS.PRODUCTS, updated);
  safeSet(KEYS.PRODUCTS_ARCHIVE, updated);

  // Delete from Cloud Firestore
  try {
    await deleteMultipleCloudFirestoreProducts(productIds);
  } catch (cloudErr) {
    console.warn('[Firestore] Error al eliminar múltiples productos en la nube:', cloudErr);
  }

  // Delete / Sync on Server Disk storage
  try {
    await fetch('/api/products/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: productIds }),
    });
  } catch (err) {
    console.warn('[Server DB] Error al sincronizar eliminación múltiple en servidor:', err);
  }

  return updated;
}

export async function addOrUpdateStoredProduct(product: Product): Promise<void> {
  unmarkProductAsDeleted(product.id);
  const current = getStoredProducts();
  const index = current.findIndex((p) => p.id === product.id);
  const withTimestamp = {
    ...product,
    updatedAt: new Date().toISOString(),
  };

  let updatedList: Product[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = { ...updatedList[index], ...withTimestamp };
  } else {
    updatedList = [withTimestamp, ...current];
  }

  saveStoredProducts(updatedList);

  // Save to Cloud Firestore
  try {
    await saveCloudFirestoreProduct(withTimestamp);
  } catch (cloudErr) {
    console.warn('[Firestore] Error al guardar producto individual en la nube:', cloudErr);
  }

  // Direct server save
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withTimestamp),
    });
  } catch (err) {
    console.warn('[Server DB] Error al guardar producto individual:', err);
  }
}

// Multi-source fetcher to recover all products from Cloud Firestore + Local Storage + Server Disk
export async function fetchAllCloudAndServerProducts(): Promise<Product[]> {
  const deletedSet = getDeletedProductIds();
  
  // 1. Sync deleted IDs from server disk
  try {
    const res = await fetch('/api/products/deleted-ids');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.deletedIds)) {
        data.deletedIds.forEach((id: string) => deletedSet.add(id));
      }
    }
  } catch {}

  safeSet(KEYS.DELETED_PRODUCTS, Array.from(deletedSet));

  const map = new Map<string, Product>();

  const mergeItem = (p: Product) => {
    if (!p || !p.id || deletedSet.has(p.id)) return;
    const existing = map.get(p.id);
    if (!existing) {
      map.set(p.id, p);
    } else {
      const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const incomingTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
      if (incomingTime >= existingTime) {
        map.set(p.id, { ...existing, ...p });
      } else {
        map.set(p.id, { ...p, ...existing });
      }
    }
  };

  // 1. PRIMARY: Fetch from Cloud Firestore (central shared database across all computers & devices)
  try {
    const cloudProducts = await getCloudFirestoreProducts();
    if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
      cloudProducts.forEach(mergeItem);
    }
  } catch (cloudErr) {
    console.warn('[Firestore] Error al consultar productos en la nube:', cloudErr);
  }

  // 2. From Server Disk API (/api/products)
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        data.products.forEach(mergeItem);
      }
    }
  } catch (e) {
    console.warn('Lectura desde /api/products:', e);
  }

  // 3. From local storage
  const localProducts = safeGet<Product[]>(KEYS.PRODUCTS, []);
  const archiveProducts = safeGet<Product[]>(KEYS.PRODUCTS_ARCHIVE, []);
  if (Array.isArray(localProducts)) localProducts.forEach(mergeItem);
  if (Array.isArray(archiveProducts)) archiveProducts.forEach(mergeItem);

  // Initialize sample products if completely empty
  if (map.size === 0 && deletedSet.size === 0) {
    SAMPLE_PRODUCTS.forEach(mergeItem);
    bootstrapCloudFirestore(SAMPLE_PRODUCTS).catch(() => {});
  }

  const merged = Array.from(map.values()).filter((p) => !deletedSet.has(p.id));

  safeSet(KEYS.PRODUCTS, merged);
  safeSet(KEYS.PRODUCTS_ARCHIVE, merged);

  return merged;
}

// Categories
export function getStoredCategories(): Category[] {
  return safeGet<Category[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
}

export function saveStoredCategories(categories: Category[]): void {
  safeSet(KEYS.CATEGORIES, categories);
  saveCloudFirestoreCategories(categories).catch(() => {});
  try {
    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    }).catch(() => {});
  } catch {}
}

// Orders
export function getStoredOrders(): Order[] {
  const current = safeGet<Order[]>(KEYS.ORDERS, []);
  const archive = safeGet<Order[]>(KEYS.ORDERS_ARCHIVE, []);
  
  const map = new Map<string, Order>();
  [...archive, ...current].forEach((ord) => {
    const key = ord.orderNumber || ord.id;
    if (key) map.set(key, ord);
  });
  
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  return merged;
}

export function saveStoredOrders(orders: Order[]): void {
  const map = new Map<string, Order>();
  const existingArchive = safeGet<Order[]>(KEYS.ORDERS_ARCHIVE, []);
  [...existingArchive, ...orders].forEach((ord) => {
    const key = ord.orderNumber || ord.id;
    if (key) {
      const prev = map.get(key);
      map.set(key, prev ? { ...prev, ...ord } : ord);
    }
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  safeSet(KEYS.ORDERS, merged);
  safeSet(KEYS.ORDERS_ARCHIVE, merged);

  // Send bulk sync to server backend disk storage
  try {
    fetch('/api/orders/bulk-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: merged }),
    }).catch(() => {});
  } catch {}
}

export async function addStoredOrder(order: Order): Promise<void> {
  const current = getStoredOrders();
  const existsIndex = current.findIndex(
    (o) => (order.orderNumber && o.orderNumber === order.orderNumber) || (order.id && o.id === order.id)
  );

  let updatedList: Order[];
  if (existsIndex >= 0) {
    updatedList = [...current];
    updatedList[existsIndex] = { ...updatedList[existsIndex], ...order };
  } else {
    updatedList = [order, ...current];
  }

  saveStoredOrders(updatedList);

  // Save to Cloud Firestore
  try {
    await saveCloudFirestoreOrder(order);
  } catch (cloudErr) {
    console.warn('[Firestore] Error al guardar pedido en la nube:', cloudErr);
  }

  // Save directly to server disk endpoint (/api/orders)
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch (serverErr) {
    console.warn('[Server DB] Error al guardar pedido en servidor:', serverErr);
  }
}

export async function fetchAllCloudAndServerOrders(): Promise<Order[]> {
  const map = new Map<string, Order>();

  // 1. From local storage
  const localOrders = getStoredOrders();
  localOrders.forEach((o) => {
    const k = o.orderNumber || o.id;
    if (k) map.set(k, o);
  });

  // 2. From Server Disk API (/api/orders)
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        data.orders.forEach((o: Order) => {
          const k = o.orderNumber || o.id;
          if (k) {
            const existing = map.get(k);
            map.set(k, existing ? { ...existing, ...o } : o);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Lectura desde /api/orders:', e);
  }

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  if (merged.length > 0) {
    safeSet(KEYS.ORDERS, merged);
    safeSet(KEYS.ORDERS_ARCHIVE, merged);
  }

  return merged;
}

// Customer Leads & Inquiries Database
export function getStoredCustomerLeads(): CustomerLead[] {
  const leads = safeGet<CustomerLead[]>(KEYS.CUSTOMER_LEADS, []);
  if (!leads || leads.length === 0) {
    const initialLeads: CustomerLead[] = [
      {
        id: 'lead_1',
        name: 'Camila Ospina',
        phone: '3145678901',
        petName: 'Rocky (Golden Retriever)',
        message: 'Hola, quisiera confirmar si tienen disponibilidad de Chunky Adultos de 8 Kg y si hacen envíos a Usaquén hoy.',
        status: 'nuevo',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        source: 'formulario_contacto',
      },
      {
        id: 'lead_2',
        name: 'Carlos Mendoza',
        phone: '3109876543',
        petName: 'Milo (Gato Persa)',
        message: 'Buenas tardes, busco alimento Monello Cat y snacks Churu. ¿Cuánto tarda el domicilio a Suba?',
        status: 'contactado',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        source: 'formulario_contacto',
      },
    ];
    saveStoredCustomerLeads(initialLeads);
    return initialLeads;
  }
  return leads;
}

export function saveStoredCustomerLeads(leads: CustomerLead[]): void {
  safeSet(KEYS.CUSTOMER_LEADS, leads);
  try {
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads }),
    }).catch(() => {});
  } catch {}
}

export function addStoredCustomerLead(lead: CustomerLead): void {
  const current = getStoredCustomerLeads();
  const updated = [lead, ...current];
  saveStoredCustomerLeads(updated);
  saveCloudFirestoreLead(lead).catch(() => {});
  try {
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead }),
    }).catch(() => {});
  } catch {}
}

// Customer Reviews & Testimonials
export function getStoredReviews(): CustomerReview[] {
  const reviews = safeGet<CustomerReview[]>(KEYS.REVIEWS, INITIAL_REVIEWS);
  if (!reviews || reviews.length === 0) {
    saveStoredReviews(INITIAL_REVIEWS);
    return INITIAL_REVIEWS;
  }
  return reviews;
}

export function saveStoredReviews(reviews: CustomerReview[]): void {
  safeSet(KEYS.REVIEWS, reviews);
  try {
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews }),
    }).catch(() => {});
  } catch {}
}

export function addStoredReview(review: CustomerReview): void {
  const current = getStoredReviews();
  const updated = [review, ...current];
  saveStoredReviews(updated);
  try {
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review }),
    }).catch(() => {});
  } catch {}
}

// Contact Info (Store details, delivery fees, Wompi keys, phone, etc.)
export function isDeliveryBogota(cityOrZone?: string): boolean {
  if (!cityOrZone) return true;
  const norm = cityOrZone.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return (
    norm === 'bogota' ||
    norm === 'bogota d.c.' ||
    norm === 'bogota dc' ||
    norm === 'distrito capital' ||
    norm === 'cundinamarca - bogota' ||
    norm.includes('bogota') ||
    norm.includes('bogotá') ||
    norm.includes('distrito capital')
  );
}

export function calculateDeliveryFee(
  subtotal: number,
  cityOrZone?: string,
  contactInfo?: ContactInfo
): { fee: number; isFree: boolean; isBogota: boolean; zone: 'bogota' | 'nacional' } {
  const info = contactInfo || getStoredContactInfo();
  const bogotaFee = Number(info.shippingFeeBogota ?? 6500);
  const nationalFee = Number(info.shippingFeeNational ?? 13500);
  const minFree = Number(info.freeShippingMinimum ?? 150000);

  const isBogota = isDeliveryBogota(cityOrZone);
  const zone = isBogota ? 'bogota' : 'nacional';

  if (minFree > 0 && subtotal >= minFree) {
    return { fee: 0, isFree: true, isBogota, zone };
  }

  return {
    fee: isBogota ? bogotaFee : nationalFee,
    isFree: false,
    isBogota,
    zone,
  };
}

export function getStoredContactInfo(): ContactInfo {
  const info = safeGet<ContactInfo>(KEYS.CONTACT_INFO, INITIAL_CONTACT_INFO);
  let needsUpdate = false;
  let updated = { ...info };

  if (!updated.storeName || updated.storeName === 'LUNARY PET' || updated.storeName === 'Lunary Pet') {
    updated.storeName = 'LUNARY WORLD PETS';
    updated.nequiOwnerName = 'Lunary World Pets Colombia';
    needsUpdate = true;
  }

  if (updated.shippingFeeBogota === undefined || updated.shippingFeeBogota === null) {
    updated.shippingFeeBogota = 6500;
    needsUpdate = true;
  }

  if (updated.shippingFeeNational === undefined || updated.shippingFeeNational === null) {
    updated.shippingFeeNational = 13500;
    needsUpdate = true;
  }

  if (needsUpdate) {
    saveStoredContactInfo(updated);
    return updated;
  }
  return info;
}

export function saveStoredContactInfo(info: ContactInfo): void {
  safeSet(KEYS.CONTACT_INFO, info);
  saveCloudFirestoreSettings('contact', info).catch(() => {});
  // Sync to server disk
  try {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactInfo: info, aboutContent: getStoredAboutContent() }),
    }).catch(() => {});
  } catch {}
}

// About Content
export function getStoredAboutContent(): AboutContent {
  return safeGet<AboutContent>(KEYS.ABOUT, INITIAL_ABOUT_CONTENT);
}

export function saveStoredAboutContent(about: AboutContent): void {
  safeSet(KEYS.ABOUT, about);
  saveCloudFirestoreSettings('about', about).catch(() => {});
  try {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactInfo: getStoredContactInfo(), aboutContent: about }),
    }).catch(() => {});
  } catch {}
}

// Blog Posts
export function getStoredBlogPosts(): BlogPost[] {
  return safeGet<BlogPost[]>(KEYS.BLOG, INITIAL_BLOG_POSTS);
}

export function saveStoredBlogPosts(posts: BlogPost[]): void {
  safeSet(KEYS.BLOG, posts);
  try {
    fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts }),
    }).catch(() => {});
  } catch {}
}

// Admin Credentials
export function getStoredAdminCredentials(): AdminCredentials {
  const creds = safeGet<AdminCredentials>(KEYS.ADMIN_CREDENTIALS, INITIAL_ADMIN_CREDENTIALS);
  if (!creds || creds.passwordHash !== 'Lunary2027*') {
    const updated = { ...INITIAL_ADMIN_CREDENTIALS, passwordHash: 'Lunary2027*' };
    saveStoredAdminCredentials(updated);
    return updated;
  }
  return creds;
}

export function saveStoredAdminCredentials(creds: AdminCredentials): void {
  safeSet(KEYS.ADMIN_CREDENTIALS, creds);
}

// Admin Session
export function getIsAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(KEYS.ADMIN_LOGGED_IN) === 'true';
  } catch {
    return false;
  }
}

export function setIsAdminLoggedIn(loggedIn: boolean): void {
  try {
    if (loggedIn) {
      sessionStorage.setItem(KEYS.ADMIN_LOGGED_IN, 'true');
    } else {
      sessionStorage.removeItem(KEYS.ADMIN_LOGGED_IN);
    }
  } catch {
    // Ignore storage issues
  }
}

// Real-Time Multi-Device Cloud Firestore & Local Multi-Tab Synchronizer
export function subscribeToStoreCloudSync(callbacks: {
  onProductsUpdate?: (products: Product[]) => void;
  onCategoriesUpdate?: (categories: Category[]) => void;
  onSettingsUpdate?: (data: { contactInfo?: ContactInfo; aboutContent?: AboutContent }) => void;
  onOrdersUpdate?: (orders: Order[]) => void;
  onLeadsUpdate?: (leads: CustomerLead[]) => void;
  onReviewsUpdate?: (reviews: CustomerReview[]) => void;
  onBlogUpdate?: (posts: BlogPost[]) => void;
}): () => void {
  const unsubscribers: Array<() => void> = [];

  // 1. Real-time Cloud Firestore subscription for Products
  if (callbacks.onProductsUpdate) {
    const unsubProducts = subscribeToCloudFirestoreProducts((cloudProducts) => {
      if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        safeSet(KEYS.PRODUCTS, cloudProducts);
        safeSet(KEYS.PRODUCTS_ARCHIVE, cloudProducts);
        callbacks.onProductsUpdate?.(cloudProducts);
      }
    });
    unsubscribers.push(unsubProducts);
  }

  // 2. Real-time Cloud Firestore subscription for Categories
  if (callbacks.onCategoriesUpdate) {
    const unsubCats = subscribeToCloudFirestoreCategories((cloudCats) => {
      if (Array.isArray(cloudCats) && cloudCats.length > 0) {
        safeSet(KEYS.CATEGORIES, cloudCats);
        callbacks.onCategoriesUpdate?.(cloudCats);
      }
    });
    unsubscribers.push(unsubCats);
  }

  // 3. Real-time Cloud Firestore subscription for Settings (Contact & About)
  if (callbacks.onSettingsUpdate) {
    const unsubSettings = subscribeToCloudFirestoreSettings((cloudSettings) => {
      if (cloudSettings.contactInfo) safeSet(KEYS.CONTACT_INFO, cloudSettings.contactInfo);
      if (cloudSettings.aboutContent) safeSet(KEYS.ABOUT, cloudSettings.aboutContent);
      callbacks.onSettingsUpdate?.(cloudSettings);
    });
    unsubscribers.push(unsubSettings);
  }

  // 4. Real-time Cloud Firestore subscription for Orders
  if (callbacks.onOrdersUpdate) {
    const unsubOrders = subscribeToCloudFirestoreOrders((cloudOrders) => {
      if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
        safeSet(KEYS.ORDERS, cloudOrders);
        callbacks.onOrdersUpdate?.(cloudOrders);
      }
    });
    unsubscribers.push(unsubOrders);
  }

  // 5. Real-time Cloud Firestore subscription for Leads
  if (callbacks.onLeadsUpdate) {
    const unsubLeads = subscribeToCloudFirestoreLeads((cloudLeads) => {
      if (Array.isArray(cloudLeads) && cloudLeads.length > 0) {
        safeSet(KEYS.CUSTOMER_LEADS, cloudLeads);
        callbacks.onLeadsUpdate?.(cloudLeads);
      }
    });
    unsubscribers.push(unsubLeads);
  }

  // 6. Cross-tab storage listeners
  const handleStorageChange = (e: StorageEvent | CustomEvent) => {
    const key = (e as StorageEvent).key || (e as CustomEvent).detail?.key;

    if (!key || key === KEYS.PRODUCTS) {
      callbacks.onProductsUpdate?.(getStoredProducts());
    }
    if (!key || key === KEYS.CATEGORIES) {
      callbacks.onCategoriesUpdate?.(getStoredCategories());
    }
    if (!key || key === KEYS.CONTACT_INFO || key === KEYS.ABOUT) {
      callbacks.onSettingsUpdate?.({
        contactInfo: getStoredContactInfo(),
        aboutContent: getStoredAboutContent(),
      });
    }
    if (!key || key === KEYS.ORDERS) {
      callbacks.onOrdersUpdate?.(getStoredOrders());
    }
    if (!key || key === KEYS.CUSTOMER_LEADS) {
      callbacks.onLeadsUpdate?.(getStoredCustomerLeads());
    }
    if (!key || key === KEYS.REVIEWS) {
      callbacks.onReviewsUpdate?.(getStoredReviews());
    }
    if (!key || key === KEYS.BLOG) {
      callbacks.onBlogUpdate?.(getStoredBlogPosts());
    }
  };

  window.addEventListener('storage', handleStorageChange as EventListener);
  window.addEventListener('lunary_storage_update', handleStorageChange as EventListener);

  return () => {
    unsubscribers.forEach((u) => u());
    window.removeEventListener('storage', handleStorageChange as EventListener);
    window.removeEventListener('lunary_storage_update', handleStorageChange as EventListener);
  };
}

// Initial Cloud Firestore Sync and bootstrapping
export async function initializeCloudFirestoreSync(): Promise<void> {
  console.log('[Storage] Conectando a Cloud Firestore (Base de datos compartida entre todos los dispositivos)...');
  try {
    const local = getStoredProducts();
    await bootstrapCloudFirestore(local);
  } catch (err) {
    console.warn('[Storage] Error al inicializar Firestore:', err);
  }

  // Load server settings if available
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data?.settings?.contactInfo) {
        safeSet(KEYS.CONTACT_INFO, data.settings.contactInfo);
      }
      if (data?.settings?.aboutContent) {
        safeSet(KEYS.ABOUT, data.settings.aboutContent);
      }
    }
  } catch {}
}

// Helpers for resetting or populating sample data
export function resetProductsToSamples(): Product[] {
  clearAllDeletedProductIds();
  saveStoredProducts(SAMPLE_PRODUCTS);
  return SAMPLE_PRODUCTS;
}

export function clearAllProducts(): Product[] {
  const current = getStoredProducts();
  if (current.length > 0) {
    markMultipleProductsAsDeleted(current.map((p) => p.id));
  }
  saveStoredProducts([]);
  return [];
}

export interface SiteDataBackup {
  version: string;
  exportedAt: string;
  storeName: string;
  aboutContent: AboutContent;
  contactInfo: ContactInfo;
  products: Product[];
  categories: Category[];
  blogPosts: BlogPost[];
  reviews: CustomerReview[];
  orders: Order[];
  customerLeads: CustomerLead[];
}

export function getAllSiteDataBackup(): SiteDataBackup {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    storeName: getStoredContactInfo().storeName || 'LUNARY WORLD PETS',
    aboutContent: getStoredAboutContent(),
    contactInfo: getStoredContactInfo(),
    products: getStoredProducts(),
    categories: getStoredCategories(),
    blogPosts: getStoredBlogPosts(),
    reviews: getStoredReviews(),
    orders: getStoredOrders(),
    customerLeads: getStoredCustomerLeads(),
  };
}

export function restoreAllSiteDataBackup(data: Partial<SiteDataBackup>): { success: boolean; message: string } {
  try {
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'El archivo de respaldo no tiene un formato válido.' };
    }

    if (data.aboutContent) saveStoredAboutContent(data.aboutContent);
    if (data.contactInfo) saveStoredContactInfo(data.contactInfo);
    if (Array.isArray(data.products) && data.products.length > 0) saveStoredProducts(data.products);
    if (Array.isArray(data.categories) && data.categories.length > 0) saveStoredCategories(data.categories);
    if (Array.isArray(data.blogPosts)) saveStoredBlogPosts(data.blogPosts);
    if (Array.isArray(data.reviews)) saveStoredReviews(data.reviews);
    if (Array.isArray(data.orders)) saveStoredOrders(data.orders);
    if (Array.isArray(data.customerLeads)) saveStoredCustomerLeads(data.customerLeads);

    return { success: true, message: '¡Copia de seguridad restaurada correctamente!' };
  } catch (err) {
    console.error('Error restaurando respaldo:', err);
    return { success: false, message: 'Ocurrió un error al procesar el archivo de respaldo.' };
  }
}

export function downloadSiteBackupJSON(): void {
  try {
    const backup = getAllSiteDataBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Lunary_World_Pets_Respaldo_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error al descargar JSON de respaldo:', e);
  }
}

export function getStorageStats(): {
  totalItems: number;
  productsCount: number;
  ordersCount: number;
  leadsCount: number;
  reviewsCount: number;
  aboutStoryLength: number;
  lastUpdated: string;
} {
  const products = getStoredProducts();
  const orders = getStoredOrders();
  const leads = getStoredCustomerLeads();
  const reviews = getStoredReviews();
  const about = getStoredAboutContent();

  return {
    totalItems: products.length + orders.length + leads.length + reviews.length,
    productsCount: products.length,
    ordersCount: orders.length,
    leadsCount: leads.length,
    reviewsCount: reviews.length,
    aboutStoryLength: (about.story || '').length,
    lastUpdated: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
  };
}
