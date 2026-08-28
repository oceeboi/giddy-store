'use client';

import { JSX, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { ProductCard, ProductImage } from '@/components/comps';
import { ProductColorSelector } from '@/components/comps/products/product-color';
import { ProductSizeSelector } from '@/components/comps/products/product-size';
import { Accordion } from '@/components/shared/accordion';
import { usePublicProductQuery } from '@/hooks/use-product.hook';
import { format_currency } from '@/utils/format';

const productCatalogSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  colorId: z.string().min(1, 'Color selection is required'),
  sizeId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});

export type ProductCatalogFormValues = z.input<typeof productCatalogSchema>;

interface ProductViewProps {
  slug: string;
}

export function ProductView({ slug }: ProductViewProps) {
  const { data: clothingData, isLoading } = usePublicProductQuery(slug);

  const { control, handleSubmit, setValue } = useForm<ProductCatalogFormValues>({
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

  // 1. Sync form values once clothingData is loaded
  useEffect(() => {
    if (clothingData) {
      setValue('id', clothingData.id);

      const defaultColor = clothingData.colors?.[0]?.id ?? '';
      setValue('colorId', defaultColor);

      const availableVariant = clothingData.variants?.find(
        (v) => v.colorId === defaultColor && v.active && v.availableQuantity > 0
      );
      setValue('sizeId', availableVariant?.sizeId ?? clothingData.variants?.[0]?.sizeId ?? '');

      // PLACEHOLDER: Trigger Recently Viewed store handler
      console.log('Record Recently Viewed:', {
        id: clothingData.id,
        slug: clothingData.slug,
        name: clothingData.name,
        price: clothingData.pricing?.basePrice,
        image: clothingData.media?.[0]?.url,
      });
    }
  }, [clothingData, setValue]);

  // 2. Validate and fallback size when color selection changes
  useEffect(() => {
    if (!clothingData || !selectedColorId) return;

    const variantsForColor = clothingData.variants?.filter((v) => v.colorId === selectedColorId);
    const stillValid = variantsForColor?.some(
      (v) => v.sizeId === selectedSizeId && v.active && v.availableQuantity > 0
    );

    if (!stillValid) {
      const firstAvailable = variantsForColor?.find((v) => v.active && v.availableQuantity > 0);
      setValue('sizeId', firstAvailable?.sizeId ?? '', {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [selectedColorId, clothingData, selectedSizeId, setValue]);

  // Derive active variant and pricing dynamic values
  const activeVariant = useMemo(() => {
    return clothingData?.variants?.find(
      (v) => v.colorId === selectedColorId && v.sizeId === selectedSizeId
    );
  }, [clothingData, selectedColorId, selectedSizeId]);

  const currentPrice = activeVariant?.priceOverride ?? clothingData?.pricing?.basePrice ?? 0;
  const originalPrice = clothingData?.pricing?.compareAtPrice;

  // Placeholder Core Handlers
  function handleAddToCart(data: ProductCatalogFormValues) {
    const selectedVariant = clothingData?.variants?.find(
      (v) => v.colorId === data.colorId && v.sizeId === data.sizeId
    );

    console.log('Cart Action Payload:', {
      productId: data.id,
      variantId: selectedVariant?.id,
      colorId: data.colorId,
      sizeId: data.sizeId,
      quantity: data.quantity,
      price: currentPrice,
    });
  }

  function handleAddToWishlist() {
    console.log('Wishlist Action Payload:', {
      productId: clothingData?.id,
      slug: clothingData?.slug,
      name: clothingData?.name,
      price: currentPrice,
    });
  }

  // Loading skeleton layout
  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 pt-10 px-4 lg:px-12 animate-pulse">
        <div className="w-full lg:w-1/2 aspect-3/4 bg-neutral-200" />
        <div className="w-full lg:w-1/2 flex flex-col gap-6 pt-6">
          <div className="h-8 bg-neutral-200 w-3/4" />
          <div className="h-6 bg-neutral-200 w-1/4" />
          <div className="h-32 bg-neutral-200 w-full" />
        </div>
      </div>
    );
  }

  return (
    <section>
      <section className="flex pt-10 flex-col lg:flex-row gap-2">
        {/* Product Media Display */}
        <ProductImage image_data={clothingData?.media ?? []} selectedColorId={selectedColorId} />

        <div className="w-full">
          <section className="pt-6 pb-12 px-4 lg:pt-15 lg:px-30">
            {/* Title & Pricing */}
            <div className="flex flex-col gap-2 mb-6">
              <h1 className="text-xl font-archivo-black font-normal tracking-tight text-black">
                {clothingData?.name}
              </h1>
              <div className="flex items-center gap-3">
                <h2>
                  <span className="text-lg font-archivo font-semibold tracking-tight text-black">
                    {format_currency(currentPrice)}
                  </span>
                </h2>
                {originalPrice && originalPrice > currentPrice && (
                  <h2>
                    <span className="text-base line-through text-neutral-500 font-archivo font-normal tracking-tight">
                      {format_currency(originalPrice)}
                    </span>
                  </h2>
                )}
              </div>
            </div>

            {/* Selection Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleAddToCart)}>
              <ProductColorSelector
                control={control}
                name="colorId"
                colors={clothingData?.colors ?? []}
              />
              <ProductSizeSelector
                control={control}
                name="sizeId"
                variants={clothingData?.variants ?? []}
                selectedColorId={selectedColorId}
              />

              <button type="button" className="flex flex-col gap-1 items-start">
                <p className="text-sm text-neutral-500 font-archivo capitalize hover:underline">
                  Size & Fit Guide
                </p>
              </button>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  type="submit"
                  className="w-full bg-black uppercase text-white py-3 px-4 rounded-none text-base font-archivo font-medium tracking-tight transition-all duration-200 ease-in-out hover:bg-neutral-900 focus-visible:outline focus-visible:outline-black focus-visible:outline-offset-2"
                >
                  Add to Cart
                </button>

                <button
                  type="button"
                  onClick={handleAddToWishlist}
                  className="w-full border-[0.5px] uppercase border-black bg-white text-black py-3 px-4 rounded-none text-base font-archivo font-medium tracking-tight transition-all duration-200 ease-in-out hover:bg-neutral-900/10 focus-visible:outline focus-visible:outline-black focus-visible:outline-offset-2"
                >
                  Add to Wishlist
                </button>
              </div>
            </form>
          </section>

          {/* Collapsible Details */}
          <section className="lg:px-28.5">
            <Accordion>
              <Accordion.Item value="product-details">
                <Accordion.Trigger
                  className="w-full flex justify-between items-center py-3 px-4 text-black font-archivo font-medium tracking-tight uppercase text-sm"
                  openIcon={<CloseIcon />}
                  closeIcon={<PlusIcon />}
                >
                  <span className="text-base font-archivo text-black font-medium tracking-tight uppercase">
                    Product Details
                  </span>
                </Accordion.Trigger>
                <Accordion.Content className="p-4 bg-white text-black font-archivo font-normal tracking-tight text-sm">
                  {clothingData?.description?.narrative && (
                    <p className="mb-4">
                      <span className="text-base text-[#787878] font-archivo font-normal tracking-tight">
                        {clothingData.description.narrative}
                      </span>
                    </p>
                  )}

                  {clothingData?.features && clothingData.features.length > 0 && (
                    <div>
                      <h4 className="mb-2">
                        <strong className="text-base text-[#787878] capitalize font-archivo font-medium tracking-tight">
                          Features
                        </strong>
                      </h4>
                      <ul className="space-y-1.5">
                        {clothingData.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-1.5 lg:gap-3">
                            <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[#787878] shrink-0" />
                            <span className="text-sm lg:text-base text-[#787878] font-archivo font-normal tracking-tight">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Accordion.Content>
              </Accordion.Item>

              <Accordion.Item value="product-specifications">
                <Accordion.Trigger
                  className="w-full flex justify-between items-center py-3 px-4 text-black font-archivo font-medium tracking-tight uppercase text-sm"
                  openIcon={<CloseIcon />}
                  closeIcon={<PlusIcon />}
                >
                  <span className="text-base font-archivo text-black font-medium tracking-tight uppercase">
                    Product Specifications
                  </span>
                </Accordion.Trigger>
                <Accordion.Content className="p-4 bg-white text-black font-archivo font-normal tracking-tight text-sm">
                  <div className="flex flex-col gap-2">
                    {clothingData?.description?.fabricComposition && (
                      <p className="text-[#787878] font-archivo uppercase">
                        Material: {clothingData.description.fabricComposition}
                      </p>
                    )}
                    {clothingData?.description?.styleCode && (
                      <p className="text-[#787878] font-archivo uppercase">
                        Style Code: {clothingData.description.styleCode}
                      </p>
                    )}
                  </div>
                </Accordion.Content>
              </Accordion.Item>

              <Accordion.Item value="shipping-returns">
                <Accordion.Trigger
                  className="w-full flex justify-between items-center py-3 px-4 text-black font-archivo font-medium tracking-tight uppercase text-sm"
                  openIcon={<CloseIcon />}
                  closeIcon={<PlusIcon />}
                >
                  <span className="text-base font-archivo text-black font-medium tracking-tight uppercase">
                    Shipping & Returns
                  </span>
                </Accordion.Trigger>
                <Accordion.Content className="p-4 bg-white text-black font-archivo font-normal tracking-tight text-sm">
                  <div className="flex flex-col gap-2">
                    <p className="text-[#787878] font-archivo uppercase">
                      Standard shipping delivers within 3–5 business days. Express options available
                      at checkout.
                    </p>
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          </section>
        </div>
      </section>

      {/* Recommendations & History */}
      <section className="lg:py-20 flex flex-col gap-10 lg:gap-20 py-10">
        <div className="px-4">
          <h2 className="text-base font-archivo-black uppercase font-medium tracking-tight text-black mb-6">
            You may also like
          </h2>
          <div className="flex overflow-x-auto w-full gap-4 pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="shrink-0">
                <ProductCard />
              </div>
            ))}
          </div>
        </div>

        <div className="px-4">
          <h2 className="text-base font-archivo-black uppercase font-medium tracking-tight text-black mb-6">
            Recently Viewed
          </h2>
          <div className="flex overflow-x-auto w-full gap-4 pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="shrink-0">
                <ProductCard />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-14 px-4 border-t border-neutral-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {CONSUMER_SERVICE_FEATURES.map((feature, index) => (
            <div key={index} className="flex flex-col gap-3 items-start justify-start">
              {feature.icon}
              <h3 className="text-base font-archivo font-semibold capitalize">{feature.title}</h3>
              <p className="text-sm text-[#ADA5A5] font-archivo">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

// Icon Helpers
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

// Consumer Service Features Static Configuration
const CONSUMER_SERVICE_FEATURES: { title: string; description: string; icon: JSX.Element }[] = [
  {
    title: 'Secured Payment',
    description: 'Enjoy peace of mind with our secured payment options!',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.5 3.75H4.5C4.10218 3.75 3.72064 3.90804 3.43934 4.18934C3.15804 4.47064 3 4.85218 3 5.25V10.5C3 15.4425 5.3925 18.4378 7.39969 20.0803C9.56156 21.8484 11.7122 22.4484 11.8059 22.4737C11.9348 22.5088 12.0708 22.5088 12.1997 22.4737C12.2934 22.4484 14.4413 21.8484 16.6059 20.0803C18.6075 18.4378 21 15.4425 21 10.5V5.25C21 4.85218 20.842 4.47064 20.5607 4.18934C20.2794 3.90804 19.8978 3.75 19.5 3.75ZM16.2825 10.2806L11.0325 15.5306C10.9628 15.6004 10.8801 15.6557 10.7891 15.6934C10.698 15.7312 10.6004 15.7506 10.5019 15.7506C10.4033 15.7506 10.3057 15.7312 10.2147 15.6934C10.1236 15.6557 10.0409 15.6004 9.97125 15.5306L7.72125 13.2806C7.58052 13.1399 7.50146 12.949 7.50146 12.75C7.50146 12.551 7.58052 12.3601 7.72125 12.2194C7.86198 12.0786 8.05285 11.9996 8.25187 11.9996C8.4509 11.9996 8.64177 12.0786 8.7825 12.2194L10.5 13.9397L15.2194 9.21937C15.2891 9.14969 15.3718 9.09442 15.4628 9.0567C15.5539 9.01899 15.6515 8.99958 15.75 8.99958C15.8485 8.99958 15.9461 9.01899 16.0372 9.0567C16.1282 9.09442 16.2109 9.14969 16.2806 9.21937C16.3503 9.28906 16.4056 9.37178 16.4433 9.46283C16.481 9.55387 16.5004 9.65145 16.5004 9.75C16.5004 9.84855 16.481 9.94613 16.4433 10.0372C16.4056 10.1282 16.3503 10.2109 16.2806 10.2806H16.2825Z"
          fill="black"
        />
      </svg>
    ),
  },
  {
    title: 'Free Shipping',
    description: 'Get your orders delivered to your doorstep at no extra cost.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15.0005 13.1249V6.82954C14.9996 6.75301 15.0222 6.67806 15.0652 6.61474C15.1082 6.55142 15.1695 6.50277 15.2409 6.47532C15.3124 6.44787 15.3905 6.44293 15.4648 6.46117C15.5391 6.47941 15.6061 6.51995 15.6567 6.57735L20.813 12.2455C20.9315 12.3756 21.0005 12.5432 21.0078 12.7191C21.0152 12.8949 20.9605 13.0678 20.8533 13.2074C20.7797 13.3001 20.6859 13.3747 20.5789 13.4254C20.472 13.4762 20.3548 13.5016 20.2364 13.4999H15.3755C15.276 13.4999 15.1806 13.4603 15.1103 13.39C15.04 13.3197 15.0005 13.2243 15.0005 13.1249ZM23.1764 16.1745C23.1152 16.0473 23.0192 15.9399 22.8996 15.8648C22.7801 15.7897 22.6417 15.7498 22.5005 15.7499H13.5005V0.749851C13.4996 0.595257 13.451 0.444699 13.3614 0.318781C13.2717 0.192863 13.1453 0.0977379 12.9994 0.0464249C12.8536 -0.00488816 12.6955 -0.00988213 12.5467 0.0321265C12.3979 0.0741351 12.2657 0.161094 12.1683 0.281101L2.41828 12.2811C2.33014 12.3912 2.27482 12.5239 2.25868 12.664C2.24253 12.8041 2.26621 12.9459 2.32699 13.0731C2.38778 13.2004 2.48321 13.3079 2.60233 13.3834C2.72146 13.4589 2.85945 13.4992 3.00047 13.4999H12.0005V15.7499H1.50047C1.35913 15.7498 1.22064 15.7896 1.10097 15.8648C0.981293 15.94 0.885303 16.0475 0.824061 16.1749C0.762819 16.3023 0.738819 16.4444 0.754826 16.5848C0.770832 16.7252 0.826195 16.8583 0.914532 16.9686L3.68953 20.4374C3.82975 20.6132 4.00788 20.7552 4.21064 20.8526C4.41339 20.95 4.63553 21.0003 4.86047 20.9999H19.1405C19.3654 21.0003 19.5875 20.95 19.7903 20.8526C19.9931 20.7552 20.1712 20.6132 20.3114 20.4374L23.0864 16.9686C23.1747 16.8582 23.2301 16.7251 23.246 16.5846C23.2619 16.4441 23.2378 16.3019 23.1764 16.1745Z"
          fill="black"
        />
      </svg>
    ),
  },
  {
    title: 'Checkout',
    description: 'Easy checkout – complete your order in seconds!',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.3125 7.75587C22.2424 7.6757 22.1559 7.61141 22.0589 7.56728C21.9619 7.52315 21.8566 7.50019 21.75 7.49994H17.5904L12.5625 1.75587C12.4922 1.67607 12.4056 1.61215 12.3086 1.56837C12.2116 1.52459 12.1065 1.50195 12 1.50195C11.8936 1.50195 11.7885 1.52459 11.6915 1.56837C11.5945 1.61215 11.5079 1.67607 11.4375 1.75587L6.40974 7.49994H2.25005C2.14316 7.49993 2.03751 7.52277 1.94016 7.56693C1.84282 7.61109 1.75604 7.67554 1.68564 7.75597C1.61525 7.8364 1.56285 7.93095 1.53197 8.03328C1.5011 8.13562 1.49245 8.24337 1.50661 8.34931L2.91943 18.9487C2.96871 19.3084 3.14633 19.6382 3.41955 19.8773C3.69278 20.1164 4.04322 20.2488 4.4063 20.2499H19.5938C19.9569 20.2488 20.3073 20.1164 20.5805 19.8773C20.8538 19.6382 21.0314 19.3084 21.0807 18.9487L22.4935 8.34931C22.5074 8.24321 22.4985 8.13536 22.4673 8.03301C22.436 7.93065 22.3833 7.83616 22.3125 7.75587ZM7.65005 17.2499C7.62476 17.2513 7.59941 17.2513 7.57411 17.2499C7.38754 17.2509 7.20731 17.1822 7.06863 17.0574C6.92995 16.9326 6.84277 16.7606 6.82411 16.5749L6.29911 11.3249C6.27922 11.127 6.33877 10.9293 6.46465 10.7753C6.59054 10.6213 6.77245 10.5236 6.97036 10.5037C7.16828 10.4838 7.36599 10.5433 7.52001 10.6692C7.67402 10.7951 7.77172 10.977 7.79161 11.1749L8.31661 16.4249C8.33762 16.6227 8.27919 16.8208 8.15419 16.9755C8.02918 17.1302 7.84784 17.2289 7.65005 17.2499ZM12.75 16.4999C12.75 16.6988 12.671 16.8896 12.5304 17.0303C12.3897 17.1709 12.199 17.2499 12 17.2499C11.8011 17.2499 11.6104 17.1709 11.4697 17.0303C11.3291 16.8896 11.25 16.6988 11.25 16.4999V11.2499C11.25 11.051 11.3291 10.8603 11.4697 10.7196C11.6104 10.579 11.8011 10.4999 12 10.4999C12.199 10.4999 12.3897 10.579 12.5304 10.7196C12.671 10.8603 12.75 11.051 12.75 11.2499V16.4999ZM8.40286 7.49994L12 3.389L15.5972 7.49994H8.40286ZM17.6963 11.3249L17.1713 16.5749C17.1527 16.7598 17.0662 16.9311 16.9285 17.0558C16.7908 17.1805 16.6118 17.2497 16.426 17.2499C16.4007 17.2513 16.3753 17.2513 16.35 17.2499C16.2521 17.2401 16.157 17.211 16.0702 17.1644C15.9834 17.1178 15.9067 17.0546 15.8443 16.9783C15.782 16.9021 15.7353 16.8143 15.7069 16.72C15.6785 16.6257 15.669 16.5267 15.6788 16.4287L16.2038 11.1787C16.2237 10.9808 16.3214 10.7989 16.4754 10.673C16.6294 10.5471 16.8271 10.4875 17.0251 10.5074C17.223 10.5273 17.4049 10.625 17.5308 10.779C17.6566 10.9331 17.7162 11.1308 17.6963 11.3287V11.3249Z"
          fill="black"
        />
      </svg>
    ),
  },
  {
    title: 'Live Support',
    description: 'Need help? Our live chat is here for instant support!',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.0002 2.25C10.3169 2.24963 8.66213 2.68508 7.19704 3.51396C5.73194 4.34285 4.50641 5.53692 3.63971 6.97997C2.77302 8.42301 2.29469 10.0659 2.25129 11.7486C2.20789 13.4314 2.60089 15.0967 3.39205 16.5825L2.32799 19.7747C2.23985 20.039 2.22706 20.3226 2.29105 20.5938C2.35504 20.8649 2.49328 21.1129 2.69029 21.3099C2.88729 21.5069 3.13526 21.6451 3.40642 21.7091C3.67757 21.7731 3.96119 21.7603 4.22549 21.6722L7.41768 20.6081C8.72527 21.3036 10.1741 21.6921 11.6543 21.744C13.1344 21.7959 14.6069 21.51 15.9601 20.9079C17.3132 20.3057 18.5114 19.4033 19.4636 18.269C20.4159 17.1346 21.0972 15.7983 21.4559 14.3613C21.8146 12.9244 21.8412 11.4246 21.5337 9.97578C21.2263 8.52701 20.5928 7.16732 19.6813 5.99992C18.7699 4.83253 17.6045 3.88811 16.2736 3.23836C14.9427 2.58861 13.4812 2.25061 12.0002 2.25ZM7.87517 13.125C7.65267 13.125 7.43516 13.059 7.25016 12.9354C7.06515 12.8118 6.92096 12.6361 6.83581 12.4305C6.75066 12.225 6.72838 11.9988 6.77179 11.7805C6.8152 11.5623 6.92235 11.3618 7.07968 11.2045C7.23701 11.0472 7.43747 10.94 7.6557 10.8966C7.87393 10.8532 8.10013 10.8755 8.30569 10.9606C8.51126 11.0458 8.68696 11.19 8.81058 11.375C8.9342 11.56 9.00017 11.7775 9.00017 12C9.00017 12.2984 8.88165 12.5845 8.67067 12.7955C8.45969 13.0065 8.17354 13.125 7.87517 13.125ZM12.0002 13.125C11.7777 13.125 11.5602 13.059 11.3752 12.9354C11.1902 12.8118 11.046 12.6361 10.9608 12.4305C10.8757 12.225 10.8534 11.9988 10.8968 11.7805C10.9402 11.5623 11.0473 11.3618 11.2047 11.2045C11.362 11.0472 11.5625 10.94 11.7807 10.8966C11.9989 10.8532 12.2251 10.8755 12.4307 10.9606C12.6363 11.0458 12.812 11.19 12.9356 11.375C13.0592 11.56 13.1252 11.7775 13.1252 12C13.1252 12.2984 13.0066 12.5845 12.7957 12.7955C12.5847 13.0065 12.2985 13.125 12.0002 13.125ZM16.1252 13.125C15.9027 13.125 15.6852 13.059 15.5002 12.9354C15.3152 12.8118 15.171 12.6361 15.0858 12.4305C15.0007 12.225 14.9784 11.9988 15.0218 11.7805C15.0652 11.5623 15.1723 11.3618 15.3297 11.2045C15.487 11.0472 15.6875 10.94 15.9057 10.8966C16.1239 10.8532 16.3501 10.8755 16.5557 10.9606C16.7613 11.0458 16.937 11.19 17.0606 11.375C17.1842 11.56 17.2502 11.7775 17.2502 12C17.2502 12.2984 17.1316 12.5845 16.9207 12.7955C16.7097 13.0065 16.4235 13.125 16.1252 13.125Z"
          fill="black"
        />
      </svg>
    ),
  },
];
