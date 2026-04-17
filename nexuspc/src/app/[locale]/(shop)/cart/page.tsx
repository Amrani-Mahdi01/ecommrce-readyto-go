import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CartPageClient } from '@/components/cart/CartPageClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `NexusPC — ${t('cart')}` };
}

export default async function CartPage({ params }: PageProps) {
  const { locale } = await params;
  return <CartPageClient locale={locale} />;
}
