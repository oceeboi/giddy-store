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
  SlidersHorizontal,
} from 'lucide-react';

import { ProductCard } from '@/components/comps';
import {
  Breadcrumb,
  FilterSheet,
  FilterSidebarDesktop,
  HeroHeader,
  SortModal,
} from '@/components/shared';
import { usePublicProductsQuery } from '@/hooks/use-product.hook';
import { cn } from '@/lib/utils';
import { STORE_DETAILS } from '@/constants/store-details';

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
        {/* <Breadcrumb className="font-archivo text-xs text-gray-500 mb-2" /> */}

        <HeroHeader
          productName={productName}
          description={` Explore ${STORE_DETAILS.name} ${productName.toLocaleLowerCase()} clothing, from everyday essentials to elevated streetwear
              designed for a confident, contemporary look. Discover premium pieces from The leading
              Nigerian streetwear brand.`}
        />
      </section>
      <div className="mt-4 px-5 border-y border-gray-100 py-3 font-archivo">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Filter & Count */}
          <div className="flex items-center gap-4">
            <FilterSheet />
            <p className="whitespace-nowrap text-[11px] uppercase tracking-wider text-[#767676]">
              {clothing_data?.pagination?.total ?? 0}{' '}
              {clothing_data?.pagination?.total === 1 ? 'product' : 'products'}
            </p>
          </div>

          {/* Right: Sort Dropdown */}
          <div className="relative group cursor-pointer py-1">
            <div className="flex items-center gap-1 text-[11px] uppercase">
              <span className="text-[#767676] whitespace-nowrap">Sort by:</span>
              <span className="font-medium font-archivo truncate max-w-25 md:max-w-full  text-black">
                {SORT_DATA_TYPE[selectedSort]}
              </span>
            </div>

            {/* Hover Menu */}
            <div className="absolute right-0 top-full z-20 hidden w-48 pt-2 group-hover:block">
              <div className="border border-gray-100 bg-white shadow-lg">
                {SORT_TYPES.map((type) => {
                  const isActive = type === selectedSort;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSortSelect(type)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-2.5 text-left text-xs uppercase transition-colors',
                        isActive
                          ? 'bg-gray-100 font-semibold text-black'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span>{SORT_DATA_TYPE[type]}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-black" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content Layout */}
      <section className="px-4 lg:px-12 pt-8 pb-16">
        <div className="flex flex-col gap-8  items-start">
          {/* Sidebar Area */}

          {/* Product Catalog Display Area */}
          <main className="flex-1 min-w-0 w-full ">
            {/* Desktop Header Controls Bar */}

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
