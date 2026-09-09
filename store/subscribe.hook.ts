import { useEffect, useState } from 'react';
import { useSubscribeStore } from './subscribe.store';

export function useSubscribe() {
  const store = useSubscribeStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return {
    ...store,
    // Safely return empty string / false on initial SSR pass
    email: hasHydrated ? store.email : '',
    isSubscribed: hasHydrated ? store.isSubscribed : false,
    isHydrated: hasHydrated,
  };
}
