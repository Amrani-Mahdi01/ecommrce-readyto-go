import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AdminProductsClient } from '@/components/admin/AdminProductsClient';
import { getAISettings } from '@/app/actions/settings';
import type { Product } from '@/types/product';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: `NexusPC Admin — ${t('products')}` };
}

export default async function AdminProductsPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const [{ data: products }, { data: categories }, aiSettings] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('id, slug, name_en').order('display_order'),
    getAISettings(),
  ]);

  return (
    <AdminProductsClient
      locale={locale}
      products={(products ?? []) as Product[]}
      categories={(categories ?? []) as { id: string; slug: string; name_en: string }[]}
      aiEnabled={aiSettings.enabled}
    />
  );
}
