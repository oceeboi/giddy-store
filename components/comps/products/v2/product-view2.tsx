'use client';

import { usePublicProductQuery } from '@/hooks/use-product.hook';
import { ProductImage } from './product-image';
import { Accordion } from '@/components/shared/accordion';
import { format_currency, format_date } from '@/utils/format';
import { Heart, Minus, Plus } from 'lucide-react';
import { ProductSizeSelector } from '@/components/comps/products/product-size';
import z from 'zod';
import { useCart } from '@/store/cart.hook';
import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductColorSelector } from './product-color';
import { useWishlist } from '@/store/wishlist.hook';
import { cn } from '@/lib/utils';
import { StickyAddToCartWrapper } from './sticky-add-to-cart-wrapper';

type ProductViewProps = {
  product_slug: string;
};

const productCatalogSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  colorId: z.string().min(1, 'Color selection is required'),
  sizeId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});

export type ProductCatalogFormValues = z.input<typeof productCatalogSchema>;

export function ProductViewV2({ product_slug }: ProductViewProps) {
  const mainAddToCartRef = useRef<HTMLButtonElement>(null);
  const { data: clothingData, isLoading, isError } = usePublicProductQuery(product_slug);
  const { addItem } = useCart();

  const { isWishlisted, toggleItem, getWishlistKey } = useWishlist();

  const { control, handleSubmit, setValue, getValues } = useForm<ProductCatalogFormValues>({
    resolver: zodResolver(productCatalogSchema),
    defaultValues: {
      id: '',
      colorId: '',
      sizeId: '',
      quantity: 1,
    },
  });

  const selectedColorId = useWatch({ control, name: 'colorId' });
  const selectedSizeId = useWatch({ control, name: 'sizeId' });
  const selectedQuantity = useWatch({ control, name: 'quantity' }) ?? 1;

  // 1. Sync default values once clothingData loads
  useEffect(() => {
    if (clothingData) {
      setValue('id', clothingData.id);

      const defaultColor = clothingData.colors?.[0]?.id ?? '';
      setValue('colorId', defaultColor);

      const firstAvailableVariant = clothingData.variants?.find(
        (v) => v.colorId === defaultColor && v.active !== false && (v.availableQuantity ?? 0) > 0
      );

      const fallbackVariant = clothingData.variants?.find((v) => v.colorId === defaultColor);

      setValue('sizeId', firstAvailableVariant?.sizeId ?? fallbackVariant?.sizeId ?? '');
    }
  }, [clothingData, setValue]);

  // 2. Fallback size selection when color changes
  useEffect(() => {
    if (!clothingData || !selectedColorId) return;

    const variantsForColor = clothingData.variants?.filter((v) => v.colorId === selectedColorId);
    const isValid = variantsForColor?.some(
      (v) => v.sizeId === selectedSizeId && v.active !== false && (v.availableQuantity ?? 0) > 0
    );

    if (!isValid) {
      const firstAvailable = variantsForColor?.find(
        (v) => v.active !== false && (v.availableQuantity ?? 0) > 0
      );
      setValue('sizeId', firstAvailable?.sizeId ?? variantsForColor?.[0]?.sizeId ?? '', {
        shouldValidate: true,
      });
    }
  }, [selectedColorId, clothingData, selectedSizeId, setValue]);

  // Derive active variant, stock, color object, image, and dynamic pricing
  const activeVariant = useMemo(() => {
    return clothingData?.variants?.find(
      (v) => v.colorId === selectedColorId && v.sizeId === selectedSizeId
    );
  }, [clothingData, selectedColorId, selectedSizeId]);

  const selectedColorObj = useMemo(() => {
    return clothingData?.colors?.find((c) => c.id === selectedColorId);
  }, [clothingData, selectedColorId]);

  const isOutOfStock = useMemo(() => {
    if (!activeVariant) return true;
    return activeVariant.availableQuantity <= 0 || activeVariant.active === false;
  }, [activeVariant]);

  const currentPrice = activeVariant?.priceOverride ?? clothingData?.pricing?.basePrice ?? 0;
  const originalPrice = clothingData?.pricing?.compareAtPrice;

  const itemImage = useMemo(() => {
    if (!clothingData) return '';
    return (
      clothingData.media?.find((m) => m.colorId === selectedColorId)?.url ??
      clothingData.media?.[0]?.url ??
      ''
    );
  }, [clothingData, selectedColorId]);

  const isCurrentWishlisted = isWishlisted(clothingData?.id ?? '');

  function handleAddToWishlist() {
    if (!clothingData || !activeVariant) return;

    const wishlistKey = getWishlistKey(clothingData.id);

    toggleItem({
      whishlist: wishlistKey,
      productId: clothingData.id,

      title: clothingData.name,
      price: currentPrice,
      image: itemImage,
      slug: clothingData.slug,
    });
  }

  // Add to Cart handler
  function handleAddToCart(data: ProductCatalogFormValues) {
    if (!clothingData || !activeVariant || isOutOfStock) return;

    addItem(
      {
        productId: clothingData.id,
        variantId: activeVariant.id,
        size: activeVariant.size,
        sizeId: activeVariant.sizeId,
        color: selectedColorObj?.name ?? 'Standard',
        sku: activeVariant.sku ?? `${clothingData.id}-${data.colorId}-${data.sizeId}`,
        quantity: Number(data.quantity) || 1,
        title: clothingData.name,
        price: currentPrice,
        image: itemImage,
        slug: clothingData.slug,
        colorId: selectedColorObj?.id ?? '',
      },
      activeVariant.availableQuantity
    );
  }

  // Buy Now handler
  const handleBuyNow = handleSubmit((data) => {
    handleAddToCart(data);
  });

  function handleQuantityChange(delta: number) {
    const nextQty = Math.max(1, selectedQuantity + delta);
    if (activeVariant?.availableQuantity && nextQty > activeVariant.availableQuantity) return;
    setValue('quantity', nextQty, { shouldValidate: true });
  }

  if (isLoading) return <ProductHeaderSkeleton />;
  if (isError || !clothingData) return null;

  return (
    <section className="w-full bg-white font-archivo">
      <section className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery Section */}
          <div>
            <ProductImage image_data={clothingData.media ?? []} selectedColorId={selectedColorId} />
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col gap-4 px-4 py-8">
            <div>
              <h3 className="font-archivo text-[18px] font-bold uppercase text-[#111111]">
                {clothingData.name}
              </h3>
            </div>

            <div className="flex items-end gap-2">
              <p className="font-archivo text-base font-normal text-[#111111]">
                {format_currency(currentPrice)}
              </p>
              {originalPrice && originalPrice > currentPrice && (
                <span className="text-sm text-zinc-400 line-through">
                  {format_currency(originalPrice)}
                </span>
              )}
            </div>

            <div>
              <p className="font-archivo text-xs text-[#767676]">
                Taxes included. Shipping calculated at checkout.
              </p>
            </div>

            <div>
              <form onSubmit={handleSubmit(handleAddToCart)} className="space-y-4">
                {/* Color Selector */}
                <ProductColorSelector
                  control={control}
                  name="colorId"
                  colors={clothingData?.colors ?? []}
                />

                {/* Size Selector */}
                <ProductSizeSelector
                  control={control}
                  name="sizeId"
                  variants={clothingData.variants ?? []}
                  label="Size"
                  selectedColorId={selectedColorId}
                />

                {/* Quantity & Add to Cart Controls */}
                <div className="flex gap-4">
                  <div className="inline-flex h-11 w-36 items-center rounded-none border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <button
                      type="button"
                      disabled={isOutOfStock || selectedQuantity <= 1}
                      onClick={() => handleQuantityChange(-1)}
                      className="flex h-full w-10 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-900"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex h-full flex-1 items-center justify-center border-neutral-200 font-mono text-sm font-bold text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
                      {selectedQuantity}
                    </span>
                    <button
                      type="button"
                      disabled={
                        isOutOfStock ||
                        (activeVariant?.availableQuantity !== undefined &&
                          selectedQuantity >= activeVariant.availableQuantity)
                      }
                      onClick={() => handleQuantityChange(1)}
                      className="flex h-full w-10 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-900"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Connected mainAddToCartRef for IntersectionObserver */}
                  <button
                    ref={mainAddToCartRef}
                    type="submit"
                    disabled={isOutOfStock}
                    className="w-full rounded-none bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-800"
                  >
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>

                {/* Buy Now Action */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-none border border-black py-3 disabled:cursor-not-allowed disabled:border-neutral-300"
                >
                  <p className="relative z-10 text-xs uppercase text-black transition-colors duration-150 group-hover:text-white">
                    Buy now
                  </p>
                  <div className="absolute left-0 h-full w-0 bg-black transition-all duration-150 ease-in-out group-hover:w-full" />
                </button>
              </form>
            </div>

            {/* Wishlist Button */}
            <div className="flex items-center gap-2 py-2">
              <button
                onClick={handleAddToWishlist}
                type="button"
                className={cn(
                  'flex items-center justify-center transition-colors',
                  isCurrentWishlisted && 'text-red-500'
                )}
              >
                <Heart
                  className={cn('h-4 w-4', isCurrentWishlisted ? 'fill-current text-red-500' : '')}
                />
              </button>
              <p className="text-[11px] uppercase text-[#111111]">Save</p>
            </div>

            {/* Specifications & Accordions */}
            <section className="border-t pt-4">
              <div>
                <FormattedText text={clothingData.description?.narrative} />
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold">Features</h3>
                <div className="mb-4 mt-4 flex flex-col items-start gap-2 text-xs uppercase">
                  {clothingData.description?.styleCode && (
                    <span>Style Code: {clothingData.description.styleCode}</span>
                  )}
                  {clothingData.description?.releaseDate && (
                    <span>Release Date: {format_date(clothingData.description.releaseDate)}</span>
                  )}
                  {selectedColorObj?.name && <span>Colorway: {selectedColorObj.name}</span>}
                  {clothingData.description?.fabricComposition && (
                    <span>Materials: {clothingData.description.fabricComposition}</span>
                  )}

                  {clothingData.features && clothingData.features.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {clothingData.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-1.5 lg:gap-3">
                          <span className="font-archivo font-normal tracking-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                {clothingData.description?.editorialHighlights && (
                  <Accordion>
                    <Accordion.Item value="details">
                      <Accordion.Trigger openIcon={<CloseIcon />} closeIcon={<PlusIcon />}>
                        <div className="text-xs uppercase text-black">Details & highlights</div>
                      </Accordion.Trigger>
                      <Accordion.Content>
                        <ul className="space-y-1.5 text-[13px] text-[#444]">
                          {clothingData.description.editorialHighlights.map((feature, index) => (
                            <li key={index} className="flex items-center gap-1.5 lg:gap-3">
                              <span className="font-archivo font-normal tracking-tight">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion>
                )}

                {clothingData.description?.additionalSections && (
                  <Accordion>
                    <Accordion.Item className="border-none" value="additional">
                      <Accordion.Trigger openIcon={<CloseIcon />} closeIcon={<PlusIcon />}>
                        <div className="text-xs uppercase text-black">Additional Information</div>
                      </Accordion.Trigger>
                      <Accordion.Content>
                        <div className="flex flex-col gap-3">
                          {clothingData.description.additionalSections.map((a, index) => (
                            <div className="flex flex-col gap-1" key={index}>
                              <h3 className="text-xs font-medium text-black">{a.title}</h3>
                              <p className="font-archivo text-[11px] font-normal text-[#444]">
                                {a.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion>
                )}

                <Accordion>
                  <Accordion.Item className="border-none" value="shipping">
                    <Accordion.Trigger openIcon={<CloseIcon />} closeIcon={<PlusIcon />}>
                      <div className="text-xs uppercase text-black">Shipping & returns</div>
                    </Accordion.Trigger>
                    <Accordion.Content>
                      <div className="font-archivo text-[13px] font-light text-[#444]">
                        Standard shipping delivers within
                        <strong className="ml-1 font-semibold">3–5 business days</strong>. Express
                        options available at checkout. Orders are dispatched within one to two
                        business days.
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion>
              </div>
            </section>
          </div>
        </section>
      </section>
      <section>
        <div>Similar Product</div>
        <div>Recently viewed Product</div>
      </section>
      {/* Sticky Bottom Bar with IntersectionObserver */}
      <StickyAddToCartWrapper
        mainButtonRef={mainAddToCartRef}
        title={clothingData.name}
        price={currentPrice}
        image={itemImage}
        selectedColorName={selectedColorObj?.name}
        selectedSizeName={activeVariant?.size}
        isOutOfStock={isOutOfStock}
        isWishlisted={isCurrentWishlisted}
        onToggleWishlist={handleAddToWishlist}
        max_quantiy={activeVariant?.availableQuantity!}
        onAddToCart={(quantity) => {
          handleAddToCart({ ...getValues(), quantity });
        }}
      />
    </section>
  );
}

function FormattedText({ text }: { text?: string }) {
  if (!text) return null;

  const parts = text.split(/"([^"]+)"/g);

  return (
    <p className="font-archivo text-sm">
      {parts.map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part))}
    </p>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductHeaderSkeleton() {
  return (
    <div className="mb-6 h-16 w-full animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-100 p-4" />
  );
}
