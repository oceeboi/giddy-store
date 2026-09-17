'use client';
import { useAddressesQuery } from '@/hooks/user.hook';
import type { AddressData } from '@/services/user.service';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';

function render_address_content(address: AddressData | null) {
  if (!address) {
    return 'You have not set up this type of address yet.';
  }

  const address_lines = [
    `${address.firstName} ${address.lastName}`.trim(),
    address.street,
    `${address.city}, ${address.state}`,
    [address.country, address.postalCode].filter(Boolean).join(' '),
    address.phone,
  ].filter(Boolean);

  return address_lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>);
}

export default function AddressPage() {
  const router: AppRouterInstance = useRouter();
  const { data: addresses, isError, error, isLoading } = useAddressesQuery();
  const billing_address = addresses?.defaults.billing ?? null;
  const shipping_address = addresses?.defaults.shipping ?? null;

  function route_to_page(href: string) {
    router.push(href);
  }
  if (isError) {
    return (
      <div className="rounded-none border font-archivo border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <p className="font-semibold">Failed to load address</p>
        <p className="mt-1 text-sm">{error?.message || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 border rounded-none font-archivo animate-pulse border-neutral-200 dark:border-neutral-800">
        {/* Subtitle skeleton */}
        <div className="mt-3.5 mb-5.25 h-3.5 w-full max-w-md bg-neutral-200 dark:bg-neutral-800" />

        {/* Billing Address Section */}
        <div className="mb-8">
          <div className="h-5 w-36 bg-neutral-200 dark:bg-neutral-800 mb-6" />
          <div className="space-y-2 mb-[27px]">
            <div className="h-3.5 w-48 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3.5 w-64 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3.5 w-40 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3.5 w-32 bg-neutral-200 dark:bg-neutral-800" />
          </div>
          {/* Action Button skeleton */}
          <div className="h-[46px] w-48 bg-neutral-300 dark:bg-neutral-800 rounded-none mt-3.5 mb-5.25" />
        </div>

        {/* Shipping Address Section */}
        <div>
          <div className="h-5 w-40 bg-neutral-200 dark:bg-neutral-800 mb-6" />
          <div className="space-y-2 mb-[27px]">
            <div className="h-3.5 w-48 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3.5 w-60 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3.5 w-36 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3.5 w-32 bg-neutral-200 dark:bg-neutral-800" />
          </div>
          {/* Action Button skeleton */}
          <div className="h-[46px] w-52 bg-neutral-300 dark:bg-neutral-800 rounded-none mt-3.5 mb-5.25" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 border rounded-none font-archivo">
      <div>
        <h4 className="text-xs text-black mt-3.5 mb-5.25">
          The following addresses will be used on the checkout page by default.
        </h4>
      </div>
      <div>
        <div>
          <h3 className="text-[18px] font-medium mb-6">Billing address</h3>
        </div>
        <div>
          <address
            style={{
              fontStyle: 'normal',
              fontSize: 14,
              lineHeight: 1.2,
              marginBottom: 27,
            }}
            className=""
          >
            {render_address_content(billing_address)}
          </address>
          <button
            onClick={() => route_to_page('/address/billing-address')}
            className="p-4 uppercase mt-3.5 mb-5.25 text-xs  bg-[#1d2128] rounded-none text-white"
          >
            {billing_address ? 'Edit Billing address' : 'Add Billing address'}
          </button>
        </div>
      </div>
      <div>
        <div>
          <h3 className="text-[18px] font-medium mb-6">Shipping address</h3>
        </div>
        <div>
          <address
            style={{
              fontStyle: 'normal',
              fontSize: 14,
              lineHeight: 1.2,
              marginBottom: 27,
            }}
            className=""
          >
            {render_address_content(shipping_address)}
          </address>
          <button
            onClick={() => route_to_page('/address/shipping-address')}
            className="p-4 text-xs uppercase rounded-none mt-3.5 mb-5.25  bg-[#1d2128] text-white"
          >
            {shipping_address ? 'Edit Shipping address' : 'Add Shipping address'}
          </button>
        </div>
      </div>
    </div>
  );
}
