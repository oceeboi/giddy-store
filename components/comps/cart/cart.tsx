'use client';
import { Sheet } from '@/components/shared/sheet';
import { format_currency } from '@/utils/format';
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function CartComponent() {
  const cartCount = 0; // Replace with your actual cart count logic
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Sheet.Trigger asChild>
        <button
          type="button"
          aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
          className="relative inline-flex size-9 items-center justify-center border border-neutral-900 bg-black text-white transition-all duration-200 ease-in-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
        >
          <ShoppingCartIcon className="size-4" />
          {cartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center border border-neutral-900 bg-white px-1 text-[9px] font-black leading-none text-black"
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      </Sheet.Trigger>

      <Sheet.Content
        side="right"
        className="h-full w-full font-archivo border-l border-neutral-900 bg-black text-white shadow-none"
      >
        <Sheet.Header className="border-b border-neutral-900 px-6 pb-4 pt-6">
          <Sheet.Title className="font-archivo text-lg font-black uppercase tracking-widest">
            Cart
          </Sheet.Title>
          <Sheet.Description className="mt-2 text-[10px] uppercase tracking-widest text-neutral-500">
            Current Session
          </Sheet.Description>
        </Sheet.Header>

        <div className="flex flex-1 flex-col px-6 py-6">
          <div className="border border-neutral-900 bg-neutral-950 p-5">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Cart Status</p>
            <h3 className="mt-3 font-archivo text-sm font-bold uppercase tracking-wider text-white">
              Your Cart Is Empty
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Add products to begin checkout. Curated pieces you select will appear here.
            </p>
          </div>

          <div className="mt-6 border-t border-neutral-900 pt-4">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
              <span>Subtotal</span>
              <span className="text-white">{format_currency(0)}</span>
            </div>
          </div>
        </div>

        <Sheet.Footer className="flex-col border-t border-neutral-900 px-6 py-4">
          <Link
            href="/cart"
            className="inline-flex w-full items-center justify-center border border-white bg-white px-4 py-3 text-[11px] font-black uppercase tracking-wider text-black transition-all duration-200 ease-in-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
          >
            View Cart
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex w-full items-center justify-center border border-neutral-800 bg-black px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white transition-all duration-200 ease-in-out hover:text-neutral-400 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
          >
            Continue Shopping
          </button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  );
}
