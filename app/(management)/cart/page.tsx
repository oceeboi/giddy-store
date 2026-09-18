'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingCartIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useCart } from '@/store/cart.hook';
import { format_currency } from '@/utils/format';
import { usePublicProductQuery } from '@/hooks/use-product.hook';

import { CartItem } from '@/types/cart.type';
import { useSubscribe } from '@/store/subscribe.hook';
import { useToken } from '@/store/token.hook';
import { useCreateCheckoutDraft } from '@/hooks/checkout.hook';

export default function CartPage() {
  const { removeItem, updateQuantity, updateSize, items, rawSubtotal: subtotal } = useCart();
  const { addToken } = useToken();
  const { mutate: createCheckoutDraft, isPending: isCreatingCheckout } = useCreateCheckoutDraft();
  const [alert, setAlert] = useState<{ message: string } | null>(null);
  const { email } = useSubscribe();

  const handleCheckout = () => {
    if (items.length === 0) return;

    createCheckoutDraft(
      {
        customer: {
          isVIP: false,
          guestEmail: email || 'anonymous@example.com',
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
          addToken(data.checkoutToken);
          window.location.href = data.shareableUrl;
        },
        onError: (err) => {
          if (err) {
            const message =
              err.details?.[0].reason === 'INSUFFICIENT_STOCK'
                ? `Currently in high demand—please adjust your quantity.`
                : err.message;
            setAlert({ message: message });
          }
          // setAlert({ message: err.message || 'Failed to initiate checkout. Please try again.' });
        },
      }
    );
  };

  return (
    <main className="w-full min-h-screen bg-white font-archivo text-neutral-900">
      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-8 border-b border-neutral-200 pb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl  text-[#821E2A] sm:text-4xl font-extrabold uppercase tracking-tight ">
              Shopping Cart
            </h1>
            <p className="mt-1 text-xs text-neutral-500 uppercase tracking-widest">
              {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Link
            href="/collections"
            className="hidden sm:inline-flex items-center text-xs font-semibold uppercase tracking-wider underline hover:opacity-60 transition-opacity"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Global Alert Notification */}
        <AnimatePresence>
          {alert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 border border-neutral-900 bg-neutral-950 p-4 text-white flex items-center justify-between"
            >
              <span className="text-xs uppercase tracking-wider">{alert.message}</span>
              <button
                type="button"
                onClick={() => setAlert(null)}
                className="text-xs underline uppercase tracking-widest ml-4 hover:opacity-70"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="flex flex-col items-center justify-center border border-dashed border-neutral-200 py-20 text-center">
            <ShoppingCartIcon className="h-10 w-10 text-neutral-300 stroke-[1.5]" />
            <h2 className="mt-4 text-sm font-bold uppercase tracking-wider text-black">
              Your cart is currently empty
            </h2>
            <p className="mt-1 text-xs text-neutral-500 max-w-xs">
              Explore our latest collection to add luxury pieces to your cart.
            </p>
            <Link
              href="/collections"
              className="mt-6 inline-flex items-center justify-center bg-black px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-neutral-800"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          /* Cart Content Layout Grid */
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
            {/* Left Column: Items List */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
              {items.map((item) => (
                <CartItemRow
                  key={item.cartItemId}
                  item={item}
                  removeItem={removeItem}
                  updateQuantity={updateQuantity}
                  updateSize={updateSize}
                  setAlert={setAlert}
                />
              ))}
            </div>

            {/* Right Column: Sticky Order Summary */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8">
              <div className="border border-neutral-900 bg-neutral-50 p-6 sm:p-8">
                <h2 className="text-xs font-black uppercase tracking-widest text-black border-b border-neutral-200 pb-4">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-neutral-600">
                    <span>Subtotal</span>
                    <span className="text-black font-semibold">{format_currency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-neutral-600">
                    <span>Shipping</span>
                    <span className="text-neutral-400 text-[10px]">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-neutral-600">
                    <span>Taxes</span>
                    <span className="text-neutral-400 text-[10px]">Calculated at checkout</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-neutral-200 pt-4 flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-widest text-black">
                    Estimated Total
                  </span>
                  <span className="text-base font-extrabold text-black">
                    {format_currency(subtotal)}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isCreatingCheckout}
                    className="w-full bg-black py-4 px-6 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreatingCheckout ? (
                      <span>Preparing Order...</span>
                    ) : (
                      <>
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-all animate-caret-blink duration-100 ease-in-out" />
                      </>
                    )}
                  </button>

                  <Link href="/collections">
                    <div className="group w-full cursor-pointer">
                      <div className="py-3 w-full relative flex items-center justify-center border border-black overflow-hidden">
                        <div className="w-0 h-full absolute bg-black transition-all duration-100 slide-in-from-left-0 left-0 group-hover:w-full" />
                        <p className="uppercase font-semibold text-black group-hover:text-white transition-colors duration-200 relative text-xs font-archivo z-10">
                          Continue Shopping
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-neutral-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-neutral-700" />
                  <span>Complimentary Shipping & Express Concierge</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-Component: Cart Item Row
// ---------------------------------------------------------------------------
type CartItemRowProps = {
  item: CartItem;
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

function CartItemRow({ item, removeItem, updateQuantity, updateSize, setAlert }: CartItemRowProps) {
  const lineTotal = item.price * item.quantity;
  const [isSizePickerOpen, setIsSizePickerOpen] = useState(false);

  const { data: clothingData, isLoading } = usePublicProductQuery(item.slug);

  const availableVariantsForColor =
    clothingData?.variants.filter((variant) => variant.colorId === item.colorId) || [];

  function handleSizeChange(newSize: string, newSizeId: string) {
    const targetVariant = availableVariantsForColor.find((v) => v.sizeId === newSizeId);
    updateSize(
      item.cartItemId,
      newSize,
      newSizeId,
      targetVariant?.availableQuantity || 1,
      targetVariant?.id || '1'
    );
    setIsSizePickerOpen(false);
  }

  function handleUpdateQuantity(newQuantity: number) {
    const variant = availableVariantsForColor.find((v) => v.sizeId === item.sizeId);
    if (variant && newQuantity > variant.availableQuantity) {
      setAlert({
        message: `Only ${variant.availableQuantity} units available for this size.`,
      });
      return;
    }

    const nextQty = Math.max(1, newQuantity);
    updateQuantity(item.cartItemId, nextQty, variant?.availableQuantity || 1);
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center border border-neutral-100 bg-neutral-50">
        <span className="text-xs uppercase tracking-widest text-neutral-400">Loading item...</span>
      </div>
    );
  }

  return (
    <div className="  bg-white p-4 sm:p-5 transition-all hover:border-black font-archivo">
      <div className="flex gap-4 sm:gap-6">
        {/* Product Image */}
        <div className="relative h-28 w-20 sm:h-32 sm:w-24 shrink-0 overflow-hidden bg-neutral-100">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              loading="eager"
              sizes="96px"
              className="object-cover object-bottom"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[9px] uppercase text-neutral-400">
              No Image
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <Link href={`/collections/${item.slug}`} className="group">
                <h3 className="text-xs sm:text-sm font-semibold uppercase  tracking-tight text-neutral-900 group-hover:underline">
                  {item.title}
                </h3>
              </Link>
              <span className="text-xs font-bold text-black sm:text-sm">
                {format_currency(lineTotal)}
              </span>
            </div>

            {/* Variant Identifiers & Size Picker Toggle */}
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500 uppercase">
              <span>{item.color}</span>
              <span>/</span>
              <span className="font-semibold text-black">{item.size}</span>
              <button
                type="button"
                onClick={() => setIsSizePickerOpen(!isSizePickerOpen)}
                className="ml-2 text-[10px] font-bold text-black underline tracking-wider hover:opacity-60"
              >
                {isSizePickerOpen ? 'Close' : 'Change Size'}
              </button>
            </div>

            {/* Expandable Size Selector Grid */}
            <AnimatePresence>
              {isSizePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Select New Size:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {availableVariantsForColor.map((variant: any) => {
                      const outOfStock = variant.availableQuantity <= 0 || !variant.active;
                      const isSelected = variant.sizeId === item.sizeId;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => handleSizeChange(variant.size, variant.sizeId)}
                          className={`h-7 px-2.5 text-[10px] font-mono border transition-all ${
                            isSelected
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-neutral-200 hover:border-black'
                          } ${outOfStock ? 'opacity-30 line-through cursor-not-allowed' : ''}`}
                        >
                          {variant.size}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quantity Controls & Remove Action */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="inline-flex items-center border border-neutral-200">
              <button
                type="button"
                onClick={() => handleUpdateQuantity(item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="flex h-7 w-7 items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="flex h-7 px-3 items-center justify-center text-xs font-mono font-bold text-black border-x border-neutral-200">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleUpdateQuantity(item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center text-neutral-600 hover:bg-neutral-100"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.cartItemId)}
              className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-red-600 transition-colors underline"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
