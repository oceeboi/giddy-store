'use client';

import { useState } from 'react';
import { Input } from '@/components/shared/form';
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProductColorItem = {
  tempId: string;
  name: string;
  hexCode?: string;
  swatchImage?: string | null | unknown;
};

type SizeItem = {
  id: string; // database ObjectId for the size
  name: string; // e.g., "US 9", "Medium"
};

type VariantItem = {
  colorId: string;
  sizeId: string;
  size: string;
  barcode?: string | null | unknown;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  active: boolean;
  priceOverride?: number | null | unknown;
};

type ProductVariantMatrixProps = {
  colors: ProductColorItem[];
  availableSizes: SizeItem[]; // Master list of sizes available to pick from
  value: VariantItem[];
  onChange: (nextVariants: VariantItem[]) => void;
  disabled?: boolean;
};

export function ProductVariantMatrix({
  colors = [],
  availableSizes = [],
  value = [],
  onChange,
  disabled = false,
}: ProductVariantMatrixProps) {
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);

  // Auto-generate grid matrix combinations of all active colors and selected sizes
  const generateMatrix = () => {
    if (colors.length === 0 || selectedSizeIds.length === 0) return;

    const newVariants: VariantItem[] = [];

    colors.forEach((color) => {
      selectedSizeIds.forEach((sizeId) => {
        const sizeObj = availableSizes.find((s) => s.id === sizeId);
        if (!sizeObj) return;

        // Check if variant already exists to preserve existing stock/price values
        const existing = value.find((v) => v.colorId === color.tempId && v.sizeId === sizeId);

        if (existing) {
          newVariants.push(existing);
        } else {
          newVariants.push({
            colorId: color.tempId, // Links to color's tempId
            sizeId: sizeObj.id,
            size: sizeObj.name,
            barcode: '',
            stockQuantity: 10,
            reservedQuantity: 0,
            availableQuantity: 10,
            reorderLevel: 2,
            active: true,
            priceOverride: null,
          });
        }
      });
    });

    onChange(newVariants);
  };

  const updateVariantField = <K extends keyof VariantItem>(
    index: number,
    field: K,
    val: VariantItem[K]
  ) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const removeVariant = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Matrix Builder Controls */}
      <div className="p-4 border border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-black">
          Generate Variant Matrix
        </span>
        <p className="text-xs text-neutral-600">
          Select sizes to pair with your added product colors ({colors.length} colors available).
        </p>

        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => {
            const isSelected = selectedSizeIds.includes(size.id);
            return (
              <button
                type="button"
                key={size.id}
                onClick={() =>
                  setSelectedSizeIds((prev) =>
                    isSelected ? prev.filter((id) => id !== size.id) : [...prev, size.id]
                  )
                }
                className={cn(
                  'px-3 py-2 sm:py-1.5 text-xs font-medium border transition-colors min-h-9 sm:min-h-0',
                  isSelected
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                )}
              >
                {size.name}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={disabled || colors.length === 0 || selectedSizeIds.length === 0}
          onClick={generateMatrix}
          className="inline-flex items-center justify-center gap-1.5 bg-black text-white px-4 py-2.5 sm:py-2 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-900 transition-colors disabled:opacity-50 w-full sm:w-fit"
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
          Generate / Sync Matrix Grid
        </button>
      </div>

      {value.length > 0 && (
        <>
          {/* Mobile / small-screen card layout */}
          <div className="flex flex-col gap-3 md:hidden">
            {value.map((variant, index) => {
              const colorObj = colors.find((c) => c.tempId === variant.colorId);
              return (
                <div
                  key={`${variant.colorId}-${variant.sizeId}`}
                  className="border border-neutral-200 bg-white p-3 flex flex-col gap-3"
                >
                  {/* Header row: color, size, delete */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-neutral-300 shrink-0"
                        style={{ backgroundColor: colorObj?.hexCode ?? '#ccc' }}
                      />
                      <span className="text-xs font-semibold truncate">
                        {colorObj?.name ?? 'Unknown'}
                      </span>
                      <span className="text-xs text-neutral-400">/</span>
                      <span className="text-xs font-semibold">{variant.size}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-neutral-400 hover:text-red-600 transition-colors p-1 -m-1 shrink-0"
                      aria-label="Remove variant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Fields grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Stock
                      </span>
                      <Input
                        type="number"
                        value={variant.stockQuantity}
                        onChange={(e) =>
                          updateVariantField(index, 'stockQuantity', Number(e.target.value))
                        }
                        disabled={disabled}
                        className="h-9 w-full text-xs rounded-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Price Override
                      </span>
                      <Input
                        type="number"
                        placeholder="Base price"
                        value={(variant.priceOverride as string) ?? ''}
                        onChange={(e) =>
                          updateVariantField(
                            index,
                            'priceOverride',
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        disabled={disabled}
                        className="h-9 w-full text-xs rounded-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1 col-span-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Barcode
                      </span>
                      <Input
                        type="text"
                        placeholder="Optional SKU/Barcode"
                        value={(variant.barcode as string) ?? ''}
                        onChange={(e) => updateVariantField(index, 'barcode', e.target.value)}
                        disabled={disabled}
                        className="h-9 w-full text-xs rounded-none"
                      />
                    </label>
                  </div>

                  {/* Active toggle */}
                  <label className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                    <input
                      type="checkbox"
                      checked={variant.active}
                      onChange={(e) => updateVariantField(index, 'active', e.target.checked)}
                      className="h-4 w-4 accent-black"
                    />
                    <span className="text-xs font-medium text-neutral-700">Active</span>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Desktop / tablet table layout */}
          <div className="hidden md:block overflow-x-auto border border-neutral-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b border-neutral-200 uppercase font-semibold text-neutral-700">
                <tr>
                  <th className="p-2.5">Color</th>
                  <th className="p-2.5">Size</th>
                  <th className="p-2.5">Stock</th>
                  <th className="p-2.5">Price Override</th>
                  <th className="p-2.5">Barcode</th>
                  <th className="p-2.5 text-center">Active</th>
                  <th className="p-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {value.map((variant, index) => {
                  const colorObj = colors.find((c) => c.tempId === variant.colorId);
                  return (
                    <tr
                      key={`${variant.colorId}-${variant.sizeId}`}
                      className="hover:bg-neutral-50"
                    >
                      <td className="p-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full border border-neutral-300 shrink-0"
                            style={{ backgroundColor: colorObj?.hexCode ?? '#ccc' }}
                          />
                          {colorObj?.name ?? 'Unknown'}
                        </div>
                      </td>
                      <td className="p-2.5 font-semibold">{variant.size}</td>
                      <td className="p-2.5">
                        <Input
                          type="number"
                          value={variant.stockQuantity}
                          onChange={(e) =>
                            updateVariantField(index, 'stockQuantity', Number(e.target.value))
                          }
                          disabled={disabled}
                          className="h-8 w-20 text-xs rounded-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <Input
                          type="number"
                          placeholder="Base price"
                          value={(variant.priceOverride as string) ?? ''}
                          onChange={(e) =>
                            updateVariantField(
                              index,
                              'priceOverride',
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          disabled={disabled}
                          className="h-8 w-28 text-xs rounded-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <Input
                          type="text"
                          placeholder="Optional SKU/Barcode"
                          value={(variant.barcode as string) ?? ''}
                          onChange={(e) => updateVariantField(index, 'barcode', e.target.value)}
                          disabled={disabled}
                          className="h-8 w-32 text-xs rounded-none"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={variant.active}
                          onChange={(e) => updateVariantField(index, 'active', e.target.checked)}
                          className="h-4 w-4 accent-black"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-neutral-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
