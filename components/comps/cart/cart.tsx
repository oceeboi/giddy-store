'use client';

import { Sheet } from '@/components/shared/sheet';
import { format_currency } from '@/utils/format';
import { Minus, Plus, ShoppingCartIcon, X } from 'lucide-react';
import Link from 'next/link';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useCart } from '@/store/cart.hook';

import Image from 'next/image';
import { usePublicProductQuery } from '@/hooks/use-product.hook';
import { AnimatePresence, motion } from 'framer-motion';

import { useSubscribe } from '@/store/subscribe.hook';
import { useToken } from '@/store/token.hook';
import { usePathname, useRouter } from 'next/navigation';
import { useCreateCheckoutDraft } from '@/hooks/checkout.hook';
import { toast } from '@/components/toast/toast';

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
          isVIP: false,
        },
        isAdvisorGenerated: false,
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
          if (data.warnings) {
            toast.info(data.warnings[0].reason);
          }
          addToken(data.checkoutToken);
          window.location.href = data.shareableUrl;
        },
        onError: (data) => {
          if (data.warnings) {
            toast.error(data.warnings[0].reason);
          }
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
        className="flex h-full w-full flex-col bg-white font-archivo text-black shadow-none border-l border-black p-0"
      >
        {/* Header */}
        <Sheet.Header className="border-b border-neutral-300! px-6 py-5">
          <Sheet.Title className="m-0 font-archivo text-xs font-bold uppercase tracking-widest text-black">
            <div className="flex items-center justify-between">
              <span className="text-black">Your Cart</span>
              <span className="font-mono text-xs font-light text-[#767676]">
                ({itemCartCount} {itemCartCount === 1 ? 'ITEM' : 'ITEMS'})
              </span>
            </div>
          </Sheet.Title>
        </Sheet.Header>

        {/* Dynamic Alerts */}
        <AnimatePresence mode="wait">
          {alert && (
            <motion.div
              className="border-b border-black bg-neutral-900 px-6 py-3 font-archivo text-xs font-normal text-white"
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <span className="block uppercase tracking-tight">{alert.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Item List */}
        <div
          className="flex-1 overflow-y-auto px-6 py-2 font-archivo"
          style={{ scrollbarWidth: 'thin' }}
        >
          {items.length > 0 ? (
            <div className="divide-y divide-neutral-200">
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
            <div className="flex h-full flex-col items-center justify-center py-12 text-center font-archivo">
              <p className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                Your Cart Is Empty
              </p>
              <p className="mt-2 text-xs font-light uppercase text-[#767676]">
                Add items to begin checkout.
              </p>
            </div>
          )}
        </div>

        {/* Footer & Actions */}
        <Sheet.Footer className="flex-col border-t border-neutral-300! px-6 py-5 font-archivo">
          <div className="mb-5 flex w-full items-center justify-between">
            <span className="text-xs font-archivo font-bold uppercase tracking-widest text-[#767676]">
              Subtotal
            </span>
            <span className="font-archivo text-sm font-semibold tracking-tight text-[#111111]">
              {format_currency(subtotal ?? 0)}
            </span>
          </div>

          <div className="flex w-full flex-col gap-2">
            {/* Main Checkout Button */}
            <button
              className="group relative inline-flex w-full cursor-pointer items-center justify-center overflow-hidden border border-black bg-black py-3.5 font-archivo text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              onClick={Checkout}
              disabled={items.length === 0}
            >
              <span className="relative font-archivo z-10">Checkout</span>
            </button>

            {/* View Cart Outlined Link */}
            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden border border-black py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors"
            >
              <span className="relative z-10 transition-colors duration-150 group-hover:text-white">
                View Cart
              </span>
              <div className="absolute left-0 h-full w-0 bg-black transition-all duration-150 ease-in-out group-hover:w-full" />
            </Link>
          </div>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  );
}

type CartItem = {
  cartItemId: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
  color: string;
  colorId: string;
  size: string;
  sizeId: string;
  image?: string;
};

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

export function CartItemRow({
  item,
  removeItem,
  updateQuantity,
  updateSize,
  setOpen,
  setAlert,
}: CartItemProps) {
  const lineTotal = item.price * item.quantity;
  const [isSizeOpen, setIsSizeOpen] = useState<boolean>(false);

  const { data: clothingData, isLoading } = usePublicProductQuery(item.slug);

  const availableVariantsForColor =
    clothingData?.variants?.filter((variant) => variant.colorId === item.colorId) || [];

  function handleSizeChange(newSize: string, newSizeId: string) {
    const targetVariant = availableVariantsForColor.find((v) => v.sizeId === newSizeId);
    updateSize(
      item.cartItemId,
      newSize,
      newSizeId,
      targetVariant?.availableQuantity || 1,
      targetVariant?.id || '1'
    );
    setIsSizeOpen(false);
  }

  function handleUpdateQuantity(newQuantity: number) {
    const variant = availableVariantsForColor.find((v) => v.sizeId === item.sizeId);
    if (variant && newQuantity > variant.availableQuantity) {
      setAlert({
        message: `Only ${variant.availableQuantity} items available for this size.`,
      });
      return;
    }

    newQuantity = Math.max(1, newQuantity);
    updateQuantity(item.cartItemId, newQuantity, variant?.availableQuantity || 1);
  }

  if (isLoading) {
    return (
      <div className="flex h-28 w-full items-center justify-center py-5 font-archivo">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#767676]">
          Loading details...
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full gap-4 py-5 font-archivo">
      {/* Product Image Frame */}
      <div className="relative h-24 w-20 shrink-0 border border-neutral-200 bg-neutral-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="80px"
            className="object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-archivo text-[9px] font-medium uppercase text-[#767676]">
            No Image
          </div>
        )}
      </div>

      {/* Details & Controls Column */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex flex-col gap-1">
          {/* Title & Price Header */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/collections/${item.slug}`}
              onClick={() => setOpen(false)}
              className="truncate"
            >
              <h4 className="truncate font-archivo text-xs font-bold uppercase tracking-tight text-[#111111] hover:underline">
                {item.title}
              </h4>
            </Link>

            <span className="shrink-0 font-mono text-xs font-semibold tracking-tight text-[#111111]">
              {format_currency(lineTotal)}
            </span>
          </div>

          {/* Color & Size Meta Row */}
          <div className="flex items-center text-xs text-[#767676]">
            <span className="uppercase font-normal">{item.color}</span>
            <span className="mx-1 font-light">/</span>
            <span className="uppercase font-bold text-[#111111]">{item.size}</span>
            <button
              type="button"
              onClick={() => setIsSizeOpen(!isSizeOpen)}
              className="ml-2 font-archivo text-[10px] font-semibold uppercase underline text-[#111111] hover:text-[#767676] transition-colors"
            >
              {isSizeOpen ? 'Cancel' : 'Edit Size'}
            </button>
          </div>

          {/* Expandable Size Selector Grid */}
          <AnimatePresence mode="wait">
            {isSizeOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 grid grid-cols-5 gap-1 border-t border-neutral-100 pt-2"
              >
                {availableVariantsForColor.map((variant: any) => {
                  const outOfStock = variant.availableQuantity <= 0 || variant.active === false;
                  const isSelected = variant.sizeId === item.sizeId;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => handleSizeChange(variant.size, variant.sizeId)}
                      className={`flex h-7 items-center justify-center border font-archivo text-[10px] font-bold uppercase transition-colors ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : outOfStock
                            ? 'border-neutral-200 bg-neutral-50 text-neutral-300 line-through cursor-not-allowed'
                            : 'border-neutral-200 bg-white text-black hover:border-black'
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
        <div className="mt-3 flex items-center justify-between">
          {/* Quantity Stepper */}
          <div className="inline-flex h-8 items-center border border-neutral-200 bg-white">
            <button
              type="button"
              onClick={() => handleUpdateQuantity(Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="flex h-full w-7 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>

            <span className="flex h-full min-w-8 items-center justify-center border-x border-neutral-200 font-mono text-xs font-bold text-neutral-900">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              className="flex h-full w-7 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Remove Button */}
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#767676] hover:text-black transition-colors"
            onClick={() => removeItem(item.cartItemId)}
          >
            <X className="h-3 w-3" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
