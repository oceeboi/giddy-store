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

type ContactEnquiryEmailProps = {
  senderName?: string;
  senderEmail?: string;
  subjectLabel?: string;
  message?: string;
  receivedAt?: string;
};

export default function ContactEnquiryEmail({
  senderName = 'Unknown sender',
  senderEmail = '',
  subjectLabel = 'Other',
  message = '',
  receivedAt = new Date().toLocaleString(),
}: ContactEnquiryEmailProps) {
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
              <Text className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#5f6570]">
                Contact form
              </Text>
              <Heading className="m-0 mb-2 text-[22px] font-bold leading-tight text-[#1d2128]">
                New customer enquiry
              </Heading>
              <Text className="m-0 mb-6 text-[14px] leading-relaxed text-[#5f6570]">
                A customer submitted the contact form on {STORE_DETAILS.name}. Details below — reply
                directly to get back to them within the 24-hour promise.
              </Text>

              {/* Sender details */}
              <Section className="rounded-md bg-[#fafafa] px-5 py-4">
                <Text className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#5f6570]">
                  Enquiry details
                </Text>
                <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                  <span className="text-[#5f6570]">From:&nbsp;</span>
                  <span className="font-semibold">{senderName}</span>
                </Text>
                <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                  <span className="text-[#5f6570]">Email:&nbsp;</span>
                  <span className="font-semibold">{senderEmail}</span>
                </Text>
                <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                  <span className="text-[#5f6570]">Subject:&nbsp;</span>
                  <span className="font-semibold">{subjectLabel}</span>
                </Text>
                <Text className="m-0 text-[13px] leading-normal text-[#1d2128]">
                  <span className="text-[#5f6570]">Received:&nbsp;</span>
                  <span className="font-semibold">{receivedAt}</span>
                </Text>
              </Section>

              {/* Message */}
              <Section className="mt-4 rounded-md border border-solid border-[#e6e6e8] px-5 py-4">
                <Text className="m-0 mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#5f6570]">
                  Message
                </Text>
                <Text className="m-0 whitespace-pre-line text-[14px] leading-relaxed text-[#1d2128]">
                  {message}
                </Text>
              </Section>

              <Hr className="my-6 border-t border-solid border-[#e6e6e8]" />

              <Button
                href={`mailto:${senderEmail}`}
                className="block rounded-md bg-[#1d2128] px-6 py-3 text-center text-[14px] font-semibold text-white"
              >
                Reply to {senderName}
              </Button>
            </Section>

            {/* Footer */}
            <Section className="mt-6 text-center">
              <Text className="m-0 mb-1 text-[12px] font-semibold text-[#1d2128]">
                {STORE_DETAILS.name}
              </Text>
              <Text className="m-0 text-[11px] leading-normal text-[#5f6570]">
                &copy; {year} {STORE_DETAILS.name}. Internal notification — sent to{' '}
                {STORE_DETAILS.support_email} from the website contact form.
              </Text>
            </Section>
          </Container>
        </Section>
      </Html>
    </Tailwind>
  );
}
