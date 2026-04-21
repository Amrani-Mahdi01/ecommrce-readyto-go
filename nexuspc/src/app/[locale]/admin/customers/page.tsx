import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AdminCustomersClient } from '@/components/admin/AdminCustomersClient';
import { getBlockedIps } from '@/app/actions/place-order';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: `NexusPC Admin — ${t('customers')}` };
}

async function getCustomers() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = await createClient();

    const [{ data: profiles }, { data: orders }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('user_id, total, created_at').not('user_id', 'is', null),
    ]);

    if (!profiles) return [];

    // Aggregate order stats per user
    const statsMap = new Map<string, { count: number; spent: number; last: string }>();
    for (const o of (orders as { user_id: string; total: number | null; created_at: string }[]) ?? []) {
      const existing = statsMap.get(o.user_id);
      if (!existing) {
        statsMap.set(o.user_id, { count: 1, spent: o.total ?? 0, last: o.created_at });
      } else {
        existing.count += 1;
        existing.spent += o.total ?? 0;
        if (o.created_at > existing.last) existing.last = o.created_at;
      }
    }

    return profiles.map((p: any) => {
      const stats = statsMap.get(p.id);
      return {
        ...p,
        order_count: stats?.count ?? 0,
        total_spent: stats?.spent ?? 0,
        last_order: stats?.last ?? null,
      };
    });
  } catch { return []; }
}

export default async function AdminCustomersPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const [customers, blockedIps] = await Promise.all([getCustomers(), getBlockedIps()]);

  return (
    <div className={`p-6 ${locale === 'ar' ? 'font-cairo' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">{t('customers')}</h1>
        <span className="text-sm text-muted-foreground">
          {customers.length} {locale === 'ar' ? 'عميل' : 'customers'}
        </span>
      </div>
      <AdminCustomersClient customers={customers} blockedIps={blockedIps} locale={locale} />
    </div>
  );
}
