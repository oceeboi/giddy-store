'use client';

import { useState } from 'react';
import STORE_DETAILS from '@/constants/store-details';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MenuIcon, SearchIcon, ShoppingCartIcon, UserIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

export function NavigationTopBar() {
  const navigationItems = [
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Women', href: '/women' },
    { label: 'Men', href: '/men' },
    { label: 'Accessories', href: '/accessories' },
    { label: 'Sale', href: '/sale' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white border-b border-neutral-900">
      <div className="flex items-center justify-between px-6 lg:px-12 h-20">
        {/* Left: Mobile Menu Trigger & Left Navigation Links (Desktop) */}
        <div className="flex items-center">
          <button
            aria-label="Open Menu"
            className="p-1 -ml-1 transition-opacity hover:opacity-60 lg:hidden"
          >
            <MenuIcon className="size-5" />
          </button>

          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.slice(0, 3).map((item) => (
              <NavigationItem key={item.href} label={item.label} href={item.href} />
            ))}
          </nav>
        </div>

        {/* Center: Monolithic Store Brand */}
        <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
          <Link href="/" className="block">
            <h1 className="text-xl lg:text-2xl font-black uppercase tracking-widest font-archivo">
              {STORE_DETAILS.name}
            </h1>
          </Link>
        </div>

        {/* Right: Remaining Navigation Links (Desktop) & Actions */}
        <div className="flex items-center space-x-6 lg:space-x-8">
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.slice(3).map((item) => (
              <NavigationItem key={item.href} label={item.label} href={item.href} />
            ))}
          </nav>

          <div className="flex items-center space-x-5">
            <SearchBar />
            <button aria-label="Cart" className="transition-opacity hover:opacity-60 relative">
              <ShoppingCartIcon className="size-5" />
            </button>
            <button
              aria-label="Account"
              className="transition-opacity hover:opacity-60 hidden sm:block"
            >
              <UserIcon className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavigationItem({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`text-[11px] uppercase tracking-wider font-archivo transition-all duration-200 relative py-1 ${
        isActive
          ? 'text-white font-bold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white'
          : 'text-neutral-400 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}

function SearchBar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="relative flex items-center">
      {/* Expandable Search Input / Container */}
      <div
        className={cn(
          'flex items-center transition-all duration-300 ease-in-out overflow-hidden',
          isSearchOpen
            ? 'w-48 sm:w-64 border-b border-white pb-1 mr-2 opacity-150'
            : 'w-0 opacity-0 pointer-events-none'
        )}
      >
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <input
          id="search"
          type="text"
          placeholder="SEARCH..."
          className="w-full bg-transparent outline-none text-[11px] uppercase tracking-wider font-archivo text-white placeholder:text-neutral-500"
          autoFocus={isSearchOpen}
        />
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        aria-label={isSearchOpen ? 'Close Search' : 'Open Search'}
        className="transition-opacity hover:opacity-60 flex items-center justify-center"
      >
        {isSearchOpen ? <XIcon className="size-5" /> : <SearchIcon className="size-5" />}
      </button>

      {isSearchOpen && (
        <div className="absolute top-12 right-0 w-72 sm:w-80 bg-black border border-neutral-900 p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-archivo mb-3">
            Popular Searches
          </div>
          <div className="flex flex-col space-y-2.5">
            {['New Arrivals', 'Outerwear', 'Footwear', 'Limited Edition'].map((term) => (
              <button
                key={term}
                onClick={() => setIsSearchOpen(false)}
                className="text-left text-xs uppercase tracking-wider font-archivo text-neutral-300 hover:text-white transition-colors py-1"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
