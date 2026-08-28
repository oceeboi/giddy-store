'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  Grid3x3,
  LayoutGrid,
  Rows,
} from 'lucide-react';

import { ProductCard } from '@/components/comps';
import { Breadcrumb, FilterSheet, FilterSidebarDesktop, SortModal } from '@/components/shared';
import { usePublicProductsQuery } from '@/hooks/use-product.hook';
import { cn } from '@/lib/utils';

type PublicProductListParams = {
  search?: string;
  brand?: string;
  category?: string;
  collection?: string;
  productType?: string;
  gender?: string;
  color?: string;
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
  const [gridCols, setGridCols] = useState<GridColumnType>(3);

  useEffect(() => {
    const savedCols = localStorage.getItem(GRID_STORAGE_KEY);
    if (savedCols) {
      const parsed = Number(savedCols) as GridColumnType;
      if ([1, 2, 3, 4].includes(parsed)) {
        setGridCols(parsed);
      }
    }
  }, []);

  function handleGridChange(cols: GridColumnType) {
    setGridCols(cols);
    localStorage.setItem(GRID_STORAGE_KEY, String(cols));
  }

  // Extract search params with standard fallback limit of 16 items per page
  const queryParams = useMemo<PublicProductListParams>(() => {
    const category = searchParams.get('category')?.trim() || undefined;
    const brand = searchParams.get('brand')?.trim() || undefined;
    const collection = searchParams.get('collection')?.trim() || undefined;
    const productType = searchParams.get('productType')?.trim() || undefined;
    const gender = searchParams.get('gender')?.trim() || undefined;
    const search = searchParams.get('search')?.trim() || undefined;
    const color = searchParams.get('color')?.trim() || undefined;
    const min_price = searchParams.get('min_price') || undefined;
    const max_price = searchParams.get('max_price') || undefined;
    const size = searchParams.get('size')?.trim() || undefined;
    const in_stock_param = searchParams.get('in_stock');
    const sort = (searchParams.get('sort') as SortType) || 'newest';
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 16;

    let in_stock: PublicProductListParams['in_stock'] = undefined;
    if (in_stock_param === 'true') in_stock = 'true';
    if (in_stock_param === 'false') in_stock = 'false';

    return {
      color,
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

  const { data: clothing_data, isLoading } = usePublicProductsQuery(queryParams);

  const pagination = clothing_data?.pagination ?? {
    page: Number(queryParams.page || 1),
    limit: Number(queryParams.limit || 16),
    total: 0,
    totalPages: 1,
  };

  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const totalItems = pagination.total;

  const productName =
    queryParams.category ||
    queryParams.brand ||
    queryParams.search ||
    params?.id ||
    queryParams.color ||
    `MEN'S COLLECTION`;

  const selectedSort = queryParams.sort || 'newest';

  // Navigation handlers
  function handleParamChange(key: string, value: string | number | null) {
    const updatedParams = new URLSearchParams(searchParams.toString());
    if (value === null || value === undefined) {
      updatedParams.delete(key);
    } else {
      updatedParams.set(key, String(value));
    }
    router.push(`${pathname}?${updatedParams.toString()}`);
  }

  function handleSortSelect(sortOption: SortType) {
    setIsSortModalOpen(false);
    const updatedParams = new URLSearchParams(searchParams.toString());
    updatedParams.set('sort', sortOption);
    updatedParams.set('page', '1'); // Reset to page 1 on sort change
    router.push(`${pathname}?${updatedParams.toString()}`);
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    handleParamChange('page', newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Generate pagination links array with ellipsis calculations
  const paginationRange = useMemo(() => {
    const range: (number | '...')[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  }, [currentPage, totalPages]);

  const gridClassMap: Record<GridColumnType, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  // Showing X - Y of Z text calculation
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pagination.limit + 1;
  const endItem = Math.min(currentPage * pagination.limit, totalItems);

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
      <section className="px-4 lg:px-12 pt-8 pb-16">
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
                  <span className="font-archivo-black text-xs truncate max-w-30">
                    {SORT_DATA_TYPE[selectedSort]}
                  </span>
                </button>
              </div>

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
          <main className="flex-1 min-w-0 w-full ">
            {/* Desktop Header Controls Bar */}
            <div className="hidden lg:flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
              <p className="text-xs font-archivo font-medium text-gray-500">
                Showing{' '}
                <span className="font-bold text-black">
                  {startItem}-{endItem}
                </span>{' '}
                of <span className="font-bold text-black">{totalItems}</span> products
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
                  {(
                    [
                      { cols: 1, icon: Rows, title: '1 Column (List)' },
                      { cols: 2, icon: Grid2x2, title: '2 Columns' },
                      { cols: 3, icon: Grid3x3, title: '3 Columns' },
                      { cols: 4, icon: LayoutGrid, title: '4 Columns' },
                    ] as const
                  ).map(({ cols, icon: Icon, title }) => (
                    <button
                      key={cols}
                      onClick={() => handleGridChange(cols)}
                      title={title}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        gridCols === cols
                          ? 'bg-black text-white shadow-xs'
                          : 'text-gray-500 hover:text-black'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Product Cards Grid & Loading Skeleton */}
            {isLoading ? (
              <div className={cn('grid gap-x-4 gap-y-8', gridClassMap[gridCols])}>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse flex flex-col gap-3">
                    <div className="aspect-3/4 w-full bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                ))}
              </div>
            ) : clothing_data?.products.length === 0 ? (
              <div className="border border-gray-200 py-16 text-center">
                <p className="font-archivo text-base font-semibold text-gray-900">
                  No products found
                </p>
                <p className="font-archivo text-xs text-gray-500 mt-1">
                  Try clearing some filters to see more results.
                </p>
              </div>
            ) : (
              <div className={cn('grid gap-x-4 gap-y-8 min-h-[50dvh]', gridClassMap[gridCols])}>
                {clothing_data?.products.map((product) => (
                  <ProductCard key={product.id} data={product} />
                ))}
              </div>
            )}
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6 font-archivo">
                <p className="text-xs text-gray-500">
                  Page <span className="font-semibold text-black">{currentPage}</span> of{' '}
                  <span className="font-semibold text-black">{totalPages}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex h-9 items-center justify-center gap-1 border border-gray-300 bg-white px-3 text-xs font-semibold text-black transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {paginationRange.map((item, index) => {
                      if (item === '...') {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="flex h-9 w-8 items-center justify-center text-xs text-gray-400"
                          >
                            …
                          </span>
                        );
                      }

                      const isSelected = item === currentPage;
                      return (
                        <button
                          key={item}
                          onClick={() => handlePageChange(item)}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center border text-xs font-semibold transition-colors',
                            isSelected
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-black'
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="flex h-9 items-center justify-center gap-1 border border-gray-300 bg-white px-3 text-xs font-semibold text-black transition-colors hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
    </section>
  );
}
