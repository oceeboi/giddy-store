'use client';

import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { CustomSelect, Field, Input, Textarea } from '@/components/shared/form';
import { UpdateCollectionInput, updateCollectionSchema } from '@/schemas/update-catalogs.schema';
import { SingleMediaUpload } from '@/components/medias/media-upload';
import {
  useAdminCollectionQuery,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
} from '@/hooks/use-catalog.hook';
import { toast } from '@/components/toast/toast';

type Option = { value: string; label: string; id: string };

const COLLECTION_ACTIVE_OPTIONS: Option[] = [
  { value: 'true', label: 'Active (Visible across storefront)', id: 'true' },
  { value: 'false', label: 'Inactive (Hidden / Draft)', id: 'false' },
];

type CollectionUpdateProps = {
  id: string;
  setValue?: Dispatch<SetStateAction<boolean>>;
};

export function CollectionUpdate({ id, setValue }: CollectionUpdateProps) {
  const { data: collection, isLoading } = useAdminCollectionQuery(id);
  const { mutateAsync: updateCollection, isPending: isUpdating } = useUpdateCollectionMutation();
  const { mutateAsync: deleteCollection, isPending: isDeleting } = useDeleteCollectionMutation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{ message: string } | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateCollectionInput>({
    resolver: zodResolver(updateCollectionSchema),
    defaultValues: {
      collection_name: '',
      collection_slug: '',
      collection_description: '',
      collection_image: '',
      collection_active: true,
    },
  });

  // Sync form state when query resolves
  useEffect(() => {
    if (collection) {
      reset({
        collection_name: collection.name ?? '',
        collection_slug: collection.slug ?? '',
        collection_description: collection.description ?? '',
        collection_image: collection.image ?? '',
        collection_active: collection.active ?? true,
      });
    }
  }, [collection, reset]);

  const onSubmit = async (data: UpdateCollectionInput) => {
    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      (async () => {
        try {
          const response = await updateCollection({ collectionId: id, data });
          setServerSuccess({ message: 'Collection updated successfully' });
          setTimeout(() => setServerSuccess(null), 2000);
          if (setValue) setValue(false);
          return response;
        } catch (err) {
          setServerError('Failed to update collection, retry');
          setTimeout(() => setServerError(null), 2000);
          throw err;
        }
      })(),
      {
        pending: 'Updating collection…',
        success: 'Collection updated',
        error: (err) => (err instanceof Error ? err.message : 'Failed to update collection'),
      }
    );
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete collection "${
          collection?.name ?? ''
        }"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      (async () => {
        await deleteCollection(id, {
          onSuccess: (s) => {
            setServerSuccess({ message: 'Collection deleted successfully' });
            setTimeout(() => setServerSuccess(null), 5000);
            if (setValue) setValue(false);
          },
          onError: (e) => {
            setServerError(e ? e.message : 'Failed to delete collection, retry');
            setTimeout(() => setServerError(null), 5000);
          },
        });
      })(),
      {
        pending: 'Deleting collection…',
        success: 'Collection deleted',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete collection'),
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

      {/* Collection Active Status */}
      <Controller
        name="collection_active"
        control={control}
        render={({ field }) => (
          <Field
            label="Collection Status"
            error={errors.collection_active?.message}
            delay={100}
            xx={true}
            className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
          >
            <CustomSelect
              value={field.value !== undefined ? String(field.value) : 'true'}
              options={COLLECTION_ACTIVE_OPTIONS}
              onChange={(val) => field.onChange(val === 'true')}
              disabled={isSubmitting}
              hasError={!!errors.collection_active}
              placeholder="Select collection status"
            />
          </Field>
        )}
      />

      {/* Collection Name */}
      <Field
        label="Collection Name"
        error={errors.collection_name?.message}
        delay={100}
        xx={true}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Input
          {...register('collection_name')}
          type="text"
          placeholder="e.g. Summer Essentials"
          hasError={!!errors.collection_name}
          disabled={isSubmitting}
          className="rounded-none"
        />
      </Field>

      {/* Collection Slug */}
      <Field
        label="Collection Slug"
        error={errors.collection_slug?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Input
          {...register('collection_slug')}
          type="text"
          placeholder="e.g. summer-essentials"
          hasError={!!errors.collection_slug}
          disabled={isSubmitting}
          className="rounded-none font-mono"
        />
      </Field>

      {/* Collection Image Upload */}
      <Field
        label="Collection Banner / Cover"
        error={errors.collection_image?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Controller
          name="collection_image"
          control={control}
          render={({ field }) => (
            <SingleMediaUpload
              productId={id}
              folder="collection"
              value={(field.value as string) || ''}
              onChange={field.onChange}
            />
          )}
        />
      </Field>

      {/* Collection Description */}
      <Field
        label="Description"
        error={errors.collection_description?.message}
        delay={100}
        xx={false}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Textarea
          {...register('collection_description')}
          rows={4}
          placeholder="Curated selection overview..."
          hasError={!!errors.collection_description}
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
          {isUpdating ? 'Saving…' : 'Update Collection'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="font-archivo rounded-none bg-red-600 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? 'Deleting…' : 'Delete Collection'}
        </button>
      </div>
    </form>
  );
}
