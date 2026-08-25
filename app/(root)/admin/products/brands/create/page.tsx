'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Textarea } from '@/components/shared/form';
import { toast } from '@/components/toast/toast';
import { CreateBrandInput, createBrandSchema } from '@/schemas/create-catalogs.schema';
import { SingleMediaUpload } from '@/components/medias/media-upload';
import { useCreateBrand } from '@/hooks/use-catalog.hook';

export default function CreateBrand() {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBrandInput>({
    resolver: zodResolver(createBrandSchema),
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{
    message: string;
    data: CreateBrandInput;
  } | null>(null);

  const { mutate } = useCreateBrand();
  const onSubmit = async (data: CreateBrandInput) => {
    // Clear previous banners on new submission attempt
    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: (response) => {
            setServerSuccess({
              message: 'Brand add Successfully',
              data: {
                brand_name: response.name,
              },
            });
            reset();
            resolve(response);
            setTimeout(() => {
              setServerSuccess(null);
            }, 2000);
          },
          onError: (err) => {
            setServerError('Failed to add brand, retry');
            reject(err);
            setTimeout(() => {
              setServerError(null);
            }, 2000);
          },
        });
      }),
      {
        pending: 'Adding brand…',
        success: 'Brand added',
        error: (err) => (err instanceof Error ? err.message : 'Something went wrong'),
      }
    );
  };

  return (
    <section className="flex  font-archivo flex-col gap-6 md:p-6 md:pt-0">
      <div>
        <h1 className="font-archivo text-2xl font-bold text-black">Brand</h1>
        <p className="font-archivo text-sm text-neutral-600">Add a Brand.</p>
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
          {serverSuccess.data?.brand_name && (
            <p className="pl-4.5 text-xs hidden text-green-600">
              Added: <span className="font-semibold">{serverSuccess.data.brand_name}</span>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Brand Name */}
        <Field
          label="Brand Name"
          error={errors.brand_name?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('brand_name')}
            type="text"
            placeholder="e.g. Nike, Fear of God, A.P.C."
            hasError={Boolean(errors.brand_name)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Brand Description */}
        <Field
          label="Brand Description"
          error={errors.brand_description?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Textarea
            {...register('brand_description')}
            rows={5}
            placeholder="Provide a brief overview of the brand's heritage, aesthetic, or design philosophy..."
            hasError={Boolean(errors.brand_description)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Brand Slug */}
        <div className="flex flex-col gap-1.5">
          <label className="font-archivo text-xs font-semibold uppercase tracking-wider text-black">
            Brand Slug
            <span className="ml-1 font-normal normal-case text-neutral-500">
              (leave blank for auto-generation)
            </span>
          </label>
          <Input
            {...register('brand_slug')}
            type="text"
            placeholder="e.g. fear-of-god"
            hasError={Boolean(errors.brand_slug)}
            disabled={isSubmitting}
            className="rounded-none"
          />
          {errors.brand_slug && (
            <p role="alert" className="font-archivo text-xs text-red-600">
              {errors.brand_slug.message}
            </p>
          )}
        </div>

        {/* Brand Image Upload */}
        <Field
          label="Brand Logo"
          error={errors.brand_logo?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Controller
            name="brand_logo"
            control={control}
            render={({ field }) => (
              <SingleMediaUpload
                productId="brand-upload" // Optional placeholder or category identifier
                folder="brand"
                value={(field.value as string) || ''}
                onChange={field.onChange}
              />
            )}
          />
        </Field>

        {/* Brand Website */}
        <div className="flex flex-col gap-1.5">
          <label className="font-archivo text-xs font-semibold uppercase tracking-wider text-black">
            Brand Website
            <span className="ml-1 font-normal normal-case text-neutral-500">(Optional)</span>
          </label>
          <Input
            {...register('brand_website')}
            type="text"
            placeholder="e.g. https://www.brandwebsite.com"
            hasError={Boolean(errors.brand_website)}
            disabled={isSubmitting}
            className="rounded-none"
          />
          {errors.brand_website && (
            <p role="alert" className="font-archivo text-xs text-red-600">
              {errors.brand_website.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="font-archivo w-fit rounded-none bg-black px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Add brand'}
        </button>
      </form>
    </section>
  );
}
