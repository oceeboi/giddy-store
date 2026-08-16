'use client';

import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { z } from 'zod';

export const productCatalogSchema = z.object({
  id: z.string(),
  colorId: z.string(),
  sizeId: z.string(),
});

export type ProductCatalog = z.infer<typeof productCatalogSchema>;

export type ProductVariant = {
  id: string;
  colorId: string;
  sizeId: string;
  size: string;
  sku: string | null;
  barcode: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  active: boolean;
  priceOverride?: number | null;
};

interface ProductSizeSelectorProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  variants: ProductVariant[];
  selectedColorId?: string;
  label?: string;
}

export function ProductSizeSelector<T extends FieldValues>({
  control,
  name,
  variants,
  selectedColorId,
  label = 'Size',
}: ProductSizeSelectorProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ control, name });

  const availableVariants = selectedColorId
    ? variants.filter((v) => v.colorId === selectedColorId)
    : variants;

  const selectedVariantObj =
    availableVariants.find((v) => v.sizeId === value) ?? variants.find((v) => v.sizeId === value);
  const selectedSizeName = selectedVariantObj ? selectedVariantObj.size : 'None selected';

  return (
    <div className="flex flex-col gap-2 mb-6 select-none">
      <div className="flex flex-row gap-1 items-center">
        <h4 className="text-base items-start uppercase font-medium text-black font-archivo tracking-tight">
          {label}:
        </h4>
        <h4 className="text-base items-start uppercase text-neutral-400 font-archivo font-normal tracking-tight">
          {selectedSizeName}
        </h4>
      </div>

      <div
        key={selectedColorId}
        className="grid grid-cols-5 bg-transparent p-px gap-px animate-in fade-in duration-200"
      >
        {availableVariants.map((variant) => {
          const isSelected = value === variant.sizeId;
          const isOutOfStock = variant.availableQuantity <= 0 || !variant.active;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => onChange(variant.sizeId)}
              aria-label={`Size ${variant.size}${isOutOfStock ? ' (Out of Stock)' : ''}`}
              aria-pressed={isSelected}
              className={`relative flex items-center justify-center p-3 transition-all duration-200 ease-in-out rounded-none bg-white text-black ${
                isSelected
                  ? 'bg-black! text-white! border border-black'
                  : 'hover:bg-neutral-900 hover:text-white border border-black'
              } ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-black/40' : 'cursor-pointer'} focus-visible:outline focus-visible:outline-white focus-visible:outline-offset-2`}
            >
              <p
                className={`text-[11px] uppercase tracking-wider font-archivo ${
                  isOutOfStock ? 'line-through text-neutral-500' : ''
                }`}
              >
                {variant.size}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
