'use client';
import { Footer, NavigationTopBar } from '../navigations';
import { Toaster } from '../ui/toast';
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <NavigationTopBar />
      {children}
      <Footer />
      <Toaster />
    </section>
  );
}
