'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input } from '@/components/shared/form';
import { toast } from '@/components/toast/toast';
import { CreateSizeInput, createSizeSchema } from '@/schemas/create-catalogs.schema';
import { useCreateSize } from '@/hooks/use-catalog.hook';

export default function CreateSizePage() {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSizeInput>({
    resolver: zodResolver(createSizeSchema),
    defaultValues: {
      size_name: '',
    },
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<{
    message: string;
    data: CreateSizeInput;
  } | null>(null);

  const { mutate } = useCreateSize();

  const onSubmit = async (data: CreateSizeInput) => {
    // Clear previous banners on new submission attempt
    setServerError(null);
    setServerSuccess(null);

    await toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: (response) => {
            setServerSuccess({
              message: 'Size added successfully',
              data: {
                size_name: response.name,
              },
            });
            resolve('Size added successfully');
            reset();
          },
          onError: (err) => {
            const errorMessage = 'Failed to save size to database. Please try again.';
            setServerError(errorMessage);
            reject(new Error(err ? err.message : errorMessage));
          },
        });
      }),
      {
        pending: 'Adding size…',
        success: 'Size added',
        error: (err) => (err instanceof Error ? err.message : 'Something went wrong'),
      }
    );
  };

  return (
    <section className="flex flex-col gap-6 font-archivo md:p-6 md:pt-0">
      <div>
        <h1 className="font-archivo text-2xl font-bold text-black">Create Size</h1>
        <p className="font-archivo text-sm text-neutral-600">
          Add a new clothing or footwear size option.
        </p>
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
          {serverSuccess.data?.size_name && (
            <p className="pl-4.5 text-xs text-green-600">
              Added: <span className="font-semibold">{serverSuccess.data.size_name}</span>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Size Name */}
        <Field
          label="Size Name"
          error={errors.size_name?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('size_name')}
            type="text"
            placeholder="e.g. US 9 / EU 42, Medium, XL"
            hasError={Boolean(errors.size_name)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="font-archivo w-fit rounded-none bg-black px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Add Size'}
        </button>
      </form>
    </section>
  );
}
