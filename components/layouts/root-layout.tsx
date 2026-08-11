'use client';
import { NavigationTopBar } from '../navigations';
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <NavigationTopBar />
      {children}
    </section>
  );
}
