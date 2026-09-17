'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductMedia } from '@/types/shared/product';

interface ProductImageProps {
  image_data: ProductMedia[];
  selectedColorId?: string | null;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export function ProductImage({ image_data = [], selectedColorId }: ProductImageProps) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // 1. Calculate sorted images
  const sortedImages = useMemo(() => {
    if (!image_data || image_data.length === 0) return [];

    const byOrder = (a: ProductMedia, b: ProductMedia) => a.order - b.order;

    const colorMatched = selectedColorId
      ? image_data.filter((img) => img.colorId === selectedColorId).sort(byOrder)
      : [];

    const generic = image_data.filter((img) => !img.colorId).sort(byOrder);

    if (colorMatched.length > 0) return [...colorMatched, ...generic];
    if (generic.length > 0) return generic;
    return [...image_data].sort(byOrder);
  }, [image_data, selectedColorId]);

  // 2. Reset slide position on color change
  useEffect(() => {
    setPage([0, 0]);
  }, [selectedColorId]);

  // 3. Callback handlers
  const handleModalNavigate = useCallback(
    (direction: 'prev' | 'next', e?: React.MouseEvent) => {
      e?.stopPropagation();
      setModalIndex((prev) => {
        if (direction === 'prev') {
          return prev === 0 ? sortedImages.length - 1 : prev - 1;
        }
        return prev === sortedImages.length - 1 ? 0 : prev + 1;
      });
    },
    [sortedImages.length]
  );

  // 4. Preload adjacent modal images
  useEffect(() => {
    if (!isModalOpen || sortedImages.length <= 1) return;

    const nextIdx = (modalIndex + 1) % sortedImages.length;
    const prevIdx = (modalIndex - 1 + sortedImages.length) % sortedImages.length;

    const imgNext = new window.Image();
    imgNext.src = sortedImages[nextIdx].url;

    const imgPrev = new window.Image();
    imgPrev.src = sortedImages[prevIdx].url;
  }, [isModalOpen, modalIndex, sortedImages]);

  // 5. Hotkey navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') setIsModalOpen(false);
      if (e.key === 'ArrowLeft') handleModalNavigate('prev');
      if (e.key === 'ArrowRight') handleModalNavigate('next');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, handleModalNavigate]);

  // =========================================================================
  // SAFE EARLY RETURN: ALL HOOKS HAVE BEEN EXECUTED BEFORE THIS POINT
  // =========================================================================
  if (sortedImages.length === 0) {
    return (
      <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">
        No images available
      </div>
    );
  }

  const activeIndex = Math.abs(page % sortedImages.length);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const goToSlide = (index: number) => {
    const dir = index > activeIndex ? 1 : -1;
    setPage([index, dir]);
  };

  const openModal = (index: number) => {
    setModalIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  const currentModalImage = sortedImages[modalIndex];

  return (
    <div className="relative aspect-square w-full overflow-hidden select-none">
      {/* Slide Container */}
      <div className="relative w-full h-full cursor-zoom-in" onClick={() => openModal(activeIndex)}>
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={sortedImages[activeIndex].url}
              alt={sortedImages[activeIndex].alt || `Product Image ${activeIndex + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={activeIndex === 0}
              className="object-cover w-full h-full mask-[linear-gradient(to_bottom,black_70%,transparent_100%)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrow Buttons */}
      {sortedImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              paginate(-1);
            }}
            aria-label="Previous Image"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded bg-white/80 hover:bg-white text-black shadow-md backdrop-blur-sm transition-all"
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              paginate(1);
            }}
            aria-label="Next Image"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded bg-white/80 hover:bg-white text-black shadow-md backdrop-blur-sm transition-all"
          >
            &#8250;
          </button>
        </>
      )}

      {/* Slide Counter Indicator */}
      <div className="absolute bottom-10 right-4 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
          <p className="font-archivo text-sm font-medium text-black">
            {activeIndex + 1}/{sortedImages.length}
          </p>
        </div>
      </div>

      {/* Dynamic Dots Navigation */}
      {sortedImages.length > 1 && (
        <div className="flex items-center w-full absolute bottom-10 justify-center z-10 pointer-events-none">
          <div className="flex gap-1.5 pointer-events-auto">
            {sortedImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? 'w-5 bg-black' : 'w-1.5 bg-black/30 hover:bg-black/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isModalOpen && currentModalImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8"
          onClick={closeModal}
        >
          <button
            type="button"
            onClick={closeModal}
            className="absolute top-5 right-5 z-50 p-3 rounded-full bg-black/50 hover:bg-black text-white transition-all focus:outline-none"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {sortedImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => handleModalNavigate('prev', e)}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/40 hover:bg-black text-white transition-all focus:outline-none"
              aria-label="Previous modal image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentModalImage.url}
              alt={currentModalImage.alt || `Product Lightbox Image ${modalIndex + 1}`}
              fill
              sizes="100vw"
              quality={90}
              priority
              className="object-contain"
            />

            <div className="absolute -bottom-8 font-archivo left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tracking-wide">
              {modalIndex + 1} / {sortedImages.length}
            </div>
          </div>

          {sortedImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => handleModalNavigate('next', e)}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/40 hover:bg-black text-white transition-all focus:outline-none"
              aria-label="Next modal image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
