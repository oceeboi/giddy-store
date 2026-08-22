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

export type PaymentReceiptItem = {
  name: string;
  size: string;
  quantity: number;
  unitPrice: string; // pre-formatted
  lineTotal: string; // pre-formatted
};

export type PaymentReceiptSummaryRow = {
  label: string;
  value: string; // pre-formatted, may include leading "-" for credits/discounts
};

type PaymentReceiptEmailProps = {
  status?: 'success' | 'failed';
  userName?: string;
  orderNumber?: string;
  items?: PaymentReceiptItem[];
  summaryRows?: PaymentReceiptSummaryRow[];
  total?: string; // pre-formatted
  reference?: string;
  channel?: string | null;
  paidAt?: string | null;
  failureReason?: string | null;
};

export default function PaymentReceiptEmail({
  status = 'success',
  userName = 'Valued Customer',
  orderNumber = '',
  items = [],
  summaryRows = [],
  total = '',
  reference = '',
  channel = null,
  paidAt = null,
  failureReason = null,
}: PaymentReceiptEmailProps) {
  const year = new Date().getFullYear();
  const isSuccess = status === 'success';

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
                {isSuccess ? 'Payment receipt' : 'Payment update'}
              </Text>
              <Heading className="m-0 mb-2 text-[22px] font-bold leading-tight text-[#1d2128]">
                {isSuccess ? 'Your payment was successful' : 'Your payment didn’t go through'}
              </Heading>
              <Text className="m-0 mb-6 text-[14px] leading-relaxed text-[#5f6570]">
                {isSuccess
                  ? `Hi ${userName}, thank you for your order. Your payment has been confirmed and your order is now being processed. Here is your receipt.`
                  : `Hi ${userName}, unfortunately your payment for this order could not be completed. No money has been taken for this order, reserved items were released, and any store credit used has been returned to your account.`}
              </Text>

              {/* Failure reason */}
              {!isSuccess && failureReason ? (
                <Section className="mb-6 rounded-md border border-solid border-[#e6e6e8] bg-[#fafafa] px-5 py-4">
                  <Text className="m-0 mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#5f6570]">
                    Reason from payment provider
                  </Text>
                  <Text className="m-0 text-[13px] leading-normal text-[#1d2128]">
                    {failureReason}
                  </Text>
                </Section>
              ) : null}

              {/* Order + payment details */}
              <Section className="rounded-md bg-[#fafafa] px-5 py-4">
                <Text className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#5f6570]">
                  {isSuccess ? 'Payment details' : 'Order details'}
                </Text>
                {orderNumber ? (
                  <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                    <span className="text-[#5f6570]">Order:&nbsp;</span>
                    <span className="font-semibold">{orderNumber}</span>
                  </Text>
                ) : null}
                {reference ? (
                  <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                    <span className="text-[#5f6570]">Reference:&nbsp;</span>
                    <span className="font-semibold">{reference}</span>
                  </Text>
                ) : null}
                {isSuccess && channel ? (
                  <Text className="m-0 mb-2 text-[13px] leading-normal text-[#1d2128]">
                    <span className="text-[#5f6570]">Paid via:&nbsp;</span>
                    <span className="font-semibold capitalize">{channel}</span>
                  </Text>
                ) : null}
                {isSuccess && paidAt ? (
                  <Text className="m-0 text-[13px] leading-normal text-[#1d2128]">
                    <span className="text-[#5f6570]">Date:&nbsp;</span>
                    <span className="font-semibold">{paidAt}</span>
                  </Text>
                ) : null}
              </Section>

              {/* Items */}
              {items.length ? (
                <Section className="mt-4 rounded-md border border-solid border-[#e6e6e8] px-5 py-1">
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
                            <td valign="top">
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
              ) : null}

              {/* Fees / summary — full transparency */}
              {summaryRows.length ? (
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  role="presentation"
                  className="mt-4"
                >
                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.label}>
                        <td className="py-1">
                          <Text className="m-0 text-[13px] text-[#5f6570]">{row.label}</Text>
                        </td>
                        <td className="py-1" align="right">
                          <Text className="m-0 text-[13px] font-semibold text-[#1d2128]">
                            {row.value}
                          </Text>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              {total ? (
                <>
                  <Hr className="my-3 border-t border-solid border-[#e6e6e8]" />
                  <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <Text className="m-0 text-[14px] font-semibold text-[#1d2128]">
                            {isSuccess ? 'Total paid' : 'Order total'}
                          </Text>
                        </td>
                        <td align="right">
                          <Text className="m-0 text-[16px] font-bold text-[#1d2128]">{total}</Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              ) : null}

              <Hr className="my-6 border-t border-solid border-[#e6e6e8]" />

              <Button
                href={
                  isSuccess ? `${STORE_DETAILS.domain}/orders` : `${STORE_DETAILS.domain}/carts`
                }
                className="block rounded-md bg-[#1d2128] px-6 py-3 text-center text-[14px] font-semibold text-white"
              >
                {isSuccess ? 'View my order' : 'Try again'}
              </Button>

              <Text className="m-0 mt-4 text-center text-[12px] leading-normal text-[#5f6570]">
                Questions about this {isSuccess ? 'receipt' : 'payment'}? Contact us at{' '}
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
                &copy; {year} {STORE_DETAILS.name}. You received this email because of a payment
                activity on your order.
              </Text>
            </Section>
          </Container>
        </Section>
      </Html>
    </Tailwind>
  );
}
