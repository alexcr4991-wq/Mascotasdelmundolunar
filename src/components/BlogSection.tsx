import React, { useState } from 'react';
import { Calendar, User, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogSectionProps {
  blogPosts: BlogPost[];
}

export const BlogSection: React.FC<BlogSectionProps> = ({ blogPosts }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <div id="blog-section-container" className="py-12 sm:py-16 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE7DF] text-[#1C1F1E] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Consejos & Guías Veterinarias</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1F1E]">
            Aprende a Cuidar a tu Peludo
          </h2>
          <p className="text-xs sm:text-sm text-[#6C716E]">
            Artículos escritos por especialistas en nutrición, bienestar y comportamiento de perros y gatos.
          </p>
        </div>

        {/* Blog Post Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group bg-white rounded-3xl overflow-hidden border border-[#ECE5DD] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1C2722]/80 backdrop-blur-xs text-white uppercase tracking-wider">
                    {post.category}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-[#7A807C]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1C1F1E] leading-snug group-hover:text-[#B97A48] transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-xs text-[#676C69] leading-relaxed line-clamp-3">
                    {post.summary}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-[#ECE5DD] mt-3 pt-3">
                <span className="text-xs text-[#7A807C] font-semibold">{post.author}</span>
                <span className="text-xs font-bold text-[#B97A48] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Leer más <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Modal to Read Full Blog Article */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 border border-[#ECE5DD] shadow-2xl relative space-y-4">
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#EFE9DF] text-[#1C1F1E] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>

              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFE9DF] text-[#1C1F1E] uppercase">
                  {selectedPost.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1C1F1E]">
                  {selectedPost.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#7A807C] pb-2 border-b border-[#ECE5DD]">
                  <span>{selectedPost.author}</span>
                  <span>•</span>
                  <span>{selectedPost.date}</span>
                </div>
              </div>

              <img
                src={selectedPost.coverImage}
                alt={selectedPost.title}
                className="w-full h-56 rounded-2xl object-cover"
              />

              <div className="text-sm text-[#4E5250] leading-relaxed whitespace-pre-line space-y-3">
                {selectedPost.content}
              </div>

              <div className="pt-4 border-t border-[#ECE5DD] flex justify-end">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-5 py-2 rounded-xl bg-[#1C2722] text-white text-xs font-bold"
                >
                  Cerrar Artículo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
