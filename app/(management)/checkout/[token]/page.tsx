import { CheckoutComp } from '@/components/comps/checkout';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { token } = await params;

  if (!token) {
    return (
      <div>
        <h1>Checkout Draft</h1>
        <p>No token provided.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Checkout Draft</h1>
      <pre className="text-black">{token}</pre>
      <CheckoutComp token={token} />
    </div>
  );
}
