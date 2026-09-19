'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { shippingService } from '@/services/shipping.service';
import type {
  PublicShippingData,
  ShippingData,
  UpdateShippingInput,
} from '@/services/shipping.service';
import { checkoutKeys } from './checkout.hook';

type ServiceResult<T> = { success: true; data: T } | { success: false; message: string };

export class ShippingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShippingServiceError';
  }
}

function unwrapResult<T>(result: ServiceResult<T>): T {
  if (!result.success) {
    throw new ShippingServiceError(result.message);
  }

  return result.data;
}

export const shippingKeys = {
  all: ['shipping'] as const,
  public: () => [...shippingKeys.all, 'public'] as const,
  admin: () => [...shippingKeys.all, 'admin'] as const,
};

type QueryOptionsOf<TData> = Omit<
  UseQueryOptions<TData, ShippingServiceError>,
  'queryKey' | 'queryFn'
>;
type MutationOptionsOf<TData, TVariables> = Omit<
  UseMutationOptions<TData, ShippingServiceError, TVariables>,
  'mutationFn'
>;

export function useAdminShippingQuery(options?: QueryOptionsOf<ShippingData>) {
  return useQuery({
    queryKey: shippingKeys.admin(),
    queryFn: async () => unwrapResult(await shippingService.getAdminShipping()),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}

export function usePublicShippingQuery(options?: QueryOptionsOf<PublicShippingData>) {
  return useQuery({
    queryKey: shippingKeys.public(),
    queryFn: async () => unwrapResult(await shippingService.getPublicShipping()),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}
export function useUpdateShippingMutation(
  options?: MutationOptionsOf<ShippingData, UpdateShippingInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateShippingInput) =>
      unwrapResult(await shippingService.updateShipping(data)),
    onSuccess: async (settings, variables, onMutateResult, context) => {
      // Synchronously update the cache first
      queryClient.setQueryData(shippingKeys.admin(), settings);

      // Invalidate queries that need fresh refetching
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shippingKeys.all }),
        queryClient.invalidateQueries({ queryKey: checkoutKeys.all }),
      ]);

      options?.onSuccess?.(settings, variables, onMutateResult, context);
    },
    ...options,
  });
}
