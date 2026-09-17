import { STORE_DETAILS } from '@/constants/store-details';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: `Saved Addresses | ${STORE_DETAILS.name}`,
  description: `Manage your shipping and billing addresses for fast, secure checkout at ${STORE_DETAILS.name}.`,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AddressLayout({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>;
}
