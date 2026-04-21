import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OrderSuccessClient } from '@/components/checkout/OrderSuccessClient';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return { title: `NexusPC — ${t('successTitle')}` };
}

export default async function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  return <OrderSuccessClient locale={locale} orderNumber={sp.order} phone={sp.phone} paymentMethod={sp.payment} />;
}
