'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Minus, Plus, Check } from 'lucide-react';
import { format_currency } from '@/utils/format';
import { cn } from '@/lib/utils';

interface StickyAddToCartProps {
  title: string;
  price: number;
  image: string;
  selectedColorName?: string;
  selectedSizeName?: string;
  isOutOfStock?: boolean;
  isWishlisted?: boolean;
  max_quantiy: number;
  onAddToCart: (quantity: number) => void;
  onToggleWishlist?: () => void;
}

export function StickyAddToCartBar({
  title,
  price,
  image,
  selectedColorName,
  selectedSizeName,
  isOutOfStock = false,
  isWishlisted = false,
  max_quantiy,
  onAddToCart,
  onToggleWishlist,
}: StickyAddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    onAddToCart(quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    setQuantity(1);
  };

  const variantDetails = [selectedColorName, selectedSizeName].filter(Boolean).join(' / ');
  function handleQuantityChange(delta: number) {
    const nextQty = Math.max(1, quantity + delta);
    if (max_quantiy && nextQty > max_quantiy) return;
    // setValue('quantity', nextQty, { shouldValidate: true });
    setQuantity(nextQty);
  }
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full border-t border-gray-300 bg-white px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95 sm:px-6 lg:px-8 font-archivo">
      <div className="mx-auto flex max-w-8xl items-center justify-between gap-4">
        {/* Product Snapshot (Desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="relative h-12 w-10 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
            {image && (
              <Image
                src={image}
                alt={title}
                fill
                loading="eager"
                sizes="40px"
                className="object-cover object-center"
              />
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            <h4 className="line-clamp-1 text-xs font-archivo font-bold uppercase tracking-tight text-[#111111] dark:text-neutral-100">
              {title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-[#767676]">
              <span className="font-normal text-[#111111] dark:text-neutral-200">
                {format_currency(price)}
              </span>
              {variantDetails && (
                <>
                  <span>•</span>
                  <span className="uppercase">{variantDetails}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Info & Actions Container */}
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
          {/* Mobile Price & Variant Snapshot */}
          <div className="flex flex-col md:hidden">
            <span className="line-clamp-1 text-[12px] font-archivo uppercase text-[#767676]">
              {variantDetails || 'Standard'}
            </span>
            <span className="text-xs font-medium font-archivo text-[#111111] dark:text-neutral-100">
              {format_currency(price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimalist Quantity Selector */}
            <div className="inline-flex h-11 items-center rounded-none border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => handleQuantityChange(-1)}
                className="flex h-full w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-900"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex h-full min-w-8 items-center justify-center border-neutral-200 px-1 font-mono text-xs font-bold text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => handleQuantityChange(1)}
                className="flex h-full w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-900"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Wishlist Icon Button */}
            {onToggleWishlist && (
              <button
                type="button"
                onClick={onToggleWishlist}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-none border border-neutral-200 bg-white transition-colors dark:border-neutral-800 dark:bg-neutral-950',
                  isWishlisted && 'text-red-500'
                )}
                aria-label="Toggle Wishlist"
              >
                <Heart
                  className={cn(
                    'h-4 w-4',
                    isWishlisted ? 'fill-current text-red-500' : 'text-black dark:text-white'
                  )}
                />
              </button>
            )}

            {/* Primary Sharp CTA */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-none px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors duration-150',
                isAdded
                  ? 'bg-[#821E2A] hover:bg-[#821E2A]'
                  : 'bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200',
                'disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-800'
              )}
            >
              {isAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
