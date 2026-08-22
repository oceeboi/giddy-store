'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Field, Input, PasswordInput } from '@/components/shared/form';
// import { AuthService } from '@/services/auth.service';

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Username or email is required')
    .refine((v) => {
      if (v.includes('@')) {
        return z.string().email().safeParse(v).success;
      }
      return v.length >= 3;
    }, 'Enter a valid email or username (min 3 chars)'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFields = z.infer<typeof loginSchema>;

function normalizeReturnTo(rawReturnTo: string | null): string | null {
  if (!rawReturnTo) return null;

  try {
    const decoded = decodeURIComponent(rawReturnTo);
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.startsWith('/api/')) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const authService = new AuthService();

  const [serverError, setServerError] = useState<string | null>(null);
  const returnToPath = normalizeReturnTo(searchParams.get('returnTo'));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (data: LoginFields) => {
    setServerError(null);

    try {
      // const result = await authService.login(data);
      const result = { success: false, message: 'Invalid credentials' }; // Mock response

      if (!result.success) {
        setServerError(result.message || 'Failed to sign in. Please try again.');
        return;
      }

      // Successful login flow
      router.push(returnToPath ?? '/dashboard');
      router.refresh();
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
          className="p-3 mb-6 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2.5 transition-all animate-fadeIn"
        >
          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <p className="font-medium">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Username or email" error={errors.identifier?.message} delay={100} xx={true}>
          <Input
            {...register('identifier')}
            type="text"
            placeholder="you@example.com or username"
            autoComplete="username"
            hasError={!!errors.identifier}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field label="Password" error={errors.password?.message} delay={200} xx={true}>
          <PasswordInput
            {...register('password')}
            placeholder="Enter your password"
            autoComplete="current-password"
            hasError={!!errors.password}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <div className="flex justify-end pt-1">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-black hover:underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-black text-white font-semibold text-sm transition-all duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
