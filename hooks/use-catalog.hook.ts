import {
  CreateBrandInput,
  CreateCategoryInput,
  CreateCollectionInput,
  CreateSizeInput,
} from '@/schemas/create-catalogs.schema';
import {
  UpdateBrandInput,
  UpdateCategoryInput,
  UpdateCollectionInput,
  UpdateSizeInput,
} from '@/schemas/update-catalogs.schema';

import { CatalogService } from '@/services/catalog.service';
import {
  AdminBrandListParams,
  AdminCategoryListParams,
  AdminCollectionListParams,
  AdminSizeListParams,
  BrandData,
  CategoryData,
  CollectionData,
  SizeData,
} from '@/types/shared/catalog';
import {
  keepPreviousData,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';

const service = new CatalogService();
type ServiceResult<T> = { success: true; data: T } | { success: false; message: string };

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

function unwrapResult<T>(result: ServiceResult<T>): T {
  if (!result.success) {
    throw new ServiceError(result.message);
  }
  return result.data;
}
type QueryOptionsOf<TData> = Omit<UseQueryOptions<TData, ServiceError>, 'queryKey' | 'queryFn'>;
type MutationOptionsOf<TData, TVariables> = Omit<
  UseMutationOptions<TData, ServiceError, TVariables>,
  'mutationFn'
>;

//======== catalog keys ===

export const brandKeys = {
  all: ['brands'] as const,
  adminList: (params?: AdminBrandListParams) =>
    [...brandKeys.all, 'admin', 'list', params ?? {}] as const,
  adminDetail: (brandId: string) => [...brandKeys.all, 'admin', 'detail', brandId] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  adminList: (params?: AdminCategoryListParams) =>
    [...categoryKeys.all, 'admin', 'list', params ?? {}] as const,
  adminDetail: (categoryId: string) =>
    [...categoryKeys.all, 'admin', 'detail', categoryId] as const,
};

export const collectionKeys = {
  all: ['collections'] as const,
  adminList: (params?: AdminCollectionListParams) =>
    [...collectionKeys.all, 'admin', 'list', params ?? {}] as const,
  adminDetail: (collectionId: string) =>
    [...collectionKeys.all, 'admin', 'detail', collectionId] as const,
};

export const sizeKeys = {
  all: ['sizes'] as const,
  adminList: (params?: AdminSizeListParams) =>
    [...sizeKeys.all, 'admin', 'list', params ?? {}] as const,
  adminDetail: (sizeId: string) => [...sizeKeys.all, 'admin', 'detail', sizeId] as const,
};

// brand

export function useAdminBrandsQuery(
  params?: AdminBrandListParams,
  options?: QueryOptionsOf<{ brands: BrandData[]; total: number }>
) {
  return useQuery({
    queryKey: brandKeys.adminList(params),
    queryFn: async () => unwrapResult(await service.getAdminBrands(params)),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useAdminBrandQuery(brandId: string, options?: QueryOptionsOf<BrandData>) {
  return useQuery({
    queryKey: brandKeys.adminDetail(brandId),
    queryFn: async () => unwrapResult(await service.getAdminBrandById(brandId)),
    enabled: Boolean(brandId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}

export function useCreateBrand(options?: MutationOptionsOf<BrandData, CreateBrandInput>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBrandInput) =>
      unwrapResult(await service.createAdminBrand(data)),
    onSuccess: (brand, variables, onMutateResult, context) => {
      queryClient.setQueryData(brandKeys.adminDetail(brand.id), brand);
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      options?.onSuccess?.(brand, variables, onMutateResult, context);
    },
    ...options,
  });
}

type UpdateAdminBrandVariables = { brandId: string; data: UpdateBrandInput };
export function useUpdateBrandMutation(
  options?: MutationOptionsOf<BrandData, UpdateAdminBrandVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ brandId, data }: UpdateAdminBrandVariables) =>
      unwrapResult(await service.updateAdminBrand(brandId, data)),
    onSuccess: (brand, variables, onMutateResult, context) => {
      queryClient.setQueryData(brandKeys.adminDetail(variables.brandId), brand);
      queryClient.invalidateQueries({ queryKey: brandKeys.all });

      options?.onSuccess?.(brand, variables, onMutateResult, context);
    },
    ...options,
  });
}

export function useDeleteBrandMutation(options?: MutationOptionsOf<{ deleted: boolean }, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => unwrapResult(await service.deleteAdminBrand(brandId)),
    onSuccess: (result, brandId, onMutateResult, context) => {
      queryClient.removeQueries({ queryKey: brandKeys.adminDetail(brandId) });
      queryClient.invalidateQueries({ queryKey: brandKeys.all });

      options?.onSuccess?.(result, brandId, onMutateResult, context);
    },
    ...options,
  });
}

/// category

export function useAdminCategoriesQuery(
  params?: AdminCategoryListParams,
  options?: QueryOptionsOf<{ categories: CategoryData[]; total: number }>
) {
  return useQuery({
    queryKey: categoryKeys.adminList(params),
    queryFn: async () => unwrapResult(await service.getAdminCategories(params)),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useAdminCategoryQuery(categoryId: string, options?: QueryOptionsOf<CategoryData>) {
  return useQuery({
    queryKey: categoryKeys.adminDetail(categoryId),
    queryFn: async () => unwrapResult(await service.getAdminCategoryById(categoryId)),
    enabled: Boolean(categoryId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}

export function useCreateCategory(options?: MutationOptionsOf<CategoryData, CreateCategoryInput>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) =>
      unwrapResult(await service.createAdminCategory(data)),
    onSuccess: (category, variables, onMutateResult, context) => {
      queryClient.setQueryData(categoryKeys.adminDetail(category.id), category);
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      options?.onSuccess?.(category, variables, onMutateResult, context);
    },
    ...options,
  });
}
type UpdateAdminCategoryVariables = { categoryId: string; data: UpdateCategoryInput };

export function useUpdateCategoryMutation(
  options?: MutationOptionsOf<CategoryData, UpdateAdminCategoryVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, data }: UpdateAdminCategoryVariables) =>
      unwrapResult(await service.updateAdminCategory(categoryId, data)),
    onSuccess: (category, variables, onMutateResult, context) => {
      queryClient.setQueryData(categoryKeys.adminDetail(variables.categoryId), category);
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });

      options?.onSuccess?.(category, variables, onMutateResult, context);
    },
    ...options,
  });
}

export function useDeleteCategoryMutation(
  options?: MutationOptionsOf<{ deleted: boolean }, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) =>
      unwrapResult(await service.deleteAdminCategory(categoryId)),
    onSuccess: (result, categoryId, onMutateResult, context) => {
      queryClient.removeQueries({ queryKey: categoryKeys.adminDetail(categoryId) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });

      options?.onSuccess?.(result, categoryId, onMutateResult, context);
    },
    ...options,
  });
}
// collections
export function useAdminCollectionsQuery(
  params?: AdminCollectionListParams,
  options?: QueryOptionsOf<{ collections: CollectionData[]; total: number }>
) {
  return useQuery({
    queryKey: collectionKeys.adminList(params),
    queryFn: async () => unwrapResult(await service.getAdminCollections(params)),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useAdminCollectionQuery(
  collectionId: string,
  options?: QueryOptionsOf<CollectionData>
) {
  return useQuery({
    queryKey: collectionKeys.adminDetail(collectionId),
    queryFn: async () => unwrapResult(await service.getAdminCollectionById(collectionId)),
    enabled: Boolean(collectionId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}

export function useCreateCollection(
  options?: MutationOptionsOf<CollectionData, CreateCollectionInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCollectionInput) =>
      unwrapResult(await service.createAdminCollection(data)),
    onSuccess: (collection, variables, onMutateResult, context) => {
      queryClient.setQueryData(collectionKeys.adminDetail(collection.id), collection);
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      options?.onSuccess?.(collection, variables, onMutateResult, context);
    },
    ...options,
  });
}
type UpdateAdminCollectionVariables = { collectionId: string; data: UpdateCollectionInput };

export function useUpdateCollectionMutation(
  options?: MutationOptionsOf<CollectionData, UpdateAdminCollectionVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, data }: UpdateAdminCollectionVariables) =>
      unwrapResult(await service.updateAdminCollection(collectionId, data)),
    onSuccess: (collection, variables, onMutateResult, context) => {
      queryClient.setQueryData(collectionKeys.adminDetail(variables.collectionId), collection);
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });

      options?.onSuccess?.(collection, variables, onMutateResult, context);
    },
    ...options,
  });
}

export function useDeleteCollectionMutation(
  options?: MutationOptionsOf<{ deleted: boolean }, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) =>
      unwrapResult(await service.deleteAdminCollection(collectionId)),
    onSuccess: (result, collectionId, onMutateResult, context) => {
      queryClient.removeQueries({ queryKey: collectionKeys.adminDetail(collectionId) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });

      options?.onSuccess?.(result, collectionId, onMutateResult, context);
    },
    ...options,
  });
}

// size
export function useAdminSizesQuery(
  params?: AdminSizeListParams,
  options?: QueryOptionsOf<{ sizes: SizeData[]; total: number }>
) {
  return useQuery({
    queryKey: sizeKeys.adminList(params),
    queryFn: async () => unwrapResult(await service.getAdminSize(params)),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useAdminSizeQuery(sizeId: string, options?: QueryOptionsOf<SizeData>) {
  return useQuery({
    queryKey: sizeKeys.adminDetail(sizeId),
    queryFn: async () => unwrapResult(await service.getAdminSizeById(sizeId)),
    enabled: Boolean(sizeId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}

export function useCreateSize(options?: MutationOptionsOf<SizeData, CreateSizeInput>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSizeInput) => unwrapResult(await service.createAdminSize(data)),
    onSuccess: (size, variables, onMutateResult, context) => {
      queryClient.setQueryData(sizeKeys.adminDetail(size.id), size);
      queryClient.invalidateQueries({ queryKey: sizeKeys.all });
      options?.onSuccess?.(size, variables, onMutateResult, context);
    },
    ...options,
  });
}

type UpdateAdminSizeVariables = { sizeId: string; data: UpdateSizeInput };

export function useUpdateSizeMutation(
  options?: MutationOptionsOf<SizeData, UpdateAdminSizeVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sizeId, data }: UpdateAdminSizeVariables) =>
      unwrapResult(await service.updateAdminSize(sizeId, data)),
    onSuccess: (size, variables, onMutateResult, context) => {
      queryClient.setQueryData(collectionKeys.adminDetail(variables.sizeId), size);
      queryClient.invalidateQueries({ queryKey: sizeKeys.all });

      options?.onSuccess?.(size, variables, onMutateResult, context);
    },
    ...options,
  });
}

export function useDeleteSizeMutation(options?: MutationOptionsOf<{ deleted: boolean }, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sizeId: string) => unwrapResult(await service.deleteAdminSize(sizeId)),
    onSuccess: (result, sizeId, onMutateResult, context) => {
      queryClient.removeQueries({ queryKey: sizeKeys.adminDetail(sizeId) });
      queryClient.invalidateQueries({ queryKey: sizeKeys.all });

      options?.onSuccess?.(result, sizeId, onMutateResult, context);
    },
    ...options,
  });
}
