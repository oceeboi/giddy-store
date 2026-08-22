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

type RegisterSuccessEmailProps = {
  userName?: string;
};

export default function RegisterSuccessEmail({
  userName = 'Valued Customer',
}: RegisterSuccessEmailProps) {
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
                Welcome to {STORE_DETAILS.name}
              </Heading>
              <Text className="m-0 mb-6 text-[14px] leading-relaxed text-[#5f6570]">
                Hi {userName}, your email is verified and your account is now active. You&apos;re
                all set to explore the latest drops and classics.
              </Text>

              {/* What you get */}
              <Section className="rounded-md bg-[#fafafa] px-5 py-4">
                <Text className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#5f6570]">
                  With your account
                </Text>
                <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                  &bull;&nbsp; Track your orders from checkout to delivery
                </Text>
                <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                  &bull;&nbsp; Save items to your wishlist for later
                </Text>
                <Text className="m-0 text-[13px] leading-normal text-[#1d2128]">
                  &bull;&nbsp; Earn rewards through referrals
                </Text>
              </Section>

              <Hr className="my-6 border-t border-solid border-[#e6e6e8]" />

              <Button
                href={STORE_DETAILS.domain}
                className="block rounded-md bg-[#1d2128] px-6 py-3 text-center text-[14px] font-semibold text-white"
              >
                Start shopping
              </Button>

              <Text className="m-0 mt-4 text-center text-[12px] leading-normal text-[#5f6570]">
                Need help? Contact us at{' '}
                <a
                  href={`mailto:${STORE_DETAILS.support_email}`}
                  className="text-[#1d2128] underline"
                >
                  {STORE_DETAILS.support_email}
                </a>
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
                &copy; {year} {STORE_DETAILS.name}. You received this email because your account was
                activated.
              </Text>
            </Section>
          </Container>
        </Section>
      </Html>
    </Tailwind>
  );
}
