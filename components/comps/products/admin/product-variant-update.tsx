'use client';

import { useEffect, useState, useMemo } from 'react';
import { Input } from '@/components/shared/form';
import { Trash2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductColorItem = {
  id?: string; // Database ID (exists on saved items)
  tempId?: string; // Temporary ID (exists on newly added session colors)
  name: string;
  hexCode?: string;
  swatchImage?: string | null | unknown;
};

export type SizeItem = {
  id: string; // Master database ID for the size
  name: string;
};

export type VariantItem = {
  id?: string; // Existing database variant ID
  colorId: string; // References color.id or color.tempId
  sizeId: string; // References size.id
  size: string;
  barcode?: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  active: boolean;
  priceOverride?: number | null;
  isNew?: boolean; // Tracking flag for backend diffing
};

type ProductVariantMatrixProps = {
  colors: ProductColorItem[];
  availableSizes: SizeItem[];
  value: VariantItem[];
  onChange: (nextVariants: VariantItem[]) => void;
  disabled?: boolean;
};

export function UpdateProductVariantMatrix({
  colors = [],
  availableSizes = [],
  value = [],
  onChange,
  disabled = false,
}: ProductVariantMatrixProps) {
  // Extract canonical color key (id or tempId)
  const getColorKey = (color: ProductColorItem) => color.id || color.tempId || '';

  // Active color keys set for quick validation
  const validColorKeys = useMemo(() => new Set(colors.map(getColorKey).filter(Boolean)), [colors]);

  // Derive initial selected sizes from existing variants
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>(() => {
    return Array.from(new Set(value.map((v) => v.sizeId).filter(Boolean)));
  });

  // 1. Auto-cleanup: If a color was deleted in parent form, drop orphan variants
  useEffect(() => {
    const validVariants = value.filter((v) => validColorKeys.has(v.colorId));
    if (validVariants.length !== value.length) {
      onChange(validVariants);
    }
  }, [validColorKeys, value, onChange]);

  // 2. Hydrate size selector checkboxes when component mounts with edit data
  useEffect(() => {
    if (value.length > 0) {
      const activeSizeIds = Array.from(new Set(value.map((v) => v.sizeId).filter(Boolean)));
      setSelectedSizeIds((prev) => {
        const merged = new Set([...prev, ...activeSizeIds]);
        return Array.from(merged);
      });
    }
  }, [value]);

  // Safely find matching color object by either database ID or tempId
  const getColorObj = (colorId: string) => {
    return colors.find((c) => (c.id && c.id === colorId) || (c.tempId && c.tempId === colorId));
  };

  // Reconcile matrix without losing existing variant database IDs or stock data
  const generateMatrix = () => {
    if (colors.length === 0 || selectedSizeIds.length === 0) return;

    const reconciledVariants: VariantItem[] = [];

    colors.forEach((color) => {
      const colorKey = getColorKey(color);
      if (!colorKey) return;

      selectedSizeIds.forEach((sizeId) => {
        const sizeObj = availableSizes.find((s) => s.id === sizeId);
        if (!sizeObj) return;

        // Search for existing variant in current state
        const existing = value.find((v) => v.colorId === colorKey && v.sizeId === sizeId);

        if (existing) {
          // Keep existing variant (preserves `id`, `stockQuantity`, etc.)
          reconciledVariants.push(existing);
        } else {
          // Create new variant shell
          reconciledVariants.push({
            colorId: colorKey,
            sizeId: sizeObj.id,
            size: sizeObj.name,
            barcode: '',
            stockQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            reorderLevel: 2,
            active: true,
            priceOverride: null,
            isNew: true,
          });
        }
      });
    });

    onChange(reconciledVariants);
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
    <div className="flex flex-col gap-4 w-full font-archivo">
      {/* Matrix Builder Controls */}
      <div className="p-4 border border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-black">
            Sync Variant Matrix
          </span>
          <span className="text-[11px] font-medium text-neutral-500">
            {value.length} Active Matrix Items
          </span>
        </div>
        <p className="text-xs text-neutral-600">
          Select sizes to pair with your active colors ({colors.length} colors available). Existing
          variant data will be preserved.
        </p>

        {/* Size selection tags */}
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
                  'px-3 py-1.5 text-xs font-medium border transition-colors min-h-9 sm:min-h-0',
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
          className="inline-flex items-center justify-center gap-1.5 bg-black text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-900 transition-colors disabled:opacity-50 w-full sm:w-fit"
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
          Reconcile Matrix Grid
        </button>
      </div>

      {value.length > 0 && (
        <>
          {/* Mobile Card Layout */}
          <div className="flex flex-col gap-3 :hidden">
            {value.map((variant, index) => {
              const colorObj = getColorObj(variant.colorId);
              return (
                <div
                  key={variant.id || `${variant.colorId}-${variant.sizeId}-${index}`}
                  className="border border-neutral-200 bg-white p-3 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-neutral-300 shrink-0"
                        style={{ backgroundColor: colorObj?.hexCode ?? '#ccc' }}
                      />
                      <span className="text-xs font-semibold text-black truncate">
                        {colorObj?.name ?? 'Unknown Color'}
                      </span>
                      <span className="text-xs text-neutral-400">/</span>
                      <span className="text-xs text-black font-semibold">{variant.size}</span>
                      {variant.isNew && (
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-neutral-400 hover:text-red-600 transition-colors p-1 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Stock
                      </span>
                      <Input
                        type="number"
                        value={Number.isNaN(variant.stockQuantity) ? '' : variant.stockQuantity}
                        onChange={(e) =>
                          updateVariantField(
                            index,
                            'stockQuantity',
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
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
                        value={variant.priceOverride ?? ''}
                        onChange={(e) =>
                          updateVariantField(
                            index,
                            'priceOverride',
                            e.target.value !== '' ? Number(e.target.value) : null
                          )
                        }
                        disabled={disabled}
                        className="h-9 w-full text-xs rounded-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1 col-span-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Barcode / SKU
                      </span>
                      <Input
                        type="text"
                        placeholder="Optional SKU/Barcode"
                        value={variant.barcode ?? ''}
                        onChange={(e) => updateVariantField(index, 'barcode', e.target.value)}
                        disabled={disabled}
                        className="h-9 w-full text-xs rounded-none"
                      />
                    </label>
                  </div>

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

          {/* Desktop Table Layout */}
          <div className="hidden :block overflow-x-auto border border-neutral-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b border-neutral-200 uppercase font-semibold text-neutral-700">
                <tr>
                  <th className="p-2.5">Status</th>
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
                  const colorObj = getColorObj(variant.colorId);
                  return (
                    <tr
                      key={variant.id || `${variant.colorId}-${variant.sizeId}-${index}`}
                      className="hover:bg-neutral-50"
                    >
                      <td className="p-2.5">
                        {variant.id ? (
                          <span className="text-[10px] bg-neutral-100 text-neutral-700 font-medium px-1.5 py-0.5 border border-neutral-200">
                            Saved
                          </span>
                        ) : (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-1.5 py-0.5 border border-blue-200">
                            New
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full border border-neutral-300 shrink-0"
                            style={{ backgroundColor: colorObj?.hexCode ?? '#ccc' }}
                          />
                          {colorObj?.name ?? 'Unknown Color'}
                        </div>
                      </td>
                      <td className="p-2.5 font-semibold">{variant.size}</td>
                      <td className="p-2.5">
                        <Input
                          type="number"
                          value={Number.isNaN(variant.stockQuantity) ? '' : variant.stockQuantity}
                          onChange={(e) =>
                            updateVariantField(
                              index,
                              'stockQuantity',
                              e.target.value === '' ? 0 : Number(e.target.value)
                            )
                          }
                          disabled={disabled}
                          className="h-8 w-20 text-xs rounded-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <Input
                          type="number"
                          placeholder="Base price"
                          value={variant.priceOverride ?? ''}
                          onChange={(e) =>
                            updateVariantField(
                              index,
                              'priceOverride',
                              e.target.value !== '' ? Number(e.target.value) : null
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
                          value={variant.barcode ?? ''}
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
