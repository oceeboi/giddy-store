import { createColumnHelper, tableFeatures } from '@tanstack/react-table';
import Image from 'next/image';
import { ClothingProductData, ProductMedia } from '@/types/shared/product';
import { format_currency } from '@/utils/format';
import { EllipsisVertical } from 'lucide-react';
import { Sheet } from '@/components/shared';
import { useState } from 'react';
import { ProductUpdate } from '@/components/comps/products/admin/product-update';
import { useUpdateAdminProductMutation } from '@/hooks/use-product.hook';
import { toast } from '@/components/toast/toast';

// 3. New in V9! Tell the table which features and row models we want to use.
// In this case, this will be a basic table with no additional features.
export const features = tableFeatures({}); // util method to create sharable TFeatures object/type

const columnHelper = createColumnHelper<typeof features, ClothingProductData>();

// Picks the best thumbnail: prefers type "image" over video/other, then
// respects the explicit `order` field rather than trusting array index.
function get_primary_image(media: ProductMedia[]): ProductMedia | undefined {
  if (!media.length) return undefined;
  const images = media.filter((item) => item.type === 'image');
  const pool = images.length > 0 ? images : media;
  return [...pool].sort((a, b) => a.order - b.order)[0];
}

export const productColumns = [
  // 1. Primary Product Info (Image, Name, & Slug)
  columnHelper.accessor('name', {
    header: 'Product',
    cell: ({ row }) => {
      const product = row.original;
      const primaryImage = get_primary_image(product.media ?? []);

      return (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-none border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                N/A
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {product.name}
            </span>
            <span className="text-xs text-neutral-500 font-mono truncate">{product.slug}</span>
          </div>
        </div>
      );
    },
  }),

  // 2. Brand
  columnHelper.accessor('brand', {
    header: 'Brand',
    cell: ({ getValue }) => {
      const brand = getValue();
      return (
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {brand?.name ?? '—'}
        </span>
      );
    },
  }),

  // 3. Category
  columnHelper.accessor('category', {
    header: 'Category',
    cell: ({ getValue }) => {
      const category = getValue();
      return (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {category?.name ?? '—'}
        </span>
      );
    },
  }),

  // 4. Product Type & Gender
  columnHelper.accessor('productType', {
    header: 'Type / Gender',
    cell: ({ row }) => (
      <div className="flex flex-col text-xs capitalize">
        <span className="font-medium text-neutral-800 dark:text-neutral-200">
          {row.original.productType}
        </span>
        <span className="text-neutral-500">{row.original.gender}</span>
      </div>
    ),
  }),

  // 5. Pricing (Base & Compare At)
  columnHelper.accessor('pricing', {
    header: 'Price',
    cell: ({ getValue }) => {
      const pricing = getValue();
      if (!pricing) return <span className="text-sm text-neutral-400">—</span>;

      return (
        <div className="flex flex-col text-sm">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {format_currency(pricing.basePrice)}
          </span>
          {pricing.compareAtPrice != null && (
            <span className="text-xs text-neutral-400 line-through">
              {format_currency(pricing.compareAtPrice)}
            </span>
          )}
        </div>
      );
    },
  }),

  // 6. Variants & Stock Aggregation
  columnHelper.accessor('variants', {
    header: 'Inventory',
    cell: ({ getValue }) => {
      const variants = getValue() ?? [];
      const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
      const totalAvailable = variants.reduce((sum, v) => sum + v.availableQuantity, 0);

      return (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {totalAvailable} Available
          </span>
          <span className="text-neutral-500">
            {variants.length} variant{variants.length !== 1 ? 's' : ''} ({totalStock} total)
          </span>
        </div>
      );
    },
  }),

  // 7. Colors Swatches
  columnHelper.accessor('colors', {
    header: 'Colors',
    cell: ({ getValue }) => {
      const colors = getValue() ?? [];
      if (!colors.length) return <span className="text-xs text-neutral-400">—</span>;

      return (
        <div className="flex items-center gap-1">
          {colors.slice(0, 4).map((color) => (
            <span
              key={color.id}
              className="h-4 w-4 rounded-full border border-neutral-300 dark:border-neutral-700"
              style={
                color.swatchImage
                  ? { backgroundImage: `url(${color.swatchImage})`, backgroundSize: 'cover' }
                  : { backgroundColor: color.hexCode ?? '#ccc' }
              }
              title={color.name}
            />
          ))}
          {colors.length > 4 && (
            <span className="text-xs text-neutral-500 font-mono">+{colors.length - 4}</span>
          )}
        </div>
      );
    },
  }),

  // 8. Status Badge
  columnHelper.accessor('active', {
    header: 'Status',
    cell: ({ getValue, row }) => {
      // `active` is optional on ClothingProductData — treat missing as Draft, not Active.
      const { mutate: update_product } = useUpdateAdminProductMutation();
      const isActive = getValue() ?? false;
      const product = row.original;

      async function toggleState(b: boolean) {
        await toast.promise(
          new Promise((resolve, reject) => {
            update_product(
              {
                data: {
                  product_name: product.name,
                  product_brand: product.brand?.id,
                  product_category: product.category?.id,
                  product_collections:
                    product.collections?.map((c: any) => c.id ?? c._id ?? c) ?? [],
                  product_active: !product.active,
                },
                productId: product.id,
              },
              {
                onSuccess: (response) => {
                  resolve(response);
                },
                onError: (err) => reject(err),
              }
            );
          }),
          {
            pending: 'Updating.. product…',
            success: 'Product Updated',
            error: (err) => (err instanceof Error ? err.message : 'Something went wrong'),
          }
        );
      }
      return (
        <div
          onClick={() => {
            toggleState(isActive);
          }}
        >
          <span
            className={`inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-medium ${
              isActive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            {isActive ? 'Active' : 'Draft'}
          </span>
        </div>
      );
    },
  }),

  columnHelper.display({
    header: 'Actions',
    cell: ({ row }) => {
      const [isOpen, setIsOpen] = useState<boolean>(false);

      const product = row.original;

      return (
        <div className="flex text-center items-center justify-center">
          <div>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <Sheet.Trigger asChild>
                <button>
                  <EllipsisVertical className="w-5 h-5 text-gray-500 cursor-pointer" />
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
      );
    },
  }),
];
