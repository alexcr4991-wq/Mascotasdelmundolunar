import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../lib/firebase';
import {
  AboutContent,
  BlogPost,
  Category,
  ContactInfo,
  CustomerLead,
  CustomerReview,
  Order,
  Product,
} from '../types';
import {
  INITIAL_ABOUT_CONTENT,
  INITIAL_CATEGORIES,
  INITIAL_CONTACT_INFO,
  SAMPLE_PRODUCTS,
} from '../data/initialData';

// Helper to remove undefined values before sending to Firestore
function sanitizeData<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  LEADS: 'customer_leads',
  REVIEWS: 'reviews',
  BLOG: 'blog_posts',
  SETTINGS: 'settings',
};

// -------------------------------------------------------------
// 1. PRODUCTS
// -------------------------------------------------------------

/**
 * Fetch all products from Cloud Firestore.
 */
export async function getCloudFirestoreProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    const products: Product[] = [];
    snap.forEach((d) => {
      const data = d.data() as Product;
      if (data && data.id) {
        products.push(data);
      }
    });
    return products;
  } catch (err) {
    console.warn('[Firestore] Error al cargar productos desde la nube:', err);
    return [];
  }
}

/**
 * Save or update a single product in Cloud Firestore.
 */
export async function saveCloudFirestoreProduct(product: Product): Promise<void> {
  if (!product || !product.id) return;
  const path = `${COLLECTIONS.PRODUCTS}/${product.id}`;
  try {
    const clean = sanitizeData({
      ...product,
      updatedAt: product.updatedAt || new Date().toISOString(),
    });
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), clean);
    console.log(`[Firestore] Producto ${product.name} (${product.id}) guardado en la nube.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Save multiple products to Cloud Firestore in batches of up to 450 items.
 */
export async function saveAllCloudFirestoreProducts(products: Product[]): Promise<void> {
  if (!Array.isArray(products) || products.length === 0) return;
  const path = COLLECTIONS.PRODUCTS;

  try {
    // Process in chunks of 450 (Firestore limit is 500 per batch)
    const chunkSize = 450;
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((prod) => {
        if (prod && prod.id) {
          const clean = sanitizeData({
            ...prod,
            updatedAt: prod.updatedAt || new Date().toISOString(),
          });
          const ref = doc(db, COLLECTIONS.PRODUCTS, prod.id);
          batch.set(ref, clean);
        }
      });
      await batch.commit();
    }
    console.log(`[Firestore] ${products.length} productos sincronizados exitosamente en la nube.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete a product from Cloud Firestore.
 */
export async function deleteCloudFirestoreProduct(productId: string): Promise<void> {
  if (!productId) return;
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    console.log(`[Firestore] Producto ${productId} eliminado de la nube.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Delete multiple products from Cloud Firestore.
 */
export async function deleteMultipleCloudFirestoreProducts(productIds: string[]): Promise<void> {
  if (!Array.isArray(productIds) || productIds.length === 0) return;
  const path = COLLECTIONS.PRODUCTS;
  try {
    const chunkSize = 450;
    for (let i = 0; i < productIds.length; i += chunkSize) {
      const chunk = productIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        if (id) {
          const ref = doc(db, COLLECTIONS.PRODUCTS, id);
          batch.delete(ref);
        }
      });
      await batch.commit();
    }
    console.log(`[Firestore] ${productIds.length} productos eliminados de la nube.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Listen for real-time changes to products from any device or session.
 */
export function subscribeToCloudFirestoreProducts(
  onUpdate: (products: Product[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.PRODUCTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as Product;
          if (item && item.id) items.push(item);
        });
        if (items.length > 0) {
          onUpdate(items);
        }
      },
      (error) => {
        console.warn('[Firestore onSnapshot Products]:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Error al suscribirse a productos:', err);
    return () => {};
  }
}

// -------------------------------------------------------------
// 2. CATEGORIES
// -------------------------------------------------------------

export async function saveCloudFirestoreCategories(categories: Category[]): Promise<void> {
  if (!Array.isArray(categories) || categories.length === 0) return;
  try {
    const batch = writeBatch(db);
    categories.forEach((cat) => {
      if (cat && cat.id) {
        const ref = doc(db, COLLECTIONS.CATEGORIES, cat.id);
        batch.set(ref, sanitizeData(cat));
      }
    });
    await batch.commit();
  } catch (err) {
    console.warn('[Firestore] Error guardando categorías:', err);
  }
}

export function subscribeToCloudFirestoreCategories(
  onUpdate: (categories: Category[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.CATEGORIES),
      (snapshot) => {
        const list: Category[] = [];
        snapshot.forEach((d) => {
          const cat = d.data() as Category;
          if (cat && cat.id) list.push(cat);
        });
        if (list.length > 0) onUpdate(list);
      },
      (err) => console.warn('[Firestore onSnapshot Categories]:', err)
    );
  } catch {
    return () => {};
  }
}

// -------------------------------------------------------------
// 3. STORE SETTINGS (Contact info & About content)
// -------------------------------------------------------------

export async function saveCloudFirestoreSettings(
  type: 'contact' | 'about',
  data: ContactInfo | AboutContent
): Promise<void> {
  const path = `${COLLECTIONS.SETTINGS}/${type}`;
  try {
    const clean = sanitizeData({
      id: type,
      data,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, COLLECTIONS.SETTINGS, type), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToCloudFirestoreSettings(
  onUpdate: (data: { contactInfo?: ContactInfo; aboutContent?: AboutContent }) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.SETTINGS),
      (snapshot) => {
        let contactInfo: ContactInfo | undefined;
        let aboutContent: AboutContent | undefined;
        snapshot.forEach((d) => {
          const id = d.id;
          const payload = d.data();
          if (id === 'contact' && payload?.data) {
            contactInfo = payload.data as ContactInfo;
          }
          if (id === 'about' && payload?.data) {
            aboutContent = payload.data as AboutContent;
          }
        });
        if (contactInfo || aboutContent) {
          onUpdate({ contactInfo, aboutContent });
        }
      },
      (err) => console.warn('[Firestore onSnapshot Settings]:', err)
    );
  } catch {
    return () => {};
  }
}

// -------------------------------------------------------------
// 4. ORDERS
// -------------------------------------------------------------

export async function saveCloudFirestoreOrder(order: Order): Promise<void> {
  if (!order) return;
  const docId = order.orderNumber || order.id || `order_${Date.now()}`;
  const path = `${COLLECTIONS.ORDERS}/${docId}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ORDERS, docId), sanitizeData(order));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToCloudFirestoreOrders(
  onUpdate: (orders: Order[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.ORDERS),
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          const ord = d.data() as Order;
          if (ord) list.push(ord);
        });
        if (list.length > 0) {
          list.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          onUpdate(list);
        }
      },
      (err) => console.warn('[Firestore onSnapshot Orders]:', err)
    );
  } catch {
    return () => {};
  }
}

// -------------------------------------------------------------
// 5. CUSTOMER LEADS
// -------------------------------------------------------------

export async function saveCloudFirestoreLead(lead: CustomerLead): Promise<void> {
  if (!lead || !lead.id) return;
  const path = `${COLLECTIONS.LEADS}/${lead.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.LEADS, lead.id), sanitizeData(lead));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToCloudFirestoreLeads(
  onUpdate: (leads: CustomerLead[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.LEADS),
      (snapshot) => {
        const list: CustomerLead[] = [];
        snapshot.forEach((d) => {
          const lead = d.data() as CustomerLead;
          if (lead && lead.id) list.push(lead);
        });
        if (list.length > 0) {
          list.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          onUpdate(list);
        }
      },
      (err) => console.warn('[Firestore onSnapshot Leads]:', err)
    );
  } catch {
    return () => {};
  }
}

// -------------------------------------------------------------
// 6. INITIALIZATION & AUTO-SEEDING
// -------------------------------------------------------------

/**
 * Prime the Firestore Cloud Database if empty so all devices have shared data.
 */
export async function bootstrapCloudFirestore(existingLocalProducts?: Product[]): Promise<Product[]> {
  await testFirestoreConnection();

  try {
    const cloudProducts = await getCloudFirestoreProducts();

    if (cloudProducts.length > 0) {
      console.log(`[Firestore] Sincronizados ${cloudProducts.length} productos desde la base de datos central.`);
      return cloudProducts;
    }

    // Database is empty in cloud: seed it with local products or samples
    console.log('[Firestore] Base de datos en la nube vacía. Inicializando catálogo en Firestore...');
    const seed = (existingLocalProducts && existingLocalProducts.length > 0)
      ? existingLocalProducts
      : SAMPLE_PRODUCTS;

    await saveAllCloudFirestoreProducts(seed);
    await saveCloudFirestoreCategories(INITIAL_CATEGORIES);
    await saveCloudFirestoreSettings('contact', INITIAL_CONTACT_INFO);
    await saveCloudFirestoreSettings('about', INITIAL_ABOUT_CONTENT);

    return seed;
  } catch (err) {
    console.warn('[Firestore] Error durante bootstrap:', err);
    return existingLocalProducts || SAMPLE_PRODUCTS;
  }
}
