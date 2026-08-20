'use client';
import { useMemo, useState } from 'react';
import { Sheet } from './sheet';
import { Check, SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Accordion } from './accordion';
import { cn } from '@/lib/utils';
import { format_currency } from '@/utils/format';

// Standard shoe/clothing size presets
const AVAILABLE_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '50',
];

const AVAILABLE_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Gray', hex: '#808080' },
];

// Preset price ranges (in Naira)
const PRICE_PRESETS = [
  { label: `Under ${format_currency(5000000)}`, min: 0, max: 5000000 },
  {
    label: `${format_currency(5000000)} - ${format_currency(15000000)}`,
    min: 5000000,
    max: 15000000,
  },
  {
    label: `${format_currency(15000000)} - ${format_currency(30000000)}`,
    min: 15000000,
    max: 30000000,
  },
  { label: `Over ${format_currency(30000000)}`, min: 30000000, max: undefined },
];

export function FilterSheet() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Queries (Replace with your actual category fetch hook/data source)
  const { data: categoriesData } = useMemo(
    () => ({
      data: [
        { name: 'T-Shirts', slug: 't-shirts' },
        { name: 'Hoodies', slug: 'hoodies' },
        { name: 'Pants', slug: 'pants' },
        { name: 'Sneakers', slug: 'sneakers' },
        { name: 'Accessories', slug: 'accessories' },
      ],
    }),
    []
  );

  // Active query param getters
  const activeColors = useMemo(() => {
    const raw = searchParams.get('color');
    return raw ? raw.split(',').map((s) => s.trim()) : [];
  }, [searchParams]);
  const activeCategory = searchParams.get('category');
  const activeBrand = searchParams.get('brand');
  const activeMinPrice = searchParams.get('min_price');
  const activeMaxPrice = searchParams.get('max_price');
  const activeInStock = searchParams.get('in_stock');
  const activeSizes = useMemo(() => {
    const raw = searchParams.get('size');
    return raw ? raw.split(',').map((s) => s.trim()) : [];
  }, [searchParams]);

  // Custom price input local state
  const [minInput, setMinInput] = useState<string>(activeMinPrice || '');
  const [maxInput, setMaxInput] = useState<string>(activeMaxPrice || '');

  // Calculate total active filter badge count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeCategory) count++;
    if (activeColors.length > 0) count += activeColors.length;
    if (activeBrand) count++;
    if (activeMinPrice || activeMaxPrice) count++;
    if (activeSizes.length > 0) count += activeSizes.length;
    if (activeInStock !== null && activeInStock !== undefined) count++;
    return count;
  }, [
    activeCategory,
    activeColors,
    activeBrand,
    activeMinPrice,
    activeMaxPrice,
    activeSizes,
    activeInStock,
  ]);

  // Helper to update specific param on URL
  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // Reset pagination when filters change

    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // Toggle multiple sizes (e.g. ?size=M,L)
  function toggleSize(size: string) {
    const newSizes = activeSizes.includes(size)
      ? activeSizes.filter((s) => s !== size)
      : [...activeSizes, size];

    updateParam('size', newSizes.length > 0 ? newSizes.join(',') : null);
  }

  // Toggle color filter
  function toggleColor(color: string) {
    const newColors = activeColors.includes(color)
      ? activeColors.filter((c) => c !== color)
      : [...activeColors, color];

    updateParam('color', newColors.length > 0 ? newColors.join(',') : null);
  }

  // Apply custom input price range
  function handleCustomPriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (minInput) params.set('min_price', `${minInput}00`);
    else params.delete('min_price');

    if (maxInput) params.set('max_price', `${maxInput}00`);
    else params.delete('max_price');

    router.push(`${pathname}?${params.toString()}`);
  }

  // Clear all filters from URL
  function clearAllFilters() {
    setMinInput('');
    setMaxInput('');
    router.push(pathname);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Sheet.Trigger asChild>
        <button className="flex flex-1 items-center justify-center gap-2 border border-neutral-500 px-2.5 py-3 text-sm font-medium transition-colors hover:bg-black hover:text-white">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="font-archivo">Filter</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full font-archivo bg-black px-2 py-0.5 text-xs text-white">
              ({activeFilterCount})
            </span>
          )}
        </button>
      </Sheet.Trigger>

      <Sheet.Content side="right" size="md" className="flex h-full flex-col bg-white p-0">
        <Sheet.Header className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex w-full items-center justify-between">
            <div>
              <Sheet.Title className="text-lg font-bold text-black">
                <p className="text-black font-archivo-black">Filter & Refine</p>
              </Sheet.Title>
              <p className="text-xs font-archivo text-gray-500">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter(s) applied`
                  : 'No filters applied'}
              </p>
            </div>
          </div>
        </Sheet.Header>

        {/* Scrollable Filter Content */}
        <section className="flex-1 overflow-y-auto py-5">
          <Accordion
            type="multiple"
            defaultValue={['categories', 'colors', 'price', 'size', 'showonly']}
          >
            {/* CATEGORIES */}
            <Accordion.Item value="categories" className="border-b border-gray-100">
              <Accordion.Trigger
                openIcon={<PlusICon />}
                closeIcon={<CloseIcon />}
                className="px-6 py-4"
              >
                <span className="font-semibold font-archivo uppercase text-black">
                  Product type
                </span>
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {(categoriesData || []).map((cat: any) => {
                    const isSelected = activeCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => updateParam('category', isSelected ? null : cat.slug)}
                        className={cn(
                          'flex items-center cursor-pointer border px-3 py-2.5 text-left text-xs font-medium transition-colors justify-between',
                          isSelected
                            ? 'border-black bg-black font-archivo-black text-white'
                            : 'border-gray-200 bg-white text-gray-800 font-archivo hover:border-gray-400'
                        )}
                      >
                        <span className="capitalize">{cat?.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </Accordion.Content>
            </Accordion.Item>

            {/* SIZE */}
            <Accordion.Item value="size" className="border-b border-gray-100">
              <Accordion.Trigger
                openIcon={<PlusICon />}
                closeIcon={<CloseIcon />}
                className="px-6 py-4"
              >
                <span className="font-semibold font-archivo uppercase text-black">SIZE</span>
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4">
                <div className="grid grid-cols-4 gap-1.5">
                  {AVAILABLE_SIZES.map((sz) => {
                    const isSelected = activeSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        onClick={() => toggleSize(sz)}
                        className={cn(
                          'flex h-10 items-center cursor-pointer justify-center border text-xs font-semibold transition-all',
                          isSelected
                            ? 'border-black bg-black font-archivo-black text-white'
                            : 'border-gray-200 bg-white text-gray-800 font-archivo hover:border-gray-400'
                        )}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </Accordion.Content>
            </Accordion.Item>

            {/* COLORS */}
            <Accordion.Item value="colors" className="border-b border-gray-100">
              <Accordion.Trigger
                openIcon={<PlusICon />}
                closeIcon={<CloseIcon />}
                className="px-6 py-4"
              >
                <span className="font-semibold font-archivo uppercase text-black">COLORS</span>
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_COLORS.map((color, index) => {
                    const isSelected = activeColors.includes(color.name);
                    return (
                      <button
                        key={index}
                        onClick={() => toggleColor(color.name)}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer border px-3 py-2 text-xs font-medium transition-all',
                          isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                        )}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-gray-300 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="font-archivo">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </Accordion.Content>
            </Accordion.Item>

            {/* PRICE */}
            <Accordion.Item value="price" className="border-b border-gray-100">
              <Accordion.Trigger
                openIcon={<PlusICon />}
                closeIcon={<CloseIcon />}
                className="px-6 py-4"
              >
                <span className="font-semibold font-archivo uppercase text-black">PRICE</span>
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4 space-y-4">
                {/* Preset Options */}
                <div className="flex flex-col gap-2">
                  {PRICE_PRESETS.map((preset, idx) => {
                    const isSelected =
                      activeMinPrice === String(preset.min) &&
                      (preset.max ? activeMaxPrice === String(preset.max) : !activeMaxPrice);

                    return (
                      <label
                        key={idx}
                        className="flex font-archivo cursor-pointer items-center gap-3 text-sm text-gray-800 hover:text-black"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              updateParam('min_price', null);
                              updateParam('max_price', null);
                            } else {
                              const params = new URLSearchParams(searchParams.toString());
                              params.set('min_price', String(preset.min));
                              if (preset.max) params.set('max_price', String(preset.max));
                              else params.delete('max_price');
                              router.push(`${pathname}?${params.toString()}`);
                            }
                          }}
                          className="h-4 w-4 rounded-none cursor-pointer border-gray-300 accent-black"
                        />
                        <span>{preset.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Min / Max Form */}
                <form onSubmit={handleCustomPriceSubmit} className="pt-3 space-y-3">
                  <p className="text-xs font-semibold font-archivo text-gray-500 uppercase tracking-wider">
                    Custom Price Range
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="relative w-full">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400 font-archivo pointer-events-none">
                        ₦
                      </span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minInput}
                        onChange={(e) => setMinInput(e.target.value)}
                        className="w-full font-archivo border border-gray-300 pl-7 pr-3 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors"
                      />
                    </div>

                    <span className="text-gray-400 text-sm">–</span>

                    <div className="relative w-full">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400 font-archivo pointer-events-none">
                        ₦
                      </span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxInput}
                        onChange={(e) => setMaxInput(e.target.value)}
                        className="w-full font-archivo border border-gray-300 pl-7 pr-3 py-2 text-sm text-black focus:border-black focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full font-archivo bg-gray-100 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white"
                  >
                    Apply Price
                  </button>
                </form>
              </Accordion.Content>
            </Accordion.Item>

            {/* AVAILABILITY */}
            <Accordion.Item value="showonly">
              <Accordion.Trigger
                openIcon={<PlusICon />}
                closeIcon={<CloseIcon />}
                className="px-6 py-4"
              >
                <span className="font-semibold font-archivo uppercase text-black">
                  Availability
                </span>
              </Accordion.Trigger>
              <Accordion.Content className="px-6 pb-4">
                <div className="flex flex-col gap-2">
                  <label className="flex font-archivo cursor-pointer items-center justify-between text-sm text-gray-800">
                    <span>In Stock Only</span>
                    <input
                      type="checkbox"
                      checked={activeInStock === 'true'}
                      onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
                      className="h-4 w-4 border-gray-300 accent-black"
                    />
                  </label>

                  <label className="flex font-archivo cursor-pointer items-center justify-between text-sm text-gray-800">
                    <span>Out of Stock</span>
                    <input
                      type="checkbox"
                      checked={activeInStock === 'false'}
                      onChange={(e) => updateParam('in_stock', e.target.checked ? 'false' : null)}
                      className="h-4 w-4 border-gray-300 accent-black"
                    />
                  </label>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </section>

        <Sheet.Footer className="flex items-center gap-3 border-t border-gray-200 p-4 bg-white">
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex w-full items-center justify-center gap-2 rounded-none border border-gray-300 bg-white px-4 py-3.5 font-archivo text-sm font-medium text-black transition-all hover:bg-gray-50 hover:border-black active:scale-[0.99]"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-none bg-black px-4 py-3.5 font-archivo text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.99]"
          >
            Show Results
          </button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  );
}

function PlusICon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
