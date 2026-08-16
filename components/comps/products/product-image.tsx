'use client';

import React, { useRef } from 'react';
import { ProductMedia } from '@/types/shared/product';

export function ProductImage({ image_data }: { image_data: ProductMedia[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full h-full relative group">
      {/* Scrollable Image Track */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto w-full h-full gap-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none snap-x snap-mandatory"
      >
        {image_data.map((image, index) => (
          <div
            key={image.colorId ? `${image.colorId}-${index}` : index}
            className="w-full h-full shrink-0 snap-center"
          >
            <img
              src={image.url}
              alt={image.alt || `Product Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Pagination / Navigation Buttons */}
      {image_data.length > 1 && (
        <>
          {/* Left Button */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5  bg-transparent hover:bg-white text-gray-800  transition-all opacity-100  focus:opacity-100"
            aria-label="Previous image"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" transform="matrix(-1 0 0 1 48 0)" fill="none"></rect>
              <path d="M32 38L16 24L32 10" stroke="black" strokeWidth="2"></path>
            </svg>
          </button>

          {/* Right Button */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5  bg-transparent hover:bg-white text-gray-800  transition-all opacity-100  focus:opacity-100"
            aria-label="Next image"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" fill="none"></rect>
              <path d="M16 38L32 24L16 10" stroke="black" strokeWidth="2"></path>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
