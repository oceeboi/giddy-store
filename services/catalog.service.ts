import { z } from 'zod';
import { HTTPError } from 'ky';
import http from '@/lib/ky';
import {
  CreateBrandInput,
  createBrandSchema,
  createCategory,
  CreateCategoryInput,
  CreateCollectionInput,
  createCollectionSchema,
  CreateSizeInput,
  createSizeSchema,
} from '@/schemas/create-catalogs.schema';
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
  UpdateBrandInput,
  updateBrandSchema,
  UpdateCategoryInput,
  updateCategorySchema,
  UpdateCollectionInput,
  updateCollectionSchema,
  UpdateSizeInput,
  updateSizeSchema,
} from '@/schemas/update-catalogs.schema';

type ServiceResult<T> = { success: true; data: T } | { success: false; message: string };

const REQUEST_TIMEOUT_MS = 30_000;

const DEFAULT_HTTP_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: 'Bad request. Please check your data.',
  401: 'Unauthorized. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This resource already exists or is still in use.',
  422: 'Invalid input. Please check your data and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'A server error occurred. Please try again later.',
  502: 'Service is temporarily unavailable. Please try again later.',
  503: 'Service is temporarily unavailable. Please try again later.',
  504: 'The request timed out. Please try again.',
};

export class CatalogService {
  private static fromValidationError(error: z.ZodError): string {
    return error.issues.map((issue) => issue.message).join(', ');
  }

  private static fromHttpError(
    error: unknown,
    fallback = 'An unexpected error occurred. Please try again.',
    statusOverrides: Partial<Record<number, string>> = {}
  ): string {
    if (!(error instanceof HTTPError)) {
      return fallback;
    }

    const status = error.response?.status;
    return statusOverrides[status] ?? DEFAULT_HTTP_ERROR_MESSAGES[status] ?? fallback;
  }
  private static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; message: string } {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: CatalogService.fromValidationError(parsed.error) };
    }

    return { success: true, data: parsed.data };
  }

  private buildQuery(
    params?: Record<string, string | number | boolean | null | undefined>
  ): string {
    if (!params) return '';

    const search_params = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      search_params.set(key, String(value));
    }

    const serialized = search_params.toString();
    return serialized ? `?${serialized}` : '';
  }

  private async get<T>(path: string): Promise<T> {
    const response = await http.get(path, { timeout: REQUEST_TIMEOUT_MS });
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await http.post(path, {
      timeout: REQUEST_TIMEOUT_MS,
      ...(body !== undefined && { json: body }),
    });
    return response.json() as Promise<T>;
  }

  private async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await http.patch(path, {
      timeout: REQUEST_TIMEOUT_MS,
      ...(body !== undefined && { json: body }),
    });
    return response.json() as Promise<T>;
  }

  private async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await http.put(path, {
      timeout: REQUEST_TIMEOUT_MS,
      ...(body !== undefined && { json: body }),
    });
    return response.json() as Promise<T>;
  }

  private async delete<T>(path: string): Promise<T> {
    const response = await http.delete(path, { timeout: REQUEST_TIMEOUT_MS });
    return response.json() as Promise<T>;
  }

  async getAdminBrands(params?: AdminBrandListParams): Promise<
    ServiceResult<{
      brands: BrandData[];
      total: number;
    }>
  > {
    try {
      const query = this.buildQuery(params);
      const response = await this.get<{
        data: {
          brands: BrandData[];
          total: number;
        };
      }>(`admin/brand${query}`);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to fetch admin brand list.'),
      };
    }
  }

  async getAdminBrandById(brandId: string): Promise<ServiceResult<BrandData>> {
    const normalized_brand_id = brandId.trim();
    if (!normalized_brand_id) {
      return { success: false, message: 'Brand id is required.' };
    }

    try {
      const response = await this.get<{ data: { brand: BrandData } }>(
        `admin/brand/${encodeURIComponent(normalized_brand_id)}`
      );

      return { success: true, data: response.data.brand };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to fetch admin brand.', {
          404: 'Brand not found.',
        }),
      };
    }
  }

  async createAdminBrand(data: CreateBrandInput): Promise<ServiceResult<BrandData>> {
    const validation = CatalogService.validate(createBrandSchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.post<{ data: { brand: BrandData } }>(
        'admin/brand',
        validation.data
      );

      return { success: true, data: response.data.brand };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to create brand.', {
          409: 'A brand with this slug already exists.',
        }),
      };
    }
  }

  async updateAdminBrand(
    brandId: string,
    data: UpdateBrandInput
  ): Promise<ServiceResult<BrandData>> {
    const normalized_brand_id = brandId.trim();
    if (!normalized_brand_id) {
      return { success: false, message: 'Brand id is required.' };
    }

    const validation = CatalogService.validate(updateBrandSchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.patch<{ data: { brand: BrandData } }>(
        `admin/brand/${encodeURIComponent(normalized_brand_id)}`,
        validation.data
      );

      return { success: true, data: response.data.brand };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to update brand.', {
          404: 'Brand not found.',
          409: 'A brand with this slug already exists.',
        }),
      };
    }
  }

  async deleteAdminBrand(brandId: string): Promise<ServiceResult<{ deleted: boolean }>> {
    const normalized_brand_id = brandId.trim();
    if (!normalized_brand_id) {
      return { success: false, message: 'Brand id is required.' };
    }

    try {
      const response = await this.delete<{ data: { deleted: boolean } }>(
        `admin/brand/${encodeURIComponent(normalized_brand_id)}`
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to delete brand.', {
          404: 'Brand not found.',
          409: 'This brand is still referenced by products.',
        }),
      };
    }
  }

  //   ############ category below
  async getAdminCategories(params?: AdminCategoryListParams): Promise<
    ServiceResult<{
      categories: CategoryData[];
      total: number;
    }>
  > {
    try {
      const query = this.buildQuery(params);
      const response = await this.get<{
        data: {
          categories: CategoryData[];
          total: number;
        };
      }>(`admin/category${query}`);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to fetch admin category list.'),
      };
    }
  }

  async getAdminCategoryById(categoryId: string): Promise<ServiceResult<CategoryData>> {
    const normalized_category_id = categoryId.trim();
    if (!normalized_category_id) {
      return { success: false, message: 'Category id is required.' };
    }

    try {
      const response = await this.get<{ data: { category: CategoryData } }>(
        `admin/category/${encodeURIComponent(normalized_category_id)}`
      );

      return { success: true, data: response.data.category };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to fetch admin category.', {
          404: 'Category not found.',
        }),
      };
    }
  }
  async createAdminCategory(data: CreateCategoryInput): Promise<ServiceResult<CategoryData>> {
    const validation = CatalogService.validate(createCategory, data);
    if (!validation.success) return validation;

    try {
      const response = await this.post<{ data: { category: CategoryData } }>(
        'admin/category',
        validation.data
      );

      return { success: true, data: response.data.category };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to create category.', {
          404: 'Parent category not found.',
          409: 'A category with this slug already exists.',
        }),
      };
    }
  }
  async updateAdminCategory(
    categoryId: string,
    data: UpdateCategoryInput
  ): Promise<ServiceResult<CategoryData>> {
    const normalized_category_id = categoryId.trim();
    if (!normalized_category_id) {
      return { success: false, message: 'Category id is required.' };
    }

    const validation = CatalogService.validate(updateCategorySchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.patch<{ data: { category: CategoryData } }>(
        `admin/category/${encodeURIComponent(normalized_category_id)}`,
        validation.data
      );

      return { success: true, data: response.data.category };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to update category.', {
          404: 'Category or parent category not found.',
          409: 'A category with this slug already exists.',
        }),
      };
    }
  }
  async deleteAdminCategory(categoryId: string): Promise<ServiceResult<{ deleted: boolean }>> {
    const normalized_category_id = categoryId.trim();
    if (!normalized_category_id) {
      return { success: false, message: 'Category id is required.' };
    }

    try {
      const response = await this.delete<{ data: { deleted: boolean } }>(
        `admin/category/${encodeURIComponent(normalized_category_id)}`
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to delete category.', {
          404: 'Category not found.',
          409: 'This category is still referenced by child categories or products.',
        }),
      };
    }
  }

  //==== collections below

  async getAdminCollections(params?: AdminCollectionListParams): Promise<
    ServiceResult<{
      collections: CollectionData[];
      total: number;
    }>
  > {
    try {
      const query = this.buildQuery(params);
      const response = await this.get<{
        data: {
          collections: CollectionData[];
          total: number;
        };
      }>(`admin/collection${query}`);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to fetch admin collection list.'),
      };
    }
  }

  async getAdminCollectionById(collectionId: string): Promise<ServiceResult<CollectionData>> {
    const normalized_collection_id = collectionId.trim();
    if (!normalized_collection_id) {
      return { success: false, message: 'Collection id is required.' };
    }

    try {
      const response = await this.get<{ data: { collection: CollectionData } }>(
        `admin/collection/${encodeURIComponent(normalized_collection_id)}`
      );

      return { success: true, data: response.data.collection };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to fetch admin collection.', {
          404: 'Collection not found.',
        }),
      };
    }
  }

  async createAdminCollection(data: CreateCollectionInput): Promise<ServiceResult<CollectionData>> {
    const validation = CatalogService.validate(createCollectionSchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.post<{ data: { collection: CollectionData } }>(
        'admin/collection',
        validation.data
      );

      return { success: true, data: response.data.collection };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to create collection.', {
          409: 'A collection with this slug already exists.',
          422: 'Smart collections require at least one rule.',
        }),
      };
    }
  }

  async updateAdminCollection(
    collectionId: string,
    data: UpdateCollectionInput
  ): Promise<ServiceResult<CollectionData>> {
    const normalized_collection_id = collectionId.trim();
    if (!normalized_collection_id) {
      return { success: false, message: 'Collection id is required.' };
    }

    const validation = CatalogService.validate(updateCollectionSchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.patch<{ data: { collection: CollectionData } }>(
        `admin/collection/${encodeURIComponent(normalized_collection_id)}`,
        validation.data
      );

      return { success: true, data: response.data.collection };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to update collection.', {
          404: 'Collection not found.',
          409: 'A collection with this slug already exists.',
        }),
      };
    }
  }

  async deleteAdminCollection(collectionId: string): Promise<ServiceResult<{ deleted: boolean }>> {
    const normalized_collection_id = collectionId.trim();
    if (!normalized_collection_id) {
      return { success: false, message: 'Collection id is required.' };
    }

    try {
      const response = await this.delete<{ data: { deleted: boolean } }>(
        `admin/collection/${encodeURIComponent(normalized_collection_id)}`
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to delete collection.', {
          404: 'Collection not found.',
          409: 'This collection is still referenced by products.',
        }),
      };
    }
  }

  //==== size below

  async getAdminSize(params?: AdminSizeListParams): Promise<
    ServiceResult<{
      sizes: SizeData[];
      total: number;
    }>
  > {
    try {
      const query = this.buildQuery(params);
      const response = await this.get<{
        data: {
          sizes: SizeData[];
          total: number;
        };
      }>(`admin/size${query}`);

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to fetch admin size list.'),
      };
    }
  }

  async getAdminSizeById(sizeId: string): Promise<ServiceResult<SizeData>> {
    const normalized_size_id = sizeId.trim();
    if (!normalized_size_id) {
      return { success: false, message: 'Size id is required.' };
    }

    try {
      const response = await this.get<{ data: { size: SizeData } }>(
        `admin/size/${encodeURIComponent(normalized_size_id)}`
      );

      return { success: true, data: response.data.size };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to fetch admin size.', {
          404: 'Size not found.',
        }),
      };
    }
  }

  async createAdminSize(data: CreateSizeInput): Promise<ServiceResult<SizeData>> {
    const validation = CatalogService.validate(createSizeSchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.post<{ data: { size: SizeData } }>('admin/size', validation.data);

      return { success: true, data: response.data.size };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to create size.', {
          409: 'A size with this name already exists.',
        }),
      };
    }
  }

  async updateAdminSize(sizeId: string, data: UpdateSizeInput): Promise<ServiceResult<SizeData>> {
    const normalized_size_id = sizeId.trim();
    if (!normalized_size_id) {
      return { success: false, message: 'Size id is required.' };
    }

    const validation = CatalogService.validate(updateSizeSchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.patch<{ data: { size: SizeData } }>(
        `admin/size/${encodeURIComponent(normalized_size_id)}`,
        validation.data
      );

      return { success: true, data: response.data.size };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to update size.', {
          404: 'size not found.',
        }),
      };
    }
  }

  async deleteAdminSize(sizeId: string): Promise<ServiceResult<{ deleted: boolean }>> {
    const normalized_size_id = sizeId.trim();
    if (!normalized_size_id) {
      return { success: false, message: 'Size id is required.' };
    }

    try {
      const response = await this.delete<{ data: { deleted: boolean } }>(
        `admin/size/${encodeURIComponent(normalized_size_id)}`
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: CatalogService.fromHttpError(error, 'Failed to delete size.', {
          404: 'Size not found.',
          409: 'This size is still referenced by products.',
        }),
      };
    }
  }
}
