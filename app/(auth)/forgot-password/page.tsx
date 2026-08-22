import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { STORE_DETAILS } from '@/constants/store-details';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Forgot Password |  ${STORE_DETAILS.name ?? 'Giddy Culture'}`,
  description: 'Request a secure password reset link for your Giddy Culture account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
