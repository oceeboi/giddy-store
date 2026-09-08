import http from '@/lib/ky';
import { createCheckoutDraftSchema } from '@/schemas/checkout.schema';
import { HTTPError } from 'ky';
import { z } from 'zod';

export type ServiceResult<T> = { success: true; data: T } | { success: false; message: string };

const REQUEST_TIMEOUT_MS = 30_000;

const DEFAULT_HTTP_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: 'Bad request. Please check your data.',
  401: 'Unauthorized. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This resource already exists or is still in use.',
  422: 'Invalid input. Please check your data and try again.',
  423: 'Access temporarily locked. Please try again later.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'A server error occurred. Please try again later.',
  502: 'Service is temporarily unavailable. Please try again later.',
  503: 'Service is temporarily unavailable. Please try again later.',
  504: 'The request timed out. Please try again.',
};

export type CheckoutDraftResponse = {
  checkoutToken: string;
  shareableUrl: string;
  draft: {
    _id?: string;
    checkoutToken: string;
    status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
    customer: {
      userId?: string;
      guestEmail?: string;
      isVIP: boolean;
    };
    cartItems: Array<{
      productId: string;
      variantId: string;
      sku: string;
      title: string;
      size?: string;
      color?: string;
      unitPrice: number;
      quantity: number;
      image: string;
      isReserved: boolean;
    }>;
    shippingAddress?: {
      firstName: string;
      lastName: string;
      company?: string;
      email: string;
      phone: string;
      streetAddress: string;
      apartment?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    billingAddress?: {
      firstName: string;
      lastName: string;
      company?: string;
      email: string;
      phone: string;
      streetAddress: string;
      apartment?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    shippingMethod?: {
      id: string;
      name: string;
      carrier?: string;
      cost: number;
      estimatedDays?: string;
    };
    pricing: {
      subtotal: number;
      discountTotal: number;
      shippingCost: number;
      taxAmount: number;
      totalAmount: number;
      currency: string;
    };
    giftOptions?: {
      isGift: boolean;
      giftMessage?: string;
      complimentaryWrapping: boolean;
      hidePricingOnReceipt: boolean;
    };
    reservation?: {
      isReserved: boolean;
      holdDurationMinutes: number;
      reservedUntil?: string;
    };
    clientNotes?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type CreateCheckoutDraftInput = z.input<typeof createCheckoutDraftSchema>;

export class CheckoutService {
  private static fromValidationError(error: z.ZodError): string {
    return error.issues.map((issue) => issue.message).join(', ');
  }

  private static validate<T>(schema: z.ZodSchema<T>, data: unknown): ServiceResult<T> {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: CheckoutService.fromValidationError(parsed.error),
      };
    }

    return { success: true, data: parsed.data };
  }

  private static async fromHttpError(
    error: unknown,
    fallback = 'An unexpected error occurred. Please try again.',
    statusOverrides: Partial<Record<number, string>> = {}
  ): Promise<string> {
    if (!(error instanceof HTTPError)) {
      return fallback;
    }

    // Attempt to extract dynamic backend error message (e.g. from Zod or API handlers)
    try {
      const errorBody = await error.response.json<{ error?: string; message?: string }>();
      if (errorBody?.error) return errorBody.error;
      if (errorBody?.message) return errorBody.message;
    } catch {
      // Body parse failed, fall back to status code messages
    }

    const status = error.response?.status;
    return statusOverrides[status] ?? DEFAULT_HTTP_ERROR_MESSAGES[status] ?? fallback;
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await http.post(path, {
      timeout: REQUEST_TIMEOUT_MS,
      ...(body !== undefined && { json: body }),
    });
    return response.json() as Promise<T>;
  }

  async createCheckoutDraft(
    data: CreateCheckoutDraftInput
  ): Promise<
    ServiceResult<{
      checkoutToken: string;
      shareableUrl: string;
      draft: CheckoutDraftResponse['draft'];
    }>
  > {
    const validation = CheckoutService.validate(createCheckoutDraftSchema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.post<{ success: boolean } & CheckoutDraftResponse>(
        '/checkout/draft',
        validation.data
      );

      return {
        success: true,
        data: {
          checkoutToken: response.checkoutToken,
          shareableUrl: response.shareableUrl,
          draft: response.draft,
        },
      };
    } catch (error) {
      const message = await CheckoutService.fromHttpError(
        error,
        'Failed to create checkout draft.',
        {
          409: 'A checkout session with this token already exists.',
          423: 'Too many failed attempts. Account temporarily locked.',
        }
      );

      return { success: false, message };
    }
  }
}

export const checkoutService = new CheckoutService();
