import type { Metadata } from 'next';
import { AdminDeliveryClient } from '@/components/admin/AdminDeliveryClient';
import { getWilayaDeliveryPrices, getOffices } from '@/app/actions/delivery';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = { title: 'NexusPC Admin — Delivery' };

export default async function DeliveryPage({ params }: PageProps) {
  const { locale } = await params;
  const [wilayaPrices, offices] = await Promise.all([
    getWilayaDeliveryPrices(),
    getOffices(),
  ]);
  return (
    <AdminDeliveryClient locale={locale} wilayaPrices={wilayaPrices} offices={offices} />
  );
}
