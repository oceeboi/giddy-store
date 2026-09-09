'use client';

import { Sheet } from '@/components/shared/sheet';
import { format_currency } from '@/utils/format';
import { Minus, Plus, ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useCart } from '@/store/cart.hook';
import { CartItem } from '@/types/cart.type';
import Image from 'next/image';
import { usePublicProductQuery } from '@/hooks/use-product.hook';
import { AnimatePresence, motion } from 'framer-motion';
import { useCreateCheckoutDraft } from '@/hooks/use-checkout.hook';
import { useSubscribe } from '@/store/subscribe.hook';
import { useToken } from '@/store/token.hook';
import { usePathname, useRouter } from 'next/navigation';

export function CartComponent() {
  const { email } = useSubscribe();
  const { addToken } = useToken();
  const { mutate: createCheckoutDraft } = useCreateCheckoutDraft();
  const [isOpen, setIsOpen] = useState(false);
  const [alert, setAlert] = useState<{ message: string } | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname.startsWith('/checkout') || pathname.startsWith('/cart');

  const {
    removeItem,
    updateQuantity,
    updateSize,
    items,
    totalItems: itemCartCount,
    rawSubtotal: subtotal,
  } = useCart();

  // Auto-dismiss alert cleanly via useEffect
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  function Checkout() {
    createCheckoutDraft(
      {
        customer: {
          guestEmail: email || 'anonymous@example.com',
        },
        cartItems: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          size: item.size,
          color: item.color,
          sku: item.sku,
          title: item.title,
          quantity: item.quantity,
          image: item.image,
          unitPrice: item.price,
        })),
      },
      {
        onSuccess: (data) => {
          addToken(data.checkoutToken);
          window.location.href = data.shareableUrl;
        },
      }
    );
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (isActive) {
      e.preventDefault();
      router.push('/cart');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Sheet.Trigger asChild>
        <button
          type="button"
          onClick={handleTriggerClick}
          aria-label={itemCartCount > 0 ? `Cart, ${itemCartCount} items` : 'Cart'}
          className="relative inline-flex size-9 items-center justify-center border border-black bg-black text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
        >
          <ShoppingCartIcon className="size-4" />
          {itemCartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center border border-black bg-white px-1 font-archivo text-[9px] font-medium leading-none text-black"
            >
              {itemCartCount > 99 ? '99+' : itemCartCount}
            </span>
          )}
        </button>
      </Sheet.Trigger>

      <Sheet.Content
        side="right"
        size="md"
        className="flex h-full w-full flex-col bg-white font-archivo text-black shadow-none"
      >
        {/* Header */}
        <Sheet.Header className="border-b border-neutral-200 px-6 py-5">
          <Sheet.Title className="m-0 font-archivo text-base font-normal uppercase tracking-wider text-black">
            <div className="flex items-center justify-between">
              <span className="text-black">Your Cart</span>
              <span className="font-archivo text-xs font-light text-neutral-500">
                ({itemCartCount} {itemCartCount === 1 ? 'ITEM' : 'ITEMS'})
              </span>
            </div>
          </Sheet.Title>
        </Sheet.Header>

        {/* Dynamic Alerts */}
        <AnimatePresence mode="wait">
          {alert && (
            <motion.div
              className="border-b border-neutral-200 bg-neutral-100 px-6 py-3 font-archivo text-xs font-normal text-neutral-900"
              role="alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <span className="block">{alert.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Item List */}
        <div
          className="flex-1 overflow-y-auto px-6 py-2 font-archivo"
          style={{ scrollbarWidth: 'thin' }}
        >
          {items.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {items.map((item) => (
                <CartItemRow
                  key={item.cartItemId}
                  item={item}
                  setOpen={setIsOpen}
                  removeItem={removeItem}
                  updateQuantity={updateQuantity}
                  updateSize={updateSize}
                  setAlert={setAlert}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col justify-center py-12 text-center font-archivo">
              <p className="text-xs font-normal uppercase tracking-widest text-neutral-400">
                Your Cart Is Empty
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                Add items to begin checkout.
              </p>
            </div>
          )}
        </div>

        {/* Footer & Actions */}
        <Sheet.Footer className="flex-col border-t border-neutral-200 px-6 py-5 font-archivo">
          <div className="mb-5 flex w-full items-center justify-between">
            <span className="text-xs font-normal uppercase tracking-widest text-neutral-500">
              Subtotal
            </span>
            <span className="font-archivo text-base font-normal tracking-tight text-black">
              {format_currency(subtotal!)}
            </span>
          </div>

          <div className="flex w-full flex-col gap-2.5">
            <button
              className="inline-flex w-full items-center justify-center border border-black bg-black py-3.5 font-archivo text-xs font-medium uppercase tracking-wider text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-black"
              onClick={Checkout}
            >
              Checkout
            </button>

            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="inline-flex w-full items-center justify-center border border-neutral-200 bg-white py-3 font-archivo text-xs font-medium uppercase tracking-wider text-black transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-black"
            >
              View Cart
            </Link>
          </div>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  );
}

type CartItemProps = {
  item: CartItem;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setAlert: Dispatch<SetStateAction<{ message: string } | null>>;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number, size_quantity: number) => void;
  updateSize: (
    cartItemId: string,
    size: string,
    sizeId: string,
    size_quantity: number,
    variantId: string
  ) => void;
};

function CartItemRow({
  item,
  removeItem,
  updateQuantity,
  updateSize,
  setOpen,
  setAlert,
}: CartItemProps) {
  const lineTotal = item.price * item.quantity;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  function onToggle() {
    setIsOpen(!isOpen);
  }

  const { data: clothingData, isLoading } = usePublicProductQuery(item.slug);

  const availableVariantsForColor =
    clothingData?.variants.filter((variant) => variant.colorId === item.colorId) || [];

  function handleSizeChange(newSize: string, newSizeId: string) {
    updateSize(
      item.cartItemId,
      newSize,
      newSizeId,
      availableVariantsForColor.find((variant) => variant.sizeId === newSizeId)
        ?.availableQuantity || 1,
      availableVariantsForColor.find((variant) => variant.sizeId === newSizeId)?.id || '1'
    );
    setIsOpen(false);
  }

  function handleUpdateQuantity(newQuantity: number) {
    const variant = availableVariantsForColor.find((variant) => variant.sizeId === item.sizeId);
    if (variant && newQuantity > variant.availableQuantity) {
      setAlert({
        message: `Only ${variant.availableQuantity} items available in stock for this size.`,
      });
      return;
    }

    newQuantity = Math.max(1, newQuantity);
    updateQuantity(
      item.cartItemId,
      newQuantity,
      availableVariantsForColor.find((variant) => variant.sizeId === item.sizeId)
        ?.availableQuantity || 1
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 font-archivo">
        <span className="text-xs font-light text-neutral-400 uppercase tracking-widest">
          LOADING...
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full gap-4 py-5 font-archivo">
      {/* Product Image */}
      <div className="relative h-24 w-20 shrink-0 bg-neutral-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="80px"
            className="object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-archivo text-[10px] font-light uppercase text-neutral-400">
            No Image
          </div>
        )}
      </div>

      {/* Details & Controls */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/collections/${item.slug}`}
              onClick={() => setOpen(false)}
              className="truncate"
            >
              <h4 className="truncate font-archivo text-xs font-medium uppercase tracking-tight text-black hover:opacity-70">
                {item.title}
              </h4>
            </Link>

            <span className="shrink-0 font-archivo text-xs font-normal tracking-tight text-black">
              {format_currency(lineTotal)}
            </span>
          </div>

          <div className="flex items-center text-xs text-neutral-500 font-archivo">
            <span className="uppercase font-light">{item.color}</span>
            <span className="mx-1.5 font-light">/</span>
            <span className="uppercase font-medium text-black">{item.size}</span>
            <button
              type="button"
              onClick={onToggle}
              className="ml-2.5 font-archivo text-[11px] font-light underline text-neutral-800 transition-opacity hover:opacity-60"
            >
              Change
            </button>
          </div>

          {/* Size Selector Drawer */}
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 grid grid-cols-5 gap-1 pt-1 font-archivo"
              >
                {availableVariantsForColor.map((variant: any) => {
                  const outOfStock = variant.availableQuantity <= 0 || !variant.active;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => handleSizeChange(variant.size, variant.sizeId)}
                      className={`flex items-center justify-center border py-1 font-archivo text-[10px] font-normal uppercase transition-colors ${
                        outOfStock
                          ? 'border-neutral-100 bg-neutral-50 text-neutral-300 line-through'
                          : 'border-neutral-200 bg-white text-black hover:border-black hover:bg-black hover:text-white'
                      }`}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quantity Controls & Remove Action */}
        <div className="mt-3 flex items-center justify-between font-archivo">
          <div className="inline-flex items-center border border-neutral-200">
            <button
              type="button"
              onClick={() => handleUpdateQuantity(Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="flex h-6 w-6 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>

            <span className="flex h-6 min-w-7 items-center justify-center px-1 font-archivo text-xs font-normal text-black border-x border-neutral-200">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              className="flex h-6 w-6 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100"
              aria-label="Increase quantity"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>

          <button
            type="button"
            className="font-archivo text-[11px] font-light uppercase tracking-wider text-neutral-400 hover:text-black transition-colors"
            onClick={() => removeItem(item.cartItemId)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
