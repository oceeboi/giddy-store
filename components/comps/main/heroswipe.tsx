'use client';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const HERO_SLIDES = [
  {
    src: '/banner/IMG_0219.jpeg',
    alt: 'High-end streetwear sneakers styled for everyday wear',
    eyebrow: '01 / NEW SEASON ESSENTIALS',
    title: 'Fresh drops, engineered for the culture.',
    description:
      'Uncompromising craftsmanship meets raw street identity. Discover rare pairs and elite silhouettes built to turn heads.',
    cta: 'Shop the drop',
    href: '/shop',
  },
  {
    src: '/banner/IMG_0220.jpeg',
    alt: 'Exclusive limited-edition luxury footwear collection',
    eyebrow: '02 / ARCHIVAL & LIMITED',
    title: 'Step into uncompromising design.',
    description:
      'Curated grails and heavily-coveted releases that bridge unmatched comfort, heritage, and pure confidence.',
    cta: 'Explore arrivals',
    href: '/whats-new',
  },
  {
    src: '/banner/IMG_0221-scaled.jpeg',
    alt: 'Modern silhouette sneakers with premium materials',
    eyebrow: '03 / DAILY ROTATION',
    title: 'Built to move. Styled to command.',
    description:
      'From daily street rotation to weekend statements, lock down your next essential pair before they are gone.',
    cta: 'View collection',
    href: '/shop',
  },
  {
    src: '/banner/IMG_0222-scaled.jpeg',
    alt: 'Minimalist clean sneaker lineup with luxury appeal',
    eyebrow: '04 / THE REFINED EDIT',
    title: 'Precision style for every rotation.',
    description:
      'Navigate the balance between timeless classic colorways and avant-garde statement pieces seamlessly.',
    cta: 'Browse products',
    href: '/shop',
  },
];

export function HeroBannerAutoSwipe() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isHoveredRef = useRef(false);

  const nextSlide = useCallback(() => {
    setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Pause auto-swiping when the user hovers over the banner to improve UX and prevent jarring interruptions
      if (!isHoveredRef.current) {
        nextSlide();
      }
    }, 5000);

    // Clean up interval on unmount to prevent memory leaks / thread/timer leaks
    return () => {
      window.clearInterval(timer);
    };
  }, [nextSlide]);

  return (
    <div
      className="relative h-[60svh] font-archivo min-h-105 overflow-hidden bg-[#0f0f0f] sm:h-[68vh] lg:h-[78vh]"
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
    >
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={slide.src}
            className={cn(
              'absolute inset-0 h-full w-full transition-all duration-1000 ease-out',
              isActive
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : 'pointer-events-none translate-x-6 opacity-0'
            )}
            aria-hidden={!isActive}
          >
            <div className="absolute inset-0 h-full w-full">
              {/* <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              /> */}
              <div className="flex-1 bg-gray-400 w-full h-full" />
            </div>
            <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/25 to-black/50" />
            <div className="absolute inset-0 flex items-end sm:items-center">
              <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-0">
                <div className="max-w-xl rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80">
                    {slide.eyebrow}
                  </p>
                  <h1 className="mt-3 text-2xl font-semibold font-archivo-black leading-tight text-white sm:text-4xl lg:text-5xl">
                    {slide.title}
                  </h1>
                  <p className="mt-3 max-w-lg text-sm leading-6 font-ibm-plex-mono text-white/80 sm:text-base">
                    {slide.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={slide.href}
                      className="rounded-full bg-white font-archivo-black px-5 py-2.5 text-sm font-semibold text-[#111111] transition hover:bg-amber-50"
                    >
                      {slide.cta}
                    </Link>
                    <Link
                      href="/whats-new"
                      className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      View arrivals
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-6">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300 cursor-pointer',
              index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/90'
            )}
          />
        ))}
      </div>
    </div>
  );
}
