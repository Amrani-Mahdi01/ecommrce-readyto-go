import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { PCBuilderClient } from '@/components/pc-builder/PCBuilderClient';
import { getAISettings } from '@/app/actions/settings';
import type { Product } from '@/types/product';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pcBuilder' });
  return {
    title: `NexusPC — ${t('title')}`,
    description: t('subtitle'),
  };
}

const SLOT_CATEGORIES: Record<string, string> = {
  cpu:        'cpu',
  motherboard:'motherboard',
  gpu:        'gpu',
  ram:        'ram',
  storage:    'storage',
  psu:        'psu',
  case:       'cases',
  cooler:     'cooling',
};

async function getProductsByCategory(): Promise<Record<string, Product[]>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return {};
  try {
    const supabase = await createClient();
    const result: Record<string, Product[]> = {};
    await Promise.all(
      Object.entries(SLOT_CATEGORIES).map(async ([slot, catSlug]) => {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', catSlug)
          .single() as any;
        if (!catData) { result[slot] = []; return; }
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', (catData as any).id)
          .eq('is_active', true)
          .gt('stock_qty', 0)
          .order('price', { ascending: true });
        result[slot] = (data ?? []) as Product[];
      }),
    );
    return result;
  } catch {
    return {};
  }
}

export default async function PCBuilderPage({ params }: PageProps) {
  const { locale } = await params;
  const [productsBySlot, aiSettings] = await Promise.all([
    getProductsByCategory(),
    getAISettings(),
  ]);

  return <PCBuilderClient locale={locale} productsBySlot={productsBySlot} aiEnabled={aiSettings.enabled} />;
}
