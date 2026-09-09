import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkoutService,
  CheckoutDraftResponse,
  CreateCheckoutDraftInput,
} from '@/services/checkout.service';

// ==========================================
// Query Keys Factory
// ==========================================
export const checkoutKeys = {
  all: ['checkout'] as const,
  drafts: () => [...checkoutKeys.all, 'draft'] as const,
  draft: (token: string) => [...checkoutKeys.drafts(), token] as const,
};

// ==========================================
// Errors & Helpers
// ==========================================
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

type ServiceResult<T> = { success: true; data: T } | { success: false; message: string };

function unwrapResult<T>(result: ServiceResult<T>): T {
  if (!result.success) {
    throw new ServiceError(result.message || 'The service request failed.');
  }
  return result.data;
}

// ==========================================
// Hooks
// ==========================================

export interface CreateCheckoutDraftPayload {
  checkoutToken: string;
  shareableUrl: string;
  draft: CheckoutDraftResponse['draft'];
}

/**
 * Hook to create or update a checkout draft session.
 *
 * Usage:
 * const { mutate: createDraft, isPending, error } = useCreateCheckoutDraft();
 * createDraft(cartPayload);
 */
export function useCreateCheckoutDraft() {
  const queryClient = useQueryClient();

  return useMutation<CreateCheckoutDraftPayload, ServiceError, CreateCheckoutDraftInput>({
    mutationFn: async (input: CreateCheckoutDraftInput) => {
      console.log('Creating checkout draft with input:', input);
      const result = await checkoutService.createCheckoutDraft(input);
      return unwrapResult(result);
    },
    onSuccess: (data) => {
      // 1. Instantly seed/prime the query cache for this specific checkout token
      queryClient.setQueryData(checkoutKeys.draft(data.checkoutToken), data.draft);

      // 2. Invalidate any active draft list queries to refetch in background
      queryClient.invalidateQueries({ queryKey: checkoutKeys.drafts() });
    },
  });
}
