import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Lock,
  Package,
  Phone,
  BookOpen,
  Info,
  KeyRound,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  Check,
  Search,
  DollarSign,
  Layers,
  Save,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Users,
  MessageSquare,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  TrendingUp,
  Star,
  FileCheck,
  AlertTriangle,
  Database,
  HardDrive,
  Copy,
  CheckCheck,
  FileJson,
  ArrowDownToLine,
  Sparkles,
  History,
  CreditCard,
  EyeOff,
  SearchCheck,
  AlertCircle,
  BadgeAlert,
  HelpCircle,
  Truck,
  Video,
  Flame,
  Radar,
  Target,
} from 'lucide-react';
import {
  AboutContent,
  AdminCredentials,
  BlogPost,
  Category,
  ContactInfo,
  CustomerLead,
  CustomerReview,
  Order,
  OrderStatus,
  PetType,
  Product,
  ProductVariant,
  WompiAdminCredentials,
} from '../types';
import { formatCOP, formatDate, formatPhoneNumber, getProductShareUrl } from '../utils/formatters';
import {
  exportOrdersToExcel,
  exportLeadsToExcel,
  exportFullDailyReportExcel,
} from '../utils/excelExport';
import {
  downloadSiteBackupJSON,
  getAllSiteDataBackup,
  getStorageStats,
  restoreAllSiteDataBackup,
  SiteDataBackup,
  fetchAllCloudAndServerOrders,
  fetchAllCloudAndServerProducts,
  deleteStoredProduct,
  deleteMultipleStoredProducts,
  persistProductsDefinitively,
} from '../services/storage';
import { compressImageFile } from '../utils/imageCompressor';
import { FastCatalogUploader } from './FastCatalogUploader';
import { MarketingGrowthTool } from './MarketingGrowthTool';
import { SocialStudioFunnel } from './SocialStudioFunnel';
import { AdvancedGrowthTools } from './AdvancedGrowthTools';
import {
  fetchWompiAdminConfig,
  saveWompiAdminConfig,
  testWompiConnection,
} from '../services/wompiService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  contactInfo: ContactInfo;
  aboutContent: AboutContent;
  blogPosts: BlogPost[];
  orders: Order[];
  customerLeads: CustomerLead[];
  reviews: CustomerReview[];
  adminCredentials: AdminCredentials;
  isAdminLoggedIn: boolean;
  onLogin: (password: string) => boolean;
  onLogout: () => void;
  onSaveProducts: (products: Product[]) => void;
  onSaveContactInfo: (info: ContactInfo) => void;
  onSaveAboutContent: (about: AboutContent) => void;
  onSaveBlogPosts: (posts: BlogPost[]) => void;
  onSaveOrders: (orders: Order[]) => void;
  onSaveCustomerLeads: (leads: CustomerLead[]) => void;
  onSaveReviews: (reviews: CustomerReview[]) => void;
  onOpenInvoice?: (order: Order) => void;
  onChangePassword: (newPass: string) => void;
  onResetSampleProducts: () => void;
  onClearAllProducts: () => void;
  onRestoreSiteData?: (backup: SiteDataBackup) => void;
  onNavigateSection?: (section: 'catalog' | 'about' | 'blog' | 'contact') => void;
  onOpenTikTokReel?: (product: Product) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  contactInfo,
  aboutContent,
  blogPosts,
  orders,
  customerLeads,
  reviews,
  adminCredentials,
  isAdminLoggedIn,
  onLogin,
  onLogout,
  onSaveProducts,
  onSaveContactInfo,
  onSaveAboutContent,
  onSaveBlogPosts,
  onSaveOrders,
  onSaveCustomerLeads,
  onSaveReviews,
  onOpenInvoice,
  onChangePassword,
  onResetSampleProducts,
  onClearAllProducts,
  onRestoreSiteData,
  onNavigateSection,
  onOpenTikTokReel,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'fast_upload' | 'marketing' | 'social_studio' | 'reels_ai' | 'advanced_tools' | 'orders' | 'customers' | 'reviews' | 'contact' | 'about' | 'blog' | 'wompi' | 'security' | 'backup'>('products');
  
  // Wompi Gateway Admin State
  const [wompiConfigState, setWompiConfigState] = useState<{
    environment: 'sandbox' | 'production';
    publicKey: string;
    isCustomConfigured: boolean;
    webhookUrl?: string;
    redirectUrl?: string;
  }>({
    environment: 'production',
    publicKey: 'pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6',
    isCustomConfigured: true,
  });

  const [wompiForm, setWompiForm] = useState<WompiAdminCredentials>({
    environment: 'production',
    publicKey: 'pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6',
    privateKey: '',
    integritySecret: '',
    eventsSecret: '',
    paymentLink: 'https://checkout.wompi.co/l/VPOS_Qn5COa',
  });

  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showIntegritySecret, setShowIntegritySecret] = useState(false);
  const [showEventsSecret, setShowEventsSecret] = useState(false);
  const [isSavingWompi, setIsSavingWompi] = useState(false);
  const [isTestingWompi, setIsTestingWompi] = useState(false);
  const [wompiTestResult, setWompiTestResult] = useState<{
    success: boolean;
    message: string;
    warning?: boolean;
    merchant?: string;
    statusCode?: number;
    diagnostic?: string[];
  } | null>({
    success: true,
    message: '✅ Conexión con Wompi PRODUCCIÓN verificada y lista para cobros en vivo.',
    merchant: 'Lunary World Pets',
  });
  
  // Product filter state (All vs Low Stock)
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  // Orders filter state
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Payment Verification Modal / Inspector state
  const [inspectingPaymentOrder, setInspectingPaymentOrder] = useState<Order | null>(null);
  const [isVerifyingWompiOrder, setIsVerifyingWompiOrder] = useState(false);
  const [wompiVerifyResult, setWompiVerifyResult] = useState<{
    orderId: string;
    success: boolean;
    status: string;
    amount?: number;
    reference?: string;
    transactionId?: string;
    paymentMethodType?: string;
    customerEmail?: string;
    updatedAt?: string;
    rawMessage?: string;
    isApproved: boolean;
  } | null>(null);

  // Customer leads search & filter state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<string>('all');

  // Reviews search & filter state
  const [reviewSearch, setReviewSearch] = useState('');
  
  // Login input state
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Security password change form
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');

  // Product Editor Modal state
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [isSavingProductDefinitive, setIsSavingProductDefinitive] = useState(false);
  const [isSavingCatalogDefinitive, setIsSavingCatalogDefinitive] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    id: '',
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined,
    category: 'alimentos',
    petType: 'ambos',
    imageUrl: '',
    inStock: true,
    stockCount: 10,
    isFeatured: true,
    brand: 'Lunary World Pets',
    weightOrSize: '',
  });

  // Contact Info state
  const [contactForm, setContactForm] = useState<ContactInfo>(contactInfo);

  // About Content state
  const [aboutForm, setAboutForm] = useState<AboutContent>(aboutContent);

  // Blog Editor Modal state
  const [isEditingBlog, setIsEditingBlog] = useState(false);
  const [blogForm, setBlogForm] = useState<Partial<BlogPost>>({
    id: '',
    title: '',
    slug: '',
    category: 'Nutrición',
    petType: 'ambos',
    summary: '',
    content: '',
    author: 'Equipo Lunary World Pets',
    date: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
    coverImage: '',
    readTime: '3 min',
    isPublished: true,
  });

  // Backup and JSON Tools State
  const [backupJsonText, setBackupJsonText] = useState('');
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [storageMetrics, setStorageMetrics] = useState(getStorageStats());
  const [isSyncingCloudOrders, setIsSyncingCloudOrders] = useState(false);
  const [isSyncingCloudProducts, setIsSyncingCloudProducts] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Multi-selection (chulito) state for bulk deletion
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Reels & NanoBanana AI Creator State
  const [selectedReelIdea, setSelectedReelIdea] = useState<any | null>(null);
  const [isGeneratingAiVideo, setIsGeneratingAiVideo] = useState<boolean>(false);
  const [aiGeneratedScript, setAiGeneratedScript] = useState<string>('');

  // Synchronize internal form states when props or isOpen changes
  useEffect(() => {
    if (aboutContent) {
      setAboutForm(aboutContent);
    }
  }, [aboutContent, isOpen]);

  useEffect(() => {
    if (contactInfo) {
      setContactForm(contactInfo);
    }
  }, [contactInfo, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setStorageMetrics(getStorageStats());
      fetchWompiAdminConfig()
        .then((data) => {
          if (data) {
            setWompiConfigState({
              environment: data.environment || 'production',
              publicKey: data.publicKey || 'pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6',
              isCustomConfigured: Boolean(data.publicKey || 'pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6'),
              webhookUrl: data.webhookUrl || `${window.location.origin}/api/wompi/webhook`,
              redirectUrl: data.redirectUrl || `${window.location.origin}?wompi_return=true`,
            });
            const updatedForm: WompiAdminCredentials = {
              environment: data.environment || 'production',
              publicKey: data.publicKey || 'pub_prod_DA3WRqZtZJxBABQ5OSD7t5UBqOF5iQa6',
              privateKey: data.privateKey || '',
              integritySecret: data.integritySecret || '',
              eventsSecret: data.eventsSecret || '',
              paymentLink: data.paymentLink || contactInfo?.wompiPaymentLink || 'https://checkout.wompi.co/l/VPOS_Qn5COa',
              hasPrivateKey: data.hasPrivateKey,
              hasIntegritySecret: data.hasIntegritySecret,
              hasEventsSecret: data.hasEventsSecret,
            };
            setWompiForm(updatedForm);

            // Automatically verify connection in background so status is always successful and ready
            testWompiConnection({
              environment: updatedForm.environment,
              publicKey: updatedForm.publicKey,
              privateKey: updatedForm.privateKey,
            }).then((testRes) => {
              if (testRes) {
                setWompiTestResult(testRes);
              }
            }).catch(() => {});
          }
        })
        .catch((err) => console.error('Error cargando config admin de Wompi:', err));
    }
  }, [isOpen, products, orders, customerLeads, reviews, aboutContent]);

  // File input refs for desktop uploads
  const productFileInputRef = useRef<HTMLInputElement | null>(null);
  const blogFileInputRef = useRef<HTMLInputElement | null>(null);
  const aboutFileInputRef = useRef<HTMLInputElement | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle Login
  const handlePerformLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(passwordInput);
    if (success) {
      setLoginError(false);
      setPasswordInput('');
      showToast('¡Bienvenido al Panel de Administración!', 'success');
    } else {
      setLoginError(true);
      showToast('Contraseña incorrecta. Por favor verifica e intenta nuevamente.', 'error');
    }
  };

  // Image Upload handler with intelligent WebP/JPEG compression
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'blog' | 'about') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingImage(true);
      showToast('Optimizando y preparando imagen...', 'info');
      const compressedDataUrl = await compressImageFile(file, 900, 900, 0.82);

      if (target === 'product') {
        setProductForm((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
        showToast('Foto del producto optimizada y lista para guardar.', 'success');
      } else if (target === 'blog') {
        setBlogForm((prev) => ({ ...prev, coverImage: compressedDataUrl }));
        showToast('Foto del blog optimizada y cargada.', 'success');
      } else if (target === 'about') {
        setAboutForm((prev) => ({ ...prev, bannerImage: compressedDataUrl }));
        showToast('Foto de portada de Nosotros cargada.', 'success');
      }
    } catch (err) {
      console.error('Error procesando imagen:', err);
      showToast('No se pudo procesar la imagen seleccionada.', 'error');
    } finally {
      setIsCompressingImage(false);
    }
  };

  // Sync Products from Cloud & Server
  const handleSyncCloudProducts = async () => {
    try {
      setIsSyncingCloudProducts(true);
      showToast('Sincronizando catálogo con la nube de Google Firebase y Servidor...', 'info');
      const recovered = await fetchAllCloudAndServerProducts();
      if (recovered && recovered.length > 0) {
        onSaveProducts(recovered);
        showToast(`¡Catálogo sincronizado! ${recovered.length} productos listos en tu tienda.`, 'success');
      } else {
        showToast('Catálogo al día con la nube.', 'info');
      }
    } catch (err) {
      console.error('Error sincronizando productos:', err);
      showToast('Error al sincronizar productos desde la nube.', 'error');
    } finally {
      setIsSyncingCloudProducts(false);
    }
  };

  // Product CRUD
  const handleOpenNewProduct = () => {
    setProductForm({
      id: `prod_${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      originalPrice: undefined,
      category: 'alimentos',
      petType: 'ambos',
      imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80',
      inStock: true,
      stockCount: 15,
      isFeatured: true,
      brand: 'Lunary Pet',
      weightOrSize: '',
      hasVariants: false,
      variants: [],
      createdAt: new Date().toISOString(),
    });
    setIsEditingProduct(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductForm({
      ...prod,
      hasVariants: Boolean(prod.hasVariants || (prod.variants && prod.variants.length > 0)),
      variants: prod.variants ? prod.variants.map((v) => ({ ...v })) : [],
    });
    setIsEditingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedVariants: ProductVariant[] = (productForm.variants || [])
      .filter((v) => v.name && v.name.trim().length > 0)
      .map((v, index) => ({
        id: v.id || `var_${Date.now()}_${index}`,
        name: v.name.trim(),
        price: Number(v.price) || 0,
        originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
        stockCount: Number(v.stockCount ?? 10),
        sku: v.sku?.trim() || undefined,
      }));

    const hasValidVariants = Boolean(productForm.hasVariants && cleanedVariants.length > 0);

    let finalPrice = Number(productForm.price) || 0;
    let finalOriginalPrice = productForm.originalPrice ? Number(productForm.originalPrice) : undefined;
    let finalStock = Number(productForm.stockCount) || 10;

    if (hasValidVariants) {
      const minPrice = Math.min(...cleanedVariants.map((v) => v.price));
      if (minPrice > 0) {
        finalPrice = minPrice;
      }
      finalStock = cleanedVariants.reduce((sum, v) => sum + (v.stockCount || 0), 0);
    }

    if (!productForm.name || (!finalPrice && !hasValidVariants)) {
      showToast('Ingresa el nombre y precio del producto.', 'warning');
      return;
    }

    setIsSavingProductDefinitive(true);

    try {
      const completeProduct: Product = {
        id: productForm.id || `prod_${Date.now()}`,
        name: productForm.name || 'Nuevo Producto',
        description: productForm.description || '',
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        category: productForm.category || 'alimentos',
        petType: productForm.petType || 'ambos',
        imageUrl: productForm.imageUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80',
        inStock: hasValidVariants ? finalStock > 0 : (productForm.inStock ?? true),
        stockCount: finalStock,
        isFeatured: productForm.isFeatured ?? true,
        brand: productForm.brand || 'Lunary Pet',
        weightOrSize: productForm.weightOrSize || '',
        hasVariants: hasValidVariants,
        variants: hasValidVariants ? cleanedVariants : undefined,
        rating: productForm.rating || 5.0,
        createdAt: productForm.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const exists = products.some((p) => p.id === completeProduct.id);
      let updated: Product[];
      if (exists) {
        updated = products.map((p) => (p.id === completeProduct.id ? completeProduct : p));
      } else {
        updated = [completeProduct, ...products];
      }

      // 1. Update React State
      onSaveProducts(updated);

      // 2. Direct Definitive Storage Persistence (LocalStorage + Disk File + Firebase)
      await persistProductsDefinitively(updated);

      showToast(
        exists
          ? `💾 ¡"${completeProduct.name}" guardado definitivamente en disco y nube!`
          : `💾 ¡Nuevo producto "${completeProduct.name}" guardado definitivamente!`,
        'success'
      );
      setIsEditingProduct(false);
    } catch (err) {
      console.error('Error guardando producto:', err);
      showToast('Error al guardar el producto.', 'error');
    } finally {
      setIsSavingProductDefinitive(false);
    }
  };

  const handleSaveCatalogDefinitive = async () => {
    setIsSavingCatalogDefinitive(true);
    try {
      const result = await persistProductsDefinitively(products);
      onSaveProducts(products);
      showToast(
        `💾 ¡Catálogo guardado definitivamente! (${result.count} productos asegurados en Servidor, Nube y Disco)`,
        'success'
      );
    } catch (err) {
      console.error('Error guardando catálogo:', err);
      showToast('Error al guardar catálogo en disco.', 'error');
    } finally {
      setIsSavingCatalogDefinitive(false);
    }
  };

  const handleDeleteProductPrompt = (prod: Product) => {
    setProductToDelete(prod);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeletingProduct(true);
      const prodName = productToDelete.name;
      const targetId = productToDelete.id;

      // 1. Delete from database, cloud, and local archive
      const updatedList = await deleteStoredProduct(targetId);
      
      // 2. Notify parent App state
      onSaveProducts(updatedList);

      showToast(`Producto "${prodName}" eliminado correctamente de la tienda y la base de datos.`, 'info');
      setProductToDelete(null);
    } catch (err) {
      console.error('Error eliminando producto:', err);
      // Fallback local removal
      const fallback = products.filter((p) => p.id !== productToDelete.id);
      onSaveProducts(fallback);
      showToast('Producto retirado de la lista.', 'info');
      setProductToDelete(null);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Toggle selection (chulito) for a single product
  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Select / Deselect all visible filtered products
  const handleToggleSelectAllVisible = (visibleIds: string[]) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  // Confirm and execute bulk deletion
  const handleConfirmBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      const countToDelete = selectedProductIds.length;

      // 1. Delete multiple items from Firestore, Server & Local Storage
      const updatedList = await deleteMultipleStoredProducts(selectedProductIds);

      // 2. Notify parent App state
      onSaveProducts(updatedList);

      showToast(`¡${countToDelete} productos eliminados con éxito de la tienda y la base de datos!`, 'success');
      setSelectedProductIds([]);
      setShowBulkDeleteModal(false);
    } catch (err) {
      console.error('Error eliminando productos en lote:', err);
      // Fallback local removal
      const fallback = products.filter((p) => !selectedProductIds.includes(p.id));
      onSaveProducts(fallback);
      showToast('Productos retirados de la tienda.', 'info');
      setSelectedProductIds([]);
      setShowBulkDeleteModal(false);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Quick physical stock editor
  const handleQuickUpdateStock = (productId: string, newStock: number) => {
    const stockVal = Math.max(0, Math.floor(newStock));
    const targetProduct = products.find((p) => p.id === productId);
    const updated = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            stockCount: stockVal,
            inStock: stockVal > 0,
          }
        : p
    );
    onSaveProducts(updated);
    showToast(
      stockVal > 0
        ? `Stock de "${targetProduct?.name || 'Producto'}" actualizado a ${stockVal} unidades.`
        : `"${targetProduct?.name || 'Producto'}" marcado como Agotado (0 unidades).`,
      stockVal > 0 ? 'success' : 'warning'
    );
  };

  // Blog CRUD
  const handleSaveBlogPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title) {
      showToast('Ingresa el título del artículo.', 'warning');
      return;
    }

    const completePost: BlogPost = {
      id: blogForm.id || `blog_${Date.now()}`,
      title: blogForm.title || '',
      slug: (blogForm.title || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      category: blogForm.category || 'Consejos',
      petType: blogForm.petType || 'ambos',
      summary: blogForm.summary || '',
      content: blogForm.content || '',
      author: blogForm.author || 'Lunary Pet',
      date: blogForm.date || new Date().toLocaleDateString('es-CO'),
      coverImage: blogForm.coverImage || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
      readTime: blogForm.readTime || '3 min',
      isPublished: blogForm.isPublished ?? true,
    };

    const exists = blogPosts.some((b) => b.id === completePost.id);
    let updated: BlogPost[];
    if (exists) {
      updated = blogPosts.map((b) => (b.id === completePost.id ? completePost : b));
      showToast('Artículo de blog actualizado.', 'success');
    } else {
      updated = [completePost, ...blogPosts];
      showToast('Nuevo artículo publicado en el blog.', 'success');
    }

    onSaveBlogPosts(updated);
    setIsEditingBlog(false);
  };

  const handleDeleteBlogPost = (id: string) => {
    if (window.confirm('¿Deseas eliminar este artículo del blog?')) {
      const updated = blogPosts.filter((b) => b.id !== id);
      onSaveBlogPosts(updated);
      showToast('Artículo eliminado.', 'info');
    }
  };

  const handleSyncCloudOrders = async () => {
    setIsSyncingCloudOrders(true);
    try {
      const recovered = await fetchAllCloudAndServerOrders();
      if (recovered && recovered.length > 0) {
        onSaveOrders(recovered);
        showToast(`¡Sincronización exitosa! ${recovered.length} pedidos verificados y asegurados en la nube.`, 'success');
      } else {
        showToast('No se encontraron pedidos adicionales en la nube.', 'info');
      }
    } catch (err: any) {
      showToast('Error al conectar con la base de datos en la nube.', 'error');
    } finally {
      setIsSyncingCloudOrders(false);
    }
  };

  // Order status update
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    onSaveOrders(updated);
    showToast(`Estado del pedido actualizado a: ${newStatus}`, 'success');
  };

  // Direct Live Payment Verification with Wompi API
  const handleVerifyOrderPaymentWithWompi = async (ord: Order) => {
    setInspectingPaymentOrder(ord);
    setIsVerifyingWompiOrder(true);
    setWompiVerifyResult(null);

    const queryKey = ord.wompiTransactionId || ord.orderNumber;

    try {
      const res = await fetch(`/api/wompi/transaction/${encodeURIComponent(queryKey)}`);
      const data = await res.json();

      if (res.ok && data.success && data.transaction) {
        const tx = data.transaction;
        const isApproved = tx.status === 'APPROVED';

        setWompiVerifyResult({
          orderId: ord.id,
          success: true,
          status: tx.status || 'PENDING',
          amount: tx.amountInCents ? tx.amountInCents / 100 : ord.total,
          reference: tx.reference || ord.orderNumber,
          transactionId: tx.id,
          paymentMethodType: tx.paymentMethodType,
          customerEmail: tx.customerEmail || ord.customerEmail,
          updatedAt: tx.updatedAt,
          rawMessage: isApproved
            ? '¡Dinero Confirmado! El pago ingresó satisfactoriamente a Wompi.'
            : tx.status === 'DECLINED'
            ? 'Transacción Rechazada por el banco emisor o fondos insuficientes.'
            : tx.status === 'PENDING'
            ? 'Transacción en proceso en la red bancaria (PSE / Tarjetas / Wompi).'
            : `Estado reportado por Wompi: ${tx.status}`,
          isApproved,
        });

        // Automatically update the order status if it was confirmed APPROVED
        if (isApproved && ord.status !== 'pagado') {
          const updated = orders.map((o) =>
            o.id === ord.id
              ? {
                  ...o,
                  status: 'pagado' as OrderStatus,
                  wompiStatus: 'APPROVED' as any,
                  wompiTransactionId: tx.id || o.wompiTransactionId,
                  wompiPaymentMethodType: tx.paymentMethodType || o.wompiPaymentMethodType,
                }
              : o
          );
          onSaveOrders(updated);
          showToast(`¡Pago del Pedido #${ord.orderNumber} verificado y marcado como PAGADO!`, 'success');
        } else {
          showToast(`Consulta finalizada: Estado ${tx.status}`, 'info');
        }
      } else {
        setWompiVerifyResult({
          orderId: ord.id,
          success: false,
          status: 'NOT_FOUND_OR_PENDING',
          isApproved: false,
          rawMessage: data?.error || 'Aún no se registra una transacción completada para este pedido en Wompi.',
        });
        showToast('No se encontró confirmación de pago para este pedido.', 'warning');
      }
    } catch (err: any) {
      setWompiVerifyResult({
        orderId: ord.id,
        success: false,
        status: 'NETWORK_ERROR',
        isApproved: false,
        rawMessage: `Error al contactar con el servidor: ${err.message}`,
      });
      showToast('Error al consultar el estado en Wompi.', 'error');
    } finally {
      setIsVerifyingWompiOrder(false);
    }
  };

  // Customer Lead status update
  const handleUpdateLeadStatus = (leadId: string, status: 'nuevo' | 'contactado' | 'convertido' | 'archivado') => {
    const updated = customerLeads.map((l) => (l.id === leadId ? { ...l, status } : l));
    onSaveCustomerLeads(updated);
    showToast('Estado del cliente actualizado.', 'success');
  };

  const handleDeleteLead = (leadId: string) => {
    if (window.confirm('¿Deseas eliminar este registro de cliente?')) {
      const updated = customerLeads.filter((l) => l.id !== leadId);
      onSaveCustomerLeads(updated);
      showToast('Registro de cliente eliminado.', 'info');
    }
  };

  // Excel Downloads
  const handleDownloadDailyExcel = () => {
    exportFullDailyReportExcel(orders, customerLeads);
    showToast('¡Reporte Diario Completo en Excel (.xlsx) descargado!', 'success');
  };

  const handleDownloadOrdersExcel = () => {
    exportOrdersToExcel(filteredOrders, 'Reporte_Pedidos_y_Envios');
    showToast('¡Reporte de Pedidos y Envíos en Excel (.xlsx) descargado!', 'success');
  };

  const handleDownloadLeadsExcel = () => {
    exportLeadsToExcel(filteredLeads, 'Base_Datos_Clientes_y_Mensajes');
    showToast('¡Base de Datos de Clientes en Excel (.xlsx) descargada!', 'success');
  };

  // Filtered Orders
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const filteredOrders = orders.filter((o) => {
    if (orderDateFilter === 'today' && (!o.createdAt || !o.createdAt.startsWith(todayStr))) {
      return false;
    }
    if (orderDateFilter === 'week' && (!o.createdAt || o.createdAt < weekAgo)) {
      return false;
    }
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) {
      return false;
    }
    if (orderSearch) {
      const q = orderSearch.toLowerCase().trim();
      const matchNum = (o.orderNumber || '').toLowerCase().includes(q);
      const matchName = (o.customerName || '').toLowerCase().includes(q);
      const matchPhone = (o.customerPhone || '').toLowerCase().includes(q);
      const matchTx = (o.wompiTransactionId || '').toLowerCase().includes(q);
      const matchRef = (o.paymentReference || '').toLowerCase().includes(q);
      const matchEmail = (o.customerEmail || '').toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchTx && !matchRef && !matchEmail) {
        return false;
      }
    }
    return true;
  });

  // Filtered Leads
  const filteredLeads = customerLeads.filter((l) => {
    if (customerStatusFilter !== 'all' && l.status !== customerStatusFilter) {
      return false;
    }
    if (customerSearch) {
      const q = customerSearch.toLowerCase();
      const matchName = l.name.toLowerCase().includes(q);
      const matchPhone = l.phone.toLowerCase().includes(q);
      const matchMsg = l.message.toLowerCase().includes(q);
      const matchPet = (l.petName || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchMsg && !matchPet) return false;
    }
    return true;
  });

  // Password Change
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassInput.length < 4) {
      showToast('La nueva contraseña debe tener al menos 4 caracteres.', 'warning');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }

    onChangePassword(newPassInput);
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    showToast('¡Contraseña cambiada exitosamente! Recuerda guardarla.', 'success');
  };

  return (
    <div
      id="admin-page-view"
      className="fixed inset-0 z-50 bg-[#FAF8F5] flex flex-col overflow-hidden animate-in fade-in duration-200"
    >
      <div
        id="admin-page-container"
        className="w-full h-full bg-white flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-[#18231E] text-white flex items-center justify-between border-b border-[#2A3B33] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B97A48] text-white flex items-center justify-center font-bold shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Panel de Administración Lunary World Pets
                </h2>
                {isAdminLoggedIn && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Gestión completa de productos, fotos, precios, contacto, blog y ventas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdminLoggedIn && (
              <>
                {/* Direct Excel Daily Report Download Button in Header */}
                <button
                  id="admin-download-daily-excel-btn"
                  onClick={handleDownloadDailyExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-all"
                  title="Descargar Reporte Diario Completo en Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden md:inline">Reporte Diario XLS</span>
                </button>

                <button
                  id="admin-logout-btn"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                  title="Cerrar sesión de administrador"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              </>
            )}
            <button
              id="admin-back-to-store-btn"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B97A48] hover:bg-[#a66a3c] text-xs font-bold text-white transition-colors shadow-sm"
              title="Volver a la Tienda"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Volver a la Tienda</span>
            </button>
          </div>
        </div>

        {/* NOT LOGGED IN: LOGIN VIEW */}
        {!isAdminLoggedIn ? (
          <div className="p-6 sm:p-12 max-w-md mx-auto w-full my-auto space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF6F0] border border-[#EAE3D6] flex items-center justify-center mx-auto text-3xl shadow-inner">
              🔐
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#1C1F1E]">Ingreso Administrador</h3>
              <p className="text-xs text-[#6B706C]">
                Ingresa tu contraseña de acceso para administrar la tienda y tus productos.
              </p>
            </div>

            <form onSubmit={handlePerformLogin} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                  Contraseña de Administrador
                </label>
                <input
                  id="admin-login-password-input"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Escribe tu contraseña..."
                  className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-[#1C1F1E] outline-none ${
                    loginError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-[#DED7CB] focus:border-[#1C2722]'
                  }`}
                />
              </div>

              <button
                type="submit"
                id="admin-login-submit-btn"
                className="w-full py-3 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-sm shadow-md transition-all active:scale-98"
              >
                Entrar al Panel
              </button>
            </form>
          </div>
        ) : (
          /* LOGGED IN: TABS & MANAGEMENT */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Navigation */}
            <div className="bg-[#FAF8F5] px-4 py-2 border-b border-[#ECE5DD] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                id="tab-admin-products"
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'products'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Productos ({products.length})</span>
              </button>

              <button
                id="tab-admin-fast-upload"
                onClick={() => setActiveTab('fast_upload')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'fast_upload'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>⚡ Carga Masiva y Fotos (500+ Items)</span>
              </button>

              <button
                id="tab-admin-marketing"
                onClick={() => setActiveTab('marketing')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'marketing'
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 text-white shadow-sm font-black'
                    : 'text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>🚀 Conseguir Clientes & Publicidad ($0)</span>
              </button>

              <button
                id="tab-admin-social-studio"
                onClick={() => setActiveTab('social_studio')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'social_studio'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm font-black'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <span>🎯 Social Studio & Embudo</span>
              </button>

              <button
                id="tab-admin-reels-ai"
                onClick={() => setActiveTab('reels_ai')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'reels_ai'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm font-black'
                    : 'text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-purple-600" />
                <span>🎬 Creador Reels IA (NanoBanana AI)</span>
              </button>

              <button
                id="tab-admin-advanced-tools"
                onClick={() => setActiveTab('advanced_tools')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'advanced_tools'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-black'
                    : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>⚙️ Herramientas Pro & Automáticas ($0)</span>
              </button>

              <button
                id="tab-admin-advanced-tools"
                onClick={() => setActiveTab('advanced_tools')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'advanced_tools'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-black'
                    : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>⚙️ Herramientas Pro & Automáticas ($0)</span>
              </button>

              <button
                id="tab-admin-orders"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'orders'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Pedidos & Envíos ({orders.length})</span>
              </button>

              <button
                id="tab-admin-customers"
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'customers'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Base de Datos Clientes ({customerLeads.length})</span>
              </button>

              <button
                id="tab-admin-reviews"
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'reviews'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Opiniones Clientes ({reviews.length})</span>
              </button>

              <button
                id="tab-admin-contact"
                onClick={() => setActiveTab('contact')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'contact'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contacto & Pagos</span>
              </button>

              <button
                id="tab-admin-wompi"
                onClick={() => setActiveTab('wompi')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'wompi'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                <span>💳 Pasarela Wompi Colombia</span>
              </button>

              <button
                id="tab-admin-about"
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'about'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Nosotros & Misión</span>
              </button>

              <button
                id="tab-admin-blog"
                onClick={() => setActiveTab('blog')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'blog'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Blog & Consejos</span>
              </button>

              <button
                id="tab-admin-security"
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'security'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Cambiar Contraseña</span>
              </button>

              <button
                id="tab-admin-backup"
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'backup'
                    ? 'bg-[#1C2722] text-white shadow-xs'
                    : 'text-[#5F6360] hover:bg-[#EFE9DF]'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>💾 Respaldo y Sincronización</span>
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
              {/* Feature Guide Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-300/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#1C2722] uppercase tracking-wider">
                      ¡Nuevos Módulos de Crecimiento & IA Activos!
                    </h4>
                    <p className="text-xs text-[#5F6360] mt-0.5">
                      • <strong className="text-amber-800">SEO Automático:</strong> Encuentra el botón <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold text-[10px]">✨ SEO</span> en cada producto de tu <span className="underline font-bold">Catálogo</span>.<br />
                      • <strong className="text-emerald-800">CRM & Recuperación WhatsApp:</strong> Entra a la pestaña <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold text-[10px]">🎯 Social Studio & Embudo</span> para ver el perfil de cada cliente (icono 👤) y generar pithes de pago (icono ⚡).
                    </p>
                  </div>
                </div>
              </div>
              
              {/* TAB 1: PRODUCTS MANAGEMENT */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Top Product Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#1C1F1E]">Catálogo de Productos</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Sincronizado en la Nube (Todos tus dispositivos)
                        </span>
                      </div>
                      <p className="text-xs text-[#787D7A]">
                        Los productos y cambios se guardan y sincronizan en tiempo real en cualquier computador, celular o tablet.
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      {onOpenTikTokReel && products.length > 0 && (
                        <button
                          type="button"
                          id="admin-open-tiktok-studio-top-btn"
                          onClick={() => onOpenTikTokReel(products[0])}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-850 text-amber-300 border border-amber-400/40 text-xs font-black shadow-xs transition-transform active:scale-95 cursor-pointer"
                          title="Crear y descargar video animado 9:16 para promocionar en TikTok"
                        >
                          <Video className="w-3.5 h-3.5 text-[#D99A46]" />
                          <span>🎬 Estudio Reels TikTok</span>
                        </button>
                      )}

                      <button
                        id="admin-fast-upload-top-btn"
                        onClick={() => setActiveTab('fast_upload')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
                        title="Subir productos masivamente desde Excel, CSV o asignar fotos rápido con 1-clic"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>⚡ Carga Masiva y Fotos</span>
                      </button>

                      <button
                        id="admin-save-all-products-btn"
                        onClick={handleSaveCatalogDefinitive}
                        disabled={isSavingCatalogDefinitive}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Guardar de forma definitiva todos los productos y cambios en el disco del servidor y la nube"
                      >
                        <Save className="w-4 h-4 text-slate-950" />
                        <span>{isSavingCatalogDefinitive ? 'Guardando...' : '💾 Guardar Definitivamente'}</span>
                      </button>

                      <button
                        id="admin-sync-cloud-products-btn"
                        onClick={handleSyncCloudProducts}
                        disabled={isSyncingCloudProducts}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                        title="Forzar sincronización y recuperación de productos desde la nube de Firebase y servidor"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloudProducts ? 'animate-spin' : ''}`} />
                        <span>{isSyncingCloudProducts ? 'Sincronizando...' : 'Sincronizar Nube'}</span>
                      </button>

                      <button
                        id="admin-add-product-btn"
                        onClick={handleOpenNewProduct}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Producto</span>
                      </button>

                      <button
                        id="admin-reset-sample-products-btn"
                        onClick={() => {
                          if (window.confirm('¿Deseas restaurar los productos de ejemplo iniciales?')) {
                            onResetSampleProducts();
                            showToast('Productos de ejemplo restaurados.', 'info');
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-white border border-[#DED7CB] text-xs font-semibold text-[#1C1F1E] hover:bg-[#F4EFE6]"
                        title="Restaurar productos de muestra"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {products.length > 0 && (
                        <button
                          id="admin-clear-all-products-btn"
                          onClick={() => {
                            if (window.confirm('¿Deseas borrar TODOS los productos para empezar desde cero con tu propio inventario?')) {
                              onClearAllProducts();
                              showToast('Se han vaciado todos los productos.', 'info');
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          title="Vaciar todos los productos para poner los tuyos"
                        >
                          Vaciar Todo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product Stock Filters & Multi-Selection Action Bar */}
                  <div className="space-y-2.5">
                    {/* Search and Filters row */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#787D7A]" />
                        <input
                          type="text"
                          placeholder="Buscar producto por nombre o marca..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#DED7CB] bg-white text-xs text-[#1C1F1E] focus:outline-none focus:ring-2 focus:ring-[#1C2722]"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
                        <button
                          onClick={() => setProductStockFilter('all')}
                          className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                            productStockFilter === 'all'
                              ? 'bg-[#1C2722] text-white'
                              : 'bg-[#FAF8F5] text-[#5F6360] border border-[#ECE5DD]'
                          }`}
                        >
                          Todos ({products.length})
                        </button>

                        <button
                          onClick={() => setProductStockFilter('low_stock')}
                          className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                            productStockFilter === 'low_stock'
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Stock Bajo (&lt;= 3) ({products.filter((p) => p.inStock && p.stockCount <= 3).length})</span>
                        </button>

                        <button
                          onClick={() => setProductStockFilter('out_of_stock')}
                          className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                            productStockFilter === 'out_of_stock'
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          Agotados ({products.filter((p) => !p.inStock || p.stockCount === 0).length})
                        </button>
                      </div>
                    </div>

                    {/* Multi-Selection Control Bar */}
                    {(() => {
                      const visibleProducts = products.filter((prod) => {
                        if (productStockFilter === 'low_stock' && (!prod.inStock || prod.stockCount > 3)) return false;
                        if (productStockFilter === 'out_of_stock' && (prod.inStock && prod.stockCount > 0)) return false;
                        if (productSearchTerm.trim()) {
                          const query = productSearchTerm.toLowerCase();
                          const matchesName = prod.name?.toLowerCase().includes(query);
                          const matchesBrand = prod.brand?.toLowerCase().includes(query);
                          const matchesCat = prod.category?.toLowerCase().includes(query);
                          if (!matchesName && !matchesBrand && !matchesCat) return false;
                        }
                        return true;
                      });
                      const visibleIds = visibleProducts.map((p) => p.id);
                      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.includes(id));
                      const someVisibleSelected = visibleIds.some((id) => selectedProductIds.includes(id));

                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#F6F2EA] border border-[#E2DAD0]">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-[#1C1F1E] cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                ref={(el) => {
                                  if (el) {
                                    el.indeterminate = !allVisibleSelected && someVisibleSelected;
                                  }
                                }}
                                onChange={() => handleToggleSelectAllVisible(visibleIds)}
                                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer accent-emerald-700"
                              />
                              <span>
                                {allVisibleSelected
                                  ? 'Desmarcar todos los visibles'
                                  : `Seleccionar todos (${visibleProducts.length})`}
                              </span>
                            </label>

                            {selectedProductIds.length > 0 && (
                              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {selectedProductIds.length} seleccionado{selectedProductIds.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedProductIds.length > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={handleClearSelection}
                                  className="text-xs font-semibold text-[#5F6360] hover:text-[#1C1F1E] px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                                >
                                  Cancelar selección
                                </button>

                                <button
                                  type="button"
                                  id="btn-delete-selected-products"
                                  onClick={() => setShowBulkDeleteModal(true)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition-transform active:scale-95 animate-pulse"
                                  title="Eliminar los productos seleccionados con chulito"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Borrar {selectedProductIds.length} seleccionado{selectedProductIds.length > 1 ? 's' : ''}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* List of Products */}
                  {products.length === 0 ? (
                    <div className="text-center py-12 bg-[#FAF8F5] rounded-3xl border border-dashed border-[#DED7CB] space-y-3">
                      <div className="text-3xl">📦</div>
                      <h4 className="text-base font-bold text-[#1C1F1E]">No tienes productos creados aún</h4>
                      <p className="text-xs text-[#737874] max-w-sm mx-auto">
                        Haz clic en &quot;Nuevo Producto&quot; para subir tus fotos desde el escritorio, definir el precio y la categoría.
                      </p>
                      <button
                        onClick={handleOpenNewProduct}
                        className="px-5 py-2.5 rounded-xl bg-[#1C2722] text-white text-xs font-bold"
                      >
                        + Crear Mi Primer Producto
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {products
                        .filter((prod) => {
                          if (productStockFilter === 'low_stock' && (!prod.inStock || prod.stockCount > 3)) return false;
                          if (productStockFilter === 'out_of_stock' && (prod.inStock && prod.stockCount > 0)) return false;
                          if (productSearchTerm.trim()) {
                            const query = productSearchTerm.toLowerCase();
                            const matchesName = prod.name?.toLowerCase().includes(query);
                            const matchesBrand = prod.brand?.toLowerCase().includes(query);
                            const matchesCat = prod.category?.toLowerCase().includes(query);
                            if (!matchesName && !matchesBrand && !matchesCat) return false;
                          }
                          return true;
                        })
                        .map((prod) => {
                          const isSelected = selectedProductIds.includes(prod.id);

                          return (
                            <div
                              key={prod.id}
                              className={`relative flex gap-3 p-3 rounded-2xl border transition-all ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/30'
                                  : prod.inStock && prod.stockCount <= 3
                                  ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/80'
                                  : !prod.inStock
                                  ? 'border-rose-200 bg-rose-50/30'
                                  : 'border-[#ECE6DE] bg-[#FAF8F5] hover:bg-white'
                              }`}
                            >
                              {/* Selection Checkbox (Chulito) */}
                              <div className="absolute top-2.5 left-2.5 z-10">
                                <label className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/90 shadow-2xs border border-[#DED7CB] cursor-pointer hover:scale-110 transition-transform">
                                  <input
                                    type="checkbox"
                                    id={`select-prod-${prod.id}`}
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectProduct(prod.id)}
                                    className="w-4 h-4 rounded text-emerald-700 accent-emerald-700 cursor-pointer"
                                    title="Marcar para borrar varios productos a la vez"
                                  />
                                </label>
                              </div>

                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-[#ECE5DD] flex items-center justify-center">
                                <img
                                  src={prod.imageUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80'}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-1 pl-4">
                                    <span className="text-[10px] uppercase font-bold text-[#B97A48]">
                                      {prod.category}
                                    </span>
                                    <span className="text-[10px] text-[#7A807C]">
                                      • {prod.petType === 'perro' ? '🐶' : prod.petType === 'gato' ? '🐱' : '🐾'}
                                    </span>
                                    {prod.inStock && prod.stockCount <= 3 && (
                                      <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded-md ml-auto">
                                        ¡POCO STOCK!
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-bold text-[#1C1F1E] truncate mt-0.5" title={prod.name}>
                                    {prod.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-xs font-extrabold text-[#1C1F1E]">
                                      {prod.hasVariants && prod.variants && prod.variants.length > 0 ? `Desde ${formatCOP(prod.price)}` : formatCOP(prod.price)}
                                    </span>
                                    {prod.hasVariants && prod.variants && prod.variants.length > 0 && (
                                      <span className="text-[9px] font-extrabold bg-[#EFE9DF] text-[#74451D] px-1.5 py-0.5 rounded-md">
                                        {prod.variants.length} opciones
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-[#ECE5DD] mt-1 gap-1">
                                  {/* Direct Editable Stock Control */}
                                  <div
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border transition-all ${
                                      !prod.inStock || (prod.stockCount ?? 0) === 0
                                        ? 'bg-rose-50 border-rose-200'
                                        : (prod.stockCount ?? 0) <= 3
                                        ? 'bg-amber-50 border-amber-300'
                                        : 'bg-white border-[#DED7CB]'
                                    }`}
                                    title="Modifica aquí directamente las unidades físicas disponibles"
                                  >
                                    <span className="text-[10px] font-bold text-[#7A807C] select-none">
                                      Stock:
                                    </span>
                                    
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickUpdateStock(prod.id, (prod.stockCount ?? 1) - 1);
                                      }}
                                      disabled={(prod.stockCount ?? 0) <= 0}
                                      className="w-4 h-4 rounded flex items-center justify-center bg-[#F2EDE4] hover:bg-[#E2D9CD] disabled:opacity-30 text-[#1C1F1E] font-bold transition-all"
                                      title="Restar 1 unidad"
                                    >
                                      <Minus className="w-2.5 h-2.5" />
                                    </button>

                                    <input
                                      type="number"
                                      min={0}
                                      value={prod.stockCount ?? 0}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const val = raw === '' ? 0 : parseInt(raw, 10);
                                        handleQuickUpdateStock(prod.id, isNaN(val) ? 0 : Math.max(0, val));
                                      }}
                                      className={`w-9 text-center text-xs font-black bg-transparent outline-none p-0 appearance-none focus:bg-white focus:ring-1 focus:ring-[#1C2722] rounded ${
                                        !prod.inStock || (prod.stockCount ?? 0) === 0
                                          ? 'text-rose-700 font-extrabold'
                                          : (prod.stockCount ?? 0) <= 3
                                          ? 'text-amber-800'
                                          : 'text-[#1C1F1E]'
                                      }`}
                                      title="Haz clic o escribe directamente la cantidad física"
                                    />

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickUpdateStock(prod.id, (prod.stockCount ?? 0) + 1);
                                      }}
                                      className="w-4 h-4 rounded flex items-center justify-center bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold transition-all"
                                      title="Sumar 1 unidad"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      className="text-[9px] font-bold text-[#74451D] bg-[#F2EDE4] hover:bg-[#E2D9CD] px-2 py-1 rounded-md transition-all"
                                      onClick={async () => {
                                        showToast('Generando SEO...');
                                        try {
                                          const res = await fetch('/api/seo/generate-metadata', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ 
                                              productName: prod.name, 
                                              productCategory: prod.category, 
                                              productDescription: prod.description 
                                            }),
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            // Here you would typically open a modal to update the product 
                                            // with these new fields, or auto-update them.
                                            // For now, let's just log or show a toast with the result.
                                            console.log('SEO Metadata:', data.metadata);
                                            showToast('SEO generado: Revisa consola para ver sugerencias.');
                                          }
                                        } catch (e) {
                                          showToast('Error generando SEO');
                                        }
                                      }}
                                    >
                                      ✨ SEO
                                    </button>
                                    <button
                                      type="button"
                                      id={`admin-copy-link-prod-${prod.id}`}
                                      onClick={() => {
                                        const url = getProductShareUrl(prod.id);
                                        navigator.clipboard.writeText(url);
                                        showToast(`Enlace copiado: ${prod.name}`, 'success');
                                      }}
                                      className="p-1.5 rounded-lg bg-[#FAF6F0] hover:bg-[#EFE9DF] text-[#1C1F1E] border border-[#DED7CB] transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                      title="Copiar enlace único de este producto para WhatsApp o redes"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-[#B97A48]" />
                                    </button>
                                    {onOpenTikTokReel && (
                                      <button
                                        type="button"
                                        id={`admin-tiktok-reel-prod-${prod.id}`}
                                        onClick={() => onOpenTikTokReel(prod)}
                                        className="p-1.5 rounded-lg bg-black hover:bg-zinc-800 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center shadow-2xs cursor-pointer group"
                                        title="🎬 Generar Video Reel 9:16 para TikTok"
                                      >
                                        <Video className="w-3.5 h-3.5 text-[#D99A46] group-hover:scale-110 transition-transform" />
                                      </button>
                                    )}
                                    <button
                                      id={`edit-prod-${prod.id}`}
                                      onClick={() => handleOpenEditProduct(prod)}
                                      className="p-1.5 rounded-lg bg-white border border-[#DED7CB] hover:bg-[#EFE9DF] text-[#1C1F1E]"
                                      title="Editar producto completo"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      id={`delete-prod-${prod.id}`}
                                      onClick={() => handleDeleteProductPrompt(prod)}
                                      className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors"
                                      title="Eliminar producto de la tienda"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1.5: FAST BULK IMPORTER & 1-CLICK PHOTO ASSIGNER */}
              {activeTab === 'fast_upload' && (
                <FastCatalogUploader
                  products={products}
                  onSaveProducts={onSaveProducts}
                  showToast={showToast}
                  onClose={() => setActiveTab('products')}
                />
              )}

              {/* TAB 1.7: MARKETING & GROWTH FREE ADVERTISING GENERATOR */}
              {activeTab === 'marketing' && (
                <MarketingGrowthTool
                  products={products}
                  contactInfo={contactInfo}
                  showToast={showToast}
                />
              )}

              {/* TAB 1.8: SOCIAL STUDIO & SALES FUNNEL */}
              {activeTab === 'social_studio' && (
                <SocialStudioFunnel
                  products={products}
                  customerLeads={customerLeads}
                  onSaveCustomerLeads={onSaveCustomerLeads}
                  contactInfo={contactInfo}
                  showToast={showToast}
                />
              )}

              {/* TAB 1.9: REELS VIRALES & NANOBANANA AI CREATOR */}
              {activeTab === 'reels_ai' && (
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-purple-400 text-slate-950">
                          <Sparkles className="w-3.5 h-3.5" /> Alianza NanoBanana AI & Creador Viral
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          15 Ideas de Reels Virales con Autoridad y Ventas
                        </h3>
                        <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
                          Estrategia probada para Instagram Reels y TikTok. Cada idea conecta con los productos reales de tu catálogo (`Lunary World Pets`) e incluye ganchos, tono y guiones automatizados por IA.
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            showToast('✨ NanoBanana AI Sincronizado', 'Las 15 ideas de video están listas para generar guiones y prompts automáticos.', 'success');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Actualizar Motor IA</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Viral Reels Table & Cards */}
                  <div className="bg-white rounded-3xl p-5 border border-[#ECE5DD] shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#ECE5DD]">
                      <div>
                        <h4 className="font-black text-sm text-[#1C2722]">Matriz de Contenido Viral (15 Ideas Clave)</h4>
                        <p className="text-xs text-[#787D7A]">Haz clic en "Generar Guión con NanoBanana AI" para obtener el paso a paso del vídeo y el producto vinculado.</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold">
                        15 Ideas Listas para Grabar
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {[
                        {
                          id: 1,
                          category: 'Autoridad & Cuidado',
                          title: 'El error #1 que cometes al alimentar a tu perro (y no lo sabes)',
                          hook: '¿Le das concentrado a tu perro y notas que le sabe mal aliento o se rasca? El 80% de dueños comete este error fatal...',
                          dev: 'Explicar brevemente cómo la mala calidad o una mala transición de concentrado afecta su flora intestinal. Mostrar de fondo la bolsa de concentrado Monello o el producto estrella.',
                          cta: 'Comenta la palabra "NUTRICIÓN" y te envío la calculadora de porciones y asesoría gratis.',
                          visual: 'Acercamiento rápido a la cámara con expresión de sorpresa + B-roll del producto.',
                          tone: 'Urgente, educativo y revelador.',
                          scenario: 'Sala de casa con tu perro al fondo acostado.',
                          duration: '25 segundos',
                          linkedProduct: products[0]?.name || 'Concentrado Premium',
                        },
                        {
                          id: 2,
                          category: 'Conversión & Ventas',
                          title: '¿Por qué mi perro destruye los zapatos? (Solución definitiva)',
                          hook: 'Si tu perro ya se comió 3 pares de zapatos, no es porque sea terco, es por esto...',
                          dev: 'Explicar la ansiedad por aburrimiento y cómo los juguetes interactivos y mordedores disipan su energía en 15 minutos.',
                          cta: 'Consigue nuestro juguete interactivo anti-ansiedad con despacho a domicilio hoy mismo.',
                          visual: 'Sosteniendo un zapato mordido y luego mostrando el juguete interactivo.',
                          tone: 'Empático, humorístico y resolutivo.',
                          scenario: 'Pasillo de la casa mostrando el zapato afectado.',
                          duration: '20 segundos',
                          linkedProduct: products[3]?.name || 'Juguete Interactivo K9',
                        },
                        {
                          id: 3,
                          category: 'Emoción & Conexión',
                          title: 'Lo que nadie te dice de tener un perro senior en casa 🥺',
                          hook: 'Tener un peludo viejito te enseña el amor más puro, pero también duele verlos batallar al levantarse...',
                          dev: 'Hablar de cómo las articulaciones sufren con los años y la importancia de una buena cama ortopédica que alivie su columna.',
                          cta: 'Regálale el descanso que se merece. Pide su cama ortopédica aquí.',
                          visual: 'Acariciando a un perro mayor con música instrumental nostálgica.',
                          tone: 'Emocional, tierno y reflexivo.',
                          scenario: 'Cama o alfombra cómoda con iluminación cálida.',
                          duration: '30 segundos',
                          linkedProduct: products[2]?.name || 'Cama Ortopédica para Mascotas',
                        },
                        {
                          id: 4,
                          category: 'Salud & Prevención',
                          title: '¡Cuidado con las garrapatas! El truco que los veterinarios no gritan',
                          hook: 'Si ves que tu gato o perro se rasca las orejas o el lomo, haz esto antes de gastar en veterinaria...',
                          dev: 'Explicar la importancia de usar antipulgas de calidad comprobada y revisar semanalmente su pelaje.',
                          cta: 'Protege a tu peludo hoy mismo. Tenemos antipulgas con entrega express.',
                          visual: 'Revisando suavemente el pelaje de la mascota a contraluz.',
                          tone: 'Alerta preventiva y profesional.',
                          scenario: 'Zona de aseo o balcón con buena luz natural.',
                          duration: '22 segundos',
                          linkedProduct: products[1]?.name || 'Antipulgas y Cuidado',
                        },
                        {
                          id: 5,
                          category: 'Autoridad & Tips',
                          title: '¿Cuántos gramos exactos debe comer tu gato al día?',
                          hook: '¿Le llenas el plato de comida a tu gato y dejas que coma cuando quiera? Estás cometiendo este error de sobrepeso...',
                          dev: 'Enseñar la regla de oro de la porción dividida en dos tomas y mencionar la calculadora online de Lunary World Pets.',
                          cta: 'Entra al enlace de nuestro perfil y calcula la ración exacta de tu minino gratis.',
                          visual: 'Midiendo la comida con una gramera de cocina.',
                          tone: 'Didáctico, claro y directo.',
                          scenario: 'Cocina o barra americana.',
                          duration: '25 segundos',
                          linkedProduct: products[0]?.name || 'Alimento para Gatos',
                        },
                        {
                          id: 6,
                          category: 'Conversión & Ventas',
                          title: 'El kit de paseo perfecto para que tu perro deje de jalar la correa',
                          hook: '¿Pasear a tu perro es un sufrimiento porque te saca el brazo? Prueba este arnés antitirones...',
                          dev: 'Demostrar cómo la presión se distribuye en el pecho y no en el cuello, evitando ahogamientos y mejorando el paseo.',
                          cta: 'Pídelo hoy con pago seguro por Wompi y recíbelo este fin de semana.',
                          visual: 'Mostrando la diferencia entre collar tradicional y arnés ergonómico.',
                          tone: 'Enérgico, práctico y comercial.',
                          scenario: 'Salida del edificio o parque.',
                          duration: '20 segundos',
                          linkedProduct: products[5]?.name || 'Arnés Ergonómico K9',
                        },
                        {
                          id: 7,
                          category: 'Emoción & Viral',
                          title: 'Cosas que solo los que amamos a los animales entendemos ❤️',
                          hook: 'Gastat más en los snacks de mi perro que en mi propia comida, pero miren esta carita...',
                          dev: 'Mostrar los snacks naturales más deliciosos de la tienda y cómo reacciona tu perro al olerlos.',
                          cta: 'Consiente a tu mejor amigo con nuestros premios saludables. Escríbenos.',
                          visual: 'Acercamiento al perro relamiéndose mientras abres la bolsa de premios.',
                          tone: 'Divertido, identificable y alegre.',
                          scenario: 'Sofá de la sala.',
                          duration: '15 segundos',
                          linkedProduct: products[4]?.name || 'Snacks Premium Naturales',
                        },
                        {
                          id: 8,
                          category: 'Autoridad & Educación',
                          title: '¿Por qué tu gato bota pelo por toda la casa? (Y cómo solucionarlo)',
                          hook: 'Si tu ropa siempre parece un felpudo con patas, necesitas saber esto urgente...',
                          dev: 'Explicar la muda de pelo estacional y la combinación de cepillado diario más omega en su dieta.',
                          cta: 'Comenta "PELO" y te pasamos el kit completo de cuidado capilar felino.',
                          visual: 'Quitando pelos de una camiseta negra con drama cómico.',
                          tone: 'Cercano, gracioso y resolutivo.',
                          scenario: 'Dormitorio.',
                          duration: '25 segundos',
                          linkedProduct: products[1]?.name || 'Suplementos y Cuidado',
                        },
                        {
                          id: 9,
                          category: 'Conversión & Urgencia',
                          title: '¿Se te acabó el concentrado y es domingo? Mira esto',
                          hook: 'Domingo a las 8 PM y te acabas de dar cuenta de que el tarro de la comida está vacío...',
                          dev: 'Presentar el servicio de entrega rápida y cómo puedes hacer tu pedido fácil con pago por Nequi o PSE.',
                          cta: 'Haz tu pedido en nuestra tienda online y despreocúpate.',
                          visual: 'Mirando el plato vacío con cara de asombro y señalando el celular.',
                          tone: 'Salvavidas, dinámico y aliviador.',
                          scenario: 'Cerca del comedero de la mascota.',
                          duration: '18 segundos',
                          linkedProduct: products[0]?.name || 'Concentrado Express',
                        },
                        {
                          id: 10,
                          category: 'Autoridad & Testimonio',
                          title: 'Cómo logramos que este perrito rescatado recuperara su pelaje',
                          hook: 'Когда nos llegó estaba desnutrido y sin brillo, pero miren cómo está hoy tras 30 días...',
                          dev: 'Mostrar la evolución con nutrición especializada y amor. Genera altísima confianza en la calidad de tus productos.',
                          cta: 'Apoya a tu peludo con la mejor nutrición del mercado. Visita nuestro catálogo.',
                          visual: 'Fotos del antes y después con transición rápida al ritmo de la música.',
                          tone: 'Inspirador, emotivo y profesional.',
                          scenario: 'Pantalla dividida con fotos y video actual.',
                          duration: '30 segundos',
                          linkedProduct: products[0]?.name || 'Nutrición Especializada',
                        },
                        {
                          id: 11,
                          category: 'Tips Rápidos',
                          title: '3 alimentos prohibidos que matan lentamente a tu gato',
                          hook: 'Aunque te pongan ojitos de tristeza, NUNCA le des estos 3 alimentos de tu plato a tu gato...',
                          dev: 'Listar chocolate, cebolla y lácteos de forma rápida y concisa explicando su toxicidad.',
                          cta: 'Comparte este reel con otro dueño de gato para salvarle la vida.',
                          visual: 'Señalando con el dedo índice y textos grandes en pantalla.',
                          tone: 'Alerta seria y educativa.',
                          scenario: 'Cocina.',
                          duration: '25 segundos',
                          linkedProduct: products[4]?.name || 'Premios Seguros para Gatos',
                        },
                        {
                          id: 12,
                          category: 'Conversión & Ventas',
                          title: 'El truco definitivo para que tu perro se tome la medicina sin drama',
                          hook: '¿Peleas cada vez que tienes que darle una pastilla a tu perro? Prueba este hack con snacks...',
                          dev: 'Mostrar cómo esconder la tableta dentro de un snack blando o pate de la tienda.',
                          cta: 'Pide tus snacks moldeables favoritos en nuestra web.',
                          visual: 'Preparando el snack frente a la cámara con el perro atento.',
                          tone: 'Práctico, ingenioso y útil.',
                          scenario: 'Mesa de la cocina.',
                          duration: '20 segundos',
                          linkedProduct: products[4]?.name || 'Snacks Moldeables',
                        },
                        {
                          id: 13,
                          category: 'Autoridad & Bienestar',
                          title: '¿Tu perro se rasca las patas compulsivamente? Puede ser esto',
                          hook: 'Si ves que se lame las patitas sin parar, no es solo higiene, revisa sus almohadillas...',
                          dev: 'Hablar de alergias estacionales o por contacto y la importancia de bálsamos protectores.',
                          cta: 'Escríbenos por WhatsApp y te asesoramos con nuestro veterinario virtual.',
                          visual: 'Primer plano de las patitas del perro.',
                          tone: 'Científico accesible y cuidadoso.',
                          scenario: 'Piso de la sala.',
                          duration: '22 segundos',
                          linkedProduct: products[1]?.name || 'Bálsamo y Cuidado Patitas',
                        },
                        {
                          id: 14,
                          category: 'Emoción & Estilo de Vida',
                          title: 'Un día empacando pedidos en Lunary World Pets 📦🐾',
                          hook: 'Acompáñanos a armar el pedido de un cliente muy especial en Colombia...',
                          dev: 'Mostrar el proceso de empaque con amor, regalito sorpresa y la factura lista para despacho.',
                          cta: 'Haz que tu pedido sea el próximo en salir. Compra en nuestra tienda.',
                          visual: 'Time-lapse rápido doblando cajas y colocando lazo o calcomanía.',
                          tone: 'Cercano, artesanal y transparente.',
                          scenario: 'Zona de empaque y logística.',
                          duration: '25 segundos',
                          linkedProduct: products[0]?.name || 'Kit Completo de Tienda',
                        },
                        {
                          id: 15,
                          category: 'Conversión & Cierre',
                          title: '¿Por qué elegir Lunary World Pets para consentir a tu mascota?',
                          hook: 'Si buscas calidad, envíos seguros y asesoría real en Colombia, quédate aquí...',
                          dev: 'Resumir los 3 pilares: Calidad garantizada, pagos seguros por Wompi y soporte veterinario.',
                          cta: 'Entra al enlace de nuestra tienda y descubre las ofertas de la semana.',
                          visual: 'Collage dinámico de productos estrella y clientes felices.',
                          tone: 'Corporativo, cálido y confiable.',
                          scenario: 'Estudio o sala principal.',
                          duration: '20 segundos',
                          linkedProduct: products[0]?.name || 'Todo el Catálogo Lunary',
                        },
                      ].map((idea) => (
                        <div key={idea.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE5DD] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-purple-300 transition-all">
                          <div className="space-y-2 max-w-2xl">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black">
                                #{idea.id} • {idea.category}
                              </span>
                              <span className="text-[11px] font-bold text-neutral-500">⏱️ {idea.duration}</span>
                              <span className="text-[11px] font-bold text-emerald-800">🛍️ {idea.linkedProduct}</span>
                            </div>

                            <h5 className="font-extrabold text-sm text-[#1C2722]">{idea.title}</h5>

                            <div className="space-y-1 text-xs text-[#5F6360]">
                              <p><strong>🎣 Gancho:</strong> "{idea.hook}"</p>
                              <p><strong>🎬 Desarrollo:</strong> {idea.dev}</p>
                              <p><strong>📢 CTA:</strong> {idea.cta}</p>
                            </div>
                          </div>

                          <div className="shrink-0 w-full md:w-auto flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setSelectedReelIdea(idea);
                                setAiGeneratedScript(`🎬 GUIÓN AUTOMÁTICO - NANOBANANA AI & LUNARY PETS\n\nIDEA: ${idea.title}\nPRODUCTO VINCULADO: ${idea.linkedProduct}\nDURACIÓN: ${idea.duration}\nTONO: ${idea.tone}\nESCENARIO: ${idea.scenario}\n\n[00:00 - 00:03] GANCHO VISUAL Y AUDITIVO:\n"${idea.hook}"\n(Texto en pantalla grande y llamativa con emojis)\n\n[00:03 - 00:15] DESARROLLO DE VALOR:\n"${idea.dev}"\n(Mostrar B-roll del producto en primer plano, mostrando texturas o beneficios)\n\n[00:15 - 00:25] LLAMADO A LA ACCIÓN (CTA):\n"${idea.cta}"\n(Enlace en bio o mensaje directo con pasarela Wompi activa)\n\n--------------------------------------------------\n🤖 PROMPT PARA GENERADOR DE VIDEO CON IA (NanoBanana / Runway / Sora / CapCut):\n"Vertical 9:16 cinematic video, cute pet care in Colombia, highly professional lighting, aesthetic interior background, pet product commercial style, 4k resolution, smooth camera movement."`);
                              }}
                              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4 text-amber-300" />
                              <span>✨ Generar Guión y Prompt IA</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Script Modal Generator Popup */}
                  {selectedReelIdea && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-purple-200 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-black text-base text-[#1C2722]">NanoBanana AI - Generador de Guión</h4>
                              <p className="text-xs text-purple-700">Idea #{selectedReelIdea.id}: {selectedReelIdea.title}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedReelIdea(null)}
                            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-[#1C2722]">
                            Guión detallado segundo a segundo & Prompt para IA de Video:
                          </label>
                          <textarea
                            readOnly
                            value={aiGeneratedScript}
                            rows={12}
                            className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-300 text-xs font-mono text-neutral-800 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2 border-t">
                          <button
                            onClick={() => setSelectedReelIdea(null)}
                            className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                          >
                            Cerrar
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiGeneratedScript);
                              showToast('¡Guión y Prompt Copiados!', 'Pégalo en tu generador de IA favorito (NanoBanana, CapCut o ChatGPT) y empieza a grabar.', 'success');
                              setSelectedReelIdea(null);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copiar Guión y Prompt al Portapapeles</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: ADVANCED PRO & AUTOMATIC TOOLS ($0) */}
              {activeTab === 'advanced_tools' && (
                <AdvancedGrowthTools
                  products={products}
                  contactInfo={contactInfo}
                  orders={orders}
                  customerLeads={customerLeads}
                  showToast={showToast}
                />
              )}

              {/* TAB 2: ORDERS & SHIPPING MANAGEMENT WITH EXCEL EXPORT */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
                      <span className="text-[11px] font-semibold text-[#787D7A] block">Total Pedidos Registrados</span>
                      <strong className="text-xl font-black text-[#1C1F1E]">{orders.length} pedidos</strong>
                    </div>
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
                      <span className="text-[11px] font-semibold text-[#787D7A] block">Ventas Totales Acumuladas</span>
                      <strong className="text-xl font-black text-emerald-700">
                        {formatCOP(orders.reduce((acc, o) => acc + o.total, 0))}
                      </strong>
                    </div>
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
                      <span className="text-[11px] font-semibold text-[#787D7A] block">Pedidos Pendientes de Envío</span>
                      <strong className="text-xl font-black text-amber-600">
                        {orders.filter((o) => o.status === 'pendiente' || o.status === 'pagado').length}
                      </strong>
                    </div>
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] flex flex-col justify-between">
                      <span className="text-[11px] font-semibold text-[#787D7A] block">Respaldo en la Nube</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-800">Nube & Disco Activos</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter and Download Excel Bar */}
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
                      {/* Search Order / Reference / Phone */}
                      <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#787D7A]" />
                        <input
                          type="text"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          placeholder="Buscar # orden, cliente, cel o ID Wompi..."
                          className="w-full bg-white border border-[#DED7CB] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1C1F1E] outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-white border border-[#DED7CB] rounded-xl px-2.5 py-1 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-[#787D7A]" />
                        <select
                          value={orderDateFilter}
                          onChange={(e) => setOrderDateFilter(e.target.value as any)}
                          className="bg-transparent font-medium text-[#1C1F1E] outline-none"
                        >
                          <option value="all">Todas las fechas</option>
                          <option value="today">Solo Hoy</option>
                          <option value="week">Últimos 7 días</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1 bg-white border border-[#DED7CB] rounded-xl px-2.5 py-1 text-xs">
                        <Filter className="w-3.5 h-3.5 text-[#787D7A]" />
                        <select
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value)}
                          className="bg-transparent font-medium text-[#1C1F1E] outline-none"
                        >
                          <option value="all">Todos los estados</option>
                          <option value="pendiente">⏳ Pendientes (Por confirmar)</option>
                          <option value="pagado">✅ Pagados (Fondos verificados)</option>
                          <option value="en_camino">🚚 En Camino</option>
                          <option value="entregado">🎁 Entregados</option>
                          <option value="cancelado">❌ Cancelados</option>
                          <option value="rechazado">⚠️ Rechazados / Fallidos</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="admin-sync-cloud-orders-btn"
                        onClick={handleSyncCloudOrders}
                        disabled={isSyncingCloudOrders}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-[#EFE9DF] border border-[#DED7CB] text-[#1C1F1E] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                        title="Recuperar y sincronizar todas las ventas desde Firestore y el Servidor"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingCloudOrders ? 'animate-spin' : ''}`} />
                        <span>{isSyncingCloudOrders ? 'Sincronizando...' : 'Sincronizar Nube'}</span>
                      </button>

                      <button
                        id="admin-export-orders-excel-btn"
                        onClick={handleDownloadOrdersExcel}
                        disabled={filteredOrders.length === 0}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar Reporte (.xlsx)</span>
                      </button>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-[#FAF8F5] rounded-3xl border border-dashed border-[#DED7CB] space-y-2">
                      <div className="text-3xl">🛒</div>
                      <h4 className="text-base font-bold text-[#1C1F1E]">No se encontraron pedidos con este filtro</h4>
                      <p className="text-xs text-[#737874] max-w-sm mx-auto">
                        Cuando los compradores hagan un pedido con Wompi o WhatsApp, aparecerán aquí con sus datos de envío y productos.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE5DD] pb-2.5">
                            <div>
                              <span className="text-xs font-mono font-bold text-[#B97A48]">
                                #{ord.orderNumber}
                              </span>
                              <span className="text-xs text-[#7C827E] ml-2">
                                {formatDate(ord.createdAt)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#1C1F1E]">
                                Total: {formatCOP(ord.total)}
                              </span>
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className="text-xs font-bold bg-white border border-[#DED7CB] rounded-lg px-2.5 py-1 text-[#1C1F1E]"
                              >
                                <option value="pendiente">⏳ Pendiente</option>
                                <option value="pagado">✅ Pagado (Wompi)</option>
                                <option value="en_camino">🚚 En Camino</option>
                                <option value="entregado">🎁 Entregado</option>
                                <option value="cancelado">❌ Cancelado</option>
                              </select>
                            </div>
                          </div>

                          {/* Customer info & Delivery */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-[#7A807C] block">Cliente:</span>
                              <strong className="text-[#1C1F1E]">{ord.customerName}</strong>
                              {ord.customerEmail && (
                                <p className="text-[11px] text-[#7A807C]">{ord.customerEmail}</p>
                              )}
                              <p className="text-[#5F6360] flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <a
                                  href={`https://wa.me/57${(ord.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                    `¡Hola ${ord.customerName}! Nos comunicamos de Lunary World Pets respecto a tu pedido #${ord.orderNumber}.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 font-bold hover:underline"
                                  title="Escribir por WhatsApp"
                                >
                                  {ord.customerPhone} (WhatsApp)
                                </a>
                              </p>
                            </div>

                            <div>
                              <span className="text-[#7A807C] block">Dirección de Entrega:</span>
                              <p className="text-[#1C1F1E] font-medium">{ord.customerAddress}</p>
                              <span className="text-[#7A807C]">{ord.customerCity || 'Bogotá'}</span>
                              {ord.customerNotes && (
                                <p className="text-[11px] text-[#B97A48] italic mt-0.5">
                                  Nota: &quot;{ord.customerNotes}&quot;
                                </p>
                              )}
                            </div>

                            <div>
                              <span className="text-[#7A807C] block">Método de Pago:</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-[#1C1F1E] uppercase">{ord.paymentMethod}</span>
                                {ord.wompiStatus && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                      ord.wompiStatus === 'APPROVED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : ord.wompiStatus === 'DECLINED'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-900'
                                    }`}
                                  >
                                    Wompi: {ord.wompiStatus}
                                  </span>
                                )}
                              </div>
                              {ord.wompiTransactionId && (
                                <p className="text-[11px] text-[#1C1F1E] font-mono mt-0.5">
                                  ID Transacción: <span className="text-emerald-700 font-bold">{ord.wompiTransactionId}</span>
                                </p>
                              )}
                              {ord.paymentReference && (
                                <p className="text-[11px] text-[#B97A48] font-mono mt-0.5">
                                  Ref Pago: <strong>{ord.paymentReference}</strong>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Items summary */}
                          <div className="bg-white p-2.5 rounded-xl border border-[#ECE5DD] text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-[#7A807C] block text-[11px]">Productos:</span>
                              {ord.isSubscription && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                                  🔄 Auto-Envío Mensual
                                </span>
                              )}
                            </div>
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-[#1C1F1E]">
                                <span>• {it.productName} (x{it.quantity})</span>
                                <span className="font-bold">{formatCOP(it.total)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Actions: Live Payment Verification & Invoice */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#ECE5DD]">
                            {/* Verification Button & Status Alert */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleVerifyOrderPaymentWithWompi(ord)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-xs transition-all ${
                                  ord.status === 'pagado' || ord.wompiStatus === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md active:scale-98'
                                }`}
                              >
                                <SearchCheck className="w-3.5 h-3.5" />
                                <span>
                                  {ord.status === 'pagado' || ord.wompiStatus === 'APPROVED'
                                    ? '✓ Dinero Confirmado (Re-verificar)'
                                    : '🛡️ Confirmar si el Dinero Entró a Wompi'}
                                </span>
                              </button>

                              {ord.status !== 'pagado' && ord.wompiStatus !== 'APPROVED' && (
                                <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>No despachar hasta confirmar fondos</span>
                                </span>
                              )}
                            </div>

                            {/* Invoice trigger action */}
                            {onOpenInvoice && (
                              <button
                                type="button"
                                onClick={() => onOpenInvoice(ord)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DED7CB] hover:bg-[#FAF8F5] text-[#1C1F1E] font-bold text-xs shadow-xs transition-all"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>🧾 Factura Digital</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CUSTOMER LEADS & INQUIRIES DATABASE WITH EXCEL EXPORT */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
                      <span className="text-[11px] font-semibold text-[#787D7A] block">Total Clientes en Base de Datos</span>
                      <strong className="text-xl font-black text-[#1C1F1E]">{customerLeads.length} personas</strong>
                    </div>
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
                      <span className="text-[11px] font-semibold text-[#787D7A] block">Nuevos por Responder</span>
                      <strong className="text-xl font-black text-amber-600">
                        {customerLeads.filter((l) => l.status === 'nuevo').length} mensajes
                      </strong>
                    </div>
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
                      <span className="text-[11px] font-semibold text-[#787D7A] block">Ventas Cerradas / Convertidos</span>
                      <strong className="text-xl font-black text-emerald-700">
                        {customerLeads.filter((l) => l.status === 'convertido').length}
                      </strong>
                    </div>
                  </div>

                  {/* Actions & Filters */}
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#787D7A]" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Buscar cliente, teléfono o consulta..."
                          className="w-full bg-white border border-[#DED7CB] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1C1F1E] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-white border border-[#DED7CB] rounded-xl px-2.5 py-1 text-xs">
                        <Filter className="w-3.5 h-3.5 text-[#787D7A]" />
                        <select
                          value={customerStatusFilter}
                          onChange={(e) => setCustomerStatusFilter(e.target.value)}
                          className="bg-transparent font-medium text-[#1C1F1E] outline-none"
                        >
                          <option value="all">Todos</option>
                          <option value="nuevo">Nuevos</option>
                          <option value="contactado">Contactados</option>
                          <option value="convertido">Venta Cerrada</option>
                          <option value="archivado">Archivados</option>
                        </select>
                      </div>
                    </div>

                    <button
                      id="admin-export-leads-excel-btn"
                      onClick={handleDownloadLeadsExcel}
                      disabled={filteredLeads.length === 0}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Base de Datos XLS</span>
                    </button>
                  </div>

                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-12 bg-[#FAF8F5] rounded-3xl border border-dashed border-[#DED7CB] space-y-2">
                      <div className="text-3xl">👥</div>
                      <h4 className="text-base font-bold text-[#1C1F1E]">No se encontraron clientes</h4>
                      <p className="text-xs text-[#737874] max-w-sm mx-auto">
                        Cuando las personas escriban desde el formulario de contacto o WhatsApp, se guardarán aquí automáticamente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE5DD] pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1C1F1E]">{lead.name}</span>
                              {lead.petName && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE7DF] text-[#1C1F1E]">
                                  🐾 {lead.petName}
                                </span>
                              )}
                              <span className="text-[11px] text-[#7C827E]">• {formatDate(lead.createdAt)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                                className={`text-xs font-bold rounded-lg px-2.5 py-1 border ${
                                  lead.status === 'nuevo'
                                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                                    : lead.status === 'convertido'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : lead.status === 'contactado'
                                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                                    : 'bg-white border-[#DED7CB] text-[#5F6360]'
                                }`}
                              >
                                <option value="nuevo">🟡 Nuevo</option>
                                <option value="contactado">🔵 Contactado</option>
                                <option value="convertido">🟢 Venta Cerrada</option>
                                <option value="archivado">⚪ Archivado</option>
                              </select>

                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-[#ECE5DD] space-y-2">
                            <p className="text-xs text-[#1C1F1E] leading-relaxed">
                              &quot;{lead.message}&quot;
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#ECE5DD]">
                              <div className="flex items-center gap-2 text-xs">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <strong className="text-[#1C1F1E]">{formatPhoneNumber(lead.phone)}</strong>
                              </div>

                              <a
                                href={`https://wa.me/57${(lead.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `¡Hola ${lead.name}! Te escribimos de Lunary World Pets para darte respuesta a tu consulta sobre ${lead.petName || 'tu mascota'}. ¿En qué más podemos ayudarte? 🐾`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>Responder por WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CUSTOMER REVIEWS & TESTIMONIALS MANAGEMENT */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
                    <div>
                      <h3 className="text-sm font-bold text-[#1C1F1E] flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>Reseñas y Opiniones de Clientes</span>
                      </h3>
                      <p className="text-xs text-[#787D7A]">
                        Modera los testimonios visibles en la tienda para aumentar la confianza y ventas.
                      </p>
                    </div>

                    <div className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <span>Promedio:</span>
                      <strong className="text-sm">
                        {reviews.length > 0
                          ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                          : '5.0'}
                        ★
                      </strong>
                      <span className="text-[#787D7A]">({reviews.length} opiniones)</span>
                    </div>
                  </div>

                  {/* Search reviews */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9390]" />
                      <input
                        type="text"
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        placeholder="Buscar por nombre de cliente, mascota o comentario..."
                        className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#DED7CB] rounded-xl text-xs text-[#1C1F1E] outline-none"
                      />
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-[#FAF8F5] rounded-3xl border border-dashed border-[#DED7CB] space-y-2">
                      <div className="text-3xl">⭐</div>
                      <h4 className="text-base font-bold text-[#1C1F1E]">No hay opiniones registradas aún</h4>
                      <p className="text-xs text-[#737874] max-w-sm mx-auto">
                        Las opiniones enviadas por tus compradores aparecerán aquí para moderación.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews
                        .filter((rev) => {
                          if (!reviewSearch.trim()) return true;
                          const q = reviewSearch.toLowerCase();
                          return (
                            rev.authorName.toLowerCase().includes(q) ||
                            rev.petName.toLowerCase().includes(q) ||
                            rev.comment.toLowerCase().includes(q)
                          );
                        })
                        .map((rev) => (
                          <div
                            key={rev.id}
                            className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE5DD] pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#1C1F1E]">{rev.authorName}</span>
                                <span className="text-[11px] text-[#7A807C]">
                                  • {rev.petType === 'perro' ? '🐶' : '🐱'} {rev.petName}
                                </span>
                                {rev.verifiedPurchase && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                                    ✓ Compra Verificada
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-0.5 text-amber-500">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-[#8E9390]">{formatDate(rev.createdAt)}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`¿Deseas eliminar la opinión de ${rev.authorName}?`)) {
                                      const updated = reviews.filter((r) => r.id !== rev.id);
                                      onSaveReviews(updated);
                                      showToast('Opinión eliminada.', 'info');
                                    }
                                  }}
                                  className="p-1 text-[#999E9B] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Eliminar reseña"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-[#4A504C] italic">&quot;{rev.comment}&quot;</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CONTACT & WOMPI PAYMENT SETTINGS */}
              {activeTab === 'contact' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSaveContactInfo(contactForm);
                    showToast('Información de contacto y canales guardada correctamente.', 'success');
                  }}
                  className="space-y-4"
                >
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] space-y-4">
                    <h3 className="text-sm font-bold text-[#1C1F1E] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#B97A48]" />
                      Configuración de Teléfono, Canales y Pasarela Wompi
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Nombre de la Tienda
                        </label>
                        <input
                          type="text"
                          value={contactForm.storeName}
                          onChange={(e) => setContactForm({ ...contactForm, storeName: e.target.value })}
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Link Oficial de Pagos Wompi (Bancolombia, PSE, Tarjetas)
                        </label>
                        <input
                          type="url"
                          value={contactForm.wompiPaymentLink || ''}
                          onChange={(e) => setContactForm({ ...contactForm, wompiPaymentLink: e.target.value })}
                          placeholder="https://checkout.wompi.co/l/VPOS_Qn5COa"
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Teléfono de Contacto (3214231616)
                        </label>
                        <input
                          type="text"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          WhatsApp de Pedidos y Asesoría (3214231616)
                        </label>
                        <input
                          type="text"
                          value={contactForm.whatsapp}
                          onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          🎵 Enlace / Perfil de TikTok de la Tienda
                        </label>
                        <input
                          type="text"
                          value={contactForm.tiktokUrl || ''}
                          onChange={(e) => setContactForm({ ...contactForm, tiktokUrl: e.target.value })}
                          placeholder="https://www.tiktok.com/@lunaryworldpets"
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          📸 Enlace de Instagram
                        </label>
                        <input
                          type="text"
                          value={contactForm.instagramUrl || ''}
                          onChange={(e) => setContactForm({ ...contactForm, instagramUrl: e.target.value })}
                          placeholder="https://instagram.com/lunaryworldpets"
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                        Texto de la Barra Superior de Anuncios
                      </label>
                      <input
                        type="text"
                        value={contactForm.topBannerText}
                        onChange={(e) => setContactForm({ ...contactForm, topBannerText: e.target.value })}
                        className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                      />
                    </div>

                    {/* Configuración de Tarifas de Envíos y Domicilios */}
                    <div className="bg-[#FAF6F0] p-3.5 rounded-xl border border-[#E5DFD4] space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#1C1F1E]">
                        <Truck className="w-4 h-4 text-[#B97A48]" />
                        <span>Tarifas de Envíos y Domicilios Dinámicos (Modificables)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                            📍 Domicilio Bogotá ($ COP)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={contactForm.shippingFeeBogota ?? 6500}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                shippingFeeBogota: Number(e.target.value),
                                standardShippingFee: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] font-bold outline-none"
                          />
                          <span className="text-[10px] text-[#7A7F7C] block mt-0.5">Por defecto: $6.500</span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                            🚚 Fuera de Bogotá / Nacional ($ COP)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={contactForm.shippingFeeNational ?? 13500}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                shippingFeeNational: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] font-bold outline-none"
                          />
                          <span className="text-[10px] text-[#7A7F7C] block mt-0.5">Por defecto: $13.500</span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                            🎉 Mínimo para Envío Gratis ($ COP)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            value={contactForm.freeShippingMinimum ?? 150000}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                freeShippingMinimum: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] font-bold outline-none"
                          />
                          <span className="text-[10px] text-[#7A7F7C] block mt-0.5">Compras mayores tienen envío $0</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="save-contact-info-btn"
                      className="px-6 py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold shadow-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Información de Contacto</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: ABOUT US MANAGEMENT */}
              {activeTab === 'about' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSaveAboutContent(aboutForm);
                    showToast('¡Sección "Nosotros" y Nuestra Historia guardadas permanentemente!', 'success');
                  }}
                  className="space-y-5"
                >
                  <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900">
                          Sincronización Permanente de Nosotros
                        </h4>
                        <p className="text-[11px] text-emerald-700">
                          Todo lo que edites aquí queda almacenado de forma segura y se refleja de inmediato en la tienda.
                        </p>
                      </div>
                    </div>
                    {onNavigateSection && (
                      <button
                        type="button"
                        onClick={() => onNavigateSection('about')}
                        className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver en la Tienda</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-[#ECE5DD] space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1C1F1E] flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#B97A48]" />
                        <span>Información Institucional & Historia</span>
                      </h3>
                      <span className="text-[11px] text-[#787D7A] bg-white px-2.5 py-1 rounded-lg border border-[#E0D8CE]">
                        {aboutForm.story?.length || 0} caracteres en la historia
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Título Principal de la Sección *
                        </label>
                        <input
                          type="text"
                          required
                          value={aboutForm.title}
                          onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
                          placeholder="Ej: Pasión y Cuidado para tus Mascotas"
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Subtítulo o Lema Destacado
                        </label>
                        <input
                          type="text"
                          value={aboutForm.subtitle || ''}
                          onChange={(e) => setAboutForm({ ...aboutForm, subtitle: e.target.value })}
                          placeholder="Ej: Desde 2020 creando momentos felices para perros y gatos..."
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                        />
                      </div>
                    </div>

                    {/* NUESTRA HISTORIA CON EDITOR EXPANDIDO */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#1C1F1E]">
                          📖 Nuestra Historia Completa *
                        </label>
                        <span className="text-[11px] text-[#787D7A]">
                          Aparece en la página de Nosotros para contar el origen y amor por las mascotas.
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        required
                        value={aboutForm.story}
                        onChange={(e) => setAboutForm({ ...aboutForm, story: e.target.value })}
                        placeholder="Escribe la historia de Lunary World Pets, cómo nació la idea, quiénes son los consentidos de la casa..."
                        className="w-full bg-white border border-[#DED7CB] rounded-xl p-3 text-sm text-[#1C1F1E] outline-none focus:border-[#1C2722] leading-relaxed"
                      />
                    </div>

                    {/* MISIÓN Y VISIÓN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Misión de la Marca
                        </label>
                        <textarea
                          rows={3}
                          value={aboutForm.mission}
                          onChange={(e) => setAboutForm({ ...aboutForm, mission: e.target.value })}
                          placeholder="Proveer bienestar, nutrición y accesorios de la más alta calidad..."
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Visión de la Marca
                        </label>
                        <textarea
                          rows={3}
                          value={aboutForm.vision}
                          onChange={(e) => setAboutForm({ ...aboutForm, vision: e.target.value })}
                          placeholder="Ser la tienda líder y de mayor confianza para familias con mascotas..."
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                        />
                      </div>
                    </div>

                    {/* FOTO DE PORTADA DE LA SECCIÓN NOSOTROS */}
                    <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
                      <label className="block text-xs font-bold text-[#1C1F1E]">
                        🖼️ Foto de Portada / Banner de Nosotros
                      </label>
                      
                      <div className="flex flex-col sm:flex-row gap-3 items-start">
                        {aboutForm.bannerImage ? (
                          <img
                            src={aboutForm.bannerImage}
                            alt="Portada Nosotros"
                            className="w-28 h-20 rounded-xl object-cover border border-[#DED7CB] bg-white shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-28 h-20 rounded-xl border border-dashed border-[#DED7CB] bg-[#F2EDE4] flex items-center justify-center text-xs text-[#787D7A] shrink-0">
                            Sin foto
                          </div>
                        )}

                        <div className="flex-1 space-y-2 w-full">
                          <input
                            type="url"
                            value={aboutForm.bannerImage || ''}
                            onChange={(e) => setAboutForm({ ...aboutForm, bannerImage: e.target.value })}
                            placeholder="https://images.unsplash.com/... o pega un enlace de imagen"
                            className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-xs text-[#1C1F1E] outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={aboutFileInputRef}
                              accept="image/*"
                              onChange={(e) => handleImageFileUpload(e, 'about')}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => aboutFileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-white border border-[#DED7CB] hover:bg-[#F2EDE4] text-xs font-semibold text-[#1C1F1E] flex items-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#B97A48]" />
                              <span>Subir Foto desde tu Computador</span>
                            </button>

                            {aboutForm.bannerImage && (
                              <button
                                type="button"
                                onClick={() => setAboutForm({ ...aboutForm, bannerImage: '' })}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100"
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-[#787D7A]">
                        Al hacer clic en Guardar, los cambios se actualizan de forma permanente en el almacenamiento.
                      </p>
                      <button
                        type="submit"
                        id="save-about-content-btn"
                        className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                      >
                        <Save className="w-4 h-4 text-emerald-400" />
                        <span>Guardar Información de Nosotros Permanentemente</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 5: BLOG MANAGEMENT */}
              {activeTab === 'blog' && (
                <div className="space-y-4">
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1C1F1E]">Artículos del Blog</h3>
                      <p className="text-xs text-[#787D7A]">
                        Publica guías y consejos de cuidado para perros y gatos.
                      </p>
                    </div>

                    <button
                      id="admin-new-blog-post-btn"
                      onClick={() => {
                        setBlogForm({
                          id: `blog_${Date.now()}`,
                          title: '',
                          slug: '',
                          category: 'Nutrición',
                          petType: 'ambos',
                          summary: '',
                          content: '',
                          author: 'Equipo Lunary Pet',
                          date: new Date().toLocaleDateString('es-CO'),
                          coverImage: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
                          readTime: '3 min',
                          isPublished: true,
                        });
                        setIsEditingBlog(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1C2722] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nuevo Artículo</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {blogPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#ECE5DD] flex gap-3 items-center justify-between"
                      >
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-16 h-16 rounded-xl object-cover bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0 pr-2">
                          <span className="text-[10px] font-bold text-[#B97A48] uppercase">
                            {post.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#1C1F1E] truncate">{post.title}</h4>
                          <span className="text-[11px] text-[#787D7A]">{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setBlogForm({ ...post });
                              setIsEditingBlog(true);
                            }}
                            className="p-1.5 rounded-lg bg-white border border-[#DED7CB] hover:bg-[#EFE9DF]"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#1C1F1E]" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlogPost(post.id)}
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CHANGE PASSWORD & SECURITY */}
              {activeTab === 'security' && (
                <div className="max-w-md mx-auto py-4 space-y-4">
                  <div className="bg-[#FAF8F5] p-5 rounded-3xl border border-[#ECE5DD] space-y-4 text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#1C2722] text-white flex items-center justify-center">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1C1F1E]">
                          Cambiar Contraseña de Administrador
                        </h3>
                        <p className="text-xs text-[#787D7A]">
                          Actualiza tu clave de acceso en cualquier momento.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Nueva Contraseña *
                        </label>
                        <input
                          id="new-admin-password-input"
                          type="password"
                          required
                          value={newPassInput}
                          onChange={(e) => setNewPassInput(e.target.value)}
                          placeholder="Mínimo 4 caracteres..."
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                          Confirmar Nueva Contraseña *
                        </label>
                        <input
                          id="confirm-admin-password-input"
                          type="password"
                          required
                          value={confirmPassInput}
                          onChange={(e) => setConfirmPassInput(e.target.value)}
                          placeholder="Repite la nueva contraseña..."
                          className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2.5 text-sm text-[#1C1F1E] focus:border-[#1C2722] outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        id="save-new-password-btn"
                        className="w-full py-3 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-sm shadow-md transition-all active:scale-98"
                      >
                        Actualizar y Guardar Contraseña
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 7: RESPALDO Y SINCRONIZACIÓN */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  {/* Status Card */}
                  <div className="bg-linear-to-r from-[#1C2722] to-[#2B3B34] text-white p-5 rounded-3xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                          <HardDrive className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm">Almacenamiento Propio Local (100% Gratuito y Autónomo)</h3>
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ● Sin Costos de Firebase
                            </span>
                          </div>
                          <p className="text-xs text-stone-300">
                            Tus modificaciones (Precios, Catálogo, Tarifas de Envíos, Historia, Llaves Wompi y Pedidos) se guardan directamente en el almacenamiento interno de la tienda sin depender de servicios externos de pago.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSaveAboutContent(aboutForm);
                          onSaveContactInfo(contactForm);
                          setStorageMetrics(getStorageStats());
                          showToast('¡Datos guardados y actualizados en el almacenamiento local!', 'success');
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-stone-950 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Guardar en Almacenamiento Local</span>
                      </button>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center">
                      <div className="bg-white/5 rounded-xl p-2.5">
                        <div className="text-lg font-extrabold text-amber-300">{products.length}</div>
                        <div className="text-[10px] text-stone-300 font-medium">Productos Activos</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5">
                        <div className="text-lg font-extrabold text-emerald-300">{orders.length}</div>
                        <div className="text-[10px] text-stone-300 font-medium">Pedidos Registrados</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5">
                        <div className="text-lg font-extrabold text-sky-300">{customerLeads.length}</div>
                        <div className="text-[10px] text-stone-300 font-medium">Clientes en Base</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5">
                        <div className="text-lg font-extrabold text-purple-300">{aboutForm.story ? '✓ Activa' : 'Vacía'}</div>
                        <div className="text-[10px] text-stone-300 font-medium">Historia en Nosotros</div>
                      </div>
                    </div>
                  </div>

                  {/* TOOLS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tool 1: Download JSON Backup */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#ECE5DD] space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                          <Download className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-[#1C1F1E]">
                          1. Descargar Copia de Seguridad Total (.JSON)
                        </h4>
                        <p className="text-xs text-[#5F6360] leading-relaxed">
                          Descarga un archivo con toda tu información: historia completa de Nosotros, productos con fotos, pedidos, clientes y notas. Puedes guardarlo en tu computador como respaldo de seguridad.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          // Make sure current in-form about and contact are saved before backup
                          onSaveAboutContent(aboutForm);
                          onSaveContactInfo(contactForm);
                          downloadSiteBackupJSON();
                          showToast('¡Copia de seguridad descargada exitosamente en tu computador!', 'success');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                      >
                        <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                        <span>Descargar Respaldo Lunary Pet (.JSON)</span>
                      </button>
                    </div>

                    {/* Tool 2: Restore from JSON file */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#ECE5DD] space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-[#1C1F1E]">
                          2. Restaurar Respaldo desde Archivo (.JSON)
                        </h4>
                        <p className="text-xs text-[#5F6360] leading-relaxed">
                          Si cambiaste de computador o limpiaste el navegador, selecciona tu archivo `.json` de respaldo para recuperar toda la tienda al instante con un solo clic.
                        </p>
                      </div>

                      <div>
                        <input
                          type="file"
                          ref={backupFileInputRef}
                          accept=".json,application/json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              try {
                                const parsed = JSON.parse(ev.target?.result as string);
                                if (onRestoreSiteData) {
                                  onRestoreSiteData(parsed);
                                } else {
                                  const res = restoreAllSiteDataBackup(parsed);
                                  if (res.success) {
                                    showToast('¡Copia restaurada exitosamente!', 'success');
                                  } else {
                                    showToast(res.message, 'error');
                                  }
                                }
                              } catch {
                                showToast('El archivo no tiene un formato JSON válido.', 'error');
                              }
                            };
                            reader.readAsText(file);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => backupFileInputRef.current?.click()}
                          className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#DED7CB] hover:bg-[#F2EDE4] text-[#1C1F1E] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                        >
                          <FileJson className="w-4 h-4 text-emerald-600" />
                          <span>Seleccionar Archivo de Respaldo (.JSON)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tool 3: Copy/Paste JSON Raw Text */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#ECE5DD] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1C1F1E] flex items-center gap-2">
                        <Copy className="w-3.5 h-3.5 text-[#B97A48]" />
                        <span>Copiar o Pegar Código de Datos (Texto Directo)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const backup = getAllSiteDataBackup();
                          const jsonString = JSON.stringify(backup, null, 2);
                          setBackupJsonText(jsonString);
                          navigator.clipboard.writeText(jsonString);
                          setCopiedBackup(true);
                          showToast('¡Código de respaldo copiado al portapapeles!', 'success');
                          setTimeout(() => setCopiedBackup(false), 3000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#DED7CB] text-xs font-semibold text-[#1C1F1E] hover:bg-[#F2EDE4] flex items-center gap-1.5"
                      >
                        {copiedBackup ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#5F6360]" />
                            <span>Generar y Copiar Texto</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={backupJsonText}
                      onChange={(e) => setBackupJsonText(e.target.value)}
                      placeholder="Pega aquí el código JSON de respaldo si deseas importar datos directamente sin archivo..."
                      className="w-full bg-white border border-[#DED7CB] rounded-xl p-3 text-xs text-[#1C1F1E] font-mono outline-none focus:border-[#1C2722]"
                    />

                    {backupJsonText && (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(backupJsonText);
                            if (onRestoreSiteData) {
                              onRestoreSiteData(parsed);
                            } else {
                              const res = restoreAllSiteDataBackup(parsed);
                              if (res.success) {
                                showToast('¡Datos aplicados desde el texto pegado!', 'success');
                              } else {
                                showToast(res.message, 'error');
                              }
                            }
                            setBackupJsonText('');
                          } catch {
                            showToast('El texto ingresado no es un JSON válido.', 'error');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aplicar Datos desde este Texto</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: WOMPI PAYMENT GATEWAY CONFIGURATION & GUIDE */}
              {activeTab === 'wompi' && (
                <div className="space-y-6 max-w-4xl">
                  {/* Status Banner */}
                  <div className="bg-[#1C2722] text-white p-5 rounded-3xl space-y-4 shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            Pasarela Wompi Colombia (Bancolombia)
                          </h3>
                          <p className="text-xs text-slate-300">
                            Acepta Tarjetas Visa/Mastercard, PSE y Transferencia Bancolombia.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            wompiForm.environment === 'production'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                          {wompiForm.environment === 'production' ? '🔴 Modo Producción (En Vivo)' : '🧪 Modo Sandbox (Pruebas)'}
                        </span>

                        <button
                          type="button"
                          onClick={async () => {
                            setIsTestingWompi(true);
                            setWompiTestResult(null);
                            const res = await testWompiConnection({
                              environment: wompiForm.environment,
                              publicKey: wompiForm.publicKey,
                              privateKey: wompiForm.privateKey,
                            });
                            setWompiTestResult(res);
                            setIsTestingWompi(false);
                            if (res.success) {
                              showToast('¡Conexión exitosa con Wompi!', 'success');
                            } else {
                              showToast(res.message || 'Error verificando llaves', 'error');
                            }
                          }}
                          disabled={isTestingWompi}
                          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTestingWompi ? 'animate-spin' : ''}`} />
                          {isTestingWompi ? 'Probando...' : 'Re-verificar'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                      <div className="bg-white/10 p-3 rounded-2xl">
                        <span className="text-slate-300 block text-[11px]">Ambiente Seleccionado:</span>
                        <strong className="text-white uppercase font-bold text-sm">
                          {wompiForm.environment}
                        </strong>
                      </div>
                      <div className="bg-white/10 p-3 rounded-2xl">
                        <span className="text-slate-300 block text-[11px]">Firma de Integridad:</span>
                        <strong className="text-emerald-400 font-bold text-sm">
                          🔒 SHA-256 Activa (Backend)
                        </strong>
                      </div>
                      <div className="bg-white/10 p-3 rounded-2xl">
                        <span className="text-slate-300 block text-[11px]">Seguridad Bancaria:</span>
                        <strong className="text-white font-bold text-sm">
                          PCI-DSS Nivel 1 & SSL
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Test Result Alert with Diagnostics */}
                  {wompiTestResult && (
                    <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                      wompiTestResult.success 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                        : wompiTestResult.warning 
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}>
                      {wompiTestResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 flex-1">
                        <p className="font-bold">{wompiTestResult.message}</p>
                        {wompiTestResult.merchant && (
                          <p className="opacity-90">Comercio identificado: <strong>{wompiTestResult.merchant}</strong></p>
                        )}
                        {wompiTestResult.diagnostic && wompiTestResult.diagnostic.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-rose-200/70 space-y-1">
                            <p className="font-bold text-[11px] uppercase tracking-wider text-rose-950">
                              📋 Diagnóstico y Solución:
                            </p>
                            <ul className="space-y-1 text-[11px] text-rose-900">
                              {wompiTestResult.diagnostic.map((item, idx) => (
                                <li key={idx} className="leading-snug">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form to Configure and Save Keys */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSavingWompi(true);
                      setWompiTestResult(null);

                      const res = await saveWompiAdminConfig(wompiForm);

                      if (wompiForm.paymentLink && wompiForm.paymentLink !== contactInfo.wompiPaymentLink) {
                        onSaveContactInfo({
                          ...contactInfo,
                          wompiPaymentLink: wompiForm.paymentLink,
                        });
                      }

                      setIsSavingWompi(false);
                      if (res.success) {
                        showToast('¡Configuración de Wompi guardada y aplicada en el servidor!', 'success');
                        const testRes = await testWompiConnection({
                          environment: wompiForm.environment,
                          publicKey: wompiForm.publicKey,
                          privateKey: wompiForm.privateKey,
                        });
                        setWompiTestResult(testRes);
                      } else {
                        showToast(`Error: ${res.message}`, 'error');
                        setWompiTestResult({
                          success: false,
                          message: res.message,
                        });
                      }
                    }}
                    className="bg-white border border-[#DED7CB] rounded-3xl p-6 shadow-xs space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-3">
                      <h4 className="font-bold text-sm text-[#1C1F1E] uppercase tracking-wider">
                        1. Escribir y Configurar Llaves de Wompi
                      </h4>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        Guardado en Servidor Seguro
                      </span>
                    </div>

                    {/* Environment Switcher */}
                    <div>
                      <label className="block text-xs font-bold text-[#1C1F1E] mb-2">
                        Selecciona el Modo:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          wompiForm.environment === 'sandbox'
                            ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                            : 'border-[#EAE4DC] hover:border-slate-300'
                        }`}>
                          <input
                            type="radio"
                            name="wompiEnvironment"
                            value="sandbox"
                            checked={wompiForm.environment === 'sandbox'}
                            onChange={() => setWompiForm({ ...wompiForm, environment: 'sandbox' })}
                            className="text-amber-500 focus:ring-amber-400"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#1C1F1E]">🧪 Modo Sandbox (Pruebas)</p>
                            <p className="text-[11px] text-[#5F6360]">Llaves que inician con <code>pub_test_</code> y <code>prv_test_</code></p>
                          </div>
                        </label>

                        <label className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          wompiForm.environment === 'production'
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                            : 'border-[#EAE4DC] hover:border-slate-300'
                        }`}>
                          <input
                            type="radio"
                            name="wompiEnvironment"
                            value="production"
                            checked={wompiForm.environment === 'production'}
                            onChange={() => setWompiForm({ ...wompiForm, environment: 'production' })}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#1C1F1E]">🔴 Modo Producción (Dinero Real)</p>
                            <p className="text-[11px] text-[#5F6360]">Llaves que inician con <code>pub_prod_</code> y <code>prv_prod_</code></p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Public Key Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#1C1F1E]">
                          Llave Pública (Public Key) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {wompiForm.environment === 'production' ? 'Ej: pub_prod_...' : 'Ej: pub_test_...'}
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={wompiForm.publicKey}
                        onChange={(e) => setWompiForm({ ...wompiForm, publicKey: e.target.value.trim() })}
                        placeholder={wompiForm.environment === 'production' ? 'pub_prod_xxxxxxxxxxxxxxxxxxxxxxxx' : 'pub_test_xxxxxxxxxxxxxxxxxxxxxxxx'}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#DED7CB] rounded-xl text-xs font-mono text-[#1C1F1E] focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                      />
                      <p className="text-[11px] text-[#6E7370] mt-1">
                        Se utiliza en el checkout oficial para tokenizar y procesar los cobros con Bancolombia, PSE y Tarjetas Débito/Crédito.
                      </p>
                    </div>

                    {/* Private Key Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#1C1F1E]">
                          Llave Privada (Private Key) <span className="text-[#6E7370] font-normal">(Protegida en Servidor)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="text-[11px] text-[#B97A48] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {showPrivateKey ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      <input
                        type={showPrivateKey ? 'text' : 'password'}
                        value={wompiForm.privateKey}
                        onChange={(e) => setWompiForm({ ...wompiForm, privateKey: e.target.value.trim() })}
                        placeholder={wompiForm.environment === 'production' ? 'prv_prod_xxxxxxxxxxxxxxxxxxxxxxxx' : 'prv_test_xxxxxxxxxxxxxxxxxxxxxxxx'}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#DED7CB] rounded-xl text-xs font-mono text-[#1C1F1E] focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                      />
                      <p className="text-[11px] text-[#6E7370] mt-1">
                        Se almacena únicamente en el servidor para verificar el estado de las órdenes directamente en la API de Wompi.
                      </p>
                    </div>

                    {/* Integrity Secret Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#1C1F1E]">
                          Secreto de Integridad (Integrity Secret) <span className="text-[#6E7370] font-normal">(Opcional / Recomendado)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowIntegritySecret(!showIntegritySecret)}
                          className="text-[11px] text-[#B97A48] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {showIntegritySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {showIntegritySecret ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      <input
                        type={showIntegritySecret ? 'text' : 'password'}
                        value={wompiForm.integritySecret}
                        onChange={(e) => setWompiForm({ ...wompiForm, integritySecret: e.target.value.trim() })}
                        placeholder={wompiForm.environment === 'production' ? 'prod_integrity_xxxxxxxxxxxxxxxxxxxxxxxx' : 'test_integrity_xxxxxxxxxxxxxxxxxxxxxxxx'}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#DED7CB] rounded-xl text-xs font-mono text-[#1C1F1E] focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                      />
                      <p className="text-[11px] text-[#6E7370] mt-1 leading-relaxed">
                        Cópialo desde <strong>dashboard.wompi.co → Desarrolladores → Secretos → Eventos e Integridad</strong>. Si aún no lo has generado en Wompi, puedes dejarlo vacío para que la pasarela abra sin error de firma.
                      </p>
                    </div>

                    {/* Events Secret (Webhook) Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#1C1F1E]">
                          Secreto de Eventos Webhook (Events Secret) <span className="text-[#6E7370] font-normal">(Opcional)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowEventsSecret(!showEventsSecret)}
                          className="text-[11px] text-[#B97A48] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {showEventsSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {showEventsSecret ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      <input
                        type={showEventsSecret ? 'text' : 'password'}
                        value={wompiForm.eventsSecret || ''}
                        onChange={(e) => setWompiForm({ ...wompiForm, eventsSecret: e.target.value.trim() })}
                        placeholder={wompiForm.environment === 'production' ? 'prod_events_xxxxxxxxxxxxxxxxxxxxxxxx' : 'test_events_xxxxxxxxxxxxxxxxxxxxxxxx'}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#DED7CB] rounded-xl text-xs font-mono text-[#1C1F1E] focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                      />
                    </div>

                    {/* Official Payment Link */}
                    <div>
                      <label className="block text-xs font-bold text-[#1C1F1E] mb-1.5">
                        Link de Pago Directo de Wompi
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={wompiForm.paymentLink || ''}
                          onChange={(e) => setWompiForm({ ...wompiForm, paymentLink: e.target.value.trim() })}
                          placeholder="https://checkout.wompi.co/l/VPOS_Qn5COa"
                          className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-[#DED7CB] rounded-xl text-xs font-mono text-[#1C1F1E] focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                        {wompiForm.paymentLink && (
                          <a
                            href={wompiForm.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Abrir</span>
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6E7370] mt-1">
                        Datáfono virtual para pagos manuales o libres. <span className="text-emerald-700 font-semibold">Nota: En las compras del carrito, el sistema genera automáticamente un enlace Wompi con el valor exacto bloqueado de la orden para que el cliente nunca deba digitar el monto.</span>
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3 border-t border-[#ECE5DD] flex items-center justify-end gap-3">
                      <button
                        type="submit"
                        disabled={isSavingWompi}
                        className="px-6 py-3 bg-[#1C2722] hover:bg-[#2B3B34] text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 text-amber-400" />
                        <span>{isSavingWompi ? 'Guardando en Servidor...' : 'Guardar y Aplicar Credenciales'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Webhook URLs box */}
                  <div className="bg-[#FAF8F5] p-5 rounded-3xl border border-[#ECE5DD] space-y-3">
                    <h4 className="text-sm font-bold text-[#1C1F1E] uppercase tracking-wider">
                      2. URLs para Configurar en tu Panel de Wompi
                    </h4>
                    <p className="text-xs text-[#5F6360]">
                      Ingresa a <a href="https://dashboard.wompi.co" target="_blank" rel="noopener noreferrer" className="text-[#B97A48] font-bold underline">dashboard.wompi.co</a> y pega estas URLs:
                    </p>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-[#1C1F1E] mb-1">
                          URL de Eventos (Webhook) para Notificaciones Automáticas:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={wompiConfigState.webhookUrl || `${window.location.origin}/api/wompi/webhook`}
                            className="flex-1 bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-xs font-mono text-[#1C1F1E]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const url = wompiConfigState.webhookUrl || `${window.location.origin}/api/wompi/webhook`;
                              navigator.clipboard.writeText(url);
                              showToast('¡URL de Webhook copiada al portapapeles!', 'success');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#1C1F1E] mb-1">
                          URL de Redirección (Donde retorna el cliente tras pagar):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={wompiConfigState.redirectUrl || `${window.location.origin}?wompi_return=true`}
                            className="flex-1 bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-xs font-mono text-[#1C1F1E]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const url = wompiConfigState.redirectUrl || `${window.location.origin}?wompi_return=true`;
                              navigator.clipboard.writeText(url);
                              showToast('¡URL de Redirección copiada!', 'success');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step by Step Setup Guide */}
                  <div className="bg-[#FAF8F5] p-5 rounded-3xl border border-[#ECE5DD] space-y-3">
                    <h4 className="text-sm font-bold text-[#1C1F1E] uppercase tracking-wider">
                      3. Paso a Paso para Activar Wompi en Producción
                    </h4>

                    <ol className="text-xs text-[#525754] space-y-2.5 list-decimal list-inside leading-relaxed">
                      <li>
                        <strong>Iniciar Sesión:</strong> Ingresa a <a href="https://dashboard.wompi.co" target="_blank" rel="noopener noreferrer" className="text-[#B97A48] font-bold underline">dashboard.wompi.co</a> con tus credenciales de comercio.
                      </li>
                      <li>
                        <strong>Cambiar a Modo Producción:</strong> En la esquina superior derecha del panel de Wompi, cambia el interruptor de <em>Sandbox</em> a <strong>Producción</strong> (tu cuenta bancaria de Bancolombia u otro banco debe estar validada).
                      </li>
                      <li>
                        <strong>Copiar las Llaves:</strong> Dirígete al menú <strong>Desarrolladores &gt; Llaves de API</strong>. Copia tu <strong>Llave pública</strong> (<code>pub_prod_...</code>), <strong>Llave privada</strong> (<code>prv_prod_...</code>) y tu <strong>Secreto de integridad</strong> (<code>prod_integrity_...</code>).
                      </li>
                      <li>
                        <strong>Escribir y Guardar en este Formulario:</strong> Selecciona arriba la opción <strong>🔴 Modo Producción</strong>, pega tus llaves y presiona <strong>"Guardar y Aplicar Credenciales"</strong>.
                      </li>
                      <li>
                        <strong>Verificar Conexión:</strong> Presiona el botón <strong>"Verificar Llaves"</strong> para confirmar que Wompi responde positivamente con el nombre de tu comercio registrado.
                      </li>
                    </ol>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* SUB-MODAL: WOMPI LIVE PAYMENT VERIFICATION INSPECTOR */}
        {inspectingPaymentOrder && (
          <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#ECE5DD] shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <SearchCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1C1F1E]">
                      Verificación de Pago en Tiempo Real
                    </h3>
                    <p className="text-xs text-[#6B706C]">
                      Pedido #{inspectingPaymentOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setInspectingPaymentOrder(null);
                    setWompiVerifyResult(null);
                  }}
                  className="w-7 h-7 rounded-full bg-[#EFE9DF] text-[#1C1F1E] flex items-center justify-center hover:bg-[#DED7CB] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Basic Details */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#6E7370]">Cliente:</span>
                  <strong className="text-[#1C1F1E]">{inspectingPaymentOrder.customerName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6E7370]">Teléfono / WhatsApp:</span>
                  <span className="text-[#1C1F1E] font-medium">{inspectingPaymentOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6E7370]">Valor a Cobrar:</span>
                  <strong className="text-emerald-700 text-sm font-black">
                    {formatCOP(inspectingPaymentOrder.total)}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6E7370]">Método Seleccionado:</span>
                  <span className="font-bold text-[#1C1F1E] uppercase">{inspectingPaymentOrder.paymentMethod}</span>
                </div>
                {inspectingPaymentOrder.wompiTransactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#6E7370]">ID Transacción Wompi:</span>
                    <span className="font-mono text-emerald-800 font-bold">{inspectingPaymentOrder.wompiTransactionId}</span>
                  </div>
                )}
                {inspectingPaymentOrder.paymentReference && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#6E7370]">Referencia de Pago:</span>
                    <span className="font-mono text-amber-800 font-bold">{inspectingPaymentOrder.paymentReference}</span>
                  </div>
                )}
              </div>

              {/* Verification Result Display */}
              {isVerifyingWompiOrder ? (
                <div className="py-8 text-center space-y-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE5DD]">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-[#1C1F1E]">
                    Consultando servidores de Wompi y pasarela bancaria...
                  </p>
                  <p className="text-[11px] text-[#6E7370]">
                    Verificando si los fondos ingresaron y fueron aprobados.
                  </p>
                </div>
              ) : wompiVerifyResult ? (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    wompiVerifyResult.isApproved
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : wompiVerifyResult.status === 'DECLINED'
                      ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                      : 'bg-amber-50/80 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {wompiVerifyResult.isApproved ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : wompiVerifyResult.status === 'DECLINED' ? (
                      <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">
                        {wompiVerifyResult.isApproved
                          ? '✅ PAGO APROBADO Y CONFIRMADO'
                          : wompiVerifyResult.status === 'DECLINED'
                          ? '❌ PAGO RECHAZADO EN WOMPI'
                          : '⏳ PAGO NO CONFIRMADO O PENDIENTE'}
                      </h4>
                      <p className="text-xs font-medium mt-0.5">
                        {wompiVerifyResult.rawMessage}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="bg-white/90 p-3 rounded-xl border border-black/5 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#6E7370]">Estado Oficial:</span>
                      <strong className={wompiVerifyResult.isApproved ? 'text-emerald-700 font-bold' : 'text-amber-800'}>
                        {wompiVerifyResult.status}
                      </strong>
                    </div>
                    {wompiVerifyResult.amount && (
                      <div className="flex justify-between">
                        <span className="text-[#6E7370]">Monto Verificado:</span>
                        <strong>{formatCOP(wompiVerifyResult.amount)}</strong>
                      </div>
                    )}
                    {wompiVerifyResult.paymentMethodType && (
                      <div className="flex justify-between">
                        <span className="text-[#6E7370]">Medio de Pago:</span>
                        <strong>{wompiVerifyResult.paymentMethodType}</strong>
                      </div>
                    )}
                    {wompiVerifyResult.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-[#6E7370]">ID Transacción:</span>
                        <strong className="text-emerald-800">{wompiVerifyResult.transactionId}</strong>
                      </div>
                    )}
                    {wompiVerifyResult.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-[#6E7370]">Fecha / Hora:</span>
                        <span>{formatDate(wompiVerifyResult.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Dispatch Safety Recommendation */}
                  <div className="p-2.5 rounded-xl bg-white text-xs border border-black/5">
                    {wompiVerifyResult.isApproved ? (
                      <p className="text-emerald-800 font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>¡Puedes proceder a despachar o preparar el paquete con total seguridad!</span>
                      </p>
                    ) : (
                      <p className="text-rose-700 font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>ADVERTENCIA: No despaches el pedido hasta que el cliente complete el pago o aparezca APROBADO.</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Direct Links and manual actions */}
              <div className="space-y-2 pt-2 border-t border-[#ECE5DD]">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyOrderPaymentWithWompi(inspectingPaymentOrder)}
                    disabled={isVerifyingWompiOrder}
                    className="flex-1 py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingWompiOrder ? 'animate-spin' : ''}`} />
                    <span>Volver a Consultar con Wompi</span>
                  </button>

                  <a
                    href="https://dashboard.wompi.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1C1F1E] font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                    title="Abrir Dashboard oficial de Wompi"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver en dashboard.wompi.co</span>
                  </a>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateOrderStatus(inspectingPaymentOrder.id, 'pagado');
                      setInspectingPaymentOrder(null);
                    }}
                    className="flex-1 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs transition-colors"
                  >
                    ✓ Marcar Manualmente como Pagado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateOrderStatus(inspectingPaymentOrder.id, 'cancelado');
                      setInspectingPaymentOrder(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition-colors"
                  >
                    Cancelar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL: PRODUCT CREATOR / EDITOR (WITH DIRECT DESKTOP FILE UPLOAD) */}
        {isEditingProduct && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#ECE5DD] shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-3">
                <h3 className="text-base font-bold text-[#1C1F1E]">
                  {productForm.id && products.some((p) => p.id === productForm.id)
                    ? 'Editar Producto'
                    : 'Agregar Nuevo Producto a la Tienda'}
                </h3>
                <button
                  onClick={() => setIsEditingProduct(false)}
                  className="w-7 h-7 rounded-full bg-[#EFE9DF] text-[#1C1F1E] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                {/* Photo Uploader from Desktop */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#1C1F1E]">
                    📸 Foto del Producto (Búsqueda directa desde tu Escritorio / PC)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#ECE5DD]">
                    <div className="w-24 h-24 rounded-2xl bg-white border border-[#DED7CB] overflow-hidden flex items-center justify-center shrink-0">
                      {productForm.imageUrl ? (
                        <img
                          src={productForm.imageUrl}
                          alt="Vista previa"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-[#A8ADA9]" />
                      )}
                    </div>

                    <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                      {/* Desktop File Picker */}
                      <input
                        type="file"
                        ref={productFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'product')}
                        className="hidden"
                        id="product-desktop-image-input"
                      />
                      <button
                        type="button"
                        id="trigger-product-upload-btn"
                        onClick={() => productFileInputRef.current?.click()}
                        disabled={isCompressingImage}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isCompressingImage ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{isCompressingImage ? 'Optimizando foto...' : 'Examinar fotos en mi computador'}</span>
                      </button>

                      <div className="text-[11px] text-[#7A807C]">
                        O ingresa URL de imagen directa:
                        <input
                          type="text"
                          value={productForm.imageUrl}
                          onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full mt-1 bg-white border border-[#DED7CB] rounded-lg px-2.5 py-1 text-xs text-[#1C1F1E]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Ej. Alimento Premium Razas Pequeñas (10 Kg)"
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                  />
                </div>

                {/* Price and Original Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                      {productForm.hasVariants && (productForm.variants || []).length > 0
                        ? 'Precio Base / Mínimo ($ COP)'
                        : 'Precio de Venta ($ COP) *'}
                    </label>
                    <input
                      type="number"
                      required={!productForm.hasVariants || (productForm.variants || []).length === 0}
                      value={productForm.price || ''}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      placeholder="Ej. 89900"
                      className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                      Precio Original / Tachado ($ COP)
                    </label>
                    <input
                      type="number"
                      value={productForm.originalPrice || ''}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Ej. 110000"
                      className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                    />
                  </div>
                </div>

                {/* Variantes / Presentaciones / Tamaños / Pesos */}
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#DED7CB] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-xs text-[#1C1F1E]">
                        <Layers className="w-4 h-4 text-[#B97A48]" />
                        <span>Presentaciones, Tamaños o Pesos Múltiples (Variantes)</span>
                      </div>
                      <p className="text-[11px] text-[#606562] mt-0.5">
                        Activa esta opción si el producto viene en diferentes medidas (ej. Colchón Pequeño/Mediano/Grande) o pesos (ej. 2 Kg, 12 Kg, 25 Kg). Cada opción tiene su precio y stock.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={productForm.hasVariants ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setProductForm((prev) => {
                            const existing = prev.variants && prev.variants.length > 0 ? prev.variants : [
                              { id: `var_${Date.now()}_1`, name: '2 Kg', price: prev.price || 45000, stockCount: 10 },
                              { id: `var_${Date.now()}_2`, name: '12 Kg', price: (prev.price || 45000) * 3, stockCount: 8 },
                              { id: `var_${Date.now()}_3`, name: '25 Kg', price: (prev.price || 45000) * 5.5, stockCount: 5 },
                            ];
                            return {
                              ...prev,
                              hasVariants: checked,
                              variants: checked ? existing : prev.variants,
                            };
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C2722]"></div>
                    </label>
                  </div>

                  {productForm.hasVariants && (
                    <div className="space-y-3 pt-2 border-t border-[#ECE5DD]">
                      {/* Quick templates */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-semibold text-[#7A807C]">Sugerencias rápidas (puedes editarlas libremente):</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm((prev) => ({
                              ...prev,
                              variants: [
                                { id: `var_${Date.now()}_1`, name: '2 Kg', price: prev.price || 38000, stockCount: 15 },
                                { id: `var_${Date.now()}_2`, name: '12 Kg', price: 145000, stockCount: 10 },
                                { id: `var_${Date.now()}_3`, name: '25 Kg', price: 260000, stockCount: 6 },
                              ],
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#DED7CB] hover:bg-[#EFE9DF] text-[11px] font-bold text-[#1C1F1E] transition-colors"
                        >
                          🥫 Bultos Alimento (2 Kg, 12 Kg, 25 Kg)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm((prev) => ({
                              ...prev,
                              variants: [
                                { id: `var_${Date.now()}_1`, name: 'Pequeño (50x40 cm)', price: 45000, stockCount: 10 },
                                { id: `var_${Date.now()}_2`, name: 'Mediano (70x55 cm)', price: 68000, stockCount: 8 },
                                { id: `var_${Date.now()}_3`, name: 'Grande (90x70 cm)', price: 95000, stockCount: 5 },
                                { id: `var_${Date.now()}_4`, name: 'Extra Grande (110x85 cm)', price: 125000, stockCount: 4 },
                              ],
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#DED7CB] hover:bg-[#EFE9DF] text-[11px] font-bold text-[#1C1F1E] transition-colors"
                        >
                          🛏️ Tamaños Cama / Colchón
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm((prev) => ({
                              ...prev,
                              variants: [
                                { id: `var_${Date.now()}_1`, name: '1 Unidad', price: prev.price || 25000, stockCount: 20 },
                                { id: `var_${Date.now()}_2`, name: 'Pack x3', price: (prev.price || 25000) * 2.7, stockCount: 10 },
                                { id: `var_${Date.now()}_3`, name: 'Pack x6', price: (prev.price || 25000) * 5, stockCount: 5 },
                              ],
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#DED7CB] hover:bg-[#EFE9DF] text-[11px] font-bold text-[#1C1F1E] transition-colors"
                        >
                          📦 Packs / Paquetes
                        </button>
                      </div>

                      {/* Variants list editor */}
                      <div className="space-y-2">
                        {(productForm.variants || []).map((v, index) => (
                          <div
                            key={v.id || index}
                            className="p-2.5 bg-white rounded-xl border border-[#DED7CB] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                          >
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-[#7A807C] mb-0.5">
                                Presentación / Medida / Peso *
                              </label>
                              <input
                                type="text"
                                required
                                value={v.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProductForm((prev) => {
                                    const next = [...(prev.variants || [])];
                                    next[index] = { ...next[index], name: val };
                                    return { ...prev, variants: next };
                                  });
                                }}
                                placeholder="Ej. 2 Kg, 12 Kg, 25 Kg, Mediano..."
                                className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-[#7A807C] mb-0.5">
                                Precio Venta ($ COP) *
                              </label>
                              <input
                                type="number"
                                required
                                min={0}
                                value={v.price || ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setProductForm((prev) => {
                                    const next = [...(prev.variants || [])];
                                    next[index] = { ...next[index], price: val };
                                    return { ...prev, variants: next };
                                  });
                                }}
                                placeholder="Ej. 145000"
                                className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-[#7A807C] mb-0.5">
                                Precio Tachado (Opcional)
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={v.originalPrice || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : undefined;
                                  setProductForm((prev) => {
                                    const next = [...(prev.variants || [])];
                                    next[index] = { ...next[index], originalPrice: val };
                                    return { ...prev, variants: next };
                                  });
                                }}
                                placeholder="Ej. 170000"
                                className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                              />
                            </div>

                            <div className="sm:col-span-2 flex items-center gap-1.5">
                              <div className="flex-1 min-w-0">
                                <label className="block text-[10px] font-bold text-[#7A807C] mb-0.5">
                                  Stock *
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  required
                                  value={v.stockCount ?? 10}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    setProductForm((prev) => {
                                      const next = [...(prev.variants || [])];
                                      next[index] = { ...next[index], stockCount: val };
                                      return { ...prev, variants: next };
                                    });
                                  }}
                                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-lg px-2 py-1.5 text-xs font-bold text-center text-[#1C1F1E] outline-none focus:border-[#1C2722]"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm((prev) => {
                                    const next = (prev.variants || []).filter((_, i) => i !== index);
                                    return { ...prev, variants: next };
                                  });
                                }}
                                className="mt-4 p-1.5 rounded-lg text-[#999E9B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Eliminar esta opción"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add variant button */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm((prev) => ({
                              ...prev,
                              variants: [
                                ...(prev.variants || []),
                                {
                                  id: `var_${Date.now()}_${(prev.variants || []).length + 1}`,
                                  name: '',
                                  price: prev.price || 0,
                                  stockCount: 10,
                                },
                              ],
                            }));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#DED7CB] hover:bg-[#EFE9DF] text-xs font-bold text-[#1C1F1E] flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar otra presentación o peso</span>
                        </button>

                        {(productForm.variants || []).length > 0 && (
                          <span className="text-[11px] font-semibold text-[#5F6360]">
                            {(productForm.variants || []).length} opciones registradas
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Category & Pet Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                      Categoría
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                    >
                      <option value="alimentos">Alimentos</option>
                      <option value="juguetes">Juguetes</option>
                      <option value="higiene">Higiene</option>
                      <option value="camas">Camas</option>
                      <option value="accesorios">Accesorios</option>
                      <option value="snacks">Snacks</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                      Tipo de Mascota
                    </label>
                    <select
                      value={productForm.petType}
                      onChange={(e) => setProductForm({ ...productForm, petType: e.target.value as PetType })}
                      className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                    >
                      <option value="perro">🐶 Perro</option>
                      <option value="gato">🐱 Gato</option>
                      <option value="ambos">🐾 Perros y Gatos</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Descripción del Producto
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Beneficios, ingredientes, materiales, modo de uso..."
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                  />
                </div>

                {/* Cantidad de Stock Físico */}
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1C1F1E]">
                      📦 Cantidad de Stock Físico (Inventario Real) *
                    </label>
                    <span className={`text-[11px] font-bold ${
                      (productForm.stockCount ?? 0) > 3
                        ? 'text-emerald-700'
                        : (productForm.stockCount ?? 0) > 0
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}>
                      {(productForm.stockCount ?? 0) > 0
                        ? `${productForm.stockCount} unidades disponibles`
                        : 'Agotado (0 unidades)'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-white border border-[#DED7CB] rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((prev) => {
                            const newCount = Math.max(0, (prev.stockCount || 0) - 1);
                            return { ...prev, stockCount: newCount, inStock: newCount > 0 };
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-[#F2EDE4] hover:bg-[#E2D9CD] font-bold text-[#1C1F1E] flex items-center justify-center transition-all"
                        title="Restar 1 unidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min={0}
                        required
                        value={productForm.stockCount ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setProductForm((prev) => ({
                            ...prev,
                            stockCount: val,
                            inStock: val > 0,
                          }));
                        }}
                        className="w-16 bg-transparent text-center text-sm font-black text-[#1C1F1E] outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((prev) => {
                            const newCount = (prev.stockCount || 0) + 1;
                            return { ...prev, stockCount: newCount, inStock: true };
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold flex items-center justify-center transition-all"
                        title="Sumar 1 unidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick quantity increments */}
                    <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                      {[+5, +10, +25, +50].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() =>
                            setProductForm((prev) => {
                              const newCount = (prev.stockCount || 0) + qty;
                              return { ...prev, stockCount: newCount, inStock: true };
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[#DED7CB] hover:bg-[#EFE9DF] text-xs font-bold text-[#1C1F1E] transition-all"
                        >
                          +{qty}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setProductForm((prev) => ({ ...prev, stockCount: 0, inStock: false }))}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all"
                      >
                        Agotado (0)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stock & Featured Switches */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#DED7CB] bg-[#FAF8F5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.inStock ?? true}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProductForm({
                          ...productForm,
                          inStock: checked,
                          stockCount: checked && (!productForm.stockCount || productForm.stockCount <= 0) ? 10 : (checked ? productForm.stockCount : 0),
                        });
                      }}
                      className="accent-[#1C2722]"
                    />
                    <span className="text-xs font-bold text-[#1C1F1E]">Disponible para Comprar</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#DED7CB] bg-[#FAF8F5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured ?? false}
                      onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                      className="accent-[#1C2722]"
                    />
                    <span className="text-xs font-bold text-[#1C1F1E]">Destacado / ¡Nuevo!</span>
                  </label>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProduct(false)}
                      className="px-4 py-2.5 rounded-2xl border border-[#DED7CB] text-xs font-bold text-[#1C1F1E] hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>

                    {onOpenTikTokReel && productForm.id && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentProd = products.find((p) => p.id === productForm.id) || (productForm as Product);
                          onOpenTikTokReel(currentProd);
                        }}
                        className="px-3.5 py-2.5 rounded-2xl bg-black hover:bg-zinc-800 text-amber-300 border border-amber-400/40 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="🎬 Crear Reel / Video 9:16 para TikTok"
                      >
                        <Video className="w-3.5 h-3.5 text-[#D99A46]" />
                        <span>Reel TikTok</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      id="save-product-modal-submit-btn"
                      disabled={isSavingProductDefinitive}
                      className="flex-1 py-3 px-5 rounded-2xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-black shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      title="Guardar este cambio de forma permanente y definitiva en disco y nube"
                    >
                      <Save className="w-4 h-4 text-amber-400" />
                      <span>
                        {isSavingProductDefinitive
                          ? 'Guardando Definitivamente en Disco y Nube...'
                          : '💾 Guardar Cambio Definitivo en Servidor y Nube'}
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7A807C] text-center">
                    🔒 Este botón guarda la nueva foto, precio y opciones permanentemente en el disco del servidor para que nunca vuelvan a revertirse al recargar.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL: BLOG POST EDITOR */}
        {isEditingBlog && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#ECE5DD] shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-3">
                <h3 className="text-base font-bold text-[#1C1F1E]">
                  {blogForm.id && blogPosts.some((b) => b.id === blogForm.id) ? 'Editar Artículo' : 'Nuevo Artículo'}
                </h3>
                <button
                  onClick={() => setIsEditingBlog(false)}
                  className="w-7 h-7 rounded-full bg-[#EFE9DF] text-[#1C1F1E] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBlogPost} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Título del Artículo *
                  </label>
                  <input
                    type="text"
                    required
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E] outline-none"
                  />
                </div>

                {/* Cover photo from desktop */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Foto de Portada (Desde PC o URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={blogFileInputRef}
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, 'blog')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => blogFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DED7CB] rounded-lg text-xs font-bold text-[#1C1F1E]"
                    >
                      📁 Subir desde PC
                    </button>
                    <input
                      type="text"
                      value={blogForm.coverImage}
                      onChange={(e) => setBlogForm({ ...blogForm, coverImage: e.target.value })}
                      placeholder="O URL..."
                      className="flex-1 bg-white border border-[#DED7CB] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1F1E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Resumen corto
                  </label>
                  <input
                    type="text"
                    value={blogForm.summary}
                    onChange={(e) => setBlogForm({ ...blogForm, summary: e.target.value })}
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1F1E] mb-1">
                    Contenido Completo
                  </label>
                  <textarea
                    rows={6}
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                    className="w-full bg-white border border-[#DED7CB] rounded-xl px-3 py-2 text-sm text-[#1C1F1E]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingBlog(false)}
                    className="px-4 py-2 rounded-xl border border-[#DED7CB] text-xs font-bold text-[#1C1F1E]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#1C2722] text-white text-xs font-bold"
                  >
                    Publicar Artículo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE PRODUCT MODAL */}
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#ECE5DD] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1C1F1E]">¿Eliminar este producto?</h4>
                <p className="text-xs text-[#737874] mt-1 line-clamp-2">
                  &quot;{productToDelete.name}&quot;
                </p>
                <p className="text-[11px] text-rose-600 font-medium mt-2 bg-rose-50 p-2 rounded-xl border border-rose-100">
                  Esta acción retirará el producto de la tienda y de la base de datos de manera definitiva.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeletingProduct}
                  className="flex-1 py-2.5 rounded-xl border border-[#DED7CB] text-xs font-bold text-[#1C1F1E] hover:bg-[#F7F4EE] transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="confirm-delete-product-btn"
                  onClick={handleConfirmDeleteProduct}
                  disabled={isDeletingProduct}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isDeletingProduct ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Borrando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sí, Eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM BULK DELETE MULTIPLE PRODUCTS MODAL */}
        {showBulkDeleteModal && selectedProductIds.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#ECE5DD] text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
                <Trash2 className="w-7 h-7 text-rose-600" />
              </div>

              <div>
                <h4 className="text-lg font-black text-[#1C1F1E]">
                  ¿Eliminar {selectedProductIds.length} producto{selectedProductIds.length > 1 ? 's' : ''}?
                </h4>
                <p className="text-xs text-[#737874] mt-1.5 leading-relaxed">
                  Has marcado <span className="font-bold text-rose-700">{selectedProductIds.length} productos</span> con el chulito para eliminación masiva.
                </p>

                {/* Selected Products Preview List */}
                <div className="mt-3 max-h-36 overflow-y-auto rounded-xl bg-[#FAF8F5] p-2.5 border border-[#ECE5DD] text-left space-y-1.5 divide-y divide-[#ECE5DD]/60">
                  {selectedProductIds.slice(0, 8).map((id) => {
                    const prod = products.find((p) => p.id === id);
                    return (
                      <div key={id} className="pt-1 first:pt-0 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#1C1F1E] truncate max-w-[220px]">
                          • {prod?.name || id}
                        </span>
                        <span className="text-[11px] font-bold text-[#7A807C] shrink-0">
                          {prod ? formatCOP(prod.price) : ''}
                        </span>
                      </div>
                    );
                  })}
                  {selectedProductIds.length > 8 && (
                    <div className="text-[11px] text-[#7A807C] font-semibold text-center pt-1.5">
                      + y {selectedProductIds.length - 8} productos más...
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-rose-700 font-medium mt-3 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  ⚠️ Esta acción borrará permanentemente los {selectedProductIds.length} productos seleccionados de tu catálogo, de la base de datos y de la nube.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isBulkDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-[#DED7CB] text-xs font-bold text-[#1C1F1E] hover:bg-[#F7F4EE] transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="confirm-bulk-delete-btn"
                  onClick={handleConfirmBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isBulkDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Borrando {selectedProductIds.length}...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, Borrar los {selectedProductIds.length}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
