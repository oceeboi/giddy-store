'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Field, Input, PasswordInput } from '@/components/shared/form';
// import { AuthService } from '@/services/auth.service';
import { toast } from '../toast/toast';

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address')
      .toLowerCase()
      .trim(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .trim()
      .toLowerCase()
      .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    referralcode: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFields = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  // const authService = new AuthService();

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      referralcode: '',
    },
  });

  const onSubmit = async (data: RegisterFields) => {
    // Clear previous feedback on a fresh submission attempt
    setServerError(null);
    setServerSuccess(null);

    try {
      // const result = await authService.register(data);
      const result = { success: false, message: 'Failed to create account. Please try again.' }; // Mock response

      if (!result.success) {
        setServerError(result.message || 'Failed to create account. Please try again.');
        return;
      }

      const successMsg = result.message || 'Account created successfully!';
      setServerSuccess(successMsg);
      toast.success(successMsg);

      // Brief delay to let the user see the success banner before redirect
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 600);
    } catch (err) {
      setServerError('An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <div className="w-full font-archivo">
      {/* Global Server Error Banner */}
      {serverError && (
        <div
          role="alert"
          className="p-3 mb-6 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2.5 rounded-none transition-all animate-fadeIn"
        >
          <span className="w-2 h-2 rounded-none bg-red-600 shrink-0" />
          <p className="font-medium">{serverError}</p>
        </div>
      )}

      {/* Global Server Success Banner */}
      {serverSuccess && (
        <div
          role="alert"
          className="p-3 mb-6 bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-center gap-2.5 rounded-none transition-all animate-fadeIn"
        >
          <span className="w-2 h-2 rounded-none bg-green-600 shrink-0" />
          <p className="font-medium">{serverSuccess}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email address" error={errors.email?.message} delay={100} xx={true}>
          <Input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            hasError={!!errors.email}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field label="Username" error={errors.username?.message} delay={150} xx={true}>
          <Input
            {...register('username')}
            type="text"
            placeholder="your_username"
            autoComplete="username"
            hasError={!!errors.username}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field label="Password" error={errors.password?.message} delay={200} xx={true}>
          <PasswordInput
            {...register('password')}
            placeholder="Create a strong password"
            autoComplete="new-password"
            hasError={!!errors.password}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Confirm password"
          error={errors.confirmPassword?.message}
          delay={250}
          xx={true}
        >
          <PasswordInput
            {...register('confirmPassword')}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            hasError={!!errors.confirmPassword}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field label="Referral code (optional)" error={errors.referralcode?.message} delay={300}>
          <Input
            {...register('referralcode')}
            type="text"
            placeholder="ABC123"
            hasError={!!errors.referralcode}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <p className="text-xs  text-gray-600 pt-1 leading-relaxed">
          Your personal data will be used to support your experience throughout this website and to
          manage access to your account. Read our
          <Link
            href="/privacy-policy"
            className="ml-1 font-semibold text-black hover:underline underline-offset-4"
          >
            privacy policy
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-black text-white font-semibold text-sm transition-all duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed mt-2 rounded-none"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
