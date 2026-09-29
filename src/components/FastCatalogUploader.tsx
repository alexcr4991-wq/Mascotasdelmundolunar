import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Image as ImageIcon,
  Check,
  Search,
  Sparkles,
  RefreshCw,
  Layers,
  HelpCircle,
  Camera,
  CheckCircle2,
  Trash2,
  Package,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Product, PetType } from '../types';
import { formatCOP } from '../utils/formatters';
import { compressImageFile } from '../utils/imageCompressor';
import { ARCOS_FULL_CATALOG } from '../data/arcosCatalogData';

interface FastCatalogUploaderProps {
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onClose: () => void;
}

export const FastCatalogUploader: React.FC<FastCatalogUploaderProps> = ({
  products,
  onSaveProducts,
  showToast,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'paste_import' | 'quick_photos' | 'arcos_catalog'>('paste_import');

  // Paste / Import State
  const [rawText, setRawText] = useState('');
  const [markupRate, setMarkupRate] = useState<number>(2.5); // Default 250%
  const [priceMode, setPriceMode] = useState<'cost_with_markup' | 'direct_sale_price'>('cost_with_markup');
  const [defaultStock, setDefaultStock] = useState<number>(15);
  const [parsedPreview, setParsedPreview] = useState<Product[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // Quick Photos State
  const [photoSearch, setPhotoSearch] = useState('');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'without_photo' | 'with_photo'>('without_photo');
  const [isUploadingPhotoForId, setIsUploadingPhotoForId] = useState<string | null>(null);
  const [isBatchMatching, setIsBatchMatching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleImageInputRef = useRef<HTMLInputElement>(null);
  const batchPhotosInputRef = useRef<HTMLInputElement>(null);
  const [targetProductIdForSingleUpload, setTargetProductIdForSingleUpload] = useState<string | null>(null);

  // Parse raw text pasted from Excel, CSV, or list
  const handleParseText = () => {
    if (!rawText.trim()) {
      showToast('Pega primero el texto o filas desde tu Excel o archivo.', 'warning');
      return;
    }

    setIsParsing(true);
    try {
      const lines = rawText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const parsed: Product[] = [];
      const timestamp = Date.now();

      lines.forEach((line, idx) => {
        // Detect delimiters: tab (\t), pipe (|), semicolon (;), or comma (,)
        let parts: string[] = [];
        if (line.includes('\t')) {
          parts = line.split('\t');
        } else if (line.includes('|')) {
          parts = line.split('|');
        } else if (line.includes(';')) {
          parts = line.split(';');
        } else {
          parts = line.split(',');
        }

        parts = parts.map((p) => p.trim());

        // Skip potential header rows
        const firstColLower = (parts[0] || '').toLowerCase();
        if (
          idx === 0 &&
          (firstColLower.includes('nombre') ||
            firstColLower.includes('producto') ||
            firstColLower.includes('descripcion') ||
            firstColLower.includes('item'))
        ) {
          return;
        }

        if (parts.length === 0 || !parts[0]) return;

        const name = parts[0];
        const secondCol = parts[1] || '';
        const thirdCol = parts[2] || '';
        const fourthCol = parts[3] || '';
        const fifthCol = parts[4] || '';
        const sixthCol = parts[5] || '';

        // Extract numerical price/cost from any column that looks like a number
        let rawPriceNumber = 0;
        let referenceCode = '';
        let categoryDetected = 'accesorios';
        let petTypeDetected: PetType = 'ambos';
        let customStock = defaultStock;

        // Auto-detect reference code if second col has letters/digits
        if (secondCol && (secondCol.toLowerCase().startsWith('ref') || /^[A-Z0-9_-]{3,15}$/i.test(secondCol))) {
          referenceCode = secondCol;
        }

        // Find numerical values in parts
        for (const p of parts) {
          const cleanNum = p.replace(/[$.\sCOP,]/gi, '').trim();
          const parsedNum = Number(cleanNum);
          if (!isNaN(parsedNum) && parsedNum > 100 && rawPriceNumber === 0) {
            rawPriceNumber = parsedNum;
          }
        }

        // Auto-detect pet type
        const combinedText = (name + ' ' + secondCol + ' ' + thirdCol).toLowerCase();
        if (combinedText.includes('gato') || combinedText.includes('felin') || combinedText.includes('michi') || combinedText.includes('catnip') || combinedText.includes('arena')) {
          petTypeDetected = 'gato';
        } else if (combinedText.includes('perro') || combinedText.includes('canin') || combinedText.includes('cachorro') || combinedText.includes('dog') || combinedText.includes('k9')) {
          petTypeDetected = 'perro';
        }

        // Auto-detect category
        if (combinedText.includes('cama') || combinedText.includes('colchon') || combinedText.includes('sofa') || combinedText.includes('iglú') || combinedText.includes('cuna') || combinedText.includes('gimnasio') || combinedText.includes('rascador')) {
          categoryDetected = 'camas';
        } else if (combinedText.includes('pelota') || combinedText.includes('juguete') || combinedText.includes('lazo') || combinedText.includes('peluche') || combinedText.includes('cuerda') || combinedText.includes('mordedor') || combinedText.includes('vara') || combinedText.includes('tunel')) {
          categoryDetected = 'juguetes';
        } else if (combinedText.includes('hueso') || combinedText.includes('snack') || combinedText.includes('carnaza') || combinedText.includes('oreja') || combinedText.includes('premio') || combinedText.includes('cabano') || combinedText.includes('galleta') || combinedText.includes('palito')) {
          categoryDetected = 'snacks';
        } else if (combinedText.includes('shampoo') || combinedText.includes('cepillo') || combinedText.includes('cardina') || combinedText.includes('cortauna') || combinedText.includes('tapete') || combinedText.includes('panal') || combinedText.includes('arena') || combinedText.includes('arenera') || combinedText.includes('bano') || combinedText.includes('toalla') || combinedText.includes('bolsa')) {
          categoryDetected = 'higiene';
        } else if (combinedText.includes('alimento') || combinedText.includes('concentrado') || combinedText.includes('comida') || combinedText.includes('bulto') || combinedText.includes('croqueta') || combinedText.includes('chunky') || combinedText.includes('monello') || combinedText.includes('dog chow') || combinedText.includes('cat chow')) {
          categoryDetected = 'alimentos';
        } else {
          categoryDetected = 'accesorios';
        }

        // Price calculation: if cost with markup, multiply by markupRate
        let finalPrice = rawPriceNumber || 25000;
        let originalPrice: number | undefined = undefined;

        if (priceMode === 'cost_with_markup' && rawPriceNumber > 0) {
          finalPrice = Math.round((rawPriceNumber * markupRate) / 100) * 100;
          originalPrice = Math.round((finalPrice * 1.12) / 100) * 100; // 12% discount badge
        }

        const generatedId = `prod_batch_${timestamp}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        const cleanFullName = referenceCode && !name.includes(referenceCode) ? `${name} (${referenceCode})` : name;

        parsed.push({
          id: generatedId,
          name: cleanFullName,
          description: `Producto de alta calidad para ${petTypeDetected === 'ambos' ? 'perros y gatos' : petTypeDetected === 'perro' ? 'perros' : 'gatos'}. Material resistente y seguro para tu mascota.`,
          price: finalPrice,
          originalPrice,
          category: categoryDetected,
          petType: petTypeDetected,
          imageUrl: '', // Empty ready for fast photo upload
          inStock: true,
          stockCount: customStock,
          isFeatured: idx < 3,
          rating: 4.8 + Math.round((Math.random() * 0.2) * 10) / 10,
          weightOrSize: referenceCode || 'Talla Estándar',
          brand: 'Lunary World Pets',
          createdAt: new Date().toISOString(),
        });
      });

      setParsedPreview(parsed);
      if (parsed.length > 0) {
        showToast(`¡Se interpretaron con éxito ${parsed.length} productos! Revisa la vista previa y haz clic en "Confirmar e Importar".`, 'success');
      } else {
        showToast('No se pudieron identificar productos. Asegúrate de incluir al menos el nombre y precio en cada fila.', 'warning');
      }
    } catch (e: any) {
      showToast('Hubo un error al procesar el texto. Revisa el formato.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Confirm and save imported products into store
  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;

    // Check duplicates by name or ID
    const existingNames = new Set(products.map((p) => p.name.trim().toLowerCase()));
    const newItemsToAdd = parsedPreview.filter((p) => !existingNames.has(p.name.trim().toLowerCase()));

    if (newItemsToAdd.length === 0) {
      showToast('Todos los productos que intentas importar ya existen en tu catálogo.', 'info');
      return;
    }

    const updatedCatalog = [...newItemsToAdd, ...products];
    onSaveProducts(updatedCatalog);
    showToast(`¡Excelente! Se agregaron ${newItemsToAdd.length} productos nuevos a tu tienda.`, 'success');
    setParsedPreview([]);
    setRawText('');
    setActiveSubTab('quick_photos'); // Direct user to the fast photo assigner right away!
  };

  // Load Arcos 2025 Full Catalog (500+ standard refs) with 1 click
  const handleLoadArcosCompleteCatalog = () => {
    const existingIds = new Set(products.map((p) => p.id));
    const existingNames = new Set(products.map((p) => p.name.trim().toLowerCase()));

    const itemsToMerge = ARCOS_FULL_CATALOG.filter(
      (arcosItem) => !existingIds.has(arcosItem.id) && !existingNames.has(arcosItem.name.trim().toLowerCase())
    );

    if (itemsToMerge.length === 0) {
      showToast('Todas las referencias del Catálogo Arcos ya están en tu tienda.', 'info');
      return;
    }

    const updated = [...products, ...itemsToMerge];
    onSaveProducts(updated);
    showToast(`¡Se importaron ${itemsToMerge.length} referencias oficiales del catálogo Arcos con éxito!`, 'success');
    setActiveSubTab('quick_photos');
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const sampleHeaders = 'Nombre del Producto,Referencia / Codigo,Costo Mayorista,Categoria,Tipo Mascota,Stock\n';
    const sampleRows = [
      'Colchón Ortopédico Razas Medianas 65x42x7 cm,Ref. 19012,27500,camas,perro,15',
      'Cama Peluche Térmica Antiestrés Redonda 45x38 cm,Ref. 19007,29900,camas,ambos,20',
      'Pelota Maciza de Caucho con Lazo Dental,Ref. 20669,11000,juguetes,perro,25',
      'Cuerda Tug Doble Nudo Resistente 35 cm,Ref. 24926,15500,juguetes,perro,20',
      'Huesos de Carnaza Blanca Prensada 3" Pack x 8,Ref. 20001-A,7900,snacks,perro,40',
      'Arnés Táctico K9 Ajustable Talla L-XL,Ref. 55562,30700,accesorios,perro,18',
      'Comedero Acero Inoxidable Base Goma 700ml,Ref. 34080,9100,accesorios,ambos,30',
      'Tapetes Pañales Absorbentes 60x60 cm Pack x 30,Ref. 26630,33900,higiene,perro,20',
      'Baño Sanitario Cerrado Iglú con Puerta y Filtro,Ref. 26029,52800,higiene,gato,15',
      'Cañita Vara con Plumas y Cascabel para Gatos,Ref. 35066,7100,juguetes,gato,40',
    ].join('\n');

    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Plantilla_Carga_Masiva_Productos_Lunary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Plantilla CSV descargada. Ábrela en Excel, llena tus productos y pégalos aquí.', 'success');
  };

  // Upload file handler (.csv or .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setRawText(text);
        showToast('Archivo cargado en el editor. Haz clic en "Interpretar y Calcular Precios".', 'info');
      }
    };
    reader.readAsText(file);
  };

  // Single Photo Upload Click Handler
  const triggerSinglePhotoUpload = (productId: string) => {
    setTargetProductIdForSingleUpload(productId);
    if (singleImageInputRef.current) {
      singleImageInputRef.current.value = '';
      singleImageInputRef.current.click();
    }
  };

  // Process Single Selected Image
  const handleSingleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = targetProductIdForSingleUpload;
    if (!file || !targetId) return;

    setIsUploadingPhotoForId(targetId);
    try {
      const compressedDataUrl = await compressImageFile(file, 800, 0.85);
      const updatedList = products.map((p) => (p.id === targetId ? { ...p, imageUrl: compressedDataUrl } : p));
      onSaveProducts(updatedList);
      showToast('📸 ¡Foto asignada y guardada con éxito!', 'success');
    } catch (err) {
      showToast('Error al procesar la imagen.', 'error');
    } finally {
      setIsUploadingPhotoForId(null);
      setTargetProductIdForSingleUpload(null);
    }
  };

  // Batch Photos Auto-Matcher by Reference/Name
  const handleBatchPhotosSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBatchMatching(true);
    try {
      let matchedCount = 0;
      let updatedProducts = [...products];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, ''); // remove extension

        // Find matching product whose ID, name, or weightOrSize contains this file name
        const matchIndex = updatedProducts.findIndex((p) => {
          const pName = p.name.toLowerCase();
          const pId = p.id.toLowerCase();
          const pRef = (p.weightOrSize || '').toLowerCase();
          // Check if file name matches digits/code or part of product name
          return (
            fileName.length > 2 &&
            (pId.includes(fileName) || pName.includes(fileName) || pRef.includes(fileName))
          );
        });

        if (matchIndex !== -1) {
          const compressed = await compressImageFile(file, 800, 0.85);
          updatedProducts[matchIndex] = {
            ...updatedProducts[matchIndex],
            imageUrl: compressed,
          };
          matchedCount++;
        }
      }

      if (matchedCount > 0) {
        onSaveProducts(updatedProducts);
        showToast(`🎉 ¡Asignación automática completada! Se vincularon ${matchedCount} fotos a sus respectivos productos.`, 'success');
      } else {
        showToast('No se encontraron coincidencias exactas en los nombres de archivo. Nombra tus fotos con la referencia o código (ej: 19011.jpg).', 'info');
      }
    } catch (err) {
      showToast('Error durante la carga masiva de fotos.', 'error');
    } finally {
      setIsBatchMatching(false);
      if (batchPhotosInputRef.current) {
        batchPhotosInputRef.current.value = '';
      }
    }
  };

  // Filter products for the Quick Photo Assigner
  const filteredProductsForPhotos = products.filter((p) => {
    const hasCustomPhoto =
      Boolean(p.imageUrl) &&
      !p.imageUrl.startsWith('https://images.unsplash.com') &&
      !p.imageUrl.includes('placeholder') &&
      p.imageUrl.length > 30;

    if (photoFilter === 'without_photo' && hasCustomPhoto) return false;
    if (photoFilter === 'with_photo' && !hasCustomPhoto) return false;

    if (photoSearch.trim()) {
      const q = photoSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.weightOrSize && p.weightOrSize.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const productsWithoutPhotoCount = products.filter(
    (p) =>
      !p.imageUrl ||
      p.imageUrl.startsWith('https://images.unsplash.com') ||
      p.imageUrl.includes('placeholder') ||
      p.imageUrl.length <= 30
  ).length;

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.txt"
        className="hidden"
      />
      <input
        type="file"
        ref={singleImageInputRef}
        onChange={handleSingleImageSelected}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={batchPhotosInputRef}
        onChange={handleBatchPhotosSelected}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Sub Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE5DD] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSubTab('paste_import')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === 'paste_import'
                ? 'bg-[#1C2722] text-white shadow-xs'
                : 'text-[#5F6360] hover:bg-[#EFE9DF]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>📋 Importar desde Excel / CSV</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quick_photos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative ${
              activeSubTab === 'quick_photos'
                ? 'bg-[#1C2722] text-white shadow-xs'
                : 'text-[#5F6360] hover:bg-[#EFE9DF]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>📸 Asignador Rápido de Fotos (1-Clic)</span>
            {productsWithoutPhotoCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {productsWithoutPhotoCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('arcos_catalog')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === 'arcos_catalog'
                ? 'bg-[#1C2722] text-white shadow-xs'
                : 'text-[#5F6360] hover:bg-[#EFE9DF]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span>⚡ Catálogo Arcos 2025 Listo</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-xs font-semibold text-[#787D7A] hover:text-[#1C1F1E] px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          Cerrar Herramienta
        </button>
      </div>

      {/* SUBTAB 1: PASTE / EXCEL IMPORT */}
      {activeSubTab === 'paste_import' && (
        <div className="space-y-5">
          {/* Instructions Box */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#1C1F1E] flex items-center gap-2">
                <span>⚡ Carga Masiva de Cientos de Productos en 1 Segundo</span>
              </h4>
              <p className="text-xs text-[#5F6360] max-w-2xl">
                Copia las celdas desde tu <strong>Excel, Google Sheets o lista de catálogo</strong> y pégalas en el cuadro de abajo. El sistema detectará automáticamente el nombre, la categoría, el tipo de mascota y calculará el precio de venta sugerido.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DED7CB] text-[#1C1F1E] hover:bg-[#F4EFE6] text-xs font-bold shadow-2xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Descargar Plantilla CSV</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Archivo .CSV</span>
              </button>
            </div>
          </div>

          {/* Pricing & Margins Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#ECE5DD]">
            <div>
              <label className="block text-xs font-bold text-[#1C1F1E] mb-1">
                Tipo de Precio en tu lista:
              </label>
              <select
                value={priceMode}
                onChange={(e) => setPriceMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#DED7CB] bg-white text-xs font-medium text-[#1C1F1E] focus:outline-none focus:ring-2 focus:ring-[#1C2722]"
              >
                <option value="cost_with_markup">Es Costo Mayorista (Calcular PVP con Ganancia)</option>
                <option value="direct_sale_price">Es Precio de Venta Final al Público</option>
              </select>
            </div>

            {priceMode === 'cost_with_markup' && (
              <div>
                <label className="block text-xs font-bold text-[#1C1F1E] mb-1">
                  Margen de Ganancia aplicado:
                </label>
                <select
                  value={markupRate}
                  onChange={(e) => setMarkupRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED7CB] bg-white text-xs font-medium text-[#1C1F1E] focus:outline-none focus:ring-2 focus:ring-[#1C2722]"
                >
                  <option value={2.5}>+250% (Estándar Accesorios / Arcos: Costo x 2.5)</option>
                  <option value={2.0}>+200% (Costo x 2.0)</option>
                  <option value={3.0}>+300% (Costo x 3.0)</option>
                  <option value={1.5}>+150% (Alimentos / Margen Reducido)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1C1F1E] mb-1">
                Stock Inicial por Defecto:
              </label>
              <input
                type="number"
                min="1"
                value={defaultStock}
                onChange={(e) => setDefaultStock(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl border border-[#DED7CB] bg-white text-xs font-medium text-[#1C1F1E] focus:outline-none focus:ring-2 focus:ring-[#1C2722]"
              />
            </div>
          </div>

          {/* Paste Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1C1F1E]">
                Pega tus filas aquí (Formato: Nombre | Referencia | Costo o Precio | Categoría):
              </label>
              <span className="text-[11px] text-[#787D7A]">
                Separado por tabulaciones, comas o plecas (|)
              </span>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Ejemplo copiado desde Excel:\nColchón Ortopédico Pequeño 50x35\tRef. 19011\t19900\tcamas\tperro\nPelota Maciza con Lazo\tRef. 20669\t11000\tjuguetes\tperro\nCama Peluche Térmica 45cm\tRef. 19007\t29900\tcamas\tambos`}
              className="w-full p-3 rounded-2xl border border-[#DED7CB] bg-[#FAF8F5] text-xs font-mono text-[#1C1F1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C2722]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleParseText}
              disabled={isParsing || !rawText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold shadow-xs transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Interpretar y Calcular Precios</span>
            </button>

            {parsedPreview.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all animate-pulse"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Importar {parsedPreview.length} Productos a la Tienda</span>
              </button>
            )}
          </div>

          {/* Parsed Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2 border border-[#ECE5DD] rounded-2xl p-4 bg-white">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-[#1C1F1E] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Vista Previa ({parsedPreview.length} productos listos para entrar al catálogo)</span>
                </h5>
                <span className="text-[11px] text-[#787D7A]">
                  Las fotos podrás asignarlas fácilmente en la siguiente pestaña
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-[#ECE5DD] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-[#5F6360] uppercase text-[10px] font-bold border-b border-[#ECE5DD]">
                    <tr>
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5">Categoría</th>
                      <th className="p-2.5">Mascota</th>
                      <th className="p-2.5">Precio Público (COP)</th>
                      <th className="p-2.5">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE5DD]">
                    {parsedPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF8F5]">
                        <td className="p-2.5 font-medium text-[#1C1F1E]">{item.name}</td>
                        <td className="p-2.5 capitalize">{item.category}</td>
                        <td className="p-2.5 capitalize">{item.petType}</td>
                        <td className="p-2.5 font-bold text-emerald-700">{formatCOP(item.price)}</td>
                        <td className="p-2.5">{item.stockCount} un.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: QUICK PHOTO ASSIGNER (1-CLIC) */}
      {activeSubTab === 'quick_photos' && (
        <div className="space-y-4">
          {/* Header & Batch Controls */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#ECE5DD] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#1C1F1E] flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>Asignador Express de Fotos (Sin abrir formularios)</span>
              </h4>
              <p className="text-xs text-[#5F6360]">
                Haz clic directamente en el recuadro de foto de cualquier producto para adjuntarle la foto desde tu computador o celular. ¡Se guarda en 1 segundo!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => batchPhotosInputRef.current?.click()}
                disabled={isBatchMatching}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                title="Selecciona varias fotos a la vez; si el archivo coincide con la referencia (ej: 19011.jpg), se vinculan solas"
              >
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                <span>{isBatchMatching ? 'Vinculando fotos...' : 'Subir Lote de Fotos Automático'}</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#787D7A]" />
              <input
                type="text"
                placeholder="Buscar por nombre o referencia (ej. 19011, cama, lazo)..."
                value={photoSearch}
                onChange={(e) => setPhotoSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DED7CB] bg-white text-xs font-medium text-[#1C1F1E] focus:outline-none focus:ring-2 focus:ring-[#1C2722]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setPhotoFilter('without_photo')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  photoFilter === 'without_photo'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#5F6360] border border-[#ECE5DD]'
                }`}
              >
                ⚠️ Solo sin foto ({productsWithoutPhotoCount})
              </button>
              <button
                onClick={() => setPhotoFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  photoFilter === 'all'
                    ? 'bg-[#1C2722] text-white'
                    : 'bg-[#FAF8F5] text-[#5F6360] border border-[#ECE5DD]'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setPhotoFilter('with_photo')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  photoFilter === 'with_photo'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#FAF8F5] text-[#5F6360] border border-[#ECE5DD]'
                }`}
              >
                ✅ Con foto ({products.length - productsWithoutPhotoCount})
              </button>
            </div>
          </div>

          {/* Product Fast Grid */}
          {filteredProductsForPhotos.length === 0 ? (
            <div className="text-center py-10 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#DED7CB] text-xs text-[#787D7A]">
              No se encontraron productos con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredProductsForPhotos.map((prod) => {
                const hasPhoto =
                  Boolean(prod.imageUrl) &&
                  !prod.imageUrl.startsWith('https://images.unsplash.com') &&
                  !prod.imageUrl.includes('placeholder') &&
                  prod.imageUrl.length > 30;

                const isUploadingThis = isUploadingPhotoForId === prod.id;

                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center gap-3 bg-white ${
                      !hasPhoto ? 'border-amber-200 bg-amber-50/20' : 'border-[#ECE5DD]'
                    }`}
                  >
                    {/* Image Clickable Slot */}
                    <button
                      type="button"
                      onClick={() => triggerSinglePhotoUpload(prod.id)}
                      disabled={isUploadingThis}
                      className="relative w-16 h-16 rounded-xl border border-dashed border-[#DED7CB] bg-[#FAF8F5] flex items-center justify-center shrink-0 overflow-hidden group hover:border-[#1C2722] hover:bg-[#EFE9DF] transition-all cursor-pointer"
                      title="Haz clic para subir o cambiar la foto"
                    >
                      {hasPhoto ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#787D7A] group-hover:text-[#1C1F1E]">
                          <Camera className="w-5 h-5 text-amber-500 mb-0.5" />
                          <span className="text-[9px] font-bold text-amber-700">Subir</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="w-4 h-4 text-white" />
                      </div>

                      {isUploadingThis && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" />
                        </div>
                      )}
                    </button>

                    {/* Info & Fast Action */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#ECE5DD] text-[#5F6360]">
                          {prod.category}
                        </span>
                        {hasPhoto ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Foto OK
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                            ⚠️ Sin Foto
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs font-bold text-[#1C1F1E] truncate" title={prod.name}>
                        {prod.name}
                      </h5>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-emerald-800">
                          {formatCOP(prod.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerSinglePhotoUpload(prod.id)}
                          className="text-[11px] font-bold text-[#1C2722] hover:underline flex items-center gap-1"
                        >
                          <span>{hasPhoto ? 'Cambiar Foto' : '+ Adjuntar Foto'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: PRE-LOADED ARCOS CATALOG 2025 */}
      {activeSubTab === 'arcos_catalog' && (
        <div className="space-y-4">
          <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#ECE5DD] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1C1F1E]">
                  Catálogo Maestro Arcos 2025 (Camas, Juguetes, Carnazas, Paseo, Higiene)
                </h4>
                <p className="text-xs text-[#5F6360]">
                  Hemos estructurado y verificado más de 50 referencias exactas del catálogo con códigos oficiales, dimensiones técnicas, precios comerciales calculados con el margen del 250% y stock inicial.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#ECE5DD]">
              <span className="text-xs text-[#787D7A]">
                ¿Deseas agregar todas estas referencias al inventario de tu tienda con 1 solo clic?
              </span>

              <button
                type="button"
                onClick={handleLoadArcosCompleteCatalog}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>⚡ Cargar Todas las Referencias Arcos a Mi Tienda</span>
              </button>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto border border-[#ECE5DD] rounded-2xl bg-white p-3 space-y-2">
            <h5 className="text-xs font-bold text-[#1C1F1E] px-1">
              Muestra de referencias incluidas:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ARCOS_FULL_CATALOG.slice(0, 16).map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl border border-[#ECE5DD] bg-[#FAF8F5] text-xs">
                  <div className="font-bold text-[#1C1F1E] truncate">{item.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#787D7A] mt-1">
                    <span className="capitalize">{item.category} ({item.petType})</span>
                    <span className="font-bold text-emerald-800">{formatCOP(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
