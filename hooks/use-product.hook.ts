import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CreateProductInput } from '@/schemas/create-product.schema';
import { AdminProductListQueryParams, ProductService } from '@/services/product.service';
import { UpdateProductInput } from '@/schemas/update-product.schema';

const adminProductService = new ProductService();

// ==========================================
// Errors & Helpers
// ==========================================

class AdminProductServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminProductServiceError';
  }
}

type ServiceResult<T> = { success: true; data: T } | { success: false; message: string };

function unwrapResult<T>(result: ServiceResult<T>): T {
  if (!result.success) {
    throw new AdminProductServiceError(result.message);
  }
  return result.data;
}

// ==========================================
// Query Keys Factory
// ==========================================

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

export function useAdminProductDetailQuery(productId: string) {
  return useQuery({
    queryKey: adminProductKeys.detail(productId),
    queryFn: async () => unwrapResult(await adminProductService.getAdminProductById(productId)),
    enabled: Boolean(productId),
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  });
}

export function useAdminProductsListQuery(params?: AdminProductListQueryParams) {
  return useQuery({
    queryKey: adminProductKeys.list(params),
    queryFn: async () => {
      const result = await adminProductService.getAdminProducts(params);
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
      const result = await adminProductService.createAdminProduct(data);
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
      unwrapResult(await adminProductService.updateAdminProduct(productId, data)),
    onSuccess: (product, variables) => {
      queryClient.setQueryData(adminProductKeys.detail(variables.productId), product);
      queryClient.invalidateQueries({ queryKey: adminProductKeys.root });
    },
  });
}
