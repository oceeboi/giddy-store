'use client';

import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Field, Input } from '@/components/shared/form';
import { UpdateSizeInput, updateSizeSchema } from '@/schemas/update-catalogs.schema';
import {
  useAdminSizeQuery,
  useUpdateSizeMutation,
  useDeleteSizeMutation,
} from '@/hooks/use-catalog.hook';
import { toast } from '@/components/toast/toast';

type SizeUpdateProps = {
  id: string;
  setValue?: Dispatch<SetStateAction<boolean>>;
};

export function SizeUpdate({ id, setValue }: SizeUpdateProps) {
  const { data: size, isLoading } = useAdminSizeQuery(id);
  const { mutateAsync: updateSize, isPending: isUpdating } = useUpdateSizeMutation();
  const { mutateAsync: deleteSize, isPending: isDeleting } = useDeleteSizeMutation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{ message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateSizeInput>({
    resolver: zodResolver(updateSizeSchema),
    defaultValues: {
      size_name: '',
    },
  });

  useEffect(() => {
    if (size) {
      reset({
        size_name: size.name ?? '',
      });
    }
  }, [size, reset]);

  const onSubmit = async (data: UpdateSizeInput) => {
    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      (async () => {
        try {
          const response = await updateSize({ sizeId: id, data });
          setServerSuccess({ message: 'Size updated successfully' });
          setTimeout(() => setServerSuccess(null), 2000);
          if (setValue) setValue(false);
          return response;
        } catch (err) {
          setServerError('Failed to update size, retry');
          setTimeout(() => setServerError(null), 2000);
          throw err;
        }
      })(),
      {
        pending: 'Updating size…',
        success: 'Size updated',
        error: (err) => (err instanceof Error ? err.message : 'Failed to update size'),
      }
    );
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete size "${size?.name ?? ''}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      (async () => {
        try {
          const response = await deleteSize(id);
          setServerSuccess({ message: 'Size deleted successfully' });
          setTimeout(() => setServerSuccess(null), 2000);
          if (setValue) setValue(false);
          return response;
        } catch (err) {
          setServerError('Failed to delete size, retry');
          setTimeout(() => setServerError(null), 2000);
          throw err;
        }
      })(),
      {
        pending: 'Deleting size…',
        success: 'Size deleted',
        error: (err) => (err instanceof Error ? err.message : 'Failed to delete size'),
      }
    );
  };

  const isSubmitting = isUpdating || isDeleting;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 font-archivo animate-pulse">
        <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 font-archivo">
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

      {/* Size Name */}
      <Field
        label="Size Name"
        error={errors.size_name?.message}
        delay={100}
        xx={true}
        className="font-archivo text-xs font-semibold uppercase tracking-wider text-black dark:text-white"
      >
        <Input
          {...register('size_name')}
          type="text"
          placeholder="e.g. Medium, US 9, XL"
          hasError={!!errors.size_name}
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
          {isUpdating ? 'Saving…' : 'Update Size'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="font-archivo rounded-none bg-red-600 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? 'Deleting…' : 'Delete Size'}
        </button>
      </div>
    </form>
  );
}
