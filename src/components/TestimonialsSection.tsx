import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  Plus,
  X,
  MessageSquare,
  Sparkles,
  Dog,
  Cat,
  Heart,
  CheckCircle2,
  MapPin,
  Camera,
} from 'lucide-react';
import { CustomerReview, PetType } from '../types';
import { formatDate } from '../utils/formatters';

interface TestimonialsSectionProps {
  reviews: CustomerReview[];
  onAddReview: (review: CustomerReview) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  reviews,
  onAddReview,
  showToast,
}) => {
  const [filterType, setFilterType] = useState<PetType>('ambos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New review form
  const [author, setAuthor] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<PetType>('perro');
  const [city, setCity] = useState('Bogotá');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [productName, setProductName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const filteredReviews = reviews.filter((r) => {
    if (filterType === 'ambos') return true;
    return r.petType === filterType || r.petType === 'ambos';
  });

  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim() || !petName.trim()) {
      showToast('Por favor completa tu nombre, el de tu mascota y tu opinión.', 'warning');
      return;
    }

    const newReview: CustomerReview = {
      id: `rev_${Date.now()}`,
      author: author.trim(),
      petName: petName.trim(),
      petType,
      city: city.trim() || 'Colombia',
      rating,
      comment: comment.trim(),
      productName: productName.trim() || undefined,
      date: new Date().toISOString().slice(0, 10),
      avatarUrl:
        avatarUrl.trim() ||
        (petType === 'gato'
          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80'),
      verifiedPurchase: true,
    };

    onAddReview(newReview);
    showToast('¡Gracias por compartir la experiencia de tu mascota!', 'success');
    setIsModalOpen(false);

    // Reset form
    setAuthor('');
    setPetName('');
    setComment('');
    setProductName('');
    setAvatarUrl('');
  };

  return (
    <section id="community-reviews-section" className="py-14 sm:py-20 bg-[#FAF8F5] border-t border-[#ECE5DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE7DF] text-[#1C1F1E] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#B97A48]" />
              <span>Comunidad Lunary en Colombia</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1C1F1E] tracking-tight">
              Mascotas Felices & Familias Satisfechas
            </h2>
            <p className="text-sm text-[#646A66] leading-relaxed">
              Descubre las experiencias reales de compradores en Bogotá, Medellín, Cali y todo el país con nuestros alimentos y envíos.
            </p>
          </div>

          {/* Rating Summary + Add Review Button */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white px-4 py-3 rounded-2xl border border-[#ECE5DD] shadow-xs flex items-center gap-3">
              <div className="flex items-center text-amber-500">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black text-[#1C1F1E]">{averageRating}</span>
                  <span className="text-xs text-[#787E7A]">/ 5.0</span>
                </div>
                <span className="text-[11px] text-[#787E7A] block">
                  {reviews.length} opiniones verificadas
                </span>
              </div>
            </div>

            <button
              id="open-add-review-btn"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#1C2722] hover:bg-[#2B3B34] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-101"
            >
              <Plus className="w-4 h-4" />
              <span>Calificar mi Compra</span>
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setFilterType('ambos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterType === 'ambos'
                ? 'bg-[#1C2722] text-white shadow-xs'
                : 'bg-white text-[#5F6360] border border-[#ECE5DD] hover:bg-[#F2ECE3]'
            }`}
          >
            Todas las Opiniones ({reviews.length})
          </button>
          <button
            onClick={() => setFilterType('perro')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterType === 'perro'
                ? 'bg-[#1C2722] text-white shadow-xs'
                : 'bg-white text-[#5F6360] border border-[#ECE5DD] hover:bg-[#F2ECE3]'
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            <span>Perritos ({reviews.filter((r) => r.petType === 'perro').length})</span>
          </button>
          <button
            onClick={() => setFilterType('gato')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterType === 'gato'
                ? 'bg-[#1C2722] text-white shadow-xs'
                : 'bg-white text-[#5F6360] border border-[#ECE5DD] hover:bg-[#F2ECE3]'
            }`}
          >
            <Cat className="w-3.5 h-3.5" />
            <span>Gaticos ({reviews.filter((r) => r.petType === 'gato').length})</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-[#ECE5DD] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* User & Pet Avatar */}
                <div className="flex items-center gap-3">
                  <img
                    src={rev.avatarUrl || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80'}
                    alt={rev.petName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover border border-[#ECE5DD] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-[#1C1F1E] truncate">{rev.author}</h4>
                      {rev.verifiedPurchase && (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Comprador verificado" />
                      )}
                    </div>
                    <p className="text-xs text-[#787E7A] truncate">
                      🐾 {rev.petName}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-[#9EA3A0]">
                      <MapPin className="w-3 h-3 text-[#B97A48]" />
                      <span>{rev.city}</span>
                    </div>
                  </div>
                </div>

                {/* Stars Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] text-[#7A807C] ml-1.5">• {formatDate(rev.date)}</span>
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-[#3E4340] leading-relaxed italic">
                  &quot;{rev.comment}&quot;
                </p>
              </div>

              {/* Product Badge if available */}
              {rev.productName && (
                <div className="bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#ECE5DD] text-[11px] text-[#1C1F1E] flex items-center justify-between">
                  <span className="text-[#787E7A]">Producto:</span>
                  <span className="font-semibold truncate max-w-[200px]">{rev.productName}</span>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* ADD REVIEW MODAL */}
      {isModalOpen && (
        <div
          id="add-review-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            id="add-review-modal-container"
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#ECE5DD] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#18231E] text-white flex items-center justify-between border-b border-[#2A3B33]">
              <div>
                <h3 className="text-base font-bold text-white">Califica tu Experiencia</h3>
                <p className="text-xs text-slate-300">
                  Cuéntanos cómo le fue a tu mascota con su compra
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReview} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1F1E] mb-1">Tu Nombre *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ej. Paula Ramírez"
                    className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3 py-2 text-xs text-[#1C1F1E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1F1E] mb-1">Nombre de tu Mascota *</label>
                  <input
                    type="text"
                    required
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Ej. Bruno (Bulldog)"
                    className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3 py-2 text-xs text-[#1C1F1E] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1F1E] mb-1">Mascota</label>
                  <select
                    value={petType}
                    onChange={(e) => setPetType(e.target.value as any)}
                    className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3 py-2 text-xs text-[#1C1F1E] font-medium outline-none"
                  >
                    <option value="perro">🐶 Perro</option>
                    <option value="gato">🐱 Gato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1F1E] mb-1">Ciudad / Barrio</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Bogotá (Chicó)"
                    className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3 py-2 text-xs text-[#1C1F1E] outline-none"
                  />
                </div>
              </div>

              {/* Star selection */}
              <div>
                <label className="block text-xs font-bold text-[#1C1F1E] mb-1">Calificación</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setRating(st)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          st <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#1C1F1E] ml-2">
                    {rating === 5 ? '¡Excelente servicio!' : `${rating} estrellas`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1F1E] mb-1">Tu Opinión *</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Cuéntanos sobre el producto, el tiempo de entrega o la experiencia de compra..."
                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl p-3 text-xs text-[#1C1F1E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1F1E] mb-1">Producto Comprado (Opcional)</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej. Monello Dog Tradicional 7 kg"
                  className="w-full bg-[#FAF8F5] border border-[#DED7CB] rounded-xl px-3 py-2 text-xs text-[#1C1F1E] outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-review-btn"
                  className="w-full py-3 rounded-xl bg-[#1C2722] hover:bg-[#2B3B34] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98"
                >
                  Publicar Opinión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
