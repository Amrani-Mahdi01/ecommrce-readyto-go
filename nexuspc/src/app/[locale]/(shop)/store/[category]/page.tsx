import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ locale: string; category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, category } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('categories')
      .select('slug, name_en, name_ar, description_en, description_ar')
      .eq('slug', category)
      .eq('is_active', true)
      .single() as any;

    if (!data) return { title: 'NexusPC Store' };

    const name = locale === 'ar' ? data.name_ar : data.name_en;
    const description =
      (locale === 'ar' ? data.description_ar : data.description_en) ??
      (locale === 'ar'
        ? `تسوق أفضل ${name} في الجزائر — توصيل لجميع الولايات`
        : `Shop the best ${name} in Algeria — delivery to all 58 wilayas`);

    return {
      title: `${name} — NexusPC`,
      description,
      alternates: {
        canonical: `${siteUrl}/${locale}/store?category=${category}`,
        languages: {
          'en': `${siteUrl}/en/store?category=${category}`,
          'ar': `${siteUrl}/ar/store?category=${category}`,
          'x-default': `${siteUrl}/en/store?category=${category}`,
        },
      },
      openGraph: {
        title: `${name} — NexusPC`,
        description,
        images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630, alt: name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} — NexusPC`,
        description,
        images: [`${siteUrl}/og.png`],
      },
    };
  } catch {
    return { title: 'NexusPC Store' };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale, category } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('slug')
    .eq('slug', category)
    .eq('is_active', true)
    .single();

  if (!data) redirect(`/${locale}/store`);
  redirect(`/${locale}/store?category=${category}`);
}
