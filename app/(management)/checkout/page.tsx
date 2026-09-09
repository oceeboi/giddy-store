'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToken } from '@/store/token.hook';
import { useTokenStore } from '@/store/token.store';

export default function CheckoutRedirectPage() {
  const router = useRouter();

  const { isHydrated, checkTokenExpiration } = useToken();

  useEffect(() => {
    // Don't redirect before Zustand has hydrated localStorage.
    if (!isHydrated) return;

    // Remove the token if it has expired.
    checkTokenExpiration();

    // Get the latest store state after expiration check.
    const currentToken = useTokenStore.getState().token;

    // No valid token.
    if (!currentToken) {
      router.replace('/collections');
      return;
    }

    // Valid token.
    router.replace(`/checkout/${encodeURIComponent(currentToken)}`);
  }, [isHydrated, checkTokenExpiration, router]);

  return null;
}
