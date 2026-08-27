'use client';

import Image from 'next/image';
import { ClothingProductData } from '@/types/shared/product';
import { format_currency } from '@/utils/format';
import { useState, MouseEvent } from 'react';
import { Sheet } from '@/components/shared';
import { MoreVertical } from 'lucide-react';
import { ProductUpdate } from './admin/product-update';

type ProductRowCardProps = {
  product: ClothingProductData;
  onClick?: (product: ClothingProductData) => void;
};

export function ProductRowCard({ product, onClick }: ProductRowCardProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const primaryImage = product.media?.[0]?.url;
  const variants = product.variants ?? [];
  const colors = product.colors ?? [];
  const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0);
  const totalAvailable = variants.reduce((sum, v) => sum + (v.availableQuantity ?? 0), 0);
  const isActive = product.active;

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  const handleSheetTriggerClick = (e: MouseEvent) => {
    e.stopPropagation(); // Prevents outer card click trigger when opening update drawer
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group relative flex w-full cursor-pointer flex-col gap-3 border border-neutral-200 bg-white p-4 transition-colors hover:border-black dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-100"
    >
      {/* Top Header: Image, Title, Status & Menu Sheet Trigger */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-none border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-archivo text-[10px] text-neutral-400 uppercase">
                No Img
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-archivo text-sm font-semibold uppercase tracking-tight text-neutral-900 truncate dark:text-neutral-100">
              {product.name}
            </span>
            <span className="font-mono text-[11px] text-neutral-500 truncate">{product.slug}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`font-archivo inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              isActive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            {isActive ? 'Active' : 'Draft'}
          </span>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <Sheet.Trigger asChild>
              <button
                type="button"
                onClick={handleSheetTriggerClick}
                className="flex h-8 w-8 items-center justify-center rounded-none border border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 hover:text-black dark:hover:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-white"
                aria-label="Edit product"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </Sheet.Trigger>

            <Sheet.Content
              side="right"
              size="lg"
              className="h-full bg-white p-0 dark:bg-neutral-950"
            >
              <Sheet.Header className="border-b border-neutral-200 p-6 dark:border-neutral-800">
                <Sheet.Title>
                  <span className="font-archivo text-base font-bold uppercase tracking-wider text-black dark:text-white">
                    Update Product
                  </span>
                </Sheet.Title>
              </Sheet.Header>
              <div className=" overflow-y-auto max-h-[calc(100vh-80px)]">
                <ProductUpdate id={product.id} setValue={setIsOpen} />
              </div>
            </Sheet.Content>
          </Sheet>
        </div>
      </div>

      {/* Product Metadata Grid */}
      <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3 text-xs dark:border-neutral-900 font-archivo">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Brand
          </span>
          <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
            {product.brand?.name ?? '—'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Category
          </span>
          <span className="text-neutral-700 dark:text-neutral-300 truncate">
            {product.category?.name ?? '—'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Type / Gender
          </span>
          <span className="text-neutral-800 dark:text-neutral-200 uppercase truncate">
            {product.productType ?? '—'}
          </span>
          <span className="text-[11px] text-neutral-500 capitalize truncate">
            {product.gender ?? '—'}
          </span>
        </div>
      </div>

      {/* Pricing & Stock Details */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-900 font-archivo">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Price
          </span>
          {product.pricing ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-black dark:text-white">
                {format_currency(product.pricing.basePrice)}
              </span>
              {product.pricing.compareAtPrice ? (
                <span className="text-xs text-neutral-400 line-through">
                  {format_currency(product.pricing.compareAtPrice)}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-sm text-neutral-400">—</span>
          )}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Inventory
          </span>
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            {totalAvailable} available
          </span>
          <span className="text-[11px] text-neutral-500">
            {variants.length} variant{variants.length !== 1 ? 's' : ''} ({totalStock} total)
          </span>
        </div>
      </div>

      {/* Color Swatches */}
      {colors.length > 0 && (
        <div className="flex items-center gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-900">
          {colors.slice(0, 6).map((color) => (
            <span
              key={color.id}
              className="h-3.5 w-3.5 rounded-full border border-neutral-300 dark:border-neutral-700"
              style={{ backgroundColor: color.hexCode ?? '#ccc' }}
              title={color.name}
            />
          ))}
          {colors.length > 6 && (
            <span className="font-mono text-[11px] text-neutral-500">+{colors.length - 6}</span>
          )}
        </div>
      )}
    </div>
  );
}
