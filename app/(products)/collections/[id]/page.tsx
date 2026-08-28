import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { STORE_DETAILS } from '@/constants/store-details';
import { ProductService } from '@/services/product.service';
import { ClothingProductData } from '@/types/shared/product';
import { ProductView } from '@/components/comps';

interface PageProps {
  params: Promise<{ id: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? STORE_DETAILS.domain;
const productService = new ProductService();

// Deduplicate request fetching across generateMetadata & Page Component
const getProduct = cache(async (slug: string) => {
  return productService.getProductBySlug(slug);
});

function safeDecode(id: string) {
  try {
    return decodeURIComponent(id ?? '').trim();
  } catch {
    return '';
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const slug = safeDecode(id);

  if (!slug) {
    return { title: 'Product Not Found', robots: { index: false, follow: false } };
  }

  const result = await getProduct(slug);

  if (!result.success || !result.data) {
    return { title: 'Product Not Found', robots: { index: false, follow: false } };
  }

  const product = result.data;
  const title = product.seo?.title || `${product.name} | ${STORE_DETAILS.name}`;
  const description =
    product.seo?.description ||
    product.description?.narrative?.slice(0, 160) ||
    `Buy ${product.name} online at ${STORE_DETAILS.name}.`;
  const primaryImage =
    product.media?.[0]?.url ||
    product.media?.find((m) => m.type === 'image')?.url ||
    '/og-image.png';
  const pageUrl = `${siteUrl}/collections/${encodeURIComponent(product.slug)}`;

  return {
    title,
    description,
    keywords: product.seo?.keywords?.length ? product.seo.keywords : undefined,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: STORE_DETAILS.name,
      images: primaryImage
        ? [
            {
              url: primaryImage,
              width: 1200,
              height: 630,
              alt: product.media?.[0]?.alt || product.name,
            },
          ]
        : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}

function buildProductJsonLd(product: ClothingProductData, pageUrl: string) {
  const totalAvailable = product.variants?.reduce(
    (sum, size) => (size.active ? sum + Math.max(size.availableQuantity, 0) : sum),
    0
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.seo?.description || product.description?.narrative || undefined,
    image: product.media?.filter((m) => m.type === 'image').map((m) => m.url),
    sku: product.description?.styleCode || undefined,
    brand: product.brand?.name ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      url: pageUrl,
      priceCurrency: product.pricing.currency,
      price: (product.pricing.basePrice / 100).toFixed(2),
      availability:
        totalAvailable && totalAvailable > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const slug = safeDecode(id);

  if (!slug) {
    notFound();
  }

  const result = await getProduct(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;
  const pageUrl = `${siteUrl}/collections/${encodeURIComponent(product.slug)}`;
  const jsonLd = buildProductJsonLd(product, pageUrl);

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <article>
        <ProductView slug={product.slug} />
      </article>
    </main>
  );
}
