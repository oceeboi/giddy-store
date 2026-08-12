'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { STORE_DETAILS } from '@/constants/store-details';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MenuIcon, SearchIcon, ShoppingCartIcon, UserIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { CartComponent } from '../comps';

type NavItem = { label: string; href: string };

const LEFT_ITEMS: NavItem[] = [
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
];

const RIGHT_ITEMS: NavItem[] = [
  { label: 'Accessories', href: '/accessories' },
  { label: 'Sale', href: '/sale' },
];

const ALL_ITEMS = [...LEFT_ITEMS, ...RIGHT_ITEMS];

const POPULAR_SEARCHES = ['New Arrivals', 'Outerwear', 'Footwear', 'Limited Edition'];

const SEARCHABLE_PRODUCTS = Array.from(
  new Set([
    ...ALL_ITEMS.map((item) => item.label),
    ...POPULAR_SEARCHES,
    'Leather Jacket',
    'Cargo Pants',
    'Classic Sneakers',
    'Silk Dress',
    'Wool Coat',
    'Crossbody Bag',
  ])
);

interface NavigationTopBarProps {
  /** Number of items in the cart. Omit or pass 0 to hide the badge. */
  cartCount?: number;
}

export function NavigationTopBar({ cartCount = 0 }: NavigationTopBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer automatically on route change.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (isMobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white border-b border-neutral-900">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 h-20">
        {/* Left: Mobile Menu Trigger & Left Navigation Links (Desktop) */}
        <div className="flex items-center">
          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="p-1 -ml-1 transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 lg:hidden"
          >
            {isMobileMenuOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>

          <nav aria-label="Primary" className="hidden lg:flex items-center space-x-8">
            {LEFT_ITEMS.map((item) => (
              <NavigationItem key={item.href} label={item.label} href={item.href} />
            ))}
          </nav>
        </div>

        {/* Center: Monolithic Store Brand */}
        <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
          <Link
            href="/"
            className="block focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
          >
            <h1 className="text-xl lg:text-2xl font-black uppercase tracking-widest font-archivo">
              {STORE_DETAILS.name}
            </h1>
          </Link>
        </div>

        {/* Right: Remaining Navigation Links (Desktop) & Actions */}
        <div className="flex items-center space-x-6 lg:space-x-8">
          <nav aria-label="Secondary" className="hidden lg:flex items-center space-x-8">
            {RIGHT_ITEMS.map((item) => (
              <NavigationItem key={item.href} label={item.label} href={item.href} />
            ))}
          </nav>

          <div className="flex items-center gap-4 sm:gap-5">
            <SearchBar onSearchOpen={() => setIsMobileMenuOpen(false)} />
            <CartComponent />
            <Link
              href="/account"
              aria-label="Account"
              className="transition-opacity hover:opacity-60 hidden sm:block focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
            >
              <UserIcon className="size-5" />
            </Link>
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={pathname}
      />
    </header>
  );
}

function NavigationItem({ label, href }: NavItem) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'text-[11px] uppercase tracking-wider font-archivo transition-all duration-200 relative py-1',
        'focus-visible:outline-2  focus-visible:outline-white focus-visible:outline-offset-4',
        isActive
          ? 'text-white font-bold after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-white'
          : 'text-neutral-400 hover:text-white'
      )}
    >
      {label}
    </Link>
  );
}

function MobileMenu({
  isOpen,
  onClose,
  pathname,
}: {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}) {
  // Close on Escape from anywhere while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Drawer */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[86vw] max-w-sm bg-black border-r border-neutral-900 transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col px-6 pt-24 space-y-1">
          {ALL_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'py-3 text-sm uppercase tracking-wider font-archivo border-b border-neutral-900 transition-colors',
                  'focus-visible:outline focus-visible:outline-white focus-visible:outline-offset-2',
                  isActive ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

function SearchBar({ onSearchOpen }: { onSearchOpen?: () => void }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const debouncedQuery = useDebouncedValue(query, 250);

  const results = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    if (!normalizedQuery) return POPULAR_SEARCHES;

    return SEARCHABLE_PRODUCTS.filter((product) =>
      product.toLowerCase().includes(normalizedQuery)
    ).slice(0, 8);
  }, [debouncedQuery]);

  const hasQuery = debouncedQuery.trim().length > 0;

  const closeSearch = () => setIsSearchOpen(false);

  const handleSelectTerm = (term: string) => {
    setQuery(term);
    closeSearch();
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    closeSearch();
  };

  useOnClickOutside(desktopContainerRef, () => {
    if (!isSearchOpen) return;
    if (!window.matchMedia('(min-width: 640px)').matches) return;
    closeSearch();
  });

  const openSearch = () => {
    onSearchOpen?.();
    setIsSearchOpen(true);
  };

  const toggleDesktopSearch = () => {
    setIsSearchOpen((open) => {
      if (!open) onSearchOpen?.();
      return !open;
    });
  };

  useEffect(() => {
    setIsSearchOpen(false);
    setQuery('');
  }, [pathname]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const isDesktop = window.matchMedia('(min-width: 640px)').matches;
    if (isDesktop) {
      desktopInputRef.current?.focus();
      return;
    }

    mobileInputRef.current?.focus();
  }, [isSearchOpen]);

  // Close on Escape (both layouts)
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSearch();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Lock body scroll only for the mobile takeover experience.
  useEffect(() => {
    if (isSearchOpen) {
      if (window.matchMedia('(min-width: 640px)').matches) return;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isSearchOpen]);

  return (
    <>
      {/* Desktop: inline expanding field + dropdown (unchanged) */}
      <div ref={desktopContainerRef} className="relative hidden sm:flex items-center">
        <form
          onSubmit={handleSearchSubmit}
          className={cn(
            'flex items-center transition-all duration-300 ease-in-out overflow-hidden',
            isSearchOpen
              ? 'w-64 border-b border-white pb-1 opacity-100'
              : 'w-0 opacity-0 pointer-events-none'
          )}
        >
          <label htmlFor="site-search-desktop" className="sr-only">
            Search
          </label>
          <input
            ref={desktopInputRef}
            id="site-search-desktop"
            type="text"
            placeholder="SEARCH..."
            className="w-full bg-transparent outline-none text-[11px] uppercase tracking-wider font-archivo text-white placeholder:text-neutral-500"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            tabIndex={isSearchOpen ? 0 : -1}
          />
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>

        <button
          type="button"
          onClick={toggleDesktopSearch}
          aria-label={isSearchOpen ? 'Close search' : 'Open search'}
          aria-expanded={isSearchOpen}
          aria-controls="desktop-search-popover"
          aria-haspopup="dialog"
          className="relative z-10 shrink-0 transition-opacity hover:opacity-60 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
        >
          {isSearchOpen ? <XIcon className="size-5" /> : <SearchIcon className="size-5" />}
        </button>

        {isSearchOpen && (
          <div
            id="desktop-search-popover"
            role="dialog"
            aria-label="Search suggestions"
            className="absolute right-0 top-full mt-6 w-80 bg-black border border-neutral-900 p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-archivo mb-3">
              {hasQuery ? 'Search Results' : 'Popular Searches'}
            </div>

            {results.length > 0 ? (
              <div className="flex flex-col space-y-2.5">
                {results.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectTerm(term)}
                    className="text-left text-xs uppercase tracking-wider font-archivo text-neutral-300 hover:text-white transition-colors py-1 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                  >
                    {term}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 font-archivo">No products found.</p>
            )}
          </div>
        )}
      </div>

      {/* Mobile: search trigger */}
      <button
        type="button"
        onClick={openSearch}
        aria-label="Open search"
        aria-controls="mobile-search-panel"
        aria-haspopup="dialog"
        className="sm:hidden transition-opacity hover:opacity-60 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
      >
        <SearchIcon className="size-5" />
      </button>

      {/* Mobile: full-width takeover backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setIsSearchOpen(false)}
        className={cn(
          'fixed inset-0 z-60 bg-black/70 transition-opacity duration-300 sm:hidden',
          isSearchOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Mobile: full-width takeover panel */}
      <div
        id="mobile-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={cn(
          'fixed inset-x-0 top-0 z-60 bg-black border-b border-neutral-800 transition-transform duration-300 ease-out sm:hidden',
          isSearchOpen ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="flex items-center gap-3 px-5 h-20 border-b border-neutral-900">
          <SearchIcon className="size-5 text-neutral-500 shrink-0" />
          <label htmlFor="site-search-mobile" className="sr-only">
            Search
          </label>
          <input
            ref={mobileInputRef}
            id="site-search-mobile"
            type="text"
            placeholder="Search products..."
            className="flex-1 bg-transparent outline-none text-sm font-archivo text-white placeholder:text-neutral-500"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            tabIndex={isSearchOpen ? 0 : -1}
          />
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search"
            className="shrink-0 p-1 transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="px-5 py-6">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-archivo mb-3">
            {hasQuery ? 'Search Results' : 'Popular Searches'}
          </div>

          {results.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {results.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSelectTerm(term)}
                  className="rounded-full border border-neutral-800 px-4 py-2 text-xs uppercase tracking-wider font-archivo text-neutral-300 hover:border-white hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                >
                  {term}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 font-archivo">No products found.</p>
          )}
        </div>
      </div>
    </>
  );
}
