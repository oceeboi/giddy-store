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

export type AbandonedCartEmailItem = {
  name: string;
  size: string;
  quantity: number;
  unitPrice: string; // pre-formatted, e.g. "₦45,000.00"
  lineTotal: string; // pre-formatted
  imageUrl?: string | null;
};

type AbandonedCartEmailProps = {
  userName?: string;
  items?: AbandonedCartEmailItem[];
  cartTotal?: string; // pre-formatted
  cartUrl?: string;
};

export default function AbandonedCartEmail({
  userName = 'Valued Customer',
  items = [],
  cartTotal = '',
  cartUrl = `${STORE_DETAILS.domain}/carts`,
}: AbandonedCartEmailProps) {
  const year = new Date().getFullYear();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
                Reserved for you
              </Text>
              <Heading className="m-0 mb-2 text-[22px] font-bold leading-tight text-[#1d2128]">
                Your pairs are still waiting
              </Heading>
              <Text className="m-0 mb-6 text-[14px] leading-relaxed text-[#5f6570]">
                Hi {userName}, you left {itemCount > 1 ? `${itemCount} items` : 'an item '} in your
                cart. We&apos;ve kept your selection together so you can pick up right where you
                left off.
              </Text>

              {/* Cart items */}
              <Section className="rounded-md border border-solid border-[#e6e6e8] bg-[#fafafa] px-5 py-1">
                {items.map((item, index) => (
                  <Section
                    key={`${item.name}-${item.size}-${index}`}
                    className={`py-4 ${
                      index < items.length - 1
                        ? 'border-0 border-b border-solid border-[#e6e6e8]'
                        : ''
                    }`}
                  >
                    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
                      <tbody>
                        <tr>
                          {item.imageUrl ? (
                            <td width="64" valign="top">
                              <Img
                                src={item.imageUrl}
                                alt={item.name}
                                width="56"
                                height="56"
                                className="rounded-md bg-[#f4f4f5] object-cover"
                              />
                            </td>
                          ) : null}
                          <td valign="top" className={item.imageUrl ? 'pl-3' : ''}>
                            <Text className="m-0 text-[14px] font-semibold leading-tight text-[#1d2128]">
                              {item.name}
                            </Text>
                            <Text className="m-0 mt-1 text-[12px] leading-normal text-[#5f6570]">
                              Size {item.size} &middot; Qty {item.quantity} &middot;{' '}
                              {item.unitPrice} each
                            </Text>
                          </td>
                          <td valign="top" align="right">
                            <Text className="m-0 text-[14px] font-semibold text-[#1d2128]">
                              {item.lineTotal}
                            </Text>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Section>
                ))}
              </Section>

              {/* Total */}
              {cartTotal ? (
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  role="presentation"
                  className="mt-4"
                >
                  <tbody>
                    <tr>
                      <td>
                        <Text className="m-0 text-[14px] text-[#5f6570]">Cart total</Text>
                      </td>
                      <td align="right">
                        <Text className="m-0 text-[16px] font-bold text-[#1d2128]">
                          {cartTotal}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : null}

              <Hr className="my-6 border-t border-solid border-[#e6e6e8]" />

              <Button
                href={cartUrl}
                className="block rounded-md bg-[#1d2128] px-6 py-3 text-center text-[14px] font-semibold text-white"
              >
                Return to my cart
              </Button>

              <Text className="m-0 mt-4 text-center text-[12px] leading-normal text-[#5f6570]">
                Sizes sell out fast — availability isn&apos;t guaranteed until checkout.
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
                &copy; {year} {STORE_DETAILS.name}. You received this reminder because you have
                items saved in your cart.
              </Text>
            </Section>
          </Container>
        </Section>
      </Html>
    </Tailwind>
  );
}
