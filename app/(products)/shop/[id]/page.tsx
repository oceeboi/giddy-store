import { format_currency } from '@/utils/format';

export default function ShoppingProductDetailsPage() {
  return (
    <section>
      <section className="flex flex-col gap-4">
        <div>product image here</div>
        <div>
          <section className="pt-6 pb-12 px-4">
            <div>
              <h3 className="text-xl font-archivo font-medium tracking-tight">
                Ashluxe Shadow Stripe Jersey Black
              </h3>
              <div>
                <h4>
                  <span className="text-lg font-archivo font-medium tracking-tight">
                    {format_currency(5000000)}
                  </span>
                </h4>
                <h4>
                  <span className="text-lg font-archivo font-medium tracking-tight">
                    {format_currency(6000000)}
                  </span>
                </h4>
              </div>
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}
