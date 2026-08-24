'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomSelect, Field, Input, Textarea } from '@/components/shared/form';
import { SingleMediaUpload } from '@/components/medias/media-upload'; // Import component
import { toast } from '@/components/toast/toast';
import { createCategory, CreateCategoryInput } from '@/schemas/create-catalogs.schema';
import { useCreateCategory } from '@/hooks/use-catalog.hook';

type Option = { value: string; label: string; id: string };

const CATEGORY: Option[] = [
  { value: 't-shirts', label: 'T-Shirts', id: '6a7b4c7734e571b38b088a23' },
];
export default function CreateCategoriesPage() {
  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategory),
    defaultValues: {
      category_name: '',
      category_description: '',
      category_slug: '',
      category_image: '',
      category_active: true,
    },
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{
    message: string;
    data: CreateCategoryInput;
  } | null>(null);
  const { mutate } = useCreateCategory();
  const onSubmit = async (data: CreateCategoryInput) => {
    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: (response) => {
            setServerSuccess({
              message: 'Category added successfully',
              data: {
                category_name: response.success ? response.data.name : data.category_name,
              },
            });
            resolve('Category added successfully');
            reset();
          },
          onError: (err) => {
            const errorMessage = 'Failed to save category to database. Please try again.';
            setServerError(errorMessage);
            reject(new Error(err ? err.message : errorMessage));
          },
        });
      }),
      {
        pending: 'Adding category…',
        success: 'Category added',
        error: (err) => (err instanceof Error ? err.message : 'Something went wrong'),
      }
    );
  };

  return (
    <section className="flex flex-col gap-6 md:p-6 font-archivo md:pt-0">
      <div>
        <h1 className="font-archivo text-2xl font-bold text-black">Category</h1>
        <p className="font-archivo text-sm text-neutral-600">Manage your Catgory.</p>
      </div>
      {/* Server Error Banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2.5 border border-red-200 bg-red-50 p-3 text-xs text-red-700 transition-all sm:text-sm"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-600" />
          <p className="font-medium">{serverError}</p>
        </div>
      )}

      {/* Server Success Banner */}
      {serverSuccess && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-1 border border-green-200 bg-green-50 p-3 text-xs text-green-700 transition-all sm:text-sm"
        >
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
            <p className="font-medium">{serverSuccess.message}</p>
          </div>
          {serverSuccess.data?.category_name && (
            <p className="pl-4.5 text-xs text-green-600">
              Added: <span className="font-semibold">{serverSuccess.data.category_name}</span>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Category Name */}
        <Field
          label="Category Name"
          error={errors.category_name?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('category_name')}
            type="text"
            placeholder="e.g. Footwear, Outerwear, Accessories"
            hasError={Boolean(errors.category_name)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Category Description */}
        <Field
          label="Category Description"
          error={errors.category_description?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Textarea
            {...register('category_description')}
            rows={5}
            placeholder="Provide a detailed description of items belonging to this category..."
            hasError={Boolean(errors.category_description)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Category Slug */}
        <Field
          label="Category Slug (leave blank for auto-generation)"
          error={errors.category_slug?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('category_slug')}
            type="text"
            placeholder="e.g. footwear-sneakers"
            hasError={Boolean(errors.category_slug)}
            disabled={isSubmitting}
            className="rounded-none "
          />
        </Field>

        {/* Catgory Brand */}
        <Controller
          control={control}
          name="category_parent"
          render={({ field }) => (
            <Field
              label="Parent Catgory"
              error={errors.category_parent?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                options={CATEGORY}
                value={field.value!}
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.category_parent}
                placeholder="Select a Category"
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
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Controller
            name="category_image"
            control={control}
            render={({ field }) => (
              <SingleMediaUpload
                productId="category-upload" // Optional placeholder or category identifier
                folder="categories"
                value={(field.value as string) || ''}
                onChange={field.onChange}
              />
            )}
          />
        </Field>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="font-archivo w-fit rounded-none bg-black px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Add Category'}
        </button>
      </form>
    </section>
  );
}
