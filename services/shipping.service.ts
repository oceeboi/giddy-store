import http from '@/lib/ky';
import { HTTPError } from 'ky';
import { z } from 'zod';

export type ShippingData = {
  shippingFee: number;
  isShippingFree: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type PublicShippingData = {
  shippingFee: number;
  isShippingFree: boolean;
  updatedAt?: Date | string;
};

export type UpdateShippingInput = {
  shippingFee?: number;
  isShippingFree?: boolean;
};

type ServiceResult<T> = { success: true; data: T } | { success: false; message: string };

const REQUEST_TIMEOUT_MS = 30_000;

const DEFAULT_HTTP_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: 'Bad request. Please check your data.',
  401: 'Unauthorized. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'The request conflicts with the current resource state.',
  422: 'Invalid input. Please check your data and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'A server error occurred. Please try again later.',
  502: 'Service is temporarily unavailable. Please try again later.',
  503: 'Service is temporarily unavailable. Please try again later.',
  504: 'The request timed out. Please try again.',
};

const update_shipping_schema = z
  .object({
    shippingFee: z
      .number({
        message: 'Shipping fee must be a number',
      })
      .min(0, 'Shipping fee cannot be negative')
      .optional(),
    isShippingFree: z
      .boolean({
        message: 'isShippingFree must be a boolean',
      })
      .optional(),
  })
  .refine((data) => data.shippingFee !== undefined || data.isShippingFree !== undefined, {
    message: 'At least one field (shippingFee or isShippingFree) must be provided for update',
  });

export class ShippingService {
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

  private static validate<T>(schema: z.ZodSchema<T>, data: unknown): ServiceResult<T> {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: ShippingService.fromValidationError(parsed.error) };
    }

    return { success: true, data: parsed.data };
  }

  private async get<T>(path: string): Promise<T> {
    const response = await http.get(path, { timeout: REQUEST_TIMEOUT_MS });
    return response.json() as Promise<T>;
  }

  private async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await http.patch(path, {
      timeout: REQUEST_TIMEOUT_MS,
      ...(body !== undefined && { json: body }),
    });
    return response.json() as Promise<T>;
  }

  async getAdminShipping(): Promise<ServiceResult<ShippingData>> {
    try {
      const response = await this.get<{ data: { settings: ShippingData } }>('admin/shipping');

      return { success: true, data: response.data.settings };
    } catch (error) {
      return {
        success: false,
        message: ShippingService.fromHttpError(error, 'Failed to fetch shipping settings.'),
      };
    }
  }

  async getPublicShipping(): Promise<ServiceResult<PublicShippingData>> {
    try {
      const response = await this.get<{ data: { settings: PublicShippingData } }>('shipping');
      return { success: true, data: response.data.settings };
    } catch (error) {
      return {
        success: false,
        message: ShippingService.fromHttpError(error, 'Failed to fetch shipping details.'),
      };
    }
  }

  async updateShipping(data: UpdateShippingInput): Promise<ServiceResult<ShippingData>> {
    const validation = ShippingService.validate(update_shipping_schema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.patch<{ data: { settings: ShippingData } }>(
        'admin/shipping',
        validation.data
      );

      return { success: true, data: response.data.settings };
    } catch (error) {
      return {
        success: false,
        message: ShippingService.fromHttpError(error, 'Failed to update shipping settings.', {
          404: 'Shipping settings not found.',
        }),
      };
    }
  }
}

export const shippingService = new ShippingService();
