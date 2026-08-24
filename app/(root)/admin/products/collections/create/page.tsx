'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Textarea } from '@/components/shared/form';
import { toast } from '@/components/toast/toast';
import { CreateCollectionInput, createCollectionSchema } from '@/schemas/create-catalogs.schema';
import { SingleMediaUpload } from '@/components/medias/media-upload';
import { useCreateCollection } from '@/hooks/use-catalog.hook';

export default function CreateCollectionsPage() {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCollectionInput>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      collection_name: '',
      collection_slug: '',
      collection_description: '',
      collection_image: '',
    },
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{
    message: string;
    data: CreateCollectionInput;
  } | null>(null);

  const { mutate } = useCreateCollection();
  const onSubmit = async (data: CreateCollectionInput) => {
    // Clear previous banners on new submission attempt
    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: (response) => {
            setServerSuccess({
              message: 'Collection added successfully',
              data: {
                collection_name: response.success ? response.data.name : data.collection_name,
              },
            });
            resolve('Collection added successfully');
            reset();
          },
          onError: (err) => {
            const errorMessage = 'Failed to save collection to database. Please try again.';
            setServerError(errorMessage);
            reject(new Error(err ? err.message : errorMessage));
          },
        });
      }),
      {
        pending: 'Adding Collection…',
        success: 'Collection added',
        error: (err) => (err instanceof Error ? err.message : 'Something went wrong'),
      }
    );
  };

  return (
    <section className="font-archivo space-y-6">
      <div>
        <h1 className="font-archivo text-2xl font-bold text-black">Collection</h1>
        <p className="font-archivo text-sm text-neutral-600">Add a Collection.</p>
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
          {serverSuccess.data?.collection_name && (
            <p className="pl-4.5 text-xs text-green-600">
              Added: <span className="font-semibold">{serverSuccess.data.collection_name}</span>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Collection Name */}
        <Field
          label="Collection Name"
          error={errors.collection_name?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('collection_name')}
            type="text"
            placeholder="e.g. Summer Drop '26, Essentials, Capsule Vol. 1"
            hasError={Boolean(errors.collection_name)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Collection Description */}
        <Field
          label="Collection Description"
          error={errors.collection_description?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Textarea
            {...register('collection_description')}
            rows={5}
            placeholder="Provide details about the theme, aesthetic, or concept behind this collection..."
            hasError={Boolean(errors.collection_description)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Collection Slug */}
        <Field
          label="Collection Slug (leave blank for auto-generation)"
          error={errors.collection_slug?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('collection_slug')}
            type="text"
            placeholder="e.g. summer-drop-26"
            hasError={Boolean(errors.collection_slug)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Collection Cover Image */}
        <Field
          label="Collection Cover Image"
          error={errors.collection_image?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Controller
            name="collection_image"
            control={control}
            render={({ field }) => (
              <SingleMediaUpload
                productId="collection-upload"
                folder="collections"
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
          {isSubmitting ? 'Saving…' : 'Add Collection'}
        </button>
      </form>
    </section>
  );
}
