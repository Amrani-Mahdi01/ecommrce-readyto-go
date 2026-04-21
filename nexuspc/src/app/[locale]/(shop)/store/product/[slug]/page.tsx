import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { getProductReviews, getReviewEligibility } from '@/app/actions/reviews';
import type { Product } from '@/types/product';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    return data as Product | null;
  } catch {
    return null;
  }
}

async function getRelated(product: Product): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', product.category_id ?? '')
      .eq('is_active', true)
      .neq('id', product.id)
      .limit(4);
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found' };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const title = (locale === 'ar' ? product.meta_title_ar : product.meta_title_en)
    ?? (locale === 'ar' ? product.name_ar : product.name_en);
  const description =
    (locale === 'ar' ? product.meta_description_ar : product.meta_description_en) ??
    (locale === 'ar' ? product.description_ar : product.description_en) ??
    '';
  const image = product.images[0] ?? `${siteUrl}/og.png`;
  const pageUrl = `${siteUrl}/${locale}/store/product/${slug}`;

  return {
    title: `${title} — NexusPC`,
    description,
    alternates: {
      canonical: pageUrl,
      languages: {
        'en': `${siteUrl}/en/store/product/${slug}`,
        'ar': `${siteUrl}/ar/store/product/${slug}`,
        'x-default': `${siteUrl}/en/store/product/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: [{ url: image, width: 800, height: 800, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [related, reviews, eligibility] = await Promise.all([
    getRelated(product),
    getProductReviews(product.id),
    getReviewEligibility(product.id),
    getTranslations({ locale, namespace: 'product' }),
  ]);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const productName = locale === 'ar' ? product.name_ar : product.name_en;
  const productDesc = (locale === 'ar' ? product.description_ar : product.description_en) ?? '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: productDesc,
    image: product.images.length > 0 ? product.images : [`${siteUrl}/og.png`],
    sku: product.sku ?? undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'DZD',
      price: product.price,
      availability: product.stock_qty > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/${locale}/store/product/${product.slug}`,
      seller: { '@type': 'Organization', name: 'NexusPC' },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient
        product={product}
        related={related}
        locale={locale}
        reviews={reviews}
        eligibility={eligibility}
      />
    </>
  );
}
