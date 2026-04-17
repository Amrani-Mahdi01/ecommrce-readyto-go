import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TrackOrderClient } from '@/components/order/TrackOrderClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'order' });
  return { title: `NexusPC — ${t('trackTitle')}` };
}

export default async function TrackOrderPage({ params }: PageProps) {
  const { locale } = await params;
  return <TrackOrderClient locale={locale} />;
}
