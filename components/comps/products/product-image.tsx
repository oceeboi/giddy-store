'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ProductMedia } from '@/types/shared/product';

interface ProductImageProps {
  image_data: ProductMedia[];
  selectedColorId?: string | null;
}

export function ProductImage({ image_data, selectedColorId }: ProductImageProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
    setActiveIndex(0);
  }, [selectedColorId]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { clientWidth } = el;
    const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  };

  const openModal = (index: number) => {
    setModalIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  };

  const handleModalNavigate = useCallback(
    (direction: 'prev' | 'next', e?: React.MouseEvent) => {
      e?.stopPropagation();
      setModalIndex((prev) => {
        if (direction === 'prev') {
          return prev === 0 ? sortedImages.length - 1 : prev - 1;
        } else {
          return prev === sortedImages.length - 1 ? 0 : prev + 1;
        }
      });
    },
    [sortedImages.length]
  );

  // Keyboard navigation for the modal
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
      {/* Scrollable Image Track */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto w-full h-full scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      >
        {sortedImages.map((image, index) => (
          <div
            key={`${image.colorId ?? 'generic'}-${image.order}-${index}`}
            onClick={() => openModal(index)}
            className="w-full h-full cursor-zoom-in shrink-0 grow-0 snap-center relative block"
          >
            <img
              src={image.url}
              alt={image.alt || `Product Image ${index + 1}`}
              className="w-full h-full object-cover block"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Gallery Navigation Arrows */}
      {sortedImages.length > 1 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-transparent hover:bg-white/80 rounded-full text-gray-800 transition-all opacity-100 focus:opacity-100"
            aria-label="Previous image"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" transform="matrix(-1 0 0 1 48 0)" fill="none"></rect>
              <path
                d="M32 38L16 24L32 10"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>

          <button
            onClick={() => scroll('right')}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-transparent hover:bg-white/80 rounded-full text-gray-800 transition-all opacity-100 focus:opacity-100"
            aria-label="Next image"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" fill="none"></rect>
              <path
                d="M16 38L32 24L16 10"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>

          {/* Pagination Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {sortedImages.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === activeIndex ? 'w-4 bg-black' : 'w-1.5 bg-black/30'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Built-in High Quality Lightbox Modal */}
      {isModalOpen && currentModalImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8 animate-fadeIn"
          onClick={closeModal}
        >
          {/* Close Button */}
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

          {/* Modal Left Navigation */}
          {sortedImages.length > 1 && (
            <button
              onClick={(e) => handleModalNavigate('prev', e)}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black text-white transition-all focus:outline-none"
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

          {/* Main Modal Image Container */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentModalImage.url}
              alt={currentModalImage.alt || `Product Lightbox Image ${modalIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Image counter indicator in modal */}
            <div className="absolute -bottom-7.5 font-archivo left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tracking-wide">
              {modalIndex + 1} / {sortedImages.length}
            </div>
          </div>

          {/* Modal Right Navigation */}
          {sortedImages.length > 1 && (
            <button
              onClick={(e) => handleModalNavigate('next', e)}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black text-white transition-all focus:outline-none"
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
