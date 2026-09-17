'use client';

import { RefObject } from 'react';
import { useIsVisible } from '@/hooks/use-is-visible';
import { StickyAddToCartBar } from './product-stick';

interface StickyAddToCartWrapperProps {
  mainButtonRef: RefObject<HTMLElement | null>;
  title: string;
  price: number;
  image: string;
  max_quantiy: number;
  selectedColorName?: string;
  selectedSizeName?: string;
  isOutOfStock?: boolean;
  isWishlisted?: boolean;
  onAddToCart: (quantity: number) => void;
  onToggleWishlist?: () => void;
}

export function StickyAddToCartWrapper({ mainButtonRef, ...props }: StickyAddToCartWrapperProps) {
  const isMainButtonVisible = useIsVisible(mainButtonRef);

  // Show bar when main button is NOT visible in viewport
  const showStickyBar = !isMainButtonVisible;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transform transition-all duration-300 ease-in-out ${
        showStickyBar
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <StickyAddToCartBar {...props} />
    </div>
  );
}
