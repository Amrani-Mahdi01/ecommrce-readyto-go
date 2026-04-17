import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { StoreClient } from '@/components/store/StoreClient';
import type { Product } from '@/types/product';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'store' });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const description = t('subtitle');

  // Canonical always points to the clean /store (no query params) to avoid duplicate content
  return {
    title: `NexusPC — ${t('title')}`,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/store`,
      languages: {
        'en': `${siteUrl}/en/store`,
        'ar': `${siteUrl}/ar/store`,
        'x-default': `${siteUrl}/en/store`,
      },
    },
    openGraph: {
      description,
      images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630, alt: 'NexusPC Store' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `NexusPC — ${t('title')}`,
      description,
      images: [`${siteUrl}/og.png`],
    },
  };
}

async function getProducts(filters: {
  category?: string;
  search?: string;
  sort?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page: number;
}): Promise<{ products: Product[]; total: number; brands: string[] }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { products: [], total: 0, brands: [] };
  }
  try {
    const supabase = await createClient();
    const PAGE_SIZE = 16;

    // Brands query (for filter sidebar)
    const { data: brandData } = await supabase
      .from('products')
      .select('brand')
      .eq('is_active', true)
      .not('brand', 'is', null) as any;
    const brands = [...new Set((brandData ?? []).map((r: any) => r.brand).filter(Boolean))] as string[];

    // Products query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (filters.category) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', filters.category)
        .single() as any;
      if (catData) query = query.eq('category_id', (catData as any).id);
    }
    if (filters.search) {
      query = query.or(
        `name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`,
      );
    }
    if (filters.brand) query = query.eq('brand', filters.brand);
    if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
    if (filters.inStock) query = query.gt('stock_qty', 0);

    // Sorting
    switch (filters.sort) {
      case 'price_asc':  query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'newest':     query = query.order('created_at', { ascending: false }); break;
      case 'featured':   query = query.eq('is_featured', true).order('created_at', { ascending: false }); break;
      default:           query = query.order('created_at', { ascending: false });
    }

    const from = (filters.page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, count } = await query;
    return {
      products: (data ?? []) as Product[],
      total: count ?? 0,
      brands,
    };
  } catch {
    return { products: [], total: 0, brands: [] };
  }
}

export default async function StorePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const getString = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const filters = {
    category: getString(sp.category),
    search:   getString(sp.search),
    sort:     getString(sp.sort),
    brand:    getString(sp.brand),
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    inStock:  sp.inStock === 'true',
    page:     sp.page ? Math.max(1, Number(sp.page)) : 1,
  };

  const supabaseForCats = await createClient();
  const { data: categoriesData } = await supabaseForCats
    .from('categories')
    .select('id, slug, name_en, name_ar, icon, description_en, description_ar')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { products, total, brands } = await getProducts(filters);

  return (
    <StoreClient
      locale={locale}
      initialProducts={products}
      total={total}
      brands={brands}
      categories={(categoriesData ?? []) as any[]}
      filters={filters}
    />
  );
}
