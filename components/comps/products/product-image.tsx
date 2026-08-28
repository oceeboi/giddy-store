'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { ProductMedia } from '@/types/shared/product';

interface ProductImageProps {
  image_data: ProductMedia[];
  selectedColorId?: string | null;
}

// Helper to leverage CloudFront / AWS Lambda@Edge image resizing if configured
const getOptimizedUrl = (url: string, width: number, quality = 80) => {
  if (!url) return '';
  // If using CloudFront URL transformer, append queries or return raw URL if pre-transformed
  return `${url}?w=${width}&q=${quality}&format=webp`;
};

export function ProductImage({ image_data, selectedColorId }: ProductImageProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const sortedImages = useMemo(() => {
    const byOrder = (a: ProductMedia, b: ProductMedia) => a.order - b.order;

    const colorMatched = selectedColorId
      ? image_data.filter((img) => img.colorId === selectedColorId).sort(byOrder)
      : [];

    const generic = image_data.filter((img) => !img.colorId).sort(byOrder);

    if (colorMatched.length > 0) return [...colorMatched, ...generic];
    if (generic.length > 0) return generic;
    return [...image_data].sort(byOrder);
  }, [image_data, selectedColorId]);

  // Reset scroll on color change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    }
    setActiveIndex(0);
  }, [selectedColorId]);

  // 1. Optimize scroll listener via requestAnimationFrame (removes scroll jank/lag metrics)
  const handleScroll = useCallback(() => {
    if (animationFrameRef.current) return;

    animationFrameRef.current = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (el && el.clientWidth > 0) {
        const index = Math.round(el.scrollLeft / el.clientWidth);
        setActiveIndex(index);
      }
      animationFrameRef.current = null;
    });
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -el.clientWidth : el.clientWidth;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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

  // 2. Preload adjacent high-res modal images to eliminate latency when clicking Next/Prev
  useEffect(() => {
    if (!isModalOpen || sortedImages.length <= 1) return;

    const nextIdx = (modalIndex + 1) % sortedImages.length;
    const prevIdx = (modalIndex - 1 + sortedImages.length) % sortedImages.length;

    const imgNext = new window.Image();
    imgNext.src = sortedImages[nextIdx].url;

    const imgPrev = new window.Image();
    imgPrev.src = sortedImages[prevIdx].url;
  }, [isModalOpen, modalIndex, sortedImages]);

  // 3. Hotkey Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') handleModalNavigate('prev');
      if (e.key === 'ArrowRight') handleModalNavigate('next');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, handleModalNavigate]);

  const currentModalImage = sortedImages[modalIndex];

  return (
    <div className="w-full h-full relative group overflow-hidden">
      {/* Scrollable Gallery Track */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto w-full h-full scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      >
        {sortedImages.map((image, index) => {
          const isLCP = index === 0;
          return (
            <div
              key={`${image.colorId ?? 'generic'}-${image.order}-${index}`}
              onClick={() => openModal(index)}
              className="w-full h-full cursor-zoom-in shrink-0 grow-0 snap-center relative aspect-3/4 bg-neutral-100"
            >
              <Image
                src={image.url}
                alt={image.alt || `Product Image ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={isLCP}
                quality={isLCP ? 85 : 75}
                className="object-cover w-full h-full"
              />
            </div>
          );
        })}
      </div>

      {/* Control Overlay Buttons */}
      {sortedImages.length > 1 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-transparent hover:bg-white backdrop-blur-sm rounded-full text-gray-800 transition-all shadow-md focus:outline-none"
            aria-label="Previous image"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={() => scroll('right')}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-transparent hover:bg-white backdrop-blur-sm rounded-full text-gray-800 transition-all shadow-md focus:outline-none"
            aria-label="Next image"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Optimized Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 pointer-events-none">
            {sortedImages.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'w-5 bg-black' : 'w-1.5 bg-black/30'
                }`}
              />
            ))}
          </div>
        </>
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
