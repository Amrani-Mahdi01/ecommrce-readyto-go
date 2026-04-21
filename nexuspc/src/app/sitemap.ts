import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const LOCALES = ['en', 'ar'] as const;

const STATIC_PATHS = [
  { path: '', changeFreq: 'daily' as const, priority: 1.0 },
  { path: '/store', changeFreq: 'daily' as const, priority: 0.9 },
  { path: '/pc-builder', changeFreq: 'weekly' as const, priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  const makeAlternates = (path: string) => ({
    languages: Object.fromEntries(
      LOCALES.map(l => [l, `${siteUrl}/${l}${path}`])
    ) as Record<string, string>,
  });

  // Static pages — one entry per locale
  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap(locale =>
    STATIC_PATHS.map(({ path, changeFreq, priority }) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: changeFreq,
      priority,
      alternates: makeAlternates(path),
    }))
  );

  let productEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_active', true) as any,
      supabase.from('categories').select('slug, updated_at').eq('is_active', true) as any,
    ]);

    productEntries = LOCALES.flatMap(locale =>
      (products ?? []).map((p: any) => ({
        url: `${siteUrl}/${locale}/store/product/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
        alternates: makeAlternates(`/store/product/${p.slug}`),
      }))
    );

    categoryEntries = LOCALES.flatMap(locale =>
      (categories ?? []).map((c: any) => ({
        url: `${siteUrl}/${locale}/store?category=${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: makeAlternates(`/store?category=${c.slug}`),
      }))
    );
  } catch {
    // DB unavailable during build — static entries still get included
  }

  return [...staticEntries, ...productEntries, ...categoryEntries];
}
