import { useEffect, useState } from 'react';
import { useCartStore } from './cart.store';

export function useCart() {
  const store = useCartStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return {
    ...store,
    // Safely return empty array / 0 on initial SSR pass
    items: hasHydrated ? store.items : [],
    totalItems: hasHydrated ? store.getTotalItems() : 0,

    rawSubtotal: hasHydrated ? store.getRawSubtotal() : 0,
    isHydrated: hasHydrated,
  };
}
