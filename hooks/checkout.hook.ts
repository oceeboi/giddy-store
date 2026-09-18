'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { checkoutService } from '@/services/checkout.service';
import type {
  CheckoutCallbackState,
  CheckoutInitializeInput,
  CheckoutInitializationData,
  CheckoutDraftResponse,
  CheckoutDraftWarning,
} from '@/services/checkout.service';
import { CreateCheckoutDraftInput } from '@/schemas/checkout.schema';
import { SterilizedCheckoutDraft } from '@/types/checkout-draft.type';

type ServiceResult<T> =
  | { success: true; data: T; warnings?: CheckoutDraftWarning[] }
  | { success: false; message: string; warnings?: CheckoutDraftWarning[] };

type QueryOptionsOf<TData> = Omit<
  UseQueryOptions<TData, CheckoutServiceError, TData>,
  'queryKey' | 'queryFn'
>;

export class CheckoutServiceError extends Error {
  warnings?: CheckoutDraftWarning[];

  constructor(message: string, warnings?: CheckoutDraftWarning[]) {
    super(message);
    this.name = 'CheckoutServiceError';
    this.warnings = warnings;
  }
}

function unwrapResult<T>(result: ServiceResult<T>): { data: T; warnings?: CheckoutDraftWarning[] } {
  if (!result.success) {
    throw new CheckoutServiceError(result.message, result.warnings);
  }

  return { data: result.data, warnings: result.warnings };
}

export const checkoutKeys = {
  all: ['checkout'] as const,
  drafts: () => [...checkoutKeys.all, 'draft'] as const,
  draft: (token: string) => [...checkoutKeys.drafts(), token] as const,
};

type MutationOptionsOf<TData, TVariables> = Omit<
  UseMutationOptions<TData, CheckoutServiceError, TVariables>,
  'mutationFn'
>;

export function useCheckoutInitializeMutation(
  options?: MutationOptionsOf<CheckoutInitializationData, CheckoutInitializeInput>
) {
  return useMutation({
    mutationFn: async (data: CheckoutInitializeInput) => {
      const { data: result_data } = unwrapResult(await checkoutService.initializeCheckout(data));
      return result_data;
    },
    retry: false,
    ...options,
  });
}

export function useCheckoutCallbackState(
  input: URL | URLSearchParams | string
): CheckoutCallbackState {
  return checkoutService.getCallbackState(input);
}

export interface CreateCheckoutDraftPayload {
  checkoutToken: string;
  shareableUrl: string;
  draft: CheckoutDraftResponse['draft'];
  warnings?: CheckoutDraftWarning[];
}

/**
 * Hook to create or update a checkout draft session.
 */
export function useCreateCheckoutDraft() {
  const query_client = useQueryClient();

  return useMutation<CreateCheckoutDraftPayload, CheckoutServiceError, CreateCheckoutDraftInput>({
    mutationFn: async (input: CreateCheckoutDraftInput) => {
      const result = await checkoutService.createCheckoutDraft(input);
      const { data, warnings } = unwrapResult(result);
      return { ...data, warnings };
    },
    onSuccess: (data) => {
      // Prime the cache with the fresh draft
      query_client.setQueryData(checkoutKeys.draft(data.checkoutToken), {
        draft: data.draft,
        warnings: data.warnings,
      });

      query_client.invalidateQueries({ queryKey: checkoutKeys.drafts() });
    },
  });
}

export interface CheckoutDraftQueryResult {
  draft: SterilizedCheckoutDraft;
  warnings?: CheckoutDraftWarning[];
}

/**
 * Hook to fetch a sterilized checkout draft by token.
 * Evaluates live MongoDB stock and reservation statuses on every mount.
 */
export function useCheckoutDraft(
  token: string | undefined | null,
  options?: QueryOptionsOf<CheckoutDraftQueryResult>
) {
  const sanitized_token = token?.trim() ?? '';

  return useQuery({
    queryKey: checkoutKeys.draft(sanitized_token),
    queryFn: async () => {
      if (!sanitized_token) {
        throw new CheckoutServiceError('Checkout token is required.');
      }
      const result = await checkoutService.getCheckoutDraft(sanitized_token);
      const { data, warnings } = unwrapResult(result);

      return {
        draft: data.draft,
        warnings: warnings || data.warnings,
      };
    },
    enabled: Boolean(sanitized_token.length > 0),
    staleTime: 0, // Instant stale so self-healing re-verifies live inventory on refocus/mount
    gcTime: 1000 * 60 * 15, // 15-minute garbage collection window
    retry: (failure_count, error) => {
      if (error instanceof CheckoutServiceError) {
        return false;
      }
      return failure_count < 2;
    },
    ...options,
  });
}
