'use client';
import { Footer, NavigationTopBar } from '../navigations';
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <NavigationTopBar />
      {children}
      <Footer />
    </section>
  );
}
