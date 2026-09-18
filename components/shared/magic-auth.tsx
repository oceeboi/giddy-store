'use client';

import { magicAuthSchema } from '@/schemas/auth.schemas';
import { MagicAuthBody } from '@/schemas/schema.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Field, Input } from './form';
import { AuthService } from '@/services/auth.service';
import { Dispatch, SetStateAction, useTransition } from 'react';
import { toast } from '../toast/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

type MagicUICheckoutProps = {
  setValue: Dispatch<SetStateAction<boolean>>;
};

export function MagicUICheckout({ setValue }: MagicUICheckoutProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<MagicAuthBody>({
    resolver: zodResolver(magicAuthSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: MagicAuthBody) => {
    startTransition(async () => {
      try {
        const authService = new AuthService();
        const result = await authService.magicAuth(data);

        if (result?.success) {
          setValue(true);
          toast.success(result.message || 'Authenticated successfully!');
          // Invalidate user session query to trigger auto-sync in CheckoutComp
          await queryClient.invalidateQueries({ queryKey: ['user'] });
        } else {
          toast.error(result?.message || 'Failed to authenticate.');
        }
      } catch (error: any) {
        toast.error(error?.message || 'An unexpected error occurred.');
      }
    });
  };

  const isLoading = isSubmitting || isPending;

  return (
    <div className="w-full font-archivo">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[#1d2128]">Express Sign In / Register</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Enter your email to receive an instant authentication link and save your shipping details.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email Address" error={errors.email?.message} xx>
          <Input
            {...register('email')}
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            hasError={!!errors.email}
            disabled={isLoading}
          />
        </Field>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative rounded flex h-12 w-full items-center justify-center overflow-hidden border border-black bg-white text-xs font-semibold uppercase tracking-wider text-black transition-all disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-150">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Continue with Magic Link</span>
            )}
          </span>
          <div className="absolute bottom-0 left-0 h-0 w-full bg-black transition-all duration-200 ease-in-out group-hover:h-full" />
        </button>
      </form>
    </div>
  );
}
