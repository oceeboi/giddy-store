interface CheckoutProps {
  token: string;
}

export function CheckoutComp({ token }: CheckoutProps) {
  return (
    <section className="w-full">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1d2128] md:text-5xl">Checkout</h1>
          <p className="mt-2 text-sm text-[#5f6570]">
            Review your cart, confirm shipping details, and complete your payment.
          </p>
        </div>

        <section>
          <div>address</div>
          <div>order summary</div>
        </section>
      </section>
    </section>
  );
}
