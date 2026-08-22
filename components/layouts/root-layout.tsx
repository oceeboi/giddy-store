'use client';
import { Footer, NavigationTopBar } from '../navigations';
import { ToastProvider } from '../toast/toast-context';
import { Toaster } from '../toast/toaster';

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <ToastProvider position="top-center" maxVisible={4}>
        <NavigationTopBar />
        {children}
        <Footer />
        <Toaster />
      </ToastProvider>
    </section>
  );
}
