import { z } from 'zod';
import { HTTPError } from 'ky';
import http from '@/lib/ky';
import { ClothingProductData } from '@/types/shared/product';
import { CreateProductInput, createProductSchema } from '@/schemas/create-product.schema';

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
}
