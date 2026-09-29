import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Video,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Share2,
  Play,
  RotateCcw,
  Palette,
  Layers,
  MessageCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product, ContactInfo } from '../types';
import { formatCOP, getProductShareUrl } from '../utils/formatters';

// Safe rounded rectangle helper compatible with all browsers and canvas rendering contexts
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  let r = radius;
  if (width < 2 * r) r = width / 2;
  if (height < 2 * r) r = height / 2;
  if (r < 0) r = 0;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

interface TikTokReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  contactInfo: ContactInfo;
}

type ReelTheme =
  | 'lunary_warm'
  | 'dark_luxury'
  | 'promo_fire'
  | 'nature_green'
  | 'royal_purple'
  | 'sunset_coral'
  | 'ocean_blue'
  | 'clean_minimal';

export const TikTokReelModal: React.FC<TikTokReelModalProps> = ({
  isOpen,
  onClose,
  product,
  products = [],
  onSelectProduct,
  contactInfo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ReelTheme>('lunary_warm');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [includePrice, setIncludePrice] = useState<boolean>(true);
  const [includeBenefits, setIncludeBenefits] = useState<boolean>(true);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const productImgRef = useRef<HTMLImageElement | null>(null);

  // Preload product image for canvas rendering
  useEffect(() => {
    if (!isOpen || !product?.imageUrl) {
      productImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = product.imageUrl;
    img.onload = () => {
      productImgRef.current = img;
    };
    img.onerror = () => {
      productImgRef.current = null;
    };
  }, [isOpen, product?.imageUrl]);

  // Real-time Canvas Rendering Loop
  useEffect(() => {
    if (!isOpen || !product) return;
    let active = true;
    startTimeRef.current = Date.now();

    const render = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          drawReelFrame(ctx, canvas.width, canvas.height, elapsed);
        }
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, selectedTheme, includeWatermark, includePrice, includeBenefits, product]);

  const currentPrice = product?.price || 0;
  const originalPrice = product?.originalPrice;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  const tiktokHandle = contactInfo.tiktokUrl
    ? contactInfo.tiktokUrl.replace(/^https?:\/\/(www\.)?tiktok\.com\//, '').replace('@', '')
    : 'lunaryworldpets';

  const directProductUrl = product ? getProductShareUrl(product.id) : (typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-plhylrlm7ulcetruuzpnp5-668220432504.us-east1.run.app');

  // Generated TikTok Copywriting (Without "Antes" price, focused on Special Offer)
  const generatedCaption = product
    ? `🐾 ¡Lo mejor para tu consentido en Colombia! ✨🐶🐱
📦 ${product.name}
${discountPercent ? `🔥 ¡Oferta Especial con -${discountPercent}% OFF!` : '⚡ ¡Oferta Especial por tiempo limitado!'}
🏷️ Precio de Oferta Especial: ${formatCOP(currentPrice)} COP

🚚 Envíos a todo Colombia (Bogotá: $6.500 | Nacional: $13.500)
🎉 ¡Envío GRATIS en compras superiores a $150.000 COP!
💳 Pagos 100% seguros con Pasarela Wompi (Tarjetas, PSE, Bancolombia)

📲 Pídelo al WhatsApp: ${contactInfo.whatsapp || '3214231616'}
🛒 Enlace directo de compra: ${directProductUrl}
🌐 Link en nuestra biografía

#LunaryWorldPets #MascotasColombia #PerrosBogota #GatosColombia #PetShopColombia #Wompi #ComidaParaPerros #AccesoriosMascotas #TiendaDeMascotasColombia #AmorPeludo`
    : '';

  const drawReelFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number
  ) => {
    try {
      ctx.clearRect(0, 0, width, height);

      const isLightTheme = selectedTheme === 'clean_minimal';

      // 1. Background Theme Gradient
      let grad: CanvasGradient;
      if (selectedTheme === 'lunary_warm') {
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#15221C');
        grad.addColorStop(0.35, '#22332A');
        grad.addColorStop(0.7, '#18251F');
        grad.addColorStop(1, '#0E1713');
      } else if (selectedTheme === 'dark_luxury') {
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#090A0D');
        grad.addColorStop(0.4, '#15171C');
        grad.addColorStop(0.75, '#0C0D11');
        grad.addColorStop(1, '#050608');
      } else if (selectedTheme === 'promo_fire') {
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#360F08');
        grad.addColorStop(0.45, '#5C1A0D');
        grad.addColorStop(0.8, '#260A05');
        grad.addColorStop(1, '#150502');
      } else if (selectedTheme === 'nature_green') {
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0B291B');
        grad.addColorStop(0.45, '#13462E');
        grad.addColorStop(0.8, '#0A2417');
        grad.addColorStop(1, '#06170E');
      } else if (selectedTheme === 'royal_purple') {
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#1E0B2E');
        grad.addColorStop(0.45, '#381357');
        grad.addColorStop(0.8, '#1B0929');
        grad.addColorStop(1, '#0F0417');
      } else if (selectedTheme === 'sunset_coral') {
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#3B1822');
        grad.addColorStop(0.45, '#612536');
        grad.addColorStop(0.8, '#2D1119');
        grad.addColorStop(1, '#17080D');
      } else if (selectedTheme === 'ocean_blue') {
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0B1E36');
        grad.addColorStop(0.45, '#13355C');
        grad.addColorStop(0.8, '#091A30');
        grad.addColorStop(1, '#040E1B');
      } else {
        // clean_minimal (Light Canvas)
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#FBF8F3');
        grad.addColorStop(0.4, '#F3ECE0');
        grad.addColorStop(0.8, '#EAE1D2');
        grad.addColorStop(1, '#DFD3C1');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Animated Ambient Glow Orbs
      const orbX = width / 2 + Math.sin(elapsed * 1.5) * 50;
      const orbY = height * 0.42 + Math.cos(elapsed * 1.2) * 40;
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 40, orbX, orbY, 340);

      if (selectedTheme === 'promo_fire') {
        orbGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (selectedTheme === 'nature_green') {
        orbGrad.addColorStop(0, 'rgba(52, 211, 153, 0.32)');
        orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (selectedTheme === 'royal_purple') {
        orbGrad.addColorStop(0, 'rgba(192, 132, 252, 0.38)');
        orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (selectedTheme === 'sunset_coral') {
        orbGrad.addColorStop(0, 'rgba(251, 146, 60, 0.38)');
        orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (selectedTheme === 'ocean_blue') {
        orbGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (selectedTheme === 'clean_minimal') {
        orbGrad.addColorStop(0, 'rgba(217, 154, 70, 0.22)');
        orbGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else if (selectedTheme === 'dark_luxury') {
        orbGrad.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
        orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        orbGrad.addColorStop(0, 'rgba(217, 154, 70, 0.32)');
        orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Top Header Bar (Lunary World Pets Branding) - Light Background + Dark Text
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;

      // Header card: Pure white / clean bright background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      drawRoundedRect(ctx, 30, 36, width - 60, 94, 20);
      ctx.fill();

      // Subtle elegant golden/neutral border
      ctx.strokeStyle = 'rgba(217, 154, 70, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Brand Name in Dark Obsidian / Charcoal
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 31px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐾 LUNARY WORLD PETS', width / 2, 78);

      // Subtitle in Dark Warm Amber/Cognac
      ctx.fillStyle = '#9A5B18';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('TIENDA OFICIAL DE MASCOTAS • COLOMBIA', width / 2, 108);
      ctx.restore();

      // 4. Category and Pet Type Badge
      ctx.save();
      const petLabel =
        product.petType === 'perro'
          ? '🐶 EXCLUSIVO PERROS'
          : product.petType === 'gato'
          ? '🐱 EXCLUSIVO GATOS'
          : '🐾 PERROS & GATOS';
      
      let badgeBg = '#C68748';
      if (selectedTheme === 'promo_fire') badgeBg = '#DC2626';
      else if (selectedTheme === 'royal_purple') badgeBg = '#7C3AED';
      else if (selectedTheme === 'ocean_blue') badgeBg = '#0284C7';
      else if (selectedTheme === 'nature_green') badgeBg = '#059669';

      ctx.fillStyle = badgeBg;
      drawRoundedRect(ctx, width / 2 - 135, 150, 270, 38, 19);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(petLabel, width / 2, 174);
      ctx.restore();

      // 5. Product Image Showcase Box with Floating/Zoom Animation
      const imgSize = 420;
      const imgX = (width - imgSize) / 2;
      const imgY = 215 + Math.sin(elapsed * 2) * 8; // Gentle breathing motion

      // Background card for product image
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 36);
      ctx.fill();
      ctx.restore();

      // Draw the image
      if (productImgRef.current && productImgRef.current.complete) {
        ctx.save();
        drawRoundedRect(ctx, imgX + 15, imgY + 15, imgSize - 30, imgSize - 30, 24);
        ctx.clip();

        const scale = 1 + Math.sin(elapsed * 1.2) * 0.03;
        const scaledW = (imgSize - 30) * scale;
        const scaledH = (imgSize - 30) * scale;
        const drawX = imgX + 15 - (scaledW - (imgSize - 30)) / 2;
        const drawY = imgY + 15 - (scaledH - (imgSize - 30)) / 2;

        ctx.drawImage(productImgRef.current, drawX, drawY, scaledW, scaledH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#666';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(product.name, width / 2, imgY + imgSize / 2);
      }

      // Discount ribbon on image
      if (discountPercent) {
        ctx.save();
        ctx.fillStyle = '#E53E3E';
        drawRoundedRect(ctx, imgX - 10, imgY + 20, 165, 46, 23);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`-${discountPercent}% OFERTA`, imgX + 72, imgY + 50);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = '#16A34A';
        drawRoundedRect(ctx, imgX - 10, imgY + 20, 155, 44, 22);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ RECOMENDADO', imgX + 68, imgY + 48);
        ctx.restore();
      }

      // 6. Product Title
      ctx.save();
      ctx.fillStyle = isLightTheme ? '#0F172A' : '#FFFFFF';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      
      // Wrap product name if too long
      const title = product.name;
      if (title.length > 32) {
        const words = title.split(' ');
        let line1 = '';
        let line2 = '';
        words.forEach((w) => {
          if ((line1 + w).length < 28) line1 += (line1 ? ' ' : '') + w;
          else line2 += (line2 ? ' ' : '') + w;
        });
        ctx.fillText(line1, width / 2, 680);
        ctx.fillText(line2, width / 2, 715);
      } else {
        ctx.fillText(title, width / 2, 695);
      }
      ctx.restore();

      // Presentation / Brand
      if (product.weightOrSize || product.brand) {
        ctx.save();
        ctx.fillStyle = isLightTheme ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)';
        ctx.font = 'bold 17px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${product.brand ? product.brand.toUpperCase() : ''} ${
            product.weightOrSize ? `• ${product.weightOrSize}` : ''
          }`,
          width / 2,
          750
        );
        ctx.restore();
      }

      // 7. Price Banner - ONLY Special Offer Price, Prominent & Centered
      if (includePrice) {
        ctx.save();
        const priceBoxY = 780;
        const priceBoxH = 92;
        
        let priceBgGrad: CanvasGradient;
        if (isLightTheme) {
          priceBgGrad = ctx.createLinearGradient(40, priceBoxY, width - 40, priceBoxY);
          priceBgGrad.addColorStop(0, '#FFFFFF');
          priceBgGrad.addColorStop(0.5, '#FAF6EE');
          priceBgGrad.addColorStop(1, '#FFFFFF');
        } else {
          priceBgGrad = ctx.createLinearGradient(40, priceBoxY, width - 40, priceBoxY);
          priceBgGrad.addColorStop(0, '#0F1612');
          priceBgGrad.addColorStop(0.5, '#1F2E26');
          priceBgGrad.addColorStop(1, '#0F1612');
        }

        ctx.fillStyle = priceBgGrad;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 16;
        drawRoundedRect(ctx, 40, priceBoxY, width - 80, priceBoxH, 24);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = '#D99A46';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // "⚡ OFERTA ESPECIAL HOY" Tag
        ctx.fillStyle = '#D99A46';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ PRECIO DE OFERTA ESPECIAL', width / 2, priceBoxY + 30);

        // Big Prominent Price COP
        ctx.fillStyle = isLightTheme ? '#0F172A' : '#FFFFFF';
        ctx.font = '900 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${formatCOP(currentPrice)} COP`, width / 2, priceBoxY + 72);

        ctx.restore();
      }

      // 8. Key Benefits Badges
      if (includeBenefits) {
        ctx.save();
        const benefitsY = 890;
        const pills = [
          '🚚 Envíos a todo Colombia',
          '💳 Paga seguro con Wompi',
          '⭐ 100% Calidad y Confianza',
        ];

        pills.forEach((p, idx) => {
          const y = benefitsY + idx * 42;
          ctx.fillStyle = isLightTheme ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.12)';
          drawRoundedRect(ctx, 45, y, width - 90, 36, 18);
          ctx.fill();

          ctx.fillStyle = isLightTheme ? '#0F172A' : '#FFFFFF';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p, width / 2, y + 23);
        });
        ctx.restore();
      }

      // 9. Bottom Call to Action (CTA) - Clean, Prominent & Centered
      ctx.save();
      const ctaY = 1045;
      const ctaH = 80;
      let ctaColor = '#D99A46';
      if (selectedTheme === 'promo_fire') ctaColor = '#EF4444';
      else if (selectedTheme === 'royal_purple') ctaColor = '#A855F7';
      else if (selectedTheme === 'ocean_blue') ctaColor = '#0EA5E9';
      else if (selectedTheme === 'nature_green') ctaColor = '#10B981';

      ctx.fillStyle = ctaColor;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      drawRoundedRect(ctx, 35, ctaY, width - 70, ctaH, 24);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 25px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛒 ¡PÍDELO AHORA EN NUESTRO LINK!', width / 2, ctaY + 50);
      ctx.restore();

      // 10. Watermark logo & handle
      if (includeWatermark) {
        ctx.save();
        ctx.fillStyle = isLightTheme ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.45)';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`TikTok: @${tiktokHandle} • Lunary World Pets`, width / 2, 1170);
        ctx.restore();
      }
    } catch (error) {
      console.error('Error drawing reel canvas frame:', error);
    }
  };

  // Record 6-second silent video Reel (.webm / .mp4 compatible)
  const handleRecordVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsRecording(true);
      setRecordProgress(0);
      setRecordedVideoUrl(null);

      const stream = canvas.captureStream(30);
      let options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        if (MediaRecorder.isTypeSupported('video/webm')) {
          options = { mimeType: 'video/webm' };
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          options = { mimeType: 'video/mp4' };
        } else {
          options = {};
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
        setIsRecording(false);
        setRecordProgress(100);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = videoUrl;
        const cleanName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25);
        a.download = `Reel_TikTok_${cleanName}_LunaryWorldPets.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      mediaRecorder.start();

      // Progress interval for 6 seconds
      const totalMs = 6000;
      const stepMs = 100;
      let currentMs = 0;

      const timer = setInterval(() => {
        currentMs += stepMs;
        setRecordProgress(Math.min(100, Math.round((currentMs / totalMs) * 100)));
        if (currentMs >= totalMs) {
          clearInterval(timer);
          mediaRecorder.stop();
        }
      }, stepMs);
    } catch (err) {
      console.error('Error grabador de video:', err);
      setIsRecording(false);
    }
  };

  // Download high-resolution vertical 9:16 PNG Cover / Story
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !product) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    const cleanName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25);
    a.download = `Story_9x16_${cleanName}_LunaryWorldPets.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  if (!isOpen || !product) return null;

  return (
    <div
      id="tiktok-reel-modal-backdrop"
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="tiktok-reel-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#18231E] border border-[#2B3B34] rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl text-white my-auto animate-in zoom-in-95 max-h-[94vh] flex flex-col"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-[#26372F] flex items-center justify-between bg-[#121B17]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#D99A46] text-black flex items-center justify-center font-black shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Generador de Reels & Stories para TikTok</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2C3E34] text-amber-300">
                  9:16 Vertical
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Crea videos cortos animados sin sonido con el logo de Lunary World Pets listos para publicar.
              </p>
            </div>
          </div>

          <button
            id="close-tiktok-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Canvas Preview, Right Settings & Export */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* Left Column: 9:16 Video Canvas Live Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[290px] sm:max-w-[320px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#2D3E35] bg-black">
              <canvas
                ref={canvasRef}
                width={640}
                height={1200}
                className="w-full h-full object-contain"
              />

              {/* Recording Overlay Indicator */}
              {isRecording && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center text-center p-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-red-600 animate-pulse flex items-center justify-center mb-3 text-white">
                    <Video className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-extrabold text-white">
                    Grabando Reel de 6 seg...
                  </span>
                  <div className="w-44 bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-red-500 h-full transition-all duration-100"
                      style={{ width: `${recordProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-300 mt-1">{recordProgress}%</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-[#D99A46]" />
              <span>Animación fluida • Sin sonido • Listo para TikTok Sound</span>
            </div>
          </div>

          {/* Right Column: Customization Controls & Post Generator (7 cols) */}
          <div className="lg:col-span-7 space-y-4">

            {/* Product Selector if available */}
            {products.length > 1 && onSelectProduct && (
              <div className="bg-[#1F2C25] p-3 rounded-2xl border border-[#2B3E34] space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>Seleccionar Producto para el Reel:</span>
                  <span className="text-[10px] text-slate-400">{products.length} productos</span>
                </label>
                <select
                  value={product.id}
                  onChange={(e) => {
                    const found = products.find((p) => p.id === e.target.value);
                    if (found) onSelectProduct(found);
                  }}
                  className="w-full bg-[#121B17] text-white border border-[#2D3E35] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#121B17] text-white">
                      {p.name} ({formatCOP(p.price)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* 1. Theme Selector */}
            <div className="bg-[#1F2C25] p-4 rounded-2xl border border-[#2B3E34] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-[#D99A46]" />
                  <span>Estilo Visual del Reel (8 Diseños)</span>
                </label>
                <span className="text-[11px] text-amber-300 font-medium">9:16 Vertical HD</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTheme('lunary_warm')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedTheme === 'lunary_warm'
                      ? 'bg-[#D99A46] text-black border-[#D99A46] shadow-sm'
                      : 'bg-black/30 text-white border-white/10 hover:bg-black/50'
                  }`}
                >
                  <span>🌟 Lunary Cálido</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTheme('dark_luxury')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedTheme === 'dark_luxury'
                      ? 'bg-amber-100 text-black border-amber-300 shadow-sm'
                      : 'bg-black/30 text-white border-white/10 hover:bg-black/50'
                  }`}
                >
                  <span>🖤 Dark Luxury</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTheme('promo_fire')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedTheme === 'promo_fire'
                      ? 'bg-red-600 text-white border-red-500 shadow-sm'
                      : 'bg-black/30 text-white border-white/10 hover:bg-black/50'
                  }`}
                >
                  <span>🔥 Oferta Flash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTheme('nature_green')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedTheme === 'nature_green'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-black/30 text-white border-white/10 hover:bg-black/50'
                  }`}
                >
                  <span>🌿 Fresh Menta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTheme('royal_purple')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedTheme === 'royal_purple'
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-black/30 text-white border-white/10 hover:bg-black/50'
                  }`}
                >
                  <span>👑 Royal Violet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTheme('sunset_coral')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedTheme === 'sunset_coral'
                      ? 'bg-orange-600 text-white border-orange-400 shadow-sm'
                      : 'bg-black/30 text-white border-white/10 hover:bg-black/50'
                  }`}
                >
                  <span>🌅 Atardecer Coral</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTheme('ocean_blue')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedTheme === 'ocean_blue'
                      ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                      : 'bg-black/30 text-white border-white/10 hover:bg-black/50'
                  }`}
                >
                  <span>🌊 Azul Zafiro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTheme('clean_minimal')}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedTheme === 'clean_minimal'
                      ? 'bg-stone-100 text-stone-900 border-amber-300 shadow-sm'
                      : 'bg-black/30 text-white border-white/10 hover:bg-black/50'
                  }`}
                >
                  <span>🤍 Marfil Clean</span>
                </button>
              </div>
            </div>

            {/* 2. Overlays & Badges Options */}
            <div className="bg-[#1F2C25] p-3.5 rounded-2xl border border-[#2B3E34] flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeWatermark}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="rounded text-[#D99A46] focus:ring-0"
                />
                <span>Logo y Marca de Agua</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={(e) => setIncludePrice(e.target.checked)}
                  className="rounded text-[#D99A46] focus:ring-0"
                />
                <span>Precio COP & Descuento</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeBenefits}
                  onChange={(e) => setIncludeBenefits(e.target.checked)}
                  className="rounded text-[#D99A46] focus:ring-0"
                />
                <span>Beneficios (Envíos & Pagos Wompi)</span>
              </label>
            </div>

            {/* 3. Export Buttons: Video Reel and Vertical Image */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="record-tiktok-reel-btn"
                  onClick={handleRecordVideo}
                  disabled={isRecording}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  <span>{isRecording ? 'Grabando Video...' : '🎬 Generar y Descargar Reel'}</span>
                </button>

                <button
                  type="button"
                  id="download-story-img-btn"
                  onClick={handleDownloadImage}
                  className="py-3 px-4 rounded-2xl bg-[#2D3E35] hover:bg-[#3B4F44] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>📸 Descargar Imagen Vertical</span>
                </button>
              </div>

              {recordedVideoUrl && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ¡Video Reel descargado exitosamente a tu dispositivo!
                  </span>
                  <a
                    href={recordedVideoUrl}
                    download={`Reel_${product.name.slice(0, 15)}.webm`}
                    className="underline font-bold text-white hover:text-emerald-200"
                  >
                    Descargar de nuevo
                  </a>
                </div>
              )}
            </div>

            {/* 4. Pre-written TikTok Description & Copy button */}
            <div className="bg-[#141C18] p-4 rounded-2xl border border-[#26372F] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Descripción y Hashtags para Publicar en TikTok</span>
                </label>
                
                <button
                  type="button"
                  id="copy-tiktok-caption-btn"
                  onClick={handleCopyCaption}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedCaption
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#2B3B34] hover:bg-[#3A4E45] text-white'
                  }`}
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                rows={4}
                value={generatedCaption}
                className="w-full bg-[#0E1512] border border-[#202E27] rounded-xl p-3 text-xs text-slate-300 font-mono resize-none focus:outline-none"
              />

              {/* Direct TikTok Upload link */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Abre TikTok, sube tu video y añade el audio en tendencia que desees.
                </span>

                <a
                  href="https://www.tiktok.com/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-slate-900 border border-white/20 text-white text-xs font-bold transition-colors"
                >
                  <span>Abrir TikTok Web</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 5. Ideas de Guiones Virales para Reels y TikTok */}
            <div className="bg-[#18231E] p-4 rounded-2xl border border-[#27382F] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ideas de Contenido para Vender con este Producto:</span>
                </h4>
                <span className="text-[10px] text-slate-400">3 Formatos Probados</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                <div className="p-2.5 rounded-xl bg-[#0F1713] border border-[#25362C] space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 block">📦 1. Unboxing Rápido</span>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Muestra el paquete llegando, ábrelo en cámara rápida, saca {product.name} y que tu peludo lo huela feliz. Remata: "Link en bio para pedir el tuyo".
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0F1713] border border-[#25362C] space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 block">💡 2. Consejo / Problema</span>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    "¿Tu perro/gato sufre por esto? Este producto le cambió la vida en minutos". Explica el beneficio clave en 15 seg.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0F1713] border border-[#25362C] space-y-1">
                  <span className="text-[11px] font-bold text-purple-400 block">😂 3. Humor / Audio Viral</span>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Pon un audio gracioso de TikTok mientras tu mascota estrena el producto o espera que le sirvas la comida. Al final pones el texto con el precio.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
