'use client';
import { ProductCard } from '@/components/comps';
import { HeroBannerAutoSwipe } from '@/components/comps/main';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <section className="">
      <section>
        <HeroBannerAutoSwipe />
      </section>
      <section className="flex flex-col  gap-4 py-10">
        <div className="flex flex-col gap-4">
          <div className="px-6">
            <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold font-archivo-black leading-tight text-black ">
              New Arrivals
            </h3>
          </div>
          <div className="px-6 flex items-center w-full justify-end ">
            <Link
              href="/new-arrivals"
              className="text-black font-archivo px-2 py-3 cursor-pointer hover:underline"
            >
              Shop New Arrivals
            </Link>
          </div>
        </div>
        <div
          style={{ scrollbarWidth: 'none' }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-2 overflow-x-auto px-6 scrollbar-hide"
        >
          {Array.from({ length: 50 }).map((index, i) => (
            <ProductCard key={i} />
          ))}
        </div>
      </section>
    </section>
  );
}
