import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InvoicePrintClient } from '@/components/order/InvoicePrintClient';

interface PageProps {
  params: Promise<{ locale: string; orderId: string }>;
}

async function getOrder(orderId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single() as any;
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function InvoicePage({ params }: PageProps) {
  const { locale, orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  // Allow download once payment is initiated (pending_payment = Chargily accepted it)
  const allowedStatuses = ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered'];
  if (!allowedStatuses.includes(order.status)) notFound();

  return <InvoicePrintClient order={order} locale={locale} />;
}
