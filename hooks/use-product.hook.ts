import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';

import { CreateProductInput } from '@/schemas/create-product.schema';
import {
  AdminProductListQueryParams,
  BestSellerListParams,
  ProductPagination,
  ProductService,
  PublicProductListParams,
} from '@/services/product.service';
import { UpdateProductInput } from '@/schemas/update-product.schema';
import { ClothingProductData } from '@/types/shared/product';

const service_product = new ProductService();

// ==========================================
// Errors & Helpers
// ==========================================

class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

type ServiceResult<T> = { success: true; data: T } | { success: false; message: string };

function unwrapResult<T>(result: ServiceResult<T>): T {
  if (!result.success) {
    throw new ServiceError(result.message);
  }
  return result.data;
}
type QueryOptionsOf<TData> = Omit<UseQueryOptions<TData, ServiceError>, 'queryKey' | 'queryFn'>;

// ==========================================
// Query Keys Factory
// ==========================================

export const productKeys = {
  all: ['products'] as const,
  publicAll: () => [...productKeys.all, 'public'] as const,
  publicList: (params?: PublicProductListParams) =>
    [...productKeys.publicAll(), 'list', params ?? {}] as const,
  bestSellers: (params?: BestSellerListParams) =>
    [...productKeys.publicAll(), 'best-sellers', params ?? {}] as const,
  publicDetail: (slug: string) => [...productKeys.publicAll(), 'detail', slug] as const,
};

export const adminProductKeys = {
  root: ['admin-products'] as const,
  lists: () => [...adminProductKeys.root, 'list'] as const,
  list: (params?: AdminProductListQueryParams) =>
    [...adminProductKeys.lists(), params ?? {}] as const,
  details: () => [...adminProductKeys.root, 'detail'] as const,
  detail: (productId: string) => [...adminProductKeys.details(), productId] as const,
  sizeList: (productId: string) => [...adminProductKeys.root, 'sizes', productId] as const,
  mediaList: (productId: string) => [...adminProductKeys.root, 'media', productId] as const,
  inventory: (productId: string, params?: AdminProductListQueryParams) =>
    [...adminProductKeys.root, 'inventory', productId, params ?? {}] as const,
};

// ==========================================
// Custom React Query Hooks
// ==========================================

// ======================
// Public
//=======================
export function usePublicProductsQuery(
  params?: PublicProductListParams,
  options?: QueryOptionsOf<{ products: ClothingProductData[]; pagination: ProductPagination }>
) {
  return useQuery({
    queryKey: productKeys.publicList(params),
    queryFn: async () => unwrapResult(await service_product.getProducts(params)),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function usePublicProductQuery(slug: string, options?: QueryOptionsOf<ClothingProductData>) {
  return useQuery({
    queryKey: productKeys.publicDetail(slug),
    queryFn: async () => unwrapResult(await service_product.getProductBySlug(slug)),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

//==================
// Admin
//=============

export function useAdminProductDetailQuery(productId: string) {
  return useQuery({
    queryKey: adminProductKeys.detail(productId),
    queryFn: async () => unwrapResult(await service_product.getAdminProductById(productId)),
    enabled: Boolean(productId),
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  });
}

export function useAdminProductsListQuery(params?: AdminProductListQueryParams) {
  return useQuery({
    queryKey: adminProductKeys.list(params),
    queryFn: async () => {
      const result = await service_product.getAdminProducts(params);
      return unwrapResult(result);
    },
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const result = await service_product.createAdminProduct(data);
      return unwrapResult(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProductKeys.root });
    },
  });
}

export function useUpdateAdminProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: UpdateProductInput }) =>
      unwrapResult(await service_product.updateAdminProduct(productId, data)),
    onSuccess: (product, variables) => {
      queryClient.setQueryData(adminProductKeys.detail(variables.productId), product);
      queryClient.invalidateQueries({ queryKey: adminProductKeys.root });
    },
  });
}
