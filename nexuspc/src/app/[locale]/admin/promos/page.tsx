import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AdminPromosClient } from '@/components/admin/AdminPromosClient';

export const metadata: Metadata = { title: 'NexusPC Admin — Promo Codes' };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPromosPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: promos } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  return <AdminPromosClient locale={locale} promos={promos ?? []} />;
}
