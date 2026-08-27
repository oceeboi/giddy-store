import { z } from 'zod';
import { HTTPError } from 'ky';
import http from '@/lib/ky';
import { ClothingProductData, Gender, ProductType } from '@/types/shared/product';
import { CreateProductInput, createProductSchema } from '@/schemas/create-product.schema';
import { UpdateProductInput, updateProductSchema } from '@/schemas/update-product.schema';

export type AdminProductListQueryParams = {
  search?: string;
  active?: 'true' | 'false';
  brand?: string;
  category?: string;
  collection?: string;
  productType?: ProductType;
  gender?: Gender;
};
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
export class ProductService {
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
      return { success: false, message: ProductService.fromValidationError(parsed.error) };
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

  async getAdminProducts(
    params?: AdminProductListQueryParams
  ): Promise<ServiceResult<{ products: ClothingProductData[]; total: number }>> {
    try {
      const query = this.buildQuery(params);
      const response = await this.get<{ data: { products: ClothingProductData[]; total: number } }>(
        `admin/product${query}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: ProductService.fromHttpError(error, 'Failed to fetch admin product list.'),
      };
    }
  }

  async getAdminProductById(productId: string): Promise<ServiceResult<ClothingProductData>> {
    const normalizedProductId = productId.trim();
    if (!normalizedProductId) return { success: false, message: 'Product id is required.' };

    try {
      const response = await this.get<{ data: { product: ClothingProductData } }>(
        `admin/product/${encodeURIComponent(normalizedProductId)}`
      );
      return { success: true, data: response.data.product };
    } catch (error) {
      return {
        success: false,
        message: ProductService.fromHttpError(error, 'Failed to fetch admin product.', {
          404: 'Product not found.',
        }),
      };
    }
  }

  async createAdminProduct(data: CreateProductInput): Promise<ServiceResult<ClothingProductData>> {
    const validation = ProductService.validate(createProductSchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.post<{ data: { product: ClothingProductData } }>(
        'admin/product',
        validation.data
      );

      return { success: true, data: response.data.product };
    } catch (error) {
      return {
        success: false,
        message: ProductService.fromHttpError(error, 'Failed to create product.', {
          404: 'One or more related catalog records were not found.',
          409: 'A product with this slug already exists.',
        }),
      };
    }
  }

  async updateAdminProduct(
    productId: string,
    data: UpdateProductInput
  ): Promise<ServiceResult<ClothingProductData>> {
    const normalizedProductId = productId.trim();
    if (!normalizedProductId) return { success: false, message: 'Product id is required.' };

    const validation = updateProductSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: validation.error.issues.map((i) => i.message).join(', ') };
    }

    try {
      const response = await this.patch<{ data: { product: ClothingProductData } }>(
        `admin/product/${encodeURIComponent(normalizedProductId)}`,
        validation.data
      );
      return { success: true, data: response.data.product };
    } catch (error) {
      return {
        success: false,
        message: ProductService.fromHttpError(error, 'Failed to update product.'),
      };
    }
  }
}
