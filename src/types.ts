export type PetType = 'perro' | 'gato' | 'ambos';

export interface ProductVariant {
  id: string;
  name: string; // ej: "2 Kg", "15 Kg", "Grande 100x70cm", "Pequeño"
  price: number; // precio específico de esta presentación en COP
  originalPrice?: number; // precio original antes de descuento (opcional)
  stockCount?: number; // stock físico específico de esta presentación
  sku?: string; // referencia o código opcional
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in COP (precio base o inicial)
  originalPrice?: number; // for discount display
  category: string; // 'alimentos' | 'juguetes' | 'higiene' | 'camas' | 'accesorios' | 'salud' | etc.
  petType: PetType;
  imageUrl: string; // can be base64 dataUrl or remote URL
  additionalImages?: string[];
  inStock: boolean;
  stockCount: number;
  isFeatured: boolean;
  rating?: number;
  weightOrSize?: string;
  brand?: string;
  lifeStage?: 'cachorro' | 'adulto' | 'senior' | 'todas';
  sackSizeCategory?: 'pequeno' | 'mediano' | 'grande';
  hasVariants?: boolean;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerReview {
  id: string;
  author: string;
  petName: string;
  petBreed?: string;
  petType: PetType;
  city: string;
  rating: number; // 1 - 5
  comment: string;
  productName?: string;
  date: string;
  avatarUrl?: string;
  verifiedPurchase: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  petType: PetType;
  description: string;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string;
  selectedVariant?: ProductVariant;
}

export type PaymentMethod = 'wompi' | 'nequi' | 'whatsapp';

export type OrderStatus = 'pendiente' | 'pagado' | 'en_camino' | 'entregado' | 'cancelado' | 'rechazado';

export interface OrderItemSummary {
  productId: string;
  productName: string;
  variantName?: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerEmail?: string;
  customerNotes?: string;
  cancellationReason?: string;
  items: OrderItemSummary[];
  subtotal: number;
  deliveryFee: number;
  deliveryZone?: 'bogota' | 'nacional';
  discountAmount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentReceiptUrl?: string; // base64 or url
  wompiTransactionId?: string;
  wompiPaymentUrl?: string;
  wompiPaymentMethodType?: string; // 'CARD' | 'PSE' | 'BANCOLOMBIA_TRANSFER' | 'NEQUI'
  wompiStatus?: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  isSubscription?: boolean;
  subscriptionPlan?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface WompiGatewayConfig {
  environment: 'sandbox' | 'production';
  publicKey: string;
  isConfigured: boolean;
  paymentLink?: string;
  webhookUrl?: string;
  redirectUrl?: string;
}

export interface WompiAdminCredentials {
  environment: 'sandbox' | 'production';
  publicKey: string;
  privateKey: string;
  integritySecret: string;
  eventsSecret?: string;
  paymentLink?: string;
  hasPrivateKey?: boolean;
  hasIntegritySecret?: boolean;
  hasEventsSecret?: boolean;
  webhookUrl?: string;
  redirectUrl?: string;
}

export interface WompiTransactionVerification {
  success: boolean;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING' | 'UNKNOWN';
  transactionId?: string;
  reference?: string;
  amountInCents?: number;
  paymentMethodType?: string;
  message?: string;
}

export interface ContactInfo {
  storeName: string;
  slogan: string;
  phone: string; // 3214231616
  whatsapp: string; // 3214231616
  nequiNumber: string; // 3214231616
  nequiOwnerName: string;
  nequiQrUrl?: string;
  wompiPaymentLink?: string; // e.g. https://checkout.wompi.co/l/VPOS_Qn5COa
  bancolombiaAccount?: string;
  bancolombiaType?: 'Ahorros' | 'Corriente';
  bancolombiaOwner?: string;
  email: string;
  address: string;
  city: string;
  schedule: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  topBannerText: string;
  deliveryCoverage: string;
  freeShippingMinimum: number;
  standardShippingFee: number;
  shippingFeeBogota?: number;
  shippingFeeNational?: number;
}

export interface AboutContent {
  title: string;
  subtitle: string;
  mission: string;
  vision: string;
  story: string;
  bannerImage: string;
  values: {
    title: string;
    description: string;
    icon: string;
  }[];
  stats: {
    label: string;
    value: string;
  }[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  petType: PetType;
  summary: string;
  content: string;
  author: string;
  date: string;
  coverImage: string;
  readTime: string;
  isPublished: boolean;
}

export type LeadStatus = 'nuevo' | 'contactado' | 'interesado' | 'link_enviado' | 'convertido' | 'archivado';

export interface CustomerLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  petName?: string;
  petType?: PetType;
  petBreed?: string;
  petAge?: string;
  message: string;
  status: LeadStatus;
  createdAt: string;
  source?: 'formulario_contacto' | 'whatsapp_boton' | 'consulta_producto' | 'checkout_wompi' | 'checkout_pedido' | 'social_radar' | 'facebook' | 'instagram' | 'tiktok';
  platform?: 'facebook' | 'instagram' | 'tiktok' | 'whatsapp' | 'otro';
  queryOrContext?: string;
  interestedProduct?: string;
  estimatedValue?: number;
  profileUrl?: string;
  notes?: string;
  lastReplyDraft?: string;
  purchaseHistory?: OrderItemSummary[];
  lastContactedAt?: string;
  preferredProduct?: string;
  loyaltyPoints?: number;
}

export interface SocialRadarOpportunity {
  id: string;
  clientName: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'whatsapp';
  channelName: string;
  timeAgo: string;
  clientComment: string;
  productKeyword: string;
  city: string;
  suggestedAction: string;
  estimatedBudget: number;
}

export interface AdminCredentials {
  username: string;
  passwordHash: string; // plain or simple encoded for local storage
  lastPasswordChange: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}
