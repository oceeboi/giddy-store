import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Text } from '@react-email/text';
import { Section } from '@react-email/section';
import { Container } from '@react-email/container';
import { Img } from '@react-email/img';
import { Heading } from '@react-email/heading';
import { Hr } from '@react-email/hr';
import { Button } from '@react-email/button';
import { Tailwind } from '@react-email/tailwind';
import { STORE_DETAILS } from '@/constants/store-details';

type PasswordResetEmailProps = {
  userName?: string;
  resetUrl?: string;
  expiresInText?: string;
};

export default function PasswordResetEmail({
  userName = 'Valued Customer',
  resetUrl = `${STORE_DETAILS.domain}/reset-password`,
  expiresInText = '15 minutes',
}: PasswordResetEmailProps) {
  const year = new Date().getFullYear();

  return (
    <Tailwind>
      <Html lang="en">
        <Head />

        <Section className="bg-[#fafafa] py-10 font-sans">
          <Container className="mx-auto w-full max-w-130">
            {/* Header / brand */}
            <Section className="mb-4 text-center">
              {STORE_DETAILS.logo ? (
                <Img
                  src={STORE_DETAILS.logo}
                  alt={STORE_DETAILS.name}
                  width="140"
                  className="mx-auto h-6 w-auto object-contain"
                />
              ) : (
                <Text className="m-0 text-[16px] font-bold tracking-wide text-[#1d2128]">
                  {STORE_DETAILS.name}
                </Text>
              )}
            </Section>

            {/* Main card */}
            <Section className="rounded-lg border border-solid border-[#e6e6e8] bg-white p-8">
              <Heading className="m-0 mb-2 text-[22px] font-bold leading-tight text-[#1d2128]">
                Reset your password
              </Heading>
              <Text className="m-0 mb-6 text-[14px] leading-relaxed text-[#5f6570]">
                Hi {userName}, we received a request to reset the password for your{' '}
                {STORE_DETAILS.name} account. Click the button below to choose a new one.
              </Text>

              <Button
                href={resetUrl}
                className="block rounded-md bg-[#1d2128] px-6 py-3 text-center text-[14px] font-semibold text-white"
              >
                Reset my password
              </Button>

              <Text className="m-0 mt-4 text-center text-[12px] leading-normal text-[#5f6570]">
                This link expires in {expiresInText}.
              </Text>

              <Hr className="my-6 border-t border-solid border-[#e6e6e8]" />

              <Text className="m-0 mb-2 text-[12px] leading-normal text-[#5f6570]">
                If the button doesn&apos;t work, copy and paste this link into your browser:
              </Text>
              <Text className="m-0 break-all text-[12px] leading-normal">
                <a href={resetUrl} className="text-[#1d2128] underline">
                  {resetUrl}
                </a>
              </Text>

              <Text className="m-0 mt-5 text-[12px] leading-normal text-[#5f6570]">
                If you didn&apos;t request a password reset, you can safely ignore this email — your
                password will remain unchanged.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="mt-6 text-center">
              <Text className="m-0 mb-1 text-[12px] font-semibold text-[#1d2128]">
                {STORE_DETAILS.name}
              </Text>
              <Text className="m-0 mb-2 text-[11px] leading-normal text-[#5f6570]">
                {STORE_DETAILS.loaction}
              </Text>
              <Text className="m-0 text-[11px] leading-normal text-[#5f6570]">
                &copy; {year} {STORE_DETAILS.name}. You received this email because a password reset
                was requested for your account.
              </Text>
            </Section>
          </Container>
        </Section>
      </Html>
    </Tailwind>
  );
}
