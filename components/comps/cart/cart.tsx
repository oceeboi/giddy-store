'use client';
import { Sheet } from '@/components/shared/sheet';
import { format_currency } from '@/utils/format';
import { Minus, Plus, ShoppingCartIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Dispatch, SetStateAction, useState } from 'react';
import { useCart } from '@/store/cart.hook';
import { CartItem } from '@/types/cart.type';
import Image from 'next/image';
import { usePublicProductQuery } from '@/hooks/use-product.hook';
import { AnimatePresence, motion } from 'framer-motion';
export function CartComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [alert, setAlert] = useState<{ message: string } | null>(null);
  const {
    addItem,
    removeItem,
    updateQuantity,
    updateSize,
    items,
    totalItems: itemCartCount,
    rawSubtotal: subtotal,
  } = useCart();
  // Function to handle closing the alert after a certain time
  const handleAlertClose = () => {
    setTimeout(() => {
      setAlert(null);
    }, 2000); // Close after 2 seconds
  };

  // Call the alert close function whenever an alert is set
  if (alert) {
    handleAlertClose();
  }

  function Checkout() {
    // Implement checkout logic here
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Sheet.Trigger asChild>
        <button
          type="button"
          aria-label={itemCartCount > 0 ? `Cart, ${itemCartCount} items` : 'Cart'}
          className="relative inline-flex size-9 items-center justify-center border border-neutral-900 bg-black text-white transition-all duration-200 ease-in-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
        >
          <ShoppingCartIcon className="size-4" />
          {itemCartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center border border-neutral-900 bg-white px-1 text-[9px] font-black leading-none text-black"
            >
              {itemCartCount > 99 ? '99+' : itemCartCount}
            </span>
          )}
        </button>
      </Sheet.Trigger>

      <Sheet.Content
        side="right"
        size="md"
        className="h-full w-full font-archivo border-l border-neutral-900 bg-white text-black shadow-none"
      >
        <Sheet.Header className="border-b border-neutral-900 px-6 pb-4 pt-6">
          <Sheet.Title className="font-archivo text-lg text-black! font-black uppercase tracking-widest">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-black uppercase tracking-widest text-black">Your Cart</h1>
              <span className="text-[10px] uppercase tracking-widest text-neutral-950">
                {itemCartCount} item{itemCartCount !== 1 ? 's' : ''}
              </span>
            </div>
          </Sheet.Title>
        </Sheet.Header>
        <AnimatePresence mode="wait">
          {alert && (
            <motion.div
              className="bg-red-100 border border-red-400 text-red-900 px-4 py-3 rounded-none relative m-4"
              role="alert"

              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <span className="block sm:inline text-[11px]">{alert.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="flex flex-1 flex-col overflow-y-auto  px-6 py-6"
          style={{ scrollbarWidth: 'thin' }}
        >
          {items.length > 0 ? (
            <div className="flex flex-col gap-4">
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
            <div className="border border-neutral-900 bg--950 p-5">
              <p className="text-[10px] uppercase tracking-widest text-neutral-900">Cart Status</p>
              <h3 className="mt-3 font-archivo text-sm font-bold uppercase tracking-wider text-black">
                Your Cart Is Empty
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                Add products to begin checkout. Curated pieces you select will appear here.
              </p>
            </div>
          )}
        </div>

        <Sheet.Footer className="flex-col border-t border-neutral-900 px-6 py-4">
          <div className="mb-4 flex w-full flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
              <span>Subtotal</span>
              <span className="text-black">{format_currency(subtotal!)}</span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3">
            {/* <Link
              href="/cart"
              className="inline-flex w-full items-center justify-center border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-wider text-black transition-all duration-200 ease-in-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
            >
              View Cart
            </Link> */}
            <button
              className="inline-flex w-full items-center justify-center border border-black bg-black px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white transition-all duration-200 ease-in-out hover:text-neutral-400 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
              onClick={Checkout}
            >
              Checkout
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex w-full items-center justify-center border border-black bg-black px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white transition-all duration-200 ease-in-out hover:text-neutral-400 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
            >
              Continue Shopping
            </button>
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
    setIsOpen(false); // Close the size selection dropdown after selection
  }

  function handleUpdateQuantity(newQuantity: number) {
    // check if thee quantity of the perticular item has up to such variant quantity in the stock before updating the quantity in the cart
    const variant = availableVariantsForColor.find((variant) => variant.sizeId === item.sizeId);
    if (variant && newQuantity > variant.availableQuantity) {
      // alert(`Only ${variant.availableQuantity} items available in stock for this size.`);
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
      <div className="flex items-center justify-center p-4">
        <span className="text-sm text-neutral-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="group relative flex w-full flex-col gap-3  bg-white p-4 transition-colors hover:border-black dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-100 font-archivo">
      {/* Top Header: Image, Title, Metadata & Trash Action */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Thumbnail Container */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-none   bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
            {item.image ? (
              <Image src={item.image} alt={item.title} fill className="object-cover" sizes="56px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-archivo text-[10px] uppercase text-neutral-400">
                No Img
              </div>
            )}
          </div>

          {/* Product Title & Identifiers */}
          <div className="flex flex-col gap-1 min-w-0">
            <Link
              href={`/collections/${item.slug}`}
              onClick={() => setOpen(false)}
              className="min-w-0"
            >
              <span className="font-archivo text-sm font-semibold uppercase tracking-tight text-neutral-900 truncate dark:text-neutral-100">
                {item.title}
              </span>
            </Link>
            <div className="font-mono flex  text-xs font-semibold uppercase text-[#ADA5A5] dark:text-neutral-200">
              <span className="text-[#ADA5A5] mr-0.5 font-normal">{item.color}</span> {item.size}{' '}
              <div
                onClick={onToggle}
                className="text-[#0a0908] ml-2 font-archivo font-light underline cursor-pointer"
              >
                Change
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isOpen && (
                <div className="grid grid-cols-5 p-[0.5px] gap-[0.5px]">
                  {availableVariantsForColor.map((variant: any, i: number) => {
                    const outOfStock = variant.availableQuantity <= 0 || !variant.active;
                    return (
                      <motion.button
                        key={variant.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        type="button"
                        disabled={outOfStock}
                        onClick={() => handleSizeChange(variant.size, variant.sizeId)}
                        aria-label={`Add size ${variant.size} to cart`}
                        className={`bg-white hover:bg-black border-[0.2px] text-black  hover:text-white p-2 flex items-center justify-center transition-colors duration-150 ${
                          outOfStock
                            ? 'opacity-40 cursor-not-allowed line-through'
                            : 'cursor-pointer'
                        }`}
                      >
                        <p className="text-[10px] font-archivo">{variant.size}</p>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>

            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              {format_currency(item.price)}
            </span>
          </div>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => removeItem(item.cartItemId)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-transparent text-neutral-400 transition-colors hover:border-neutral-200 hover:bg-neutral-100 hover:text-red-600 dark:hover:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-red-400"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Quantity Controls & Line Total */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-900">
        {/* Counter Button Block */}
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center border border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => handleUpdateQuantity(Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-900"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="flex h-7 min-w-8 items-center justify-center px-2 font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 border-x border-neutral-200 dark:border-neutral-800">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Total Price */}
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-black dark:text-white">
            {format_currency(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
