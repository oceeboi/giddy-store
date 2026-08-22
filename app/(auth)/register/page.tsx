import { STORE_DETAILS } from '@/constants/store-details';
import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: `Create Account |  ${STORE_DETAILS.name ?? 'Giddy Culture'}`,
  description:
    'Create your Giddy Culture account to save addresses, track orders, and unlock member rewards.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
