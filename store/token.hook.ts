import { useEffect, useState } from 'react';
import { useTokenStore } from './token.store';

export function useToken() {
  const store = useTokenStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return {
    ...store,
    token: hasHydrated ? store.token : '',
    expireAt: hasHydrated ? store.expireAt : null,
    isToken: hasHydrated ? store.isToken : false,
    isHydrated: hasHydrated,
  };
}
