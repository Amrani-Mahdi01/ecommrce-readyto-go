import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { getWilayaDeliveryPrices, getOffices } from '@/app/actions/delivery';
import { getOnlinePaymentEnabled } from '@/app/actions/settings';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return { title: `NexusPC — ${t('title')}` };
}

export default async function CheckoutPage({ params }: PageProps) {
  const { locale } = await params;
  const [wilayaPrices, allOffices, onlinePaymentEnabled] = await Promise.all([
    getWilayaDeliveryPrices(),
    getOffices(),
    getOnlinePaymentEnabled(),
  ]);
  const offices = allOffices.filter((o: { is_active: boolean }) => o.is_active);
  return (
    <CheckoutClient
      locale={locale}
      wilayaPrices={wilayaPrices}
      offices={offices}
      onlinePaymentEnabled={onlinePaymentEnabled}
    />
  );
}
