import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AdminOrdersClient } from '@/components/admin/AdminOrdersClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: `NexusPC Admin — ${t('orders')}` };
}

async function getOrders() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = await createClient();
    // Default: last 7 days
    const from = new Date();
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'pending_payment')
      .gte('created_at', from.toISOString())
      .order('created_at', { ascending: false });
    return data ?? [];
  } catch { return []; }
}

export default async function AdminOrdersPage({ params }: PageProps) {
  const { locale } = await params;
  const orders = await getOrders();
  return <AdminOrdersClient locale={locale} orders={orders as any[]} />;
}
