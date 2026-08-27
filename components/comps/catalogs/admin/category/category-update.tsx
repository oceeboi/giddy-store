'use client';

import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { CustomSelect, Field, Input, Textarea } from '@/components/shared/form';
import { UpdateCategoryInput, updateCategorySchema } from '@/schemas/update-catalogs.schema';
import { SingleMediaUpload } from '@/components/medias/media-upload';
import {
  useAdminCategoryQuery,
  useAdminCategoriesQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/hooks/use-catalog.hook';
import { toast } from '@/components/toast/toast';

type Option = { value: string; label: string; id: string };

const CATEGORY_ACTIVE_OPTIONS: Option[] = [
  { value: 'true', label: 'Active (Visible across storefront)', id: 'true' },
  { value: 'false', label: 'Inactive (Hidden / Draft)', id: 'false' },
];

type CategoryUpdateProps = {
  id: string;
  setValue?: Dispatch<SetStateAction<boolean>>;
};

export function CategoryUpdate({ id, setValue }: CategoryUpdateProps) {
  const { data: category, isLoading } = useAdminCategoryQuery(id);
  const { data: categories } = useAdminCategoriesQuery();
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateCategoryMutation();
  const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteCategoryMutation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{ message: string } | null>(null);

  // Filter out current category from parent selection options to prevent self-referencing
  const parentCategoryOptions: Option[] = [
    { value: 'none', label: 'None (Root Category)', id: 'none' },
    ...(categories?.categories
      ?.filter((cat) => cat.id !== id)
      .map((cat) => ({
        value: cat.id,
        label: cat.name,
        id: cat.id,
      })) ?? []),
  ];

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      category_name: '',
      category_slug: '',
      category_parent: null,
      category_image: '',
      category_description: '',
      category_active: true,
    },
  });

  // Sync form state when query resolves
  useEffect(() => {
    if (category) {
      reset({
        category_name: category.name ?? '',
        category_slug: category.slug ?? '',
        category_parent: category.parentId ?? null,
        category_image: category.image ?? '',
        category_description: category.description ?? '',
        category_active: category.active ?? true,
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: UpdateCategoryInput) => {
    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      (async () => {
        updateCategory(
          { categoryId: id, data },
          {
            onSuccess: (r) => {
              setServerSuccess({ message: 'Category updated successfully' });
              setTimeout(() => setServerSuccess(null), 5000);
              if (setValue) setValue(false);
            },
            onError: (e) => {
              setServerError(e ? e.message : 'Failed to update category, retry');
              setTimeout(() => setServerError(null), 5000);
            },
          }
        );
      })(),
      {
        pending: 'Updating category…',
        success: 'Category updated',
        error: (err) => (err instanceof Error ? err.message : 'Failed to update category'),
      }
    );
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete category "${category?.name ?? ''}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      (async () => {
        await deleteCategory(id, {
          onSuccess: (s) => {
            setServerSuccess({ message: 'Category deleted successfully' });
            setTimeout(() => setServerSuccess(null), 5000);
            if (setValue) setValue(false);
          },
          onError: (e) => {
            setServerError(e ? e.message : 'Failed to delete category, retry');
            setTimeout(() => setServerError(null), 5000);
          },
        });
      })(),
      {
        pending: 'Deleting category…',
        success: 'Category deleted',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete category'),
      }
    );
  };

  const isSubmitting = isUpdating || isDeleting;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 font-archivo animate-pulse">
        <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-32 w-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 font-archivo">
      {/* Server Feedback Banners */}
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

      {/* Category Active Status */}
      <Controller
        name="category_active"
        control={control}
        render={({ field }) => (
          <Field
            label="Category Status"
            error={errors.category_active?.message}
            delay={100}
            xx={true}
            className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
          >
            <CustomSelect
              value={field.value !== undefined ? String(field.value) : 'true'}
              options={CATEGORY_ACTIVE_OPTIONS}
              onChange={(val) => field.onChange(val === 'true')}
              disabled={isSubmitting}
              hasError={!!errors.category_active}
              placeholder="Select category status"
            />
          </Field>
        )}
      />

      {/* Category Name */}
      <Field
        label="Category Name"
        error={errors.category_name?.message}
        delay={100}
        xx={true}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Input
          {...register('category_name')}
          type="text"
          placeholder="e.g. Footwear"
          hasError={!!errors.category_name}
          disabled={isSubmitting}
          className="rounded-none"
        />
      </Field>

      {/* Category Slug */}
      <Field
        label="Category Slug"
        error={errors.category_slug?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Input
          {...register('category_slug')}
          type="text"
          placeholder="e.g. footwear"
          hasError={!!errors.category_slug}
          disabled={isSubmitting}
          className="rounded-none font-mono"
        />
      </Field>

      {/* Parent Category Select */}
      <Controller
        name="category_parent"
        control={control}
        render={({ field }) => (
          <Field
            label="Parent Category"
            error={errors.category_parent?.message}
            delay={100}
            xx={false}
            className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
          >
            <CustomSelect
              value={field.value ?? 'none'}
              options={parentCategoryOptions}
              onChange={(val) => field.onChange(val === 'none' ? null : val)}
              disabled={isSubmitting}
              hasError={!!errors.category_parent}
              placeholder="Select parent category"
            />
          </Field>
        )}
      />

      {/* Category Image Upload */}
      <Field
        label="Category Image"
        error={errors.category_image?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Controller
          name="category_image"
          control={control}
          render={({ field }) => (
            <SingleMediaUpload
              productId={id}
              folder="category"
              value={(field.value as string) || ''}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      {/* Category Description */}
      <Field
        label="Description"
        error={errors.category_description?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Textarea
          {...register('category_description')}
          rows={4}
          placeholder="Category details and overview..."
          hasError={!!errors.category_description}
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
          {isUpdating ? 'Saving…' : 'Update Category'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="font-archivo rounded-none bg-red-600 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? 'Deleting…' : 'Delete Category'}
        </button>
      </div>
    </form>
  );
}
