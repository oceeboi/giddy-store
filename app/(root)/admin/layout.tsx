import { AdminDashboard_Navigation } from '@/components/navigations';

export default function AuthorizedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative pb-16 pt-10 sm:pt-12 lg:pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-black/3 to-transparent" />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* <HeaderBox /> */}
        <section className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[19.5rem_minmax(0,1fr)]">
          {/* Sticky Navigation Container */}
          <div className="lg:sticky lg:top-25">
            <AdminDashboard_Navigation />
          </div>

          {/* Main Content */}
          <div className="min-w-0">{children}</div>
        </section>
      </div>
    </section>
  );
}
