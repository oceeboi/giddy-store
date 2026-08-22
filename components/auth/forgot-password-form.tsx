'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { z } from 'zod';

import { Field, Input } from '@/components/shared/form';
import { useState } from 'react';
import { toast } from '../toast/toast';
// import { AuthService } from '@/services/auth.service';

const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or username is required')
    .trim()
    .refine(
      (v) => (v.includes('@') ? z.string().email().safeParse(v).success : v.length >= 3),
      'Enter a valid email address or username'
    ),
});

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  // const authService = new AuthService();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    // const result = await authService.forgotPassword(data);
    const result = { success: true, message: 'Invalid credentials' }; // Mock response

    if (!result.success) {
      setServerError(result.message || 'An error occurred. Please try again.');
      return;
    }

    setServerSuccess(result.message || 'If your account exists, a reset link has been sent.');
    toast.success(result.message || 'If your account exists, a reset link has been sent.');
  };

  return (
    <div className="w-full">
      <p className="text-sm text-gray-600 mb-4">
        Enter your email or username and we will send you a password reset link.
      </p>
      {serverError && (
        <div
          role="alert"
          className="p-3 mb-6 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2.5 transition-all animate-fadeIn"
        >
          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <p className="font-medium">{serverError}</p>
        </div>
      )}
      {serverSuccess && (
        <div
          role="alert"
          className="p-3 mb-6 bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-center gap-2.5 transition-all animate-fadeIn"
        >
          <span className="w-2 h-2 rounded-full bg-green-600 shrink-0" />
          <p className="font-medium">{serverSuccess}</p>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email or username" error={errors.identifier?.message} delay={100} xx={true}>
          <Input
            {...register('identifier')}
            type="text"
            placeholder="you@example.com"
            autoComplete="username"
            hasError={!!errors.identifier}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <button
          type="submit"
          className={`w-full py-3 rounded-none text-white font-semibold text-sm transition-all duration-200 ${
            isSubmitting ? 'bg-black/50 cursor-not-allowed' : 'bg-black hover:bg-black/90'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>
    </div>
  );
}
