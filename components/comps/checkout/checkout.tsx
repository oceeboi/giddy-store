'use client';
import { HeroHeader } from '@/components/shared';
import { toast } from '@/components/toast/toast';
import {
  useCheckoutDraft,
  useCheckoutInitializeMutation,
  useCreateCheckoutDraft,
} from '@/hooks/checkout.hook';
import {
  useAddressesQuery,
  useUpdateShippingAddressMutation,
  useUserQuery,
} from '@/hooks/user.hook';
import { UpsertAddressInput, upsertAddressSchema } from '@/schemas/user.schemas';
import { AddressData } from '@/services/user.service';
import {
  CartItemDraft,
  PricingSummary,
  SterilizedCheckoutDraft,
} from '@/types/checkout-draft.type';
import { format_currency } from '@/utils/format';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Gift } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

const PAYMENT_FEE = 2000_00;

const EMPTY_ADDRESS_VALUES: UpsertAddressInput = {
  firstName: '',
  lastName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  label: '',
};

function to_form_values(address: AddressData | null | undefined): UpsertAddressInput {
  if (!address) return { ...EMPTY_ADDRESS_VALUES };
  return {
    firstName: address.firstName ?? '',
    lastName: address.lastName ?? '',
    phone: address.phone ?? '',
    street: address.street ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    country: address.country ?? '',
    postalCode: address.postalCode ?? '',
    label: address.label ?? '',
  };
}

function pick_dirty_values(
  values: UpsertAddressInput,
  dirty_fields: Partial<Record<keyof UpsertAddressInput, boolean>>
) {
  return (Object.keys(values) as (keyof UpsertAddressInput)[]).reduce(
    (payload, key) => {
      if (dirty_fields[key]) {
        payload[key] = values[key] ?? '';
      }
      return payload;
    },
    {} as Record<string, unknown>
  );
}

function map_address_line(address: AddressData) {
  return [
    `${address.firstName} ${address.lastName}`.trim(),
    address.street,
    `${address.city}, ${address.state}`,
    [address.country, address.postalCode].filter(Boolean).join(' '),
    address.phone,
  ]
    .filter(Boolean)
    .join(', ');
}

interface CheckoutProps {
  token: string;
}

export function CheckoutComp({ token }: CheckoutProps) {
  const { data: user } = useUserQuery();
  const router = useRouter();
  const { isAuthenticated, isLoading: is_session_loading } = {
    isAuthenticated: false,
    isLoading: false,
  };
  const [selected_shipping_id, set_selected_shipping_id] = useState<string>('');

  const {
    data: checkout_draft_res,
    isLoading: is_draft_loading,
    isError,
  } = useCheckoutDraft(token);
  const { mutate: update_draft } = useCreateCheckoutDraft();
  const draft = checkout_draft_res?.draft as SterilizedCheckoutDraft | undefined;
  // Track whether we've already synced to prevent infinite re-render loops

  console.log(draft);
  const has_synced_ref = useRef(false);

  // Draft Customer Sync Effect (Guest -> Authenticated User)
  useEffect(() => {
    if (!isAuthenticated || !user || !draft || has_synced_ref.current) {
      return;
    }

    // Check if the draft is still attached to guest/anonymous data
    const needs_user_id_sync = !draft.customer?.userId && user.id;
    const needs_email_sync = draft.customer?.guestEmail !== user.email;

    if (needs_user_id_sync || needs_email_sync) {
      has_synced_ref.current = true; // Mark as synced

      // Map existing draft cart items including sizeId
      const cart_items_payload = draft.cartItems.map((item) => ({
        productId: item.productId,
        title: item.title,
        unitPrice: item.price,
        quantity: item.quantity,
        image: item.image,
        size: item.size,
        color: item.color,
        variantId: item.variantId,
        sku: item.sku,
      }));

      update_draft(
        {
          checkoutToken: token,
          cartItems: cart_items_payload,
          isAdvisorGenerated: false,
          customer: {
            userId: user.id,
            guestEmail: user?.email,
            isVIP: false,
          },
        },
        {
          onError: () => {
            // Reset flag on error so it can retry if needed
            has_synced_ref.current = false;
          },
        }
      );
    }
  }, [isAuthenticated, user, draft, token, update_draft]);

  const { data: addresses, isLoading: is_addresses_loading } = useAddressesQuery({
    enabled: isAuthenticated,
    retry: false,
  });

  const shipping_address = addresses?.defaults.shipping ?? null;
  const initial_values = useMemo(() => to_form_values(shipping_address), [shipping_address]);

  const shipping_candidates = useMemo(() => {
    return (addresses?.addresses ?? []).filter(
      (addr: { type: string }) => addr.type === 'shipping' || addr.type === 'both'
    );
  }, [addresses]);

  useEffect(() => {
    if (shipping_address?.id) {
      set_selected_shipping_id((curr: any) => curr || shipping_address.id);
      return;
    }
    if (shipping_candidates.length > 0) {
      set_selected_shipping_id((curr: any) => curr || shipping_candidates[0].id);
    }
  }, [shipping_address, shipping_candidates]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: {
      errors: address_errors,
      isSubmitting: is_shipping_form_submitting,
      isDirty: is_shipping_form_dirty,
      dirtyFields,
    },
  } = useForm<UpsertAddressInput>({
    resolver: zodResolver(upsertAddressSchema),
    defaultValues: EMPTY_ADDRESS_VALUES,
  });

  useEffect(() => {
    reset(initial_values);
  }, [initial_values, reset]);

  const { mutate: save_shipping_address, isPending: is_saving_shipping_address } =
    useUpdateShippingAddressMutation({
      onSuccess(address) {
        toast.success('Shipping address saved successfully.');
        set_selected_shipping_id(address.id);
        reset(to_form_values(address));
      },
      onError(error) {
        toast.error(error.message);
      },
    });

  const on_save_shipping_address = (values: UpsertAddressInput) => {
    if (!is_shipping_form_dirty) {
      toast.info('No shipping address changes to save yet.');
      return;
    }

    const dirty_payload = pick_dirty_values(
      values,
      dirtyFields as Partial<Record<keyof UpsertAddressInput, boolean>>
    );

    save_shipping_address({
      ...initial_values,
      ...dirty_payload,
    });
  };

  const { mutate: initialize_checkout, isPending: is_initializing_checkout } =
    useCheckoutInitializeMutation({
      onSuccess(result) {
        if (result.authorizationUrl) {
          window.location.assign(result.authorizationUrl);
          return;
        }
        if (result.order?.orderNumber) {
          toast.success('Checkout completed successfully.');
          router.push(`/orders/${encodeURIComponent(result.order.orderNumber)}`);
        }
      },
      onError(error) {
        toast.error(error.message);
      },
    });

  const is_busy =
    is_draft_loading ||
    is_session_loading ||
    is_addresses_loading ||
    is_shipping_form_submitting ||
    is_saving_shipping_address ||
    is_initializing_checkout;

  const can_checkout =
    isAuthenticated &&
    Boolean(draft) &&
    !draft?.isExpired &&
    Boolean(selected_shipping_id) &&
    !is_busy;

  const handle_login_for_checkout = () => {
    router.push(`/login?returnTo=${encodeURIComponent(`/checkout/${token}`)}`);
  };

  const handle_proceed_to_payment = () => {
    if (!isAuthenticated) {
      toast.info('Sign in to complete checkout.');
      handle_login_for_checkout();
      return;
    }

    if (!selected_shipping_id) {
      toast.error('Please select or save a shipping address first.');
      return;
    }

    type FormatedType = {
      productId: string;
      sizeId: string;
      name: string;
      size: string;
      quantity: number;
      unitPriceKobo: number;
    };
    const formart_items: FormatedType[] | undefined = draft?.cartItems.map((c) => {
      return {
        productId: c.productId,
        sizeId: c.variantId,
        size: c.size,
        quantity: c.quantity,
        unitPriceKobo: c.price,
        name: c.title,
      };
    });
    // update more
    initialize_checkout({
      shippingAddressId: selected_shipping_id,
      useStoreCredit: false,
      items: formart_items!,
      shippingFeeKobo: 0,
    });
  };

  if (is_draft_loading || is_session_loading) {
    return <CheckoutSkeleton />;
  }

  if (isError || !draft) {
    return (
      <div className="mx-auto flex min-h-[50svh] max-w-xl flex-col items-center justify-center text-center font-archivo">
        <h2 className="text-xl font-bold text-neutral-900">Checkout Expired or Invalid</h2>
        <p className="mt-2 text-sm text-neutral-500">
          We couldn't retrieve your checkout session. Please return to your cart and try again.
        </p>
        <Link
          href="/carts"
          className="mt-6 rounded-xl bg-[#1d2128] px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Return to Cart
        </Link>
      </div>
    );
  }

  return (
    <section className="w-full bg-neutral-50/50 min-h-screen font-archivo">
      <section className="mx-auto max-w-8xl px-4 md:px-6 lg:px-8 py-10">
        <HeroHeader
          productName="Checkout"
          description="Review your cart, confirm shipping details, and complete your payment."
        />

        <section className="grid grid-cols-1 w-full gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
            address
          </div>
          <div className="lg:col-span-5">
            <OrderSummaryCard
              draft={draft}
              canCheckout={can_checkout}
              isAuthenticated={isAuthenticated}
              isInitializing={is_initializing_checkout}
              onProceed={handle_proceed_to_payment}
            />
          </div>
        </section>
      </section>
    </section>
  );
}

// ─── Order Summary Component ──────────────────────────────────────────────────

function OrderSummaryCard({
  draft,
  canCheckout,
  isAuthenticated,
  isInitializing,
  onProceed,
}: {
  draft: SterilizedCheckoutDraft;
  canCheckout: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  onProceed: () => void;
}) {
  // Safe default fallbacks to prevent undefined crashes
  const cartItems = Array.isArray(draft?.cartItems) ? draft.cartItems : [];
  const pricingSummary = draft?.pricingSummary ?? {
    subtotal: 0,
    discountTotal: 0,
    shippingCost: 0,
    taxAmount: 0,
    totalAmount: 0,
    currency: 'NGN',
  };
  const giftOptions = draft?.giftOptions ?? {
    isGift: false,
    complimentaryGiftWrapping: false,
  };

  const total_item_count = cartItems.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0);

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs select-none space-y-4 font-archivo">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <h2 className="text-lg font-bold tracking-tight text-[#1d2128]">Order Summary</h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
          {total_item_count} {total_item_count === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {/* Cart Items List */}
      <div className="divide-y divide-neutral-100 max-h-95 overflow-y-auto pr-1">
        {cartItems.length === 0 ? (
          <p className="py-6 text-center text-xs text-neutral-400">No items found in draft.</p>
        ) : (
          cartItems.map((item, index) => (
            <OrderItemRow
              key={`${item.productId}-${item.variantId}-${item.size}-${index}`}
              item={item}
              currency={pricingSummary.currency}
            />
          ))
        )}
      </div>

      {/* Gift Indicator */}
      {giftOptions.isGift && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200/60">
          <Gift className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Complimentary Gift Wrapping Included</span>
        </div>
      )}

      {/* Financial Breakdown */}
      <PricingBreakdown summary={pricingSummary} />

      {/* Checkout Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onProceed}
          disabled={!canCheckout}
          className="w-full rounded-xl bg-[#1d2128] px-4 py-3.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isInitializing
            ? 'Initializing Payment...'
            : !isAuthenticated
              ? 'Sign in to Pay'
              : 'Proceed to Payment'}
        </button>

        {!isAuthenticated && (
          <p className="mt-2 text-center text-[11px] text-neutral-400">
            Sign in is required to authorize order creation and payment.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Pricing Breakdown ────────────────────────────────────────────────────────

function PricingBreakdown({ summary }: { summary: PricingSummary }) {
  const subtotal = summary?.subtotal ?? 0;

  const shippingCost = summary?.shippingCost ?? 0;
  const taxAmount = summary?.taxAmount ?? 0;
  const totalAmount = summary?.totalAmount ?? 0;

  return (
    <div className="space-y-2.5 border-t border-neutral-100 pt-4">
      <div className="flex justify-between text-xs text-neutral-600">
        <span>Subtotal</span>
        <span className="font-medium text-neutral-900">{format_currency(subtotal)}</span>
      </div>
      {/* 
      {discountTotal > 0 && (
        <div className="flex justify-between text-xs text-emerald-700">
          <span>Discount</span>
          <span className="font-medium">-{format_currency(discountTotal)}</span>
        </div>
      )} */}

      <div className="flex justify-between text-xs text-neutral-600">
        <span>Estimated Shipping</span>
        <span className="font-medium text-neutral-900">
          {shippingCost === 0 ? 'FREE' : format_currency(shippingCost)}
        </span>
      </div>

      <div className="flex justify-between text-xs text-neutral-600">
        <span>Estimated Tax</span>
        <span className="font-medium text-neutral-900">{format_currency(taxAmount)}</span>
      </div>

      <div className="flex justify-between text-xs text-neutral-600">
        <span>Payment Fee</span>
        <span className="font-medium text-neutral-900">{format_currency(PAYMENT_FEE)}</span>
      </div>

      <div className="flex justify-between border-t border-neutral-100 pt-3 text-sm font-bold text-[#1d2128]">
        <span>Total</span>
        <span className="text-base text-black">{format_currency(totalAmount + PAYMENT_FEE)}</span>
      </div>
    </div>
  );
}
// ─── Individual Item Row ──────────────────────────────────────────────────────

function OrderItemRow({ item }: { item: CartItemDraft; currency: string }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-neutral-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            loading="eager"
            className="object-cover object-center"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
            No image
          </div>
        )}
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white shadow-xs">
          {item.quantity}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center min-w-0">
        <h4 className="truncate text-xs font-bold text-[#1d2128]">{item.title}</h4>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-500">
          <span>
            Size: <strong className="text-neutral-900">{item.size}</strong>
          </span>
          {item.isReserved && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Reserved
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs font-bold text-neutral-900">{format_currency(item.lineTotal)}</p>
        {item.quantity > 1 && (
          <p className="text-[10px] text-neutral-400">{format_currency(item.price)} each</p>
        )}
      </div>
    </div>
  );
}

// ─── Expiration Badge Helper ─────────────────────────────────────────────────

function DraftExpirationBadge({ expiresAt, isExpired }: { expiresAt: string; isExpired: boolean }) {
  const isClose = useMemo(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 1000 * 60 * 15;
  }, [expiresAt]);

  if (isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200">
        <Clock className="h-3.5 w-3.5" />
        <span>Reservation Expired</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors ${
        isClose
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-neutral-100 text-neutral-600 border-neutral-200'
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>Items reserved temporarily</span>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-8xl px-4 py-10 animate-pulse font-archivo">
      <div className="h-10 w-48 rounded-xl bg-neutral-200 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 h-96 rounded-2xl bg-neutral-100" />
        <div className="lg:col-span-5 h-96 rounded-2xl bg-neutral-100" />
      </div>
    </div>
  );
}
