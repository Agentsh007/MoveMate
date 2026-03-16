// =============================================
// Image Gallery — Grid + Fullscreen Modal
// =============================================

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function ImageGallery({ images = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageList = images.length > 0
    ? images.map(img => img.url)
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'];

  const prev = () => setCurrentIndex((i) => (i === 0 ? imageList.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === imageList.length - 1 ? 0 : i + 1));

  return (
    <>
      {/* Grid Preview */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[400px] md:h-[480px]">
        {/* Main image */}
        <div
          className="col-span-4 md:col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => { setCurrentIndex(0); setIsOpen(true); }}
        >
          <img
            src={imageList[0]}
            alt="Property"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Thumbnail grid */}
        {imageList.slice(1, 5).map((url, idx) => (
          <div
            key={idx}
            className="hidden md:block relative cursor-pointer group overflow-hidden"
            onClick={() => { setCurrentIndex(idx + 1); setIsOpen(true); }}
          >
            <img
              src={url}
              alt={`Property ${idx + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* "Show all" overlay on last thumbnail */}
            {idx === 3 && imageList.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-medium text-sm">+{imageList.length - 5} more</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: show all button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden mt-2 text-sm text-accent font-medium flex items-center gap-1"
      >
        <Maximize2 size={14} />
        View all {imageList.length} photos
      </button>

      {/* ══════════ Fullscreen Modal ══════════ */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in">
          {/* Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 z-10"
          >
            <X size={24} />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 text-white/60 text-sm font-medium">
            {currentIndex + 1} / {imageList.length}
          </div>

          {/* Previous */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Image */}
          <img
            src={imageList[currentIndex]}
            alt={`Property ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />

          {/* Next */}
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
          >
            <ChevronRight size={32} />
          </button>

          {/* Thumbnails */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {imageList.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-accent scale-110' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
