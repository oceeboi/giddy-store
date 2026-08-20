'use client';
import { ProductCard } from '@/components/comps';
import { Breadcrumb, FilterSheet, FilterSidebarDesktop, SortModal } from '@/components/shared';
import { SAMPLE_CLOTHING } from '@/constants/sample';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Grid2x2, Grid3x3, LayoutGrid, Rows } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type PublicProductListParams = {
  search?: string;
  brand?: string;
  category?: string;
  collection?: string;
  productType?: string;
  gender?: string;
  min_price?: number | string;
  max_price?: number | string;
  size?: string;
  in_stock?: 'true' | 'false' | boolean;
  sort?: SortType;
  page?: number | string;
  limit?: number | string;
};

type SortType = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

const SORT_DATA_TYPE: Record<SortType, string> = {
  newest: 'Newest Arrivals',
  oldest: 'Oldest First',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name_asc: 'Name: A to Z',
  name_desc: 'Name: Z to A',
};

type GridColumnType = 1 | 2 | 3 | 4;

const GRID_STORAGE_KEY = 'catalog_grid_cols';
const SORT_TYPES = Object.keys(SORT_DATA_TYPE) as SortType[];

export default function ShoppingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id?: string }>();

  const [isSortModalOpen, setIsSortModalOpen] = useState<boolean>(false);
  const [gridCols, setGridCols] = useState<GridColumnType>(3); // Fallback default to 3 columns

  // Load grid layout preference from localStorage on mount
  useEffect(() => {
    const savedCols = localStorage.getItem(GRID_STORAGE_KEY);
    if (savedCols) {
      const parsed = Number(savedCols) as GridColumnType;
      if ([1, 2, 3, 4].includes(parsed)) {
        setGridCols(parsed);
      }
    }
  }, []);

  // Update localStorage when layout preference changes
  function handleGridChange(cols: GridColumnType) {
    setGridCols(cols);
    localStorage.setItem(GRID_STORAGE_KEY, String(cols));
  }

  // Extract and map URL SearchParams to `PublicProductListParams`
  const queryParams = useMemo<PublicProductListParams>(() => {
    const category = searchParams.get('category')?.trim() || undefined;
    const brand = searchParams.get('brand')?.trim() || undefined;
    const collection = searchParams.get('collection')?.trim() || undefined;
    const productType = searchParams.get('productType')?.trim() || undefined;
    const gender = searchParams.get('gender')?.trim() || undefined;
    const search = searchParams.get('search')?.trim() || undefined;
    const min_price = searchParams.get('min_price') || undefined;
    const max_price = searchParams.get('max_price') || undefined;
    const size = searchParams.get('size')?.trim() || undefined;
    const in_stock_param = searchParams.get('in_stock');
    const sort = (searchParams.get('sort') as SortType) || 'newest';
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    let in_stock: PublicProductListParams['in_stock'] = undefined;
    if (in_stock_param === 'true') in_stock = 'true';
    if (in_stock_param === 'false') in_stock = 'false';

    return {
      search,
      brand,
      category,
      collection,
      productType,
      gender,
      min_price,
      max_price,
      size,
      in_stock,
      sort,
      page,
      limit,
    };
  }, [searchParams]);

  // Determine header title fallback
  const productName =
    queryParams.category ||
    queryParams.brand ||
    queryParams.search ||
    params?.id ||
    `MEN'S COLLECTION`;

  const selectedSort = queryParams.sort || 'newest';

  // Update URL parameters when changing sort
  function handleSortSelect(sortOption: SortType) {
    setIsSortModalOpen(false);

    const updatedParams = new URLSearchParams(searchParams.toString());
    updatedParams.set('sort', sortOption);
    updatedParams.delete('page'); // Reset to page 1 on sort change
    router.push(`${pathname}?${updatedParams.toString()}`);
  }

  // Dynamic CSS helper for grid column selection
  const gridClassMap: Record<GridColumnType, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <section className="min-h-screen bg-white">
      {/* Header & Breadcrumb Section */}
      <section className="px-4 lg:px-12 pt-8 lg:pt-12 pb-6 border-b border-gray-100">
        <Breadcrumb className="font-archivo text-xs text-gray-500 mb-2" />
        <div>
          <h1 className="lg:text-[44px] md:text-[36px] text-[28px] font-bold text-gray-900 font-archivo-black uppercase tracking-tight">
            {productName}
          </h1>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="px-4 lg:px-12 pt-8 lg:pb-16">
        <div className="flex flex-col gap-8 lg:flex-row items-start">
          {/* Sidebar Area */}
          <aside className="w-full lg:w-64 shrink-0">
            {/* Mobile Filter & Sort Bar */}
            <div className="relative lg:hidden">
              <div className="flex gap-2.5">
                <FilterSheet />
                <button
                  onClick={() => setIsSortModalOpen(true)}
                  className="flex flex-1 items-center justify-center gap-1 border border-neutral-400 px-3 py-3 text-sm font-medium whitespace-nowrap bg-white text-black"
                >
                  <span className="font-archivo text-xs">Sort by:</span>
                  <span className="font-archivo-black text-xs truncate max-w-[120px]">
                    {SORT_DATA_TYPE[selectedSort]}
                  </span>
                </button>
              </div>

              {/* Mobile Sort Overlay Modal */}
              <SortModal
                open={isSortModalOpen}
                onClose={() => setIsSortModalOpen(false)}
                selectedSort={selectedSort}
                onSelect={handleSortSelect}
              />
            </div>

            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block sticky top-24">
              <FilterSidebarDesktop />
            </div>
          </aside>

          {/* Product Catalog Display Area */}
          <main className="flex-1 min-w-0 w-full">
            {/* Desktop Top Header Bar (Product Count, Sort Dropdown & Grid Switcher) */}
            <div className="hidden lg:flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
              <p className="text-xs font-archivo font-medium text-gray-500">
                Showing <span className="font-bold text-black">5</span> products
              </p>

              <div className="flex items-center gap-6">
                {/* Desktop Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold font-archivo text-gray-500 uppercase tracking-wider">
                    Sort by:
                  </span>
                  <div className="relative group">
                    <button className="flex items-center font-archivo gap-2 border border-gray-300 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black hover:border-black transition-colors">
                      <span>{SORT_DATA_TYPE[selectedSort]}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    </button>

                    <div className="absolute right-0 top-full z-20 hidden w-48 pt-1 group-hover:block">
                      <div className="bg-white border border-gray-200 rounded-md shadow-lg py-1">
                        {SORT_TYPES.map((type) => {
                          const isActive = type === selectedSort;
                          return (
                            <button
                              key={type}
                              onClick={() => handleSortSelect(type)}
                              className={cn(
                                'flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors',
                                isActive
                                  ? 'bg-gray-100 font-archivo-black text-black'
                                  : 'text-gray-700 hover:bg-gray-50 font-archivo'
                              )}
                            >
                              <span>{SORT_DATA_TYPE[type]}</span>
                              {isActive && <Check className="w-3.5 h-3.5 text-black" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Persistent Grid Layout Column Switcher */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
                  <button
                    onClick={() => handleGridChange(1)}
                    title="1 Column (List)"
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      gridCols === 1
                        ? 'bg-black text-white shadow-xs'
                        : 'text-gray-500 hover:text-black'
                    )}
                  >
                    <Rows className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleGridChange(2)}
                    title="2 Columns"
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      gridCols === 2
                        ? 'bg-black text-white shadow-xs'
                        : 'text-gray-500 hover:text-black'
                    )}
                  >
                    <Grid2x2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleGridChange(3)}
                    title="3 Columns"
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      gridCols === 3
                        ? 'bg-black text-white shadow-xs'
                        : 'text-gray-500 hover:text-black'
                    )}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleGridChange(4)}
                    title="4 Columns"
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      gridCols === 4
                        ? 'bg-black text-white shadow-xs'
                        : 'text-gray-500 hover:text-black'
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className={cn('grid gap-x-4 gap-y-8', gridClassMap[gridCols])}>
              {Array.from({ length: 5 }).map((_, index) => (
                <ProductCard key={index} data={SAMPLE_CLOTHING} />
              ))}
            </div>
          </main>
        </div>
      </section>
    </section>
  );
}
