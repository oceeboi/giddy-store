'use client';

import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { CustomSelect, Field, Input, Textarea } from '@/components/shared/form';
import { UpdateBrandInput, updateBrandSchema } from '@/schemas/update-catalogs.schema';
import { SingleMediaUpload } from '@/components/medias/media-upload';
import {
  useAdminBrandQuery,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from '@/hooks/use-catalog.hook';
import { toast } from '@/components/toast/toast';

type Option = { value: string; label: string; id: string };

const BRAND_ACTIVE_OPTIONS: Option[] = [
  { value: 'true', label: 'Active (Visible across storefront)', id: 'true' },
  { value: 'false', label: 'Inactive (Hidden / Draft)', id: 'false' },
];

type BrandUpdateProps = {
  id: string;
  setValue?: Dispatch<SetStateAction<boolean>>;
};

export function BrandUpdate({ id, setValue }: BrandUpdateProps) {
  const { data: brand, isLoading } = useAdminBrandQuery(id);
  const { mutateAsync: updateBrand, isPending: isUpdating } = useUpdateBrandMutation();
  const { mutateAsync: deleteBrand, isPending: isDeleting } = useDeleteBrandMutation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{ message: string } | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBrandInput>({
    resolver: zodResolver(updateBrandSchema),
    defaultValues: {
      brand_name: '',
      brand_slug: '',
      brand_logo: '',
      brand_description: '',
      brand_website: '',
      brand_active: true,
    },
  });

  // Sync form values when query resolves
  useEffect(() => {
    if (brand) {
      reset({
        brand_name: brand.name ?? '',
        brand_slug: brand.slug ?? '',
        brand_logo: brand.logo ?? '',
        brand_description: brand.description ?? '',
        brand_website: brand.website ?? '',
        brand_active: brand.active ?? true,
      });
    }
  }, [brand, reset]);

  const onSubmit = async (data: UpdateBrandInput) => {
    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      (async () => {
        try {
          const response = await updateBrand({ brandId: id, data });
          setServerSuccess({ message: 'Brand updated successfully' });
          setTimeout(() => setServerSuccess(null), 2000);
          if (setValue) setValue(false);
          return response;
        } catch (err) {
          setServerError('Failed to update brand, retry');
          setTimeout(() => setServerError(null), 2000);
          throw err;
        }
      })(),
      {
        pending: 'Updating brand…',
        success: 'Brand updated',
        error: (err) => (err instanceof Error ? err.message : 'Failed to update brand'),
      }
    );
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete brand "${brand?.name ?? ''}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      (async () => {
        await deleteBrand(id, {
          onSuccess: (r) => {
            setServerSuccess({ message: 'Brand deleted successfully' });
            setTimeout(() => setServerSuccess(null), 2000);
            if (setValue) setValue(false);
          },
          onError: (err) => {
            setServerError(err.message ?? 'Failed to delete brand, retry');
            setTimeout(() => setServerError(null), 5000);
          },
        });
      })(),
      {
        pending: 'Deleting brand…',
        success: 'Brand deleted',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete brand'),
      }
    );
  };

  const isSubmitting = isUpdating || isDeleting;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 font-archivo animate-pulse">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-10 w-full bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 font-archivo">
      {/* Server Banners */}
      {serverSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-400 p-3 text-xs uppercase font-semibold tracking-wider">
          {serverSuccess.message}
        </div>
      )}
      {serverError && (
        <div className="bg-red-500/10 border border-red-500 text-red-600 dark:text-red-400 p-3 text-xs uppercase font-semibold tracking-wider">
          {serverError}
        </div>
      )}

      {/* Brand Active Status */}
      <Controller
        name="brand_active"
        control={control}
        render={({ field }) => (
          <Field
            label="Brand Status"
            error={errors.brand_active?.message}
            delay={100}
            xx={true}
            className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
          >
            <CustomSelect
              value={field.value !== undefined ? String(field.value) : 'true'}
              options={BRAND_ACTIVE_OPTIONS}
              onChange={(val) => field.onChange(val === 'true')}
              disabled={isSubmitting}
              hasError={!!errors.brand_active}
              placeholder="Select brand status"
            />
          </Field>
        )}
      />

      {/* Brand Name */}
      <Field
        label="Brand Name"
        error={errors.brand_name?.message}
        delay={100}
        xx={true}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Input
          {...register('brand_name')}
          type="text"
          placeholder="e.g. NIKE"
          hasError={!!errors.brand_name}
          disabled={isSubmitting}
          className="rounded-none"
        />
      </Field>

      {/* Brand Slug */}
      <Field
        label="Brand Slug"
        error={errors.brand_slug?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Input
          {...register('brand_slug')}
          type="text"
          placeholder="e.g. nike"
          hasError={!!errors.brand_slug}
          disabled={isSubmitting}
          className="rounded-none font-mono"
        />
      </Field>

      {/* Brand Logo Upload */}
      <Field
        label="Brand Logo"
        error={errors.brand_logo?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Controller
          name="brand_logo"
          control={control}
          render={({ field }) => (
            <SingleMediaUpload
              productId={id}
              folder="brand"
              value={(field.value as string) || ''}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      {/* Brand Official Website */}
      <Field
        label="Official Website"
        error={errors.brand_website?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Input
          {...register('brand_website')}
          type="url"
          placeholder="https://nike.com"
          hasError={!!errors.brand_website}
          disabled={isSubmitting}
          className="rounded-none"
        />
      </Field>

      {/* Brand Description */}
      <Field
        label="Description"
        error={errors.brand_description?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Textarea
          {...register('brand_description')}
          rows={4}
          placeholder="Brand legacy and background info..."
          hasError={!!errors.brand_description}
          disabled={isSubmitting}
          className="rounded-none"
        />
      </Field>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          type="submit"
          disabled={isSubmitting}
          className="font-archivo rounded-none bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {isUpdating ? 'Saving…' : 'Update Brand'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="font-archivo rounded-none bg-red-600 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? 'Deleting…' : 'Delete Brand'}
        </button>
      </div>
    </form>
  );
}
