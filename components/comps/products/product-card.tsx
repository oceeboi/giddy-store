'use client';
import { Drawer } from '@/components/shared/drawer';
import { STORE_DETAILS } from '@/constants/store-details';
import { ClothingProductData, ProductMedia, ProductVariant } from '@/types/shared/product';
import { format_currency } from '@/utils/format';
import { Eye, Heart, PlusIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from '@/components/ui/toast';

type ProductCardProps = {
  data?: ClothingProductData;
  onAddToCart?: (payload: { productId: string; sizeId?: string; size: string }) => void;
  onToggleWishlist?: (productId: string) => void;
  isWishlisted?: boolean;
};

export function ProductCard({
  data,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}: ProductCardProps) {
  const [isPlusClicked, setIsPlusClicked] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const productName = (data?.name ?? 'Giddy Shadow Stripe Jersey Black').toUpperCase();
  const productCategory = (data?.category?.name ?? data?.productType ?? 'Outerwear').toUpperCase();
  const primaryColorId = data?.colors?.[0]?.id;
  const colorName = (data?.colors?.[0]?.name ?? 'black').toUpperCase();

  // Sizes scoped to the card's primary/displayed color, deduped by sizeId,
  // in variant order (which should already reflect size-order from the API).
  const sizeOptions = useMemo(() => {
    const variants = data?.variants ?? [];
    const scoped = primaryColorId ? variants.filter((v) => v.colorId === primaryColorId) : variants;
    const seen = new Set<string>();
    return scoped.filter((v) => {
      if (seen.has(v.sizeId ?? v.id)) return false;
      seen.add(v.sizeId ?? v.id);
      return true;
    });
  }, [data?.variants, primaryColorId]);

  const selectedVariant = sizeOptions.find((v) => v.sizeId === selectedSizeId);
  const fallbackVariant =
    sizeOptions.find((v) => v.availableQuantity > 0 && v.active) ?? sizeOptions[0];

  const isSoldOut =
    Boolean(data?.variants?.length) &&
    sizeOptions.every((v) => v.availableQuantity <= 0 || !v.active);
  const isNew = Boolean(data?.tags?.some((tag) => tag.toLowerCase() === 'new'));
  const basePrice = data?.pricing?.basePrice ?? 5000000;
  const compareAtPrice = data?.pricing?.compareAtPrice;
  const hasDiscount = typeof compareAtPrice === 'number' && compareAtPrice > basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice! - basePrice) / compareAtPrice!) * 100)
    : null;

  const targetUrl = data?.slug
    ? `/collections/${data.slug}`
    : data?.id
      ? `/collections/${data.id}`
      : '/collections/all';

  function commitAddToCart(variant?: ProductVariant) {
    const variantToUse = variant ?? selectedVariant ?? fallbackVariant;
    if (!onAddToCart || !variantToUse || !data?.id || isAdding) return;

    setIsAdding(true);
    onAddToCart({
      productId: data.id,
      sizeId: variantToUse.sizeId,
      size: variantToUse.size,
    });
    toast.add({
      type: 'success',
      description: `Added ${productName} (${variantToUse.size}) to cart`,
    });
    setIsAdding(false);
    setIsPlusClicked(false);
  }

  function handleSizeTap(variant: ProductVariant) {
    if (variant.availableQuantity <= 0 || !variant.active) return;
    setSelectedSizeId(variant.sizeId);
  }

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!data?.id) return;
    onToggleWishlist?.(data.id);
  }

  const sampleImages: ProductMedia[] = [
    {
      url: 'https://sfycdn.speedsize.com/f872e742-7b4a-4913-b7dc-4d0ce34f2142/ash-luxe.com/cdn/shop/files/Ashluxe_Shadow_Stripe_Jersey_Black.png?v=1786101587&width=1200',
      alt: 'Model wearing front view of outfit',
      type: 'image',
      order: 0,
      colorId: '1',
    },
    {
      url: 'https://sfycdn.speedsize.com/f872e742-7b4a-4913-b7dc-4d0ce34f2142/ash-luxe.com/cdn/shop/files/Ashluxe_Celebration_Bowling_Shirt_Off-white.png?v=1786101761&width=1200',
      alt: 'Model wearing side view of outfit',
      type: 'image',
      order: 1,
      colorId: '1',
    },
  ];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-none bg-transparent text-black transition-all duration-200 ease-in-out hover:border-neutral-400">
      <div className="relative aspect-square w-full overflow-hidden bg-[#f7f7f7]">
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {isSoldOut ? (
            <span className="font-archivo bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-black">
              Sold Out
            </span>
          ) : (
            <>
              {discountPercent ? (
                <span className="font-archivo bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-black">
                  -{discountPercent}%
                </span>
              ) : null}
              {isNew ? (
                <span className="font-archivo bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-black">
                  New
                </span>
              ) : null}
            </>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <Link href={targetUrl} className="flex-1 flex w-full h-full">
            <div className="relative h-full w-full">
              <ImageHoverBoard image={data?.media ?? sampleImages} colorId={primaryColorId} />
            </div>
          </Link>
        </div>

        {/* Mobile quick-add trigger */}
        <div className="absolute right-3 bottom-3 lg:hidden z-10">
          <Drawer open={isPlusClicked} onOpenChange={setIsPlusClicked}>
            <Drawer.Trigger asChild>
              <button
                type="button"
                disabled={isSoldOut}
                onClick={() => setIsPlusClicked(true)}
                className="flex h-8 w-8 items-center justify-center bg-transparent text-black transition hover:bg-white/0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Add to cart</span>
                <PlusIcon className="h-5 w-5" />
              </button>
            </Drawer.Trigger>
            <Drawer.Content
              disableDrag
              disableEscapeClose
              showHandle={false}
              hideCloseButton
              side="bottom"
              size="sm"
              className="h-1/2 w-full bg-white lg:hidden"
            >
              <div className="flex h-full flex-col justify-between p-4 pt-6">
                <div>
                  <h3 className="text-[#232221] text-base font-archivo uppercase tracking-wider mb-6">
                    Select size
                  </h3>
                  <div className="grid grid-cols-4 p-[0.5px] gap-[0.5px] mb-6">
                    {sizeOptions.length === 0 ? (
                      <p className="col-span-4 text-xs text-neutral-500 font-archivo">
                        No sizes available
                      </p>
                    ) : (
                      sizeOptions.map((variant) => {
                        const outOfStock = variant.availableQuantity <= 0 || !variant.active;
                        const isSelected = selectedSizeId === variant.sizeId;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={outOfStock}
                            onClick={() => handleSizeTap(variant)}
                            aria-pressed={isSelected}
                            className={`border-[0.2px] border-black py-4.5 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-black text-white'
                                : 'bg-white hover:bg-black hover:text-white'
                            } ${outOfStock ? 'opacity-40 cursor-not-allowed line-through' : 'cursor-pointer'}`}
                          >
                            <p className="text-sm font-archivo">{variant.size}</p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!selectedVariant || isAdding}
                  onClick={() => commitAddToCart(selectedVariant)}
                  className="py-4.5 px-4 w-full bg-black text-white text-sm font-archivo uppercase tracking-wider transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedVariant ? 'Add to Cart' : 'Select a size'}
                </button>
              </div>
            </Drawer.Content>
          </Drawer>
        </div>

        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0">
          <button
            type="button"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isWishlisted}
            onClick={handleWishlistClick}
            className={`flex h-8 w-8 items-center justify-center rounded-full border bg-white/90 backdrop-blur-md shadow-xs transition-transform active:scale-90 ${
              isWishlisted
                ? 'border-rose-200 text-rose-600'
                : 'border-zinc-200/80 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
          </button>

          <Link
            href={targetUrl}
            aria-label="Quick view product details"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 backdrop-blur-md text-zinc-600 shadow-xs transition-transform hover:text-zinc-900 active:scale-90"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Desktop hover quick-add — tap a size to add immediately */}
        {!isSoldOut && sizeOptions.length > 0 && (
          <div className="absolute hidden lg:block inset-x-0 bottom-10 z-20 bg-transparent px-3 py-2.5 transition-all duration-300 ease-out translate-y-full opacity-0 pointer-events-none sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto">
            <div className="grid grid-cols-5 p-[0.5px] gap-[0.5px]">
              {sizeOptions.map((variant) => {
                const outOfStock = variant.availableQuantity <= 0 || !variant.active;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={outOfStock || isAdding}
                    onClick={() => commitAddToCart(variant)}
                    aria-label={`Add size ${variant.size} to cart`}
                    className={`bg-white hover:bg-black border-[0.2px] hover:text-white p-2 flex items-center justify-center transition-colors duration-150 ${
                      outOfStock ? 'opacity-40 cursor-not-allowed line-through' : 'cursor-pointer'
                    }`}
                  >
                    <p className="text-[10px] font-archivo">{variant.size}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Link href={targetUrl}>
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-2 p-4 pb-0 md:pb-0 md:p-5">
            <p className="text-[10px] hidden font-archivo uppercase tracking-widest text-neutral-600">
              {productCategory}
            </p>
            <h3 className="font-archivo text-xs lg:text-sm uppercase tracking-widest text-black">
              {productName}
            </h3>
            <p className="text-[11px] font-ibm-plex-mono uppercase tracking-wider text-[#ada5a5]">
              {colorName}
            </p>
          </div>

          <div className="border-neutral-300 p-4 pt-2 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              {hasDiscount ? (
                <span className="text-[11px] font-archivo font-semibold uppercase tracking-wider text-neutral-600 line-through">
                  {format_currency(compareAtPrice!)}
                </span>
              ) : null}
              <span className="font-archivo font-bold text-xs uppercase tracking-wider text-black md:text-base">
                {format_currency(basePrice)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function ImageHoverBoard({ image, colorId }: { image: ProductMedia[]; colorId?: string }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!image || image.length === 0) {
    return (
      <div className="relative w-full h-full">
        <Image
          src="/sample/sample_jg.avif"
          alt={`${STORE_DETAILS.name}-image`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
    );
  }

  // Scope to the card's displayed color first; if that color has no
  // dedicated shots, fall back to the full set rather than showing nothing.
  const scoped = colorId ? image.filter((img) => img.colorId === colorId) : image;
  const pool = scoped.length > 0 ? scoped : image;

  const sorted = [...pool].sort((a, b) => a.order - b.order);
  const primaryImage = sorted[0];
  const secondaryImage = sorted[1];
  const hasSecondary = !!secondaryImage && secondaryImage !== primaryImage;

  return (
    <div
      className="relative w-full h-full overflow-hidden group/image"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={primaryImage?.url ?? '/sample/sample_jg.avif'}
        alt={primaryImage?.alt ?? 'Product Image'}
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`object-cover object-center transition-all duration-500 ease-out group-hover/image:scale-105 ${
          isHovered && hasSecondary ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {hasSecondary && (
        <Image
          src={secondaryImage.url}
          alt={secondaryImage.alt ?? 'Product Image Hover'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`absolute inset-0 object-cover object-center transition-all duration-500 ease-out group-hover/image:scale-105 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
