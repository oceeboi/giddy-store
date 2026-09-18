import http from '@/lib/ky';
import { CreateCheckoutDraftInput, createCheckoutDraftSchema } from '@/schemas/checkout.schema';
import { SterilizedCheckoutDraft } from '@/types/checkout-draft.type';
import { HTTPError } from 'ky';
import { z } from 'zod';

export type CheckoutInitializeInput = z.input<typeof initialize_checkout_schema>;
export type CheckoutOrderSnapshot = {
  id: string;
  orderNumber: string;
  status: 'pending_payment' | 'paid';
  total?: number;
};

export type CheckoutDraftWarning = {
  productId?: string;
  sizeId?: string;
  requested?: number;
  available?: number;
  oldPrice?: number;
  newPrice?: number;
  reason: string;
  message?: string;
};

export type CheckoutDraftResponse = {
  checkoutToken: string;
  shareableUrl: string;
  draft: SterilizedCheckoutDraft;
  warnings?: CheckoutDraftWarning[];
};

export type GetCheckoutDraftResponse = {
  success: boolean;
  draft: SterilizedCheckoutDraft;
  warnings?: CheckoutDraftWarning[];
};

export type CheckoutInitializationData = {
  order: CheckoutOrderSnapshot;
  reference?: string;
  authorizationUrl?: string;
  resumed?: boolean;
  paidWithCredit?: boolean;
  recoveredFromPreviousAttempt?: boolean;
};

export type CheckoutCallbackState = {
  reference: string | null;
  paymentStatus: string | null;
};

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; message: string; warnings?: CheckoutDraftWarning[] };

const REQUEST_TIMEOUT_MS = 30_000;

const DEFAULT_HTTP_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: 'Bad request. Please check your cart data.',
  401: 'Unauthorized. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'The request conflicts with the current resource state.',
  410: 'This checkout session has expired or items are no longer available.',
  422: 'Invalid input. Please check your data and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'A server error occurred. Please try again later.',
  502: 'Service is temporarily unavailable. Please try again later.',
  503: 'Service is temporarily unavailable. Please try again later.',
  504: 'The request timed out. Please try again.',
};

const initialize_checkout_schema = z.object({
  shippingAddressId: z.string().trim().min(1, 'Shipping address id is required.'),
  useStoreCredit: z.boolean().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      sizeId: z.string(),
      name: z.string(),
      size: z.string(),
      quantity: z.number().int().positive(),
      unitPriceKobo: z.number().int().nonnegative(),
    })
  ),
  shippingFeeKobo: z.number().int().nonnegative(),
});

export class CheckoutService {
  private static fromValidationError(error: z.ZodError): string {
    return error.issues.map((issue) => issue.message).join(', ');
  }

  private static async fromHttpError(
    error: unknown,
    fallback = 'An unexpected error occurred. Please try again.',
    status_overrides: Partial<Record<number, string>> = {}
  ): Promise<{ message: string; warnings?: CheckoutDraftWarning[] }> {
    if (!(error instanceof HTTPError)) {
      return { message: fallback };
    }

    const status = error.response?.status;
    let server_error_message: string | undefined;
    let server_warnings: CheckoutDraftWarning[] | undefined;

    try {
      const error_body = await error.response.json<{
        error?: string;
        message?: string;
        warnings?: CheckoutDraftWarning[];
      }>();
      server_error_message = error_body?.error || error_body?.message;
      server_warnings = error_body?.warnings;
    } catch {
      // Body reading failed, fallback to status codes
    }

    const message =
      server_error_message ||
      status_overrides[status] ||
      DEFAULT_HTTP_ERROR_MESSAGES[status] ||
      fallback;

    return { message, warnings: server_warnings };
  }

  private static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; message: string } {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return { success: false, message: CheckoutService.fromValidationError(parsed.error) };
    }

    return { success: true, data: parsed.data };
  }

  private async get<T>(
    path: string,
    search_params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const response = await http.get(path, {
      timeout: REQUEST_TIMEOUT_MS,
      ...(search_params && { searchParams: search_params }),
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

  async initializeCheckout(
    data: CheckoutInitializeInput
  ): Promise<ServiceResult<CheckoutInitializationData>> {
    const validation = CheckoutService.validate(initialize_checkout_schema, data);
    if (!validation.success) return validation;

    try {
      const response = await this.post<{ data: CheckoutInitializationData }>(
        'checkout/initialize',
        validation.data
      );

      return { success: true, data: response.data };
    } catch (error) {
      const { message } = await CheckoutService.fromHttpError(
        error,
        'Failed to initialize checkout.',
        {
          404: 'Shipping address or account context was not found.',
          409: 'Checkout is already in progress or cart stock changed.',
          502: 'Payment gateway initialization failed. Please try again.',
          503: 'Checkout is temporarily unavailable.',
        }
      );

      return { success: false, message };
    }
  }

  getCallbackState(input: URL | URLSearchParams | string): CheckoutCallbackState {
    const search_params =
      input instanceof URL
        ? input.searchParams
        : input instanceof URLSearchParams
          ? input
          : new URL(input, 'http://localhost').searchParams;

    return {
      reference: search_params.get('reference'),
      paymentStatus: search_params.get('paymentStatus'),
    };
  }

  async createCheckoutDraft(data: CreateCheckoutDraftInput): Promise<
    ServiceResult<{
      checkoutToken: string;
      shareableUrl: string;
      draft: CheckoutDraftResponse['draft'];
      warnings?: CheckoutDraftWarning[];
    }>
  > {
    const validation = CheckoutService.validate(createCheckoutDraftSchema, data);
    if (!validation.success) {
      console.error('Validation failed for createCheckoutDraft:', validation.message);
      return { success: false, message: validation.message };
    }

    try {
      const response = await this.post<{ success: boolean } & CheckoutDraftResponse>(
        'checkout/draft',
        validation.data
      );

      return {
        success: true,
        data: {
          checkoutToken: response.checkoutToken,
          shareableUrl: response.shareableUrl,
          draft: response.draft,
          warnings: response.warnings,
        },
      };
    } catch (error) {
      const { message, warnings } = await CheckoutService.fromHttpError(
        error,
        'Failed to create checkout draft.',
        {
          409: 'A checkout session with this token already exists.',
          423: 'Too many failed attempts. Account temporarily locked.',
        }
      );

      return { success: false, message, warnings };
    }
  }

  /**
   * Fetch a sterilized, self-healed checkout draft by token.
   */
  async getCheckoutDraft(token: string): Promise<
    ServiceResult<{
      success: boolean;
      draft: SterilizedCheckoutDraft;
      warnings?: CheckoutDraftWarning[];
    }>
  > {
    const sanitized_token = token?.trim();
    if (!sanitized_token) {
      return {
        success: false,
        message: 'Checkout token is required.',
      };
    }

    try {
      const response = await this.get<GetCheckoutDraftResponse>('checkout', {
        token: sanitized_token,
      });

      return {
        success: true,
        data: {
          success: response.success,
          draft: response.draft,
          warnings: response.warnings,
        },
      };
    } catch (error) {
      const { message, warnings } = await CheckoutService.fromHttpError(
        error,
        'Failed to retrieve checkout session.',
        {
          404: 'Checkout session not found or has expired.',
          410: 'This checkout session has expired or stock was exhausted.',
        }
      );

      return { success: false, message, warnings };
    }
  }
}

export const checkoutService = new CheckoutService();
