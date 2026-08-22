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

type LoginSuccessEmailProps = {
  userName?: string;
  location?: string;
  device?: string;
  time?: string;
};

export default function LoginSuccessEmail({
  userName = 'Valued Customer',
  location = 'Unknown location',
  device = 'Unknown device',
  time = new Date().toLocaleString(),
}: LoginSuccessEmailProps) {
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
                New sign-in to your account
              </Heading>
              <Text className="m-0 mb-6 text-[14px] leading-relaxed text-[#5f6570]">
                Hi {userName}, we noticed a new sign-in to your {STORE_DETAILS.name} account. If
                this was you, no action is needed.
              </Text>

              {/* Sign-in details */}
              <Section className="rounded-md bg-[#fafafa] px-5 py-4">
                <Text className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#5f6570]">
                  Sign-in details
                </Text>

                <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                  <span className="text-[#5f6570]">Time:&nbsp;</span>
                  <span className="font-semibold">{time}</span>
                </Text>
                <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                  <span className="text-[#5f6570]">Location:&nbsp;</span>
                  <span className="font-semibold">{location}</span>
                </Text>
                <Text className="m-0 text-[13px] leading-normal text-[#1d2128]">
                  <span className="text-[#5f6570]">Device:&nbsp;</span>
                  <span className="font-semibold">{device}</span>
                </Text>
              </Section>

              <Hr className="my-6 border-t border-solid border-[#e6e6e8]" />

              {/* Security guidance */}
              <Text className="m-0 mb-5 text-[14px] leading-relaxed text-[#5f6570]">
                If you don&apos;t recognize this activity, secure your account now by resetting your
                password.
              </Text>

              <Button
                href={`${STORE_DETAILS.domain}/forgot-password`}
                className="block rounded-md bg-[#1d2128] px-6 py-3 text-center text-[14px] font-semibold text-white"
              >
                Secure my account
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
                &copy; {year} {STORE_DETAILS.name}. You received this email because a sign-in
                occurred on your account.
              </Text>
            </Section>
          </Container>
        </Section>
      </Html>
    </Tailwind>
  );
}
