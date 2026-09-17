'use client';

import { Breadcrumb } from '@/components/shared/breadcrumb';
import { Field, Input } from '@/components/shared/form';
import { SearchableSelect } from '@/components/shared/search-input';
import { toast } from '@/components/toast/toast';
import { countries } from '@/constants/countries';
import { useAddressesQuery, useUpdateShippingAddressMutation } from '@/hooks/user.hook';
import { UpsertAddressInput, upsertAddressSchema } from '@/schemas/user.schemas';
import type { AddressData } from '@/services/user.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

const EMPTY_ADDRESS_VALUES: UpsertAddressInput = {
  firstName: '',
  lastName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  label: '',
};

function to_form_values(address: AddressData | null | undefined): UpsertAddressInput {
  if (!address) {
    return { ...EMPTY_ADDRESS_VALUES };
  }

  return {
    firstName: address.firstName ?? '',
    lastName: address.lastName ?? '',
    phone: address.phone ?? '',
    street: address.street ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    country: address.country ?? '',
    postalCode: address.postalCode ?? '',
    label: address.label ?? '',
  };
}

function pick_dirty_values(
  values: UpsertAddressInput,
  dirty_fields: Partial<Record<keyof UpsertAddressInput, boolean>>
) {
  return (Object.keys(values) as (keyof UpsertAddressInput)[]).reduce(
    (payload, key) => {
      if (dirty_fields[key]) {
        payload[key] = values[key] ?? '';
      }
      return payload;
    },
    {} as Record<string, unknown>
  );
}

export default function ShippingAddressPage() {
  const { data: addresses, isLoading: is_addresses_loading, isError, error } = useAddressesQuery();
  const shipping_address = addresses?.defaults.shipping ?? null;
  const initial_values = useMemo(() => to_form_values(shipping_address), [shipping_address]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty, isLoading, dirtyFields },
  } = useForm<UpsertAddressInput>({
    resolver: zodResolver(upsertAddressSchema),
    defaultValues: EMPTY_ADDRESS_VALUES,
  });

  useEffect(() => {
    reset(initial_values);
  }, [initial_values, reset]);

  const { mutate } = useUpdateShippingAddressMutation();
  const on_submit = (values: UpsertAddressInput) => {
    if (!isDirty) {
      toast.info('No changes to save yet.');
      return;
    }

    const dirty_payload = pick_dirty_values(
      values,
      dirtyFields as Partial<Record<keyof UpsertAddressInput, boolean>>
    );

    const payload: Record<string, unknown> = {
      ...initial_values,
      ...dirty_payload,
    };

    mutate(payload, {
      onSuccess() {
        toast.success('Shipping address saved successfully.');
        reset(values);
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  if (isError) {
    return (
      <div className="rounded-none border font-archivo border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <p className="font-semibold">Failed to load address</p>
        <p className="mt-1 text-sm">{error?.message || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="font-archivo animate-pulse space-y-5">
        {/* Title skeleton */}
        <div className="my-5 h-7 w-44 rounded bg-neutral-200 dark:bg-neutral-800" />

        {/* First & Last Name grid */}
        <div className="flex flex-col gap-5 lg:flex-row justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
          </div>
        </div>

        {/* Country Select */}
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
        </div>

        {/* Street Address */}
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
        </div>

        {/* City */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
        </div>

        {/* Province / State */}
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
        </div>

        {/* Postal Code */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
        </div>

        {/* Label */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800" />
        </div>

        {/* Save Button Skeleton */}
        <div className="h-12 w-full rounded bg-neutral-300 dark:bg-neutral-800" />
      </div>
    );
  }
  return (
    <div className="p-8 border rounded-none font-archivo">
      <Breadcrumb />
      <div>
        <h3 className="my-5 text-[24px] font-medium text-black">Shipping address</h3>
      </div>

      <div>
        <form onSubmit={handleSubmit(on_submit)}>
          <div className="flex flex-col gap-5 justify-between lg:flex-row">
            <div className="flex-1">
              <Field label="First Name" error={errors.firstName?.message} delay={100} xx={true}>
                <Input
                  {...register('firstName')}
                  type="text"
                  placeholder="e.g. Thabo"
                  className="rounded-none"
                  autoComplete="given-name"
                  hasError={!!errors.firstName}
                  disabled={isSubmitting || is_addresses_loading || isLoading}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Last Name" error={errors.lastName?.message} delay={100} xx={true}>
                <Input
                  {...register('lastName')}
                  type="text"
                  placeholder="e.g. Mokoena"
                  className="rounded-none"
                  autoComplete="family-name"
                  hasError={!!errors.lastName}
                  disabled={isSubmitting || is_addresses_loading || isLoading}
                />
              </Field>
            </div>
          </div>

          <div className="mt-5">
            <Controller
              name="country"
              control={control}
              rules={{ required: 'Please select a destination country' }}
              render={({ field: { onChange, value, onBlur, name }, fieldState: { error } }) => (
                <div>
                  <SearchableSelect
                    xx
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    items={countries}
                    displayField="name"
                    valueField="name"
                    label="Select Country"
                    hasError={!!error?.message}
                    searchFields={['name', 'value']}
                    placeholder="Select country (e.g. South Africa)"
                  />
                  {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
                </div>
              )}
            />
          </div>

          <div className="mt-5">
            <Field label="Street address" error={errors.street?.message} delay={100} xx={true}>
              <Input
                {...register('street')}
                type="text"
                className="rounded-none"
                placeholder="e.g. 45 Kloof Street, Gardens"
                autoComplete="address-line1"
                hasError={!!errors.street}
                disabled={isSubmitting || is_addresses_loading || isLoading}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Town / City" error={errors.city?.message} delay={100} xx={true}>
              <Input
                {...register('city')}
                type="text"
                placeholder="e.g. Cape Town or Sandton"
                className="rounded-none"
                autoComplete="address-level2"
                hasError={!!errors.city}
                disabled={isSubmitting || is_addresses_loading || isLoading}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Province / State" error={errors.state?.message} delay={100} xx={true}>
              <Input
                {...register('state')}
                type="text"
                placeholder="e.g. Western Cape or Gauteng"
                className="rounded-none"
                autoComplete="address-level1"
                hasError={!!errors.state}
                disabled={isSubmitting || is_addresses_loading || isLoading}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Postal Code" error={errors.postalCode?.message} delay={100} xx={false}>
              <Input
                {...register('postalCode')}
                type="text"
                className="rounded-none"
                placeholder="e.g. 8001"
                autoComplete="postal-code"
                hasError={!!errors.postalCode}
                disabled={isSubmitting || is_addresses_loading || isLoading}
              />
            </Field>
          </div>

          <div className="mb-2.5 mt-5">
            <Field label="Phone Number" error={errors.phone?.message} delay={100} xx={true}>
              <Input
                {...register('phone')}
                type="tel"
                placeholder="e.g. 082 123 4567 or +27 82 123 4567"
                className="rounded-none"
                autoComplete="tel"
                hasError={!!errors.phone}
                disabled={isSubmitting || is_addresses_loading || isLoading}
              />
            </Field>
          </div>

          <div className="my-5">
            <Field label="Address Label" error={errors.label?.message} delay={100} xx={false}>
              <Input
                {...register('label')}
                type="text"
                placeholder="e.g. Home, Office, Apartment"
                className="rounded-none"
                autoComplete="off"
                hasError={!!errors.label}
                disabled={isSubmitting || is_addresses_loading || isLoading}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || is_addresses_loading || isLoading}
            className="w-full cursor-pointer rounded-none bg-[#1d2128] px-7 py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <p className="text-sm font-bold text-white">Save address</p>
          </button>
        </form>
      </div>
    </div>
  );
}
