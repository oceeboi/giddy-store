'use client';
import { Drawer } from '@/components/shared/drawer';
import { STORE_DETAILS } from '@/constants/store-details';
import { ClothingProductData, ProductMedia } from '@/types/shared/product';
import { format_currency } from '@/utils/format';
import { Eye, Heart, PlusIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type ProductCardProps = {
  data?: ClothingProductData;
  onAddToCart?: (payload: { productId: string; sizeId?: string; size: string }) => void;
};

export function ProductCard({ data, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPlusClicked, setIsPlusClicked] = useState<boolean>(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const productName = (data?.name ?? 'Monolith Hooded Overcoat').toUpperCase();
  const productCategory = (data?.category?.name ?? data?.productType ?? 'Outerwear').toUpperCase();
  const colorName = (data?.colors?.[0]?.name ?? 'black').toUpperCase();

  const primaryVariant =
    data?.variants.find((variant) => variant.availableQuantity > 0 && variant.active) ??
    data?.variants[0];

  //const isSoldOut = Boolean(data?.variants.length) && !primaryVariant;
  //  const isNew = Boolean(data?.tags.some((tag) => tag.toLowerCase() === 'new'));

  function is_plus_clicked() {
    setIsPlusClicked(true);
  }
  const isSoldOut = false; // Placeholder for now
  const isNew = true; // Placeholder for now
  const basePrice = data?.pricing.basePrice ?? 5000000;
  const compareAtPrice = data?.pricing.compareAtPrice;
  //   const hasDiscount = typeof compareAtPrice === 'number' && compareAtPrice > basePrice;
  const hasDiscount = false; // Placeholder for now
  //   const discountPercent = hasDiscount
  //     ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
  //     : null;
  const discountPercent = 0; // Placeholder for now

  const targetUrl = '/shop/222';
  function handleAddToCart() {
    if (!onAddToCart || !primaryVariant || !data?.id) {
      return;
    }

    onAddToCart({
      productId: data.id,
      sizeId: primaryVariant.sizeId,
      size: primaryVariant.size,
    });
  }

  //   const sampleImages: ProductMedia[] = [];
  const sampleImages = [
    {
      url: 'https://sfycdn.speedsize.com/f872e742-7b4a-4913-b7dc-4d0ce34f2142/ash-luxe.com/cdn/shop/files/Ashluxe_Shadow_Stripe_Jersey_Black.png?v=1786101587&width=1200',
      alt: 'Model wearing front view of outfit',
      type: 'image',
      order: 1,
      colorId: 'black_01',
    },
    {
      url: 'https://sfycdn.speedsize.com/f872e742-7b4a-4913-b7dc-4d0ce34f2142/ash-luxe.com/cdn/shop/files/Ashluxe_Celebration_Bowling_Shirt_Off-white.png?v=1786101761&width=1200',
      alt: 'Model wearing side/back view of outfit',
      type: 'image',
      order: 0,
      colorId: 'black_01',
    },
  ];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-none   bg-transparent text-black transition-all duration-200 ease-in-out hover:border-neutral-400">
      <div className="relative aspect-square w-full overflow-hidden   bg-[#f7f7f7]">
        {/* <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-size-[18px_18px]" /> */}

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
              {/* <Image
              src={data?.media?.[0]?.url ?? '/sample/sample_jg.avif'}
              alt={data?.media?.[0]?.alt ?? 'Product Image'}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            /> */}
              <ImageHoverBoard image={data?.media ?? sampleImages} />
              <div className="flex-1 bg-[#f7f7f7] hidden w-full h-full" />
            </div>
          </Link>
        </div>

        <div className="absolute right-3 bottom-3 lg:hidden z-10">
          <Drawer open={isPlusClicked} onOpenChange={setIsPlusClicked}>
            <Drawer.Trigger asChild>
              <button
                type="button"
                onClick={() => setIsPlusClicked(true)}
                className="flex h-8 w-8 items-center justify-center bg-transparent text-black transition hover:bg-white/0"
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
                  <div className="grid grid-cols-4  p-[0.5px] gap-[0.5px] mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white border-[0.2px] border-black hover:bg-black hover:text-white py-4.5 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-archivo">XS</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  disabled
                  className="py-4.5 cursor-not-allowed opacity-50 px-4 w-full bg-black text-white text-sm font-archivo uppercase tracking-wider transition hover:bg-black/90"
                >
                  Add to Cart
                </button>
              </div>
            </Drawer.Content>
          </Drawer>
        </div>
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0">
          <button
            type="button"
            aria-label="Add to wishlist"
            className={`flex h-8 w-8 items-center justify-center rounded-full border bg-white/90 backdrop-blur-md shadow-xs transition-transform active:scale-90 ${
              true
                ? 'border-rose-200 text-rose-600'
                : 'border-zinc-200/80 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${true ? 'fill-rose-600' : ''}`} />
          </button>

          <Link
            href={targetUrl}
            aria-label="Quick view product details"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 backdrop-blur-md text-zinc-600 shadow-xs transition-transform hover:text-zinc-900 active:scale-90"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div
          className={`absolute hidden lg:block inset-x-0 bottom-10 z-20 bg-transparent px-3 py-2.5 transition-all duration-300 ease-out
    ${quickAddOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
    sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto`}
        >
          <div className="grid grid-cols-5  p-[0.5px] gap-[0.5px]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="bg-white hover:bg-black border-[0.2px] hover:text-white p-2 flex items-center justify-center transition-colors duration-150"
              >
                <p className="text-[10px] font-archivo">XS</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link href={targetUrl}>
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-2 p-4 pb-0 md:pb-0 md:p-5">
            <p className="text-[10px] hidden font-archivo uppercase tracking-widest text-neutral-600">
              {productCategory}
            </p>
            <h3 className="font-archivo text-xs lg:text-sm uppercase tracking-widest text-black ">
              {productName}
            </h3>
            <p className="text-[11px] font-ibm-plex-mono uppercase tracking-wider text-[#ada5a5]">
              {colorName}
            </p>
          </div>

          <div className=" border-neutral-300 p-4 pt-2 md:p-5">
            <div className="mb-4 flex  items-center gap-2">
              {hasDiscount ? (
                <span className="text-[11px] font-archivo font-semibold uppercase tracking-wider text-neutral-600 line-through">
                  {format_currency(compareAtPrice || 6895000)}
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

function ImageHoverBoard({ image }: { image: ProductMedia[] }) {
  const [isHovered, setIsHovered] = useState(false);

  // Fallback if array is empty or undefined
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

  // Find images explicitly by their `order` property
  const primaryImage = image.find((img) => img.order === 0) || image[0];
  const secondaryImage = image.find((img) => img.order === 1) || image[1];
  const hasSecondary = !!secondaryImage && secondaryImage !== primaryImage;

  return (
    <div
      className="relative w-full h-full overflow-hidden group/image"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Primary Image (order: 0) */}
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

      {/* Secondary Image (order: 1) */}
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
