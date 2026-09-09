import http from '@/lib/ky';
import { createCheckoutDraftSchema } from '@/schemas/checkout.schema';
import { CheckoutDraftType, SterilizedCheckoutDraft } from '@/types/checkout-draft.type';
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
  410: 'The checkout session has expired.',
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
  draft: SterilizedCheckoutDraft;
};

export type GetCheckoutDraftResponse = {
  success: boolean;
  draft: SterilizedCheckoutDraft;
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
  private async get<T>(
    path: string,
    searchParams?: Record<string, string | number | boolean>
  ): Promise<T> {
    const response = await http.get(path, {
      timeout: REQUEST_TIMEOUT_MS,
      ...(searchParams && { searchParams }),
    });
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await http.post(path, {
      timeout: REQUEST_TIMEOUT_MS,
      ...(body !== undefined && { json: body }),
    });
    return response.json() as Promise<T>;
  }

  async createCheckoutDraft(data: CreateCheckoutDraftInput): Promise<
    ServiceResult<{
      checkoutToken: string;
      shareableUrl: string;
      draft: CheckoutDraftResponse['draft'];
    }>
  > {
    const validation = CheckoutService.validate(createCheckoutDraftSchema, data);
    if (!validation.success) {
      console.error('Validation failed for createCheckoutDraft:', validation.message);
      return { success: false, message: validation.message };
    }

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

  /**
   * Fetch a sterilized checkout draft by token.
   */
  async getCheckoutDraft(token: string): Promise<
    ServiceResult<{
      success: boolean;
      draft: SterilizedCheckoutDraft;
    }>
  > {
    if (!token || token.trim() === '') {
      return {
        success: false,
        message: 'Checkout token is required.',
      };
    }

    try {
      const response = await this.get<GetCheckoutDraftResponse>('/checkout/draft', { token });

      return {
        success: true,
        data: {
          success: response.success,
          draft: response.draft,
        },
      };
    } catch (error) {
      const message = await CheckoutService.fromHttpError(
        error,
        'Failed to retrieve checkout session.',
        {
          404: 'Checkout session not found or has expired.',
          410: 'This checkout session has expired. Please start a new checkout.',
        }
      );

      return { success: false, message };
    }
  }
}

export const checkoutService = new CheckoutService();
