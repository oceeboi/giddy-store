'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore } from './wishlist.store';

export function useWishlist() {
  const store = useWishlistStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  // Prevent SSR hydration mismatch when reading persisted localStorage
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return {
    ...store,
    // Return empty state during SSR / initial hydration phase
    products: hasHydrated ? store.products : [],
    totalItems: hasHydrated ? store.products.length : 0,
    hasHydrated,

    // Helper method to generate composite key: `${productId}-${variantId}-${size}`
    getWishlistKey: (productId: string) => `${productId}`,

    // Quick check helper by productId, variantId, and size
    isWishlisted: (productId: string) => {
      if (!hasHydrated) return false;
      const key = `${productId}`;
      return store.hasItem(key);
    },
  };
}
