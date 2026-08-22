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
    href: '/collections',
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
      if (!isHoveredRef.current) {
        nextSlide();
      }
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [nextSlide]);

  return (
    <div
      className="relative h-[70svh] font-archivo min-h-125 overflow-hidden bg-[#0a0a0a] sm:h-[75vh] lg:h-[82vh]"
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
              'absolute inset-0 h-full w-full transition-all duration-700 ease-in-out',
              isActive
                ? 'translate-x-0 opacity-100 pointer-events-auto z-10'
                : 'pointer-events-none translate-x-4 opacity-0 z-0'
            )}
            aria-hidden={!isActive}
          >
            {/* Background Image / Smart Placeholder */}
            <div className="absolute inset-0 h-full w-full bg-[#121212]">
              {/* Uncomment once images are ready:
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center filter brightness-90"
              /> */}

              {/* Styled Placeholder Graphic */}
              <div className="absolute inset-0 bg-linear-to-br from-[#1c1c1c] via-[#111111] to-[#050505] flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[radial-linear(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="text-center px-4 select-none">
                  <span className="text-white/20 font-archivo-black text-6xl sm:text-8xl lg:text-9xl tracking-tighter uppercase block">
                    Slide 0{index + 1}
                  </span>
                  <span className="text-white/30 text-xs tracking-[0.4em] uppercase font-mono mt-2 block">
                    Image Placeholder // {slide.href}
                  </span>
                </div>
              </div>
            </div>

            {/* Cinematic linear Overlays */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-linear-to-r from-black/70 via-transparent to-transparent" />

            {/* Slide Content Box */}
            <div className="absolute inset-0 flex items-end sm:items-center">
              <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 sm:pb-0">
                <div className="max-w-xl border-l-2 border-white bg-black/60 p-6 backdrop-blur-md sm:p-10 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 bg-white rounded-none" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
                      {slide.eyebrow}
                    </p>
                  </div>

                  <h1 className="mt-4 text-3xl font-bold font-archivo tracking-tight leading-none text-white sm:text-5xl">
                    {slide.title}
                  </h1>

                  <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base font-normal">
                    {slide.description}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link
                      href={slide.href}
                      className="rounded-none bg-white px-7 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-black transition-all duration-200 hover:bg-white/90 hover:translate-y-[-1px]"
                    >
                      {slide.cta}
                    </Link>
                    <Link
                      href="/whats-new"
                      className="rounded-none border border-white/30 px-7 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 hover:border-white hover:bg-white/10"
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

      {/* Modern Brutalist Indicator Bar */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 bg-black/50 px-4 py-2 backdrop-blur-md border border-white/10">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'h-1 transition-all duration-300 cursor-pointer rounded-none',
              index === activeIndex ? 'w-10 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'
            )}
          />
        ))}
      </div>
    </div>
  );
}
