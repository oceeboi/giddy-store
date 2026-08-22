'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { STORE_DETAILS } from '@/constants/store-details';
import { usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isLogin = pathname?.includes('/login');
  const showAuthTabs = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50/70 py-12 px-4 sm:px-6 lg:px-8 font-archivo">
      <div className="w-full max-w-md space-y-6">
        {/* Brand / Logo Header */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block uppercase tracking-wide font-archivo-black text-xl font-bold  text-black hover:opacity-80 transition-opacity"
          >
            {/* Replace with your actual Logo component or brand name */}
            {STORE_DETAILS.name ?? 'Your Brand'}
          </Link>
        </div>

        {/* Auth Content Card */}
        <div className="bg-white border border-gray-200/80 p-6 sm:p-8">{children}</div>
        {showAuthTabs && (
          <div className="w-full border flex flex-col gap-2 border-gray-200/80 p-6">
            <p className=" text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <Link
              href={isLogin ? '/register' : '/login'}
              className="mt-2 block w-full text-center rounded-none bg-white border  px-4 py-3 text-sm font-medium hover:text-white transition-all duration-200 hover:bg-black/90"
            >
              {isLogin ? 'Create an account' : 'Log in'}
            </Link>
          </div>
        )}

        {/* Footer / Legal Links */}
        <footer className="text-center text-xs text-gray-500">
          By continuing, you agree to our{' '}
          <Link
            href="/terms-of-use"
            className="underline underline-offset-4 text-gray-600 hover:text-black"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy-policy"
            className="underline underline-offset-4 text-gray-600 hover:text-black"
          >
            Privacy Policy
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}
