import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
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

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <TrackOrderClient locale={locale} userOrders={null} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <TrackOrderClient locale={locale} userOrders={null} />;
  }

  const [{ data: orders }, { data: reviews }] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('product_id')
      .eq('user_id', user.id),
  ]);

  const reviewedProductIds = (reviews ?? []).map((r: { product_id: string }) => r.product_id);

  return <TrackOrderClient locale={locale} userOrders={orders ?? []} reviewedProductIds={reviewedProductIds} />;
}
