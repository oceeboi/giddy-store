'use client';
import { Footer, NavigationTopBar } from '../navigations';
import { ToastProvider } from '../toast/toast-context';
import { Toaster } from '../toast/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { tableDevtoolsPlugin, useTanStackTableDevtools } from '@tanstack/react-table-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
export function RootLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider position="top-center" maxVisible={4}>
        <NavigationTopBar />
        {children}
        <Footer />
        <Toaster />
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <TanStackDevtools plugins={[tableDevtoolsPlugin()]} />
    </QueryClientProvider>
  );
}
