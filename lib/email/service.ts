import { STORE_DETAILS } from '@/constants/store-details';
import LoginSuccessEmail from '@/emails/login-success';
import EmailVerificationEmail from '@/emails/email-verification';
import RegisterSuccessEmail from '@/emails/register-sucesss';
import PasswordResetEmail from '@/emails/password-reset';
import PasswordChangedEmail from '@/emails/password-changed';
import AbandonedCartEmail, { AbandonedCartEmailItem } from '@/emails/send-adadon-cart';
import PaymentReceiptEmail, {
  PaymentReceiptItem,
  PaymentReceiptSummaryRow,
} from '@/emails/order-success';
import ContactEnquiryEmail from '@/emails/contact-us';
import { UserData } from '@/services/user.service';
import { render } from '@react-email/render';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM_DOMAIN = STORE_DETAILS.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
// const FROM_ADDRESS = process.env.EMAIL_FROM ?? `noreply@${DEFAULT_FROM_DOMAIN || 'sneaker.com'}`;

const FROM_ADDRESS = process.env.EMAIL_FROM!;
type EmailResult =
  | { success: true }
  | {
      success: false;
      status: 500;
      message: string;
    };

// ─────────────────────────────────────────────────────────────────────────────
// Shared error handler — keeps all three functions consistent
// ─────────────────────────────────────────────────────────────────────────────
function handleEmailError(label: string, err: unknown): EmailResult {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error(`${label}:`, err);
  return { success: false, status: 500, message };
}

type EmailRecipient = Pick<UserData, 'email' | 'username'>;

// TODO: remove once a production sending domain is configured
// const TEST_RECIPIENT = 'bernadoattard@gmail.com';

function resolveRecipient(user: EmailRecipient): string {
  return user.email;
}

async function sendEmail(input: {
  label: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.replyTo && { replyTo: input.replyTo }),
    });

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (err) {
    return handleEmailError(input.label, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email verification (register) — sends the verify link with the raw token
// ─────────────────────────────────────────────────────────────────────────────
export async function sendEmailVerification(
  user: EmailRecipient,
  token: string
): Promise<EmailResult> {
  try {
    const verifyUrl = `${STORE_DETAILS.domain}/verify-email?token=${encodeURIComponent(token)}`;

    const html = await render(
      EmailVerificationEmail({
        userName: user.username,
        verifyUrl,
        expiresInText: '24 hours',
      })
    );

    return sendEmail({
      label: 'Verification email error',
      to: resolveRecipient(user),
      subject: `${STORE_DETAILS.name} — Verify your email address`,
      html,
    });
  } catch (err) {
    return handleEmailError('Verification email error', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome (after email verified) — account is now active
// ─────────────────────────────────────────────────────────────────────────────
export async function sendRegistrationSuccess(user: EmailRecipient): Promise<EmailResult> {
  try {
    const html = await render(
      RegisterSuccessEmail({
        userName: user.username,
      })
    );

    return sendEmail({
      label: 'Registration email error',
      to: resolveRecipient(user),
      subject: `Welcome to ${STORE_DETAILS.name}`,
      html,
    });
  } catch (err) {
    return handleEmailError('Registration email error', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Password reset (forgot-password) — sends the reset link with the raw token
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordReset(user: EmailRecipient, token: string): Promise<EmailResult> {
  try {
    const resetUrl = `${STORE_DETAILS.domain}/reset-password?token=${encodeURIComponent(token)}`;

    const html = await render(
      PasswordResetEmail({
        userName: user.username,
        resetUrl,
        expiresInText: '15 minutes',
      })
    );

    return sendEmail({
      label: 'Password reset email error',
      to: resolveRecipient(user),
      subject: `${STORE_DETAILS.name} — Reset your password`,
      html,
    });
  } catch (err) {
    return handleEmailError('Password reset email error', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Password changed (reset-password) — confirmation notice
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordChanged(
  user: EmailRecipient,
  time?: string
): Promise<EmailResult> {
  try {
    const html = await render(
      PasswordChangedEmail({
        userName: user.username,
        time,
      })
    );

    return sendEmail({
      label: 'Password changed email error',
      to: resolveRecipient(user),
      subject: `${STORE_DETAILS.name} — Your password was changed`,
      html,
    });
  } catch (err) {
    return handleEmailError('Password changed email error', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Login notification
// ─────────────────────────────────────────────────────────────────────────────
export async function sendLoginSuccess(
  user: EmailRecipient,
  location?: string,
  time?: string,
  device?: string
): Promise<EmailResult> {
  try {
    const html = await render(
      LoginSuccessEmail({
        userName: user.username,
        location,
        device,
        time,
      })
    );

    return sendEmail({
      label: 'Login email error',
      to: resolveRecipient(user),
      subject: `${STORE_DETAILS.name} — New sign-in detected`,
      html,
    });
  } catch (err) {
    return handleEmailError('Login email error', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Abandoned cart reminder — premium recap of the items left behind
// ─────────────────────────────────────────────────────────────────────────────
export type AbandonedCartItemInput = {
  name: string;
  size: string;
  quantity: number;
  priceAtAdd: number; // smallest unit (kobo/cents)
  imageUrl?: string | null;
};

function formatAmount(amountInSmallestUnit: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(
      amountInSmallestUnit / 100
    );
  } catch {
    return `${currency} ${(amountInSmallestUnit / 100).toFixed(2)}`;
  }
}

export async function sendAbandonedCartReminder(
  user: EmailRecipient,
  items: AbandonedCartItemInput[],
  currency: string
): Promise<EmailResult> {
  try {
    if (!items.length) {
      return { success: false, status: 500, message: 'Cart has no items to remind about' };
    }

    const emailItems: AbandonedCartEmailItem[] = items.map((item) => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice: formatAmount(item.priceAtAdd, currency),
      lineTotal: formatAmount(item.priceAtAdd * item.quantity, currency),
      imageUrl: item.imageUrl ?? null,
    }));

    const cartTotal = formatAmount(
      items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0),
      currency
    );

    const html = await render(
      AbandonedCartEmail({
        userName: user.username,
        items: emailItems,
        cartTotal,
        cartUrl: `${STORE_DETAILS.domain}/carts`,
      })
    );

    return sendEmail({
      label: 'Abandoned cart email error',
      to: resolveRecipient(user),
      subject: `${STORE_DETAILS.name} — Your pairs are still waiting`,
      html,
    });
  } catch (err) {
    return handleEmailError('Abandoned cart email error', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment receipt — success and failed variants, itemized with all fees
// ─────────────────────────────────────────────────────────────────────────────
export type PaymentReceiptInput = {
  status: 'success' | 'failed';
  orderNumber: string;
  currency: string;
  items: {
    name: string;
    size: string;
    quantity: number;
    unitPrice: number; // smallest unit (kobo/cents)
  }[];
  subtotal: number; // smallest unit
  shippingFee: number;
  paymentFee: number;
  discount: number;
  total: number;
  reference: string;
  channel?: string | null;
  paidAt?: Date | null;
  failureReason?: string | null;
};

export async function sendPaymentReceipt(
  user: EmailRecipient,
  receipt: PaymentReceiptInput
): Promise<EmailResult> {
  const label =
    receipt.status === 'success' ? 'Payment receipt email error' : 'Payment failed email error';

  try {
    const { currency } = receipt;

    const emailItems: PaymentReceiptItem[] = receipt.items.map((item) => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice: formatAmount(item.unitPrice, currency),
      lineTotal: formatAmount(item.unitPrice * item.quantity, currency),
    }));

    // Full fee transparency — every component of the charge, like a real receipt.
    const summaryRows: PaymentReceiptSummaryRow[] = [
      { label: 'Subtotal', value: formatAmount(receipt.subtotal, currency) },
      { label: 'Shipping', value: formatAmount(receipt.shippingFee, currency) },
      { label: 'Payment processing fee', value: formatAmount(receipt.paymentFee, currency) },
    ];

    if (receipt.discount > 0) {
      summaryRows.push({
        label: 'Discount',
        value: `-${formatAmount(receipt.discount, currency)}`,
      });
    }

    const creditApplied =
      receipt.subtotal +
      receipt.shippingFee +
      receipt.paymentFee -
      receipt.discount -
      receipt.total;
    if (creditApplied > 0) {
      summaryRows.push({
        label: 'Store credit applied',
        value: `-${formatAmount(creditApplied, currency)}`,
      });
    }

    const html = await render(
      PaymentReceiptEmail({
        status: receipt.status,
        userName: user.username,
        orderNumber: receipt.orderNumber,
        items: emailItems,
        summaryRows,
        total: formatAmount(receipt.total, currency),
        reference: receipt.reference,
        channel: receipt.channel ?? null,
        paidAt: receipt.paidAt ? receipt.paidAt.toLocaleString() : null,
        failureReason: receipt.failureReason ?? null,
      })
    );

    const subject =
      receipt.status === 'success'
        ? `${STORE_DETAILS.name} — Receipt for order ${receipt.orderNumber}`
        : `${STORE_DETAILS.name} — Payment failed for order ${receipt.orderNumber}`;

    return sendEmail({
      label,
      to: resolveRecipient(user),
      subject,
      html,
    });
  } catch (err) {
    return handleEmailError(label, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact enquiry — forwards the website contact form to the support inbox
// ─────────────────────────────────────────────────────────────────────────────
export type ContactEnquiryInput = {
  name: string;
  email: string;
  subjectLabel: string;
  message: string;
};

export async function sendContactEnquiry(enquiry: ContactEnquiryInput): Promise<EmailResult> {
  try {
    const html = await render(
      ContactEnquiryEmail({
        senderName: enquiry.name,
        senderEmail: enquiry.email,
        subjectLabel: enquiry.subjectLabel,
        message: enquiry.message,
        receivedAt: new Date().toLocaleString(),
      })
    );

    return sendEmail({
      label: 'Contact enquiry email error',
      to: STORE_DETAILS.support_email,
      subject: `${STORE_DETAILS.name} — New enquiry: ${enquiry.subjectLabel}`,
      html,
      replyTo: enquiry.email,
    });
  } catch (err) {
    return handleEmailError('Contact enquiry email error', err);
  }
}
