import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Heart,
  MessageCircle,
  ShieldCheck,
  Truck,
  Dog,
  Cat,
} from 'lucide-react';
import {
  AboutContent,
  AdminCredentials,
  BlogPost,
  CartItem,
  Category,
  ContactInfo,
  CustomerLead,
  CustomerReview,
  Order,
  PetType,
  Product,
  ProductVariant,
  ToastMessage,
} from './types';
import {
  getStoredAboutContent,
  getStoredAdminCredentials,
  getStoredBlogPosts,
  getStoredCategories,
  getStoredContactInfo,
  getStoredCustomerLeads,
  getStoredOrders,
  getStoredProducts,
  getStoredReviews,
  getIsAdminLoggedIn,
  saveStoredAboutContent,
  saveStoredAdminCredentials,
  saveStoredBlogPosts,
  saveStoredContactInfo,
  saveStoredCustomerLeads,
  saveStoredOrders,
  saveStoredProducts,
  saveStoredReviews,
  setIsAdminLoggedIn as setStorageAdminLoggedIn,
  resetProductsToSamples,
  clearAllProducts,
  addStoredOrder,
  addStoredCustomerLead,
  addStoredReview,
  restoreAllSiteDataBackup,
  SiteDataBackup,
  subscribeToStoreCloudSync,
  initializeCloudFirestoreSync,
  fetchAllCloudAndServerOrders,
  fetchAllCloudAndServerProducts,
  persistProductsDefinitively,
  getStoredCustomerCheckoutProfile,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryRow } from './components/CategoryRow';
import { ProductCard } from './components/ProductCard';
import { CartDrawer, CheckoutStep } from './components/CartDrawer';
import { AdminModal } from './components/AdminModal';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { AboutSection } from './components/AboutSection';
import { BlogSection } from './components/BlogSection';
import { ContactSection } from './components/ContactSection';
import { FoodCalculatorModal } from './components/FoodCalculatorModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { VirtualVetModal } from './components/VirtualVetModal';
import { TestimonialsSection } from './components/TestimonialsSection';
import { InvoiceModal } from './components/InvoiceModal';
import { TikTokReelModal } from './components/TikTokReelModal';
import { Footer } from './components/Footer';
import { LegalPoliciesModal, LegalPolicyTab } from './components/LegalPoliciesModal';
import { NotificationToast } from './components/NotificationToast';
import { formatCOP, formatPhoneNumber } from './utils/formatters';

export default function App() {
  // App persistent state
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [categories, setCategories] = useState<Category[]>(getStoredCategories);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(getStoredContactInfo);
  const [aboutContent, setAboutContent] = useState<AboutContent>(getStoredAboutContent);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(getStoredBlogPosts);
  const [orders, setOrders] = useState<Order[]>(getStoredOrders);
  const [customerLeads, setCustomerLeads] = useState<CustomerLead[]>(getStoredCustomerLeads);
  const [reviews, setReviews] = useState<CustomerReview[]>(getStoredReviews);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(getStoredAdminCredentials);
  const [isAdminLoggedIn, setIsAdminLoggedInState] = useState<boolean>(getIsAdminLoggedIn);

  // Navigation & Filtering
  const [activeSection, setActiveSection] = useState<'catalog' | 'about' | 'blog' | 'contact'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPetType, setSelectedPetType] = useState<PetType>('ambos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');

  // UI Drawers & Modals
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const localCart = localStorage.getItem('patitas_cart_v1');
      return localCart ? JSON.parse(localCart) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartInitialStep, setCartInitialStep] = useState<CheckoutStep>('cart');
  const [cartCheckoutBanner, setCartCheckoutBanner] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFoodCalculatorOpen, setIsFoodCalculatorOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isVirtualVetOpen, setIsVirtualVetOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [tikTokReelProduct, setTikTokReelProduct] = useState<Product | null>(null);
  const [isLegalPolicyOpen, setIsLegalPolicyOpen] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<LegalPolicyTab>('returns');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('patitas_cart_v1', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Real-time Local & Internal Server Disk Storage Synchronization
  useEffect(() => {
    // 1. Initial Local Storage & Server Disk Check
    initializeCloudFirestoreSync();

    // 2. Fetch and merge all orders & products from Local Storage & Server Disk Storage
    fetchAllCloudAndServerOrders().then((recoveredOrders) => {
      if (recoveredOrders && recoveredOrders.length > 0) {
        setOrders(recoveredOrders);
      }
    });

    fetchAllCloudAndServerProducts().then((recoveredProducts) => {
      if (Array.isArray(recoveredProducts)) {
        setProducts(recoveredProducts);
      }
    });

    // 3. Subscribe to Real-time Cloud Firestore updates (across all devices & sessions)
    const unsubscribe = subscribeToStoreCloudSync({
      onProductsUpdate: (newProducts) => {
        setProducts(newProducts);
      },
      onCategoriesUpdate: (newCats) => {
        setCategories(newCats);
      },
      onSettingsUpdate: ({ contactInfo: newContact, aboutContent: newAbout }) => {
        if (newContact) setContactInfo(newContact);
        if (newAbout) setAboutContent(newAbout);
      },
      onOrdersUpdate: (newOrders) => {
        setOrders(newOrders);
      },
      onLeadsUpdate: (newLeads) => {
        setCustomerLeads(newLeads);
      },
      onReviewsUpdate: (newReviews) => {
        setReviews(newReviews);
      },
      onBlogUpdate: (newPosts) => {
        setBlogPosts(newPosts);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Check URL parameters for Wompi transaction return (redirect mode)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wompiTxId = params.get('id');
    const wompiRef = params.get('wompi_ref') || params.get('reference');

    if (wompiTxId || wompiRef) {
      // Clear URL query without reloading
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      if (wompiTxId) {
        fetch(`/api/wompi/transaction/${wompiTxId}`)
          .then((r) => r.json())
          .then((data) => {
            const tx = data?.transaction;
            if (tx) {
              if (tx.status === 'APPROVED') {
                showToast(`¡Pago Aprobado con Wompi! Ref: ${tx.reference}`, 'success');
                // Update order if found in state
                setOrders((prev) => {
                  const updated = prev.map((ord) =>
                    ord.orderNumber === tx.reference
                      ? { ...ord, status: 'pagado' as const, wompiStatus: 'APPROVED', wompiTransactionId: tx.id }
                      : ord
                  );
                  saveStoredOrders(updated);
                  return updated;
                });
              } else if (tx.status === 'DECLINED') {
                showToast(`El pago con Wompi fue rechazado. Ref: ${tx.reference}`, 'error');
              } else {
                showToast(`Pago Wompi en estado: ${tx.status}`, 'info');
              }
            }
          })
          .catch((err) => console.error('Error verificando retorno Wompi:', err));
      }
    }
  }, []);

  // Toast Notification Helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Subpage URL & Route Synchronization (Enables direct links for Google Ads, Google Business, and SEO)
  const handleRouteSync = (pathname: string) => {
    const cleanPath = pathname.toLowerCase().trim();
    if (cleanPath === '/carrito' || cleanPath === '/cart' || cleanPath === '/checkout') {
      setActiveSection('catalog');
      setCartInitialStep('cart');
      setIsCartOpen(true);
    } else if (cleanPath === '/nosotros' || cleanPath === '/about') {
      setActiveSection('about');
      setIsCartOpen(false);
    } else if (cleanPath === '/blog') {
      setActiveSection('blog');
      setIsCartOpen(false);
    } else if (cleanPath === '/contacto' || cleanPath === '/contact') {
      setActiveSection('contact');
      setIsCartOpen(false);
    } else if (cleanPath === '/calculadora') {
      setIsFoodCalculatorOpen(true);
    } else if (cleanPath === '/devoluciones' || cleanPath === '/reembolsos' || cleanPath === '/garantias') {
      setActiveLegalTab('returns');
      setIsLegalPolicyOpen(true);
    } else if (cleanPath === '/envios' || cleanPath === '/despachos') {
      setActiveLegalTab('shipping');
      setIsLegalPolicyOpen(true);
    } else if (cleanPath === '/terminos' || cleanPath === '/condiciones') {
      setActiveLegalTab('terms');
      setIsLegalPolicyOpen(true);
    } else if (cleanPath === '/privacidad' || cleanPath === '/datos' || cleanPath === '/habeas-data') {
      setActiveLegalTab('privacy');
      setIsLegalPolicyOpen(true);
    } else if (cleanPath === '/politicas' || cleanPath === '/legal') {
      setActiveLegalTab('returns');
      setIsLegalPolicyOpen(true);
    } else if (cleanPath === '/admin') {
      setIsAdminOpen(true);
    } else if (cleanPath.startsWith('/producto/') || cleanPath.startsWith('/product/')) {
      const prodId = cleanPath.split('/')[2];
      if (prodId && products.length > 0) {
        const found = products.find((p) => p.id === prodId || p.slug === prodId);
        if (found) {
          setQuickViewProduct(found);
        }
      }
    } else if (cleanPath === '/catalogo' || cleanPath === '/tienda' || cleanPath === '/productos' || cleanPath === '/products') {
      setActiveSection('catalog');
      setIsCartOpen(false);
    }
  };

  useEffect(() => {
    handleRouteSync(window.location.pathname);

    const onPopState = () => {
      handleRouteSync(window.location.pathname);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [products]);

  const handleNavigateSection = (section: 'catalog' | 'about' | 'blog' | 'contact') => {
    setActiveSection(section);
    setIsCartOpen(false);
    const path = section === 'catalog' ? '/catalogo' : `/${section === 'about' ? 'nosotros' : section === 'contact' ? 'contacto' : 'blog'}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const VALID_CHECKOUT_STEPS: CheckoutStep[] = ['cart', 'customer_info', 'order_review', 'wompi_processing', 'confirmed'];

  const handleOpenCart = (stepArg?: unknown, bannerArg?: unknown) => {
    const step: CheckoutStep = (typeof stepArg === 'string' && VALID_CHECKOUT_STEPS.includes(stepArg as CheckoutStep))
      ? (stepArg as CheckoutStep)
      : 'cart';
    const banner: string | null = typeof bannerArg === 'string' ? bannerArg : null;

    setCartInitialStep(step);
    setCartCheckoutBanner(banner);
    setIsCartOpen(true);
    if (window.location.pathname !== '/carrito') {
      window.history.pushState({}, '', '/carrito');
    }
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    setCartCheckoutBanner(null);
    const returnPath = activeSection === 'catalog' ? '/catalogo' : `/${activeSection === 'about' ? 'nosotros' : activeSection === 'contact' ? 'contacto' : 'blog'}`;
    if (window.location.pathname === '/carrito' || window.location.pathname === '/cart' || window.location.pathname === '/checkout') {
      window.history.pushState({}, '', returnPath);
    }
  };

  const handleOpenQuickView = (prod: Product) => {
    setQuickViewProduct(prod);
    window.history.pushState({}, '', `/producto/${prod.id}`);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
    const returnPath = activeSection === 'catalog' ? '/catalogo' : `/${activeSection === 'about' ? 'nosotros' : activeSection === 'contact' ? 'contacto' : 'blog'}`;
    if (window.location.pathname.startsWith('/producto/')) {
      window.history.pushState({}, '', returnPath);
    }
  };

  const handleOpenPolicy = (tab: LegalPolicyTab) => {
    setActiveLegalTab(tab);
    setIsLegalPolicyOpen(true);
    const pathMap: Record<LegalPolicyTab, string> = {
      returns: '/devoluciones',
      shipping: '/envios',
      terms: '/terminos',
      privacy: '/privacidad',
    };
    if (window.location.pathname !== pathMap[tab]) {
      window.history.pushState({}, '', pathMap[tab]);
    }
  };

  const handleClosePolicy = () => {
    setIsLegalPolicyOpen(false);
    const returnPath = activeSection === 'catalog' ? '/catalogo' : `/${activeSection === 'about' ? 'nosotros' : activeSection === 'contact' ? 'contacto' : 'blog'}`;
    const policyPaths = ['/devoluciones', '/envios', '/terminos', '/privacidad', '/politicas', '/reembolsos', '/garantias', '/despachos', '/condiciones', '/datos', '/habeas-data'];
    if (policyPaths.includes(window.location.pathname)) {
      window.history.pushState({}, '', returnPath);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, variant?: ProductVariant) => {
    const itemKey = variant ? `${product.id}_${variant.id}` : product.id;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => {
        const k = item.selectedVariant ? `${item.product.id}_${item.selectedVariant.id}` : item.product.id;
        return k === itemKey;
      });
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity, selectedVariant: variant }];
    });
    const variantLabel = variant ? ` (${variant.name})` : '';
    showToast(`"${product.name}${variantLabel}" añadido al carrito 🛒`, 'success');
  };

  const handleDirectBuy = (product: Product, quantity = 1, variant?: ProductVariant) => {
    // 1. Add product to cart
    handleAddToCart(product, quantity, variant);

    // 2. Immediately close floating quick view modal so it fades out with AnimatePresence
    handleCloseQuickView();

    // 3. Determine if customer already has contact & address information stored
    const savedProfile = getStoredCustomerCheckoutProfile();
    const hasCompleteShippingInfo = Boolean(
      savedProfile?.name?.trim() &&
      savedProfile?.phone?.trim() &&
      savedProfile?.address?.trim()
    );

    // If shipping info is complete, jump straight to 'order_review' to click "Ir a Pagar a Wompi"
    // Otherwise jump to 'customer_info' so they can enter delivery details
    const targetStep: CheckoutStep = hasCompleteShippingInfo ? 'order_review' : 'customer_info';
    const banner = hasCompleteShippingInfo
      ? `⚡ Compra directa: Revisa tu pedido de "${product.name}" y haz clic en "Pago PSE".`
      : `⚡ Compra directa: Ingresa tus datos de entrega para procesar tu pago seguro por PSE.`;

    handleOpenCart(targetStep, banner);
  };

  const handleUpdateCartQuantity = (itemKey: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(itemKey);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        const k = item.selectedVariant ? `${item.product.id}_${item.selectedVariant.id}` : item.product.id;
        return k === itemKey ? { ...item, quantity } : item;
      })
    );
  };

  const handleRemoveCartItem = (itemKey: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        const k = item.selectedVariant ? `${item.product.id}_${item.selectedVariant.id}` : item.product.id;
        return k !== itemKey;
      })
    );
    showToast('Producto eliminado del carrito.', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderCompleted = (newOrder: Order) => {
    addStoredOrder(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
    handleClearCart();
    showToast(`¡Pedido #${newOrder.orderNumber} creado exitosamente!`, 'success');
  };

  // Admin Auth handlers
  const handleAdminLogin = (password: string): boolean => {
    const cleanPass = (password || '').trim();
    if (cleanPass === 'Lunary2027*' || cleanPass === 'Lunary2017*' || cleanPass === adminCredentials.passwordHash) {
      setIsAdminLoggedInState(true);
      setStorageAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedInState(false);
    setStorageAdminLoggedIn(false);
    showToast('Sesión de administración cerrada.', 'info');
  };

  const handleChangeAdminPassword = (newPassword: string) => {
    const updated: AdminCredentials = {
      ...adminCredentials,
      passwordHash: newPassword,
      lastPasswordChange: new Date().toISOString(),
    };
    saveStoredAdminCredentials(updated);
    setAdminCredentials(updated);
  };

  // Content update handlers
  const handleSaveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
    persistProductsDefinitively(newProducts).catch((err) => {
      console.error('Error persistiendo productos en todos los niveles:', err);
    });
  };

  const handleSaveContactInfo = (newInfo: ContactInfo) => {
    saveStoredContactInfo(newInfo);
    setContactInfo(newInfo);
  };

  const handleSaveAboutContent = (newAbout: AboutContent) => {
    saveStoredAboutContent(newAbout);
    setAboutContent(newAbout);
  };

  const handleSaveBlogPosts = (newPosts: BlogPost[]) => {
    saveStoredBlogPosts(newPosts);
    setBlogPosts(newPosts);
  };

  const handleSaveOrders = (newOrders: Order[]) => {
    saveStoredOrders(newOrders);
    setOrders(newOrders);
  };

  const handleSaveCustomerLeads = (newLeads: CustomerLead[]) => {
    saveStoredCustomerLeads(newLeads);
    setCustomerLeads(newLeads);
  };

  const handleNewCustomerLead = (lead: CustomerLead) => {
    addStoredCustomerLead(lead);
    setCustomerLeads((prev) => [lead, ...prev]);
  };

  const handleResetSampleProducts = () => {
    const samples = resetProductsToSamples();
    setProducts(samples);
  };

  const handleClearAllProducts = () => {
    const cleared = clearAllProducts();
    setProducts(cleared);
  };

  const handleRestoreAllSiteData = (backup: SiteDataBackup) => {
    const res = restoreAllSiteDataBackup(backup);
    if (res.success) {
      if (backup.aboutContent) setAboutContent(backup.aboutContent);
      if (backup.contactInfo) setContactInfo(backup.contactInfo);
      if (Array.isArray(backup.products)) setProducts(backup.products);
      if (Array.isArray(backup.categories)) setCategories(backup.categories);
      if (Array.isArray(backup.blogPosts)) setBlogPosts(backup.blogPosts);
      if (Array.isArray(backup.reviews)) setReviews(backup.reviews);
      if (Array.isArray(backup.orders)) setOrders(backup.orders);
      if (Array.isArray(backup.customerLeads)) setCustomerLeads(backup.customerLeads);
      showToast('¡Copia de seguridad restaurada y aplicada con éxito!', 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Review handlers
  const handleAddReview = (newReview: CustomerReview) => {
    addStoredReview(newReview);
    setReviews((prev) => [newReview, ...prev]);
    showToast('¡Gracias por tu opinión! Reseña publicada con éxito 🐾', 'success');
  };

  const handleSaveReviews = (updatedReviews: CustomerReview[]) => {
    saveStoredReviews(updatedReviews);
    setReviews(updatedReviews);
  };

  // Invoice view handler
  const handleOpenInvoice = (order: Order) => {
    setSelectedInvoiceOrder(order);
    setIsInvoiceOpen(true);
  };

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Pet type filter
      if (selectedPetType !== 'ambos' && product.petType !== 'ambos' && product.petType !== selectedPetType) {
        return false;
      }

      // Category filter
      if (selectedCategory && product.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        const matchesBrand = product.brand?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesBrand) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, selectedPetType, selectedCategory, searchQuery, sortBy]);

  // Featured products for the highlighted top section matching the reference image
  const featuredProducts = useMemo(() => {
    const featured = products.filter((p) => p.isFeatured || p.rating && p.rating >= 4.8);
    return featured.length > 0 ? featured.slice(0, 4) : products.slice(0, 4);
  }, [products]);

  const totalCartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1F1E] flex flex-col font-sans selection:bg-[#B97A48] selection:text-white">
      {/* Toast Notifications */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Top Navbar */}
      <Navbar
        contactInfo={contactInfo}
        cartCount={totalCartItemCount}
        selectedPetType={selectedPetType}
        onSelectPetType={setSelectedPetType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => handleOpenCart('cart')}
        onOpenAdmin={() => {
          setIsAdminOpen(true);
          if (window.location.pathname !== '/admin') {
            window.history.pushState({}, '', '/admin');
          }
        }}
        onOpenCalculator={() => {
          setIsFoodCalculatorOpen(true);
          if (window.location.pathname !== '/calculadora') {
            window.history.pushState({}, '', '/calculadora');
          }
        }}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenVirtualVet={() => setIsVirtualVetOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        activeSection={activeSection}
        onNavigate={handleNavigateSection}
      />

      {/* MAIN VIEW CONTENT ACCORDING TO ACTIVE SECTION */}
      <main className="flex-1">
        {activeSection === 'catalog' && (
          <>
            {/* Hero Section matching the exact design and composition */}
            <HeroBanner
              contactInfo={contactInfo}
              onExploreCatalog={() => {
                const el = document.getElementById('catalog-products-container');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreAbout={() => handleNavigateSection('about')}
            />

            {/* Category Pills Bar (Alimentos, Juguetes, Higiene, Camas, Accesorios, Snacks) */}
            <CategoryRow
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Interactive Tool Banner: Calculadora de Racionamiento de Alimento */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="bg-linear-to-r from-[#1C2722] to-[#2B3B34] rounded-3xl p-5 sm:p-7 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="space-y-1.5 text-center md:text-left z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold backdrop-blur-xs">
                    <span>✨</span>
                    <span>HERRAMIENTA NUTRICIONAL GRATUITA</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Calculadora de Racionamiento de Alimento 🥣
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                    Descubre exactamente cuántos gramos diarios necesita tu peludo según su peso y nivel de actividad, y cuánto te durará cada bulto.
                  </p>
                </div>

                <div className="z-10 shrink-0">
                  <button
                    id="open-food-calculator-banner-btn"
                    onClick={() => setIsFoodCalculatorOpen(true)}
                    className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 hover:scale-104 transition-all"
                  >
                    <span>Calcular Ración de mi Mascota</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Decorative background paw */}
                <span className="absolute -right-8 -bottom-10 text-9xl opacity-10 select-none pointer-events-none">
                  🐾
                </span>
              </div>
            </section>

            {/* FEATURED PRODUCTS SECTION (Matching the exact "🐾 Productos destacados" row in image) */}
            {!selectedCategory && !searchQuery && featuredProducts.length > 0 && (
              <section id="featured-products-section" className="py-10 bg-white border-b border-[#F0EBE3]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  
                  {/* Section Title & Subtitle matching the reference image */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl select-none text-[#B97A48]">🐾</span>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#1C1F1E]">
                          Productos destacados
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-[#707572]">
                        Lo más querido por nuestras mascotas
                      </p>
                    </div>

                    <button
                      id="view-all-products-link"
                      onClick={() => {
                        const el = document.getElementById('catalog-products-container');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs sm:text-sm font-bold text-[#1C1F1E] hover:text-[#B97A48] flex items-center gap-1 group transition-colors"
                    >
                      <span>Ver todos</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>

                  {/* 4-Column Featured Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {featuredProducts.map((product) => (
                      <ProductCard
                        key={`featured-${product.id}`}
                        product={product}
                        whatsappPhone={contactInfo.whatsapp}
                        onAddToCart={(prod) => handleAddToCart(prod, 1)}
                        onQuickView={handleOpenQuickView}
                        onDirectBuy={(prod) => handleDirectBuy(prod, 1)}
                      />
                    ))}
                  </div>

                </div>
              </section>
            )}

            {/* FULL CATALOG GRID */}
            <section id="catalog-products-container" className="py-12 bg-[#FAF8F5]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* Catalog Controls Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#ECE5DD]">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1C1F1E]">
                      {selectedCategory
                        ? `Catálogo: ${categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}`
                        : 'Todos los Productos'}
                    </h2>
                    <p className="text-xs text-[#7A807C]">
                      Mostrando {filteredProducts.length} productos disponibles
                    </p>
                  </div>

                  {/* Sorting and Filters */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-[#7A807C] font-semibold hidden sm:inline">
                      Ordenar por:
                    </span>
                    <select
                      id="product-sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white border border-[#DDD5C9] text-xs font-semibold text-[#1C1F1E] rounded-xl px-3 py-2 outline-none focus:border-[#1C2722]"
                    >
                      <option value="featured">⭐ Destacados</option>
                      <option value="price_asc">💰 Menor precio</option>
                      <option value="price_desc">💎 Mayor precio</option>
                      <option value="name">🔤 Nombre A-Z</option>
                    </select>

                    {/* Admin Add Product Shortcut */}
                    <button
                      id="catalog-admin-shortcut-btn"
                      onClick={() => setIsAdminOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FAF6F0] hover:bg-[#EFE9DF] border border-[#DED7CB] rounded-xl text-xs font-bold text-[#1C1F1E] transition-colors"
                      title="Abrir panel para añadir o editar productos"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#B97A48]" />
                      <span className="hidden sm:inline">Gestionar / Agregar</span>
                    </button>
                  </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-[#ECE5DD] space-y-4">
                    <div className="text-4xl select-none">🔍</div>
                    <h3 className="text-lg font-bold text-[#1C1F1E]">
                      No encontramos productos con estos filtros
                    </h3>
                    <p className="text-xs text-[#7A807C] max-w-sm mx-auto">
                      Intenta buscar con otros términos o limpia los filtros de categoría y tipo de mascota.
                    </p>
                    <div className="flex justify-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedPetType('ambos');
                          setSearchQuery('');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#1C2722] text-white text-xs font-bold"
                      >
                        Mostrar Todo
                      </button>
                      <button
                        onClick={() => setIsAdminOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#DED7CB] text-xs font-bold text-[#1C1F1E]"
                      >
                        + Crear Producto en Admin
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        whatsappPhone={contactInfo.whatsapp}
                        onAddToCart={(prod) => handleAddToCart(prod, 1)}
                        onQuickView={handleOpenQuickView}
                        onDirectBuy={(prod) => handleDirectBuy(prod, 1)}
                      />
                    ))}
                  </div>
                )}

              </div>
            </section>

            {/* CUSTOMER REVIEWS & TESTIMONIALS SECTION */}
            <TestimonialsSection
              reviews={reviews}
              onAddReview={handleAddReview}
            />
          </>
        )}

        {/* ABOUT US SECTION */}
        {activeSection === 'about' && (
          <motion.div
            key="about-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <AboutSection
              aboutContent={aboutContent}
              contactInfo={contactInfo}
              onExploreCatalog={() => handleNavigateSection('catalog')}
            />
          </motion.div>
        )}

        {/* BLOG & PET TIPS SECTION */}
        {activeSection === 'blog' && (
          <motion.div
            key="blog-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <BlogSection blogPosts={blogPosts} />
          </motion.div>
        )}

        {/* CONTACT & CHANNELS SECTION */}
        {activeSection === 'contact' && (
          <motion.div
            key="contact-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <ContactSection
              contactInfo={contactInfo}
              showToast={showToast}
              onNewCustomerLead={handleNewCustomerLead}
            />
          </motion.div>
        )}
      </main>

      {/* Floating Colombian WhatsApp Button (Logo / Icon Only without phone text) */}
      <motion.a
        id="floating-whatsapp-chat-button"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        href={`https://wa.me/57${(contactInfo?.whatsapp || '3214231616').replace(/\D/g, '')}?text=${encodeURIComponent(
          '¡Hola Lunary Pet! Deseo información sobre compras y catálogo de mascotas 🐾'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl transition-all cursor-pointer group"
        title="WhatsApp: Asesoría y Pedidos Lunary World Pets"
        aria-label="Contactar por WhatsApp"
      >
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-[#25D366]" />
        </motion.span>
      </motion.a>

      {/* Shopping Cart & Checkout Funnel Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cart={cart}
        contactInfo={contactInfo}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderCompleted={handleOrderCompleted}
        onOpenInvoice={handleOpenInvoice}
        initialStep={cartInitialStep}
        checkoutBanner={cartCheckoutBanner}
      />

      {/* Product Quick View Modal with AnimatePresence for smooth fade-out */}
      <AnimatePresence>
        {quickViewProduct && (
          <ProductQuickViewModal
            key={quickViewProduct.id}
            product={quickViewProduct}
            onClose={handleCloseQuickView}
            whatsappPhone={contactInfo.whatsapp}
            onAddToCart={handleAddToCart}
            onDirectBuy={handleDirectBuy}
          />
        )}
      </AnimatePresence>

      {/* TikTok Reel & Video Generator Studio Modal */}
      <TikTokReelModal
        isOpen={Boolean(tikTokReelProduct)}
        onClose={() => setTikTokReelProduct(null)}
        product={tikTokReelProduct}
        products={products}
        onSelectProduct={(prod) => setTikTokReelProduct(prod)}
        contactInfo={contactInfo}
      />

      {/* Food Portion Calculator Modal */}
      <FoodCalculatorModal
        isOpen={isFoodCalculatorOpen}
        onClose={() => {
          setIsFoodCalculatorOpen(false);
          const returnPath = activeSection === 'catalog' ? '/catalogo' : `/${activeSection === 'about' ? 'nosotros' : activeSection === 'contact' ? 'contacto' : 'blog'}`;
          if (window.location.pathname === '/calculadora') {
            window.history.pushState({}, '', returnPath);
          }
        }}
        products={products}
        onAddToCart={(prod) => {
          handleAddToCart(prod, 1);
          setIsFoodCalculatorOpen(false);
          handleOpenCart();
        }}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        orders={orders}
        contactInfo={contactInfo}
        showToast={(msg, type) => {
          const id = String(Date.now());
          setToasts((prev) => [...prev, { id, message: msg, type: type || 'success' }]);
        }}
      />

      {/* Virtual Vet AI Assistant Modal */}
      <VirtualVetModal
        isOpen={isVirtualVetOpen}
        onClose={() => setIsVirtualVetOpen(false)}
        products={products}
        contactInfo={contactInfo}
        showToast={(msg, type) => {
          const id = String(Date.now());
          setToasts((prev) => [...prev, { id, message: msg, type: type || 'success' }]);
        }}
        onAddToCart={(prod) => {
          handleAddToCart(prod, 1);
          setIsVirtualVetOpen(false);
          handleOpenCart();
        }}
      />

      {/* Digital Invoice / Receipt Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={selectedInvoiceOrder}
        contactInfo={contactInfo}
      />

      {/* Administrator Portal Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          const returnPath = activeSection === 'catalog' ? '/catalogo' : `/${activeSection === 'about' ? 'nosotros' : activeSection === 'contact' ? 'contacto' : 'blog'}`;
          if (window.location.pathname === '/admin') {
            window.history.pushState({}, '', returnPath);
          }
        }}
        products={products}
        categories={categories}
        contactInfo={contactInfo}
        aboutContent={aboutContent}
        blogPosts={blogPosts}
        orders={orders}
        customerLeads={customerLeads}
        reviews={reviews}
        adminCredentials={adminCredentials}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onSaveProducts={handleSaveProducts}
        onSaveContactInfo={handleSaveContactInfo}
        onSaveAboutContent={handleSaveAboutContent}
        onSaveBlogPosts={handleSaveBlogPosts}
        onSaveOrders={handleSaveOrders}
        onSaveCustomerLeads={handleSaveCustomerLeads}
        onSaveReviews={handleSaveReviews}
        onChangePassword={handleChangeAdminPassword}
        onResetSampleProducts={handleResetSampleProducts}
        onClearAllProducts={handleClearAllProducts}
        onOpenInvoice={handleOpenInvoice}
        onRestoreSiteData={handleRestoreAllSiteData}
        onNavigateSection={(section) => {
          handleNavigateSection(section);
          setIsAdminOpen(false);
        }}
        onOpenTikTokReel={(prod) => setTikTokReelProduct(prod)}
        showToast={showToast}
      />

      {/* Global Footer */}
      <Footer
        contactInfo={contactInfo}
        onNavigate={handleNavigateSection}
        onOpenPolicy={handleOpenPolicy}
        onOpenAdmin={() => {
          setIsAdminOpen(true);
          if (window.location.pathname !== '/admin') {
            window.history.pushState({}, '', '/admin');
          }
        }}
      />

      {/* Transparency & Legal Policies Modal for Google Ads Compliance */}
      <LegalPoliciesModal
        isOpen={isLegalPolicyOpen}
        onClose={handleClosePolicy}
        initialTab={activeLegalTab}
        contactInfo={contactInfo}
      />
    </div>
  );
}
