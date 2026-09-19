'use client';

import { toast } from '@/components/toast/toast';
import { useAdminShippingQuery, useUpdateShippingMutation } from '@/hooks/shipping.hook';
import { format_currency } from '@/utils/format';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RefreshCw, Save, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';

import z from 'zod';

const updateShippingSchema = z.object({
  shippingFee: z.coerce
    .number({
      message: 'Shipping fee must be a valid number',
    })
    .min(0, 'Shipping fee cannot be negative'),
  isShippingFree: z.boolean().default(false),
});

type UpdateShippingFormValues = z.input<typeof updateShippingSchema>;

function formatDate(value: Date | string | undefined): string {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function ShippingManagementCard() {
  const { data: settings, isLoading, isError, refetch, error } = useAdminShippingQuery();
  const { mutate: updateShipping, isPending } = useUpdateShippingMutation();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateShippingFormValues>({
    resolver: zodResolver(updateShippingSchema),
    // `values` keeps form fields reactively synchronized when remote query data resolves
    values: {
      shippingFee: settings?.shippingFee ?? 0,
      isShippingFree: settings?.isShippingFree ?? false,
    },
  });

  const shippingfee = watch('shippingFee') || 0;
  const isShippingFree = watch('isShippingFree');

  const onSubmit = (values: UpdateShippingFormValues) => {
    updateShipping(
      {
        shippingFee: Number(values.shippingFee),
        isShippingFree: values.isShippingFree,
      },
      {
        onSuccess: () => {
          toast.success('Shipping settings updated successfully');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update shipping settings');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <section className="rounded-none border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-none bg-neutral-200" />
              <div className="h-6 w-48 rounded-none bg-neutral-200" />
            </div>
            <div className="h-4 w-28 rounded bg-neutral-200" />
          </div>
          <div className="h-16 rounded-none bg-neutral-100" />
          <div className="h-12 rounded-none bg-neutral-100" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col items-center justify-center rounded-none border border-red-200 bg-red-50/50 p-8 text-center">
        <p className="text-sm font-medium text-red-800">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-700 hover:text-red-900"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-none border border-neutral-200/80 bg-white p-5  sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-neutral-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-neutral-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Logistics & Operations
              </p>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900">Shipping Management</h3>
            <p className="text-xs text-neutral-500">
              Configure baseline shipping fees and store-wide free shipping promotions.
            </p>
          </div>

          {settings?.updatedAt && (
            <div className="grid gap-0.5 text-left sm:text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Last updated
              </p>
              <p className="text-xs font-medium text-neutral-600">
                {formatDate(settings.updatedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Free Shipping Toggle */}
          <label
            className={`flex cursor-pointer items-start gap-4 rounded-none border p-4 transition-all duration-200 ${
              isShippingFree
                ? 'border-emerald-500/50 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50'
            }`}
          >
            <input
              type="checkbox"
              disabled={isPending}
              {...register('isShippingFree')}
              className="mt-0.5 h-4 w-4 rounded-none border-neutral-300 text-black focus:ring-black focus:ring-offset-0 disabled:opacity-50"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-neutral-900">Enable Global Free Shipping</p>
              <p className="text-xs text-neutral-500">
                When active, all checkout orders bypass standard delivery fees regardless of the
                threshold.
              </p>
            </div>
          </label>

          {/* Shipping Fee Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="shippingFee"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600"
            >
              Standard Shipping Fee (NGN) in kobos
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-neutral-400">
                R
              </span>
              <input
                id="shippingFee"
                type="number"
                min={0}
                step="100"
                disabled={isPending || isShippingFree}
                {...register('shippingFee')}
                className={`w-full rounded-none border bg-white py-2.5 pl-8 pr-3 text-sm text-neutral-900 outline-none transition-all duration-200 focus:ring-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 ${
                  errors.shippingFee
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 focus:border-black focus:ring-black/10'
                }`}
              />
            </div>

            {/* Error Message */}
            {errors.shippingFee && (
              <p className="text-xs font-medium text-red-600">{errors.shippingFee.message}</p>
            )}

            {/* Context Helper */}
            {isShippingFree ? (
              <p className="text-xs italic text-amber-600">
                Shipping fee input is currently overridden by the Global Free Shipping setting.
              </p>
            ) : (
              <p className="text-xs text-neutral-500">
                Active fee per order:{' '}
                <span className="font-semibold text-neutral-900">
                  {format_currency(Number(shippingfee))}
                </span>
              </p>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            <button
              type="button"
              disabled={!isDirty || isPending}
              onClick={() => reset()}
              className="rounded-none px-4 py-2 text-xs  bg-red-400 text-white font-semibold hover:text-black transition-colors hover:bg-neutral-100 disabled:invisible"
            >
              Discard
            </button>

            <button
              type="submit"
              disabled={!isDirty || isPending}
              className="inline-flex items-center gap-2 rounded-none bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-black focus:ring-2 focus:ring-black/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
