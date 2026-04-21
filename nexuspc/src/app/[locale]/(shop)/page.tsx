import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Truck, ShieldCheck, Award, Headphones,
  ChevronRight, ChevronLeft, Wrench, Star, Quote,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductSlider } from '@/components/product/ProductSlider';
import { AnimateInView } from '@/components/layout/AnimateInView';
import { HeroSection } from '@/components/layout/HeroSection';
import { createClient } from '@/lib/supabase/server';
import { withReviewStats } from '@/lib/product-reviews';
import { CategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';

interface HomeReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reviewer_name: string;
  product_name: string;
  product_slug: string;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const description = t('heroSubtitle');
  return {
    title: 'NexusPC — ' + t('heroTitle') + ' ' + t('heroHighlight'),
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'en': `${siteUrl}/en`,
        'ar': `${siteUrl}/ar`,
        'x-default': `${siteUrl}/en`,
      },
    },
    openGraph: {
      description,
      images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630, alt: 'NexusPC' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'NexusPC',
      description,
      images: [`${siteUrl}/og.png`],
    },
  };
}


async function getFeaturedProducts(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);
    return withReviewStats((data ?? []) as Product[]);
  } catch {
    return [];
  }
}

async function getBestSellerProducts(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = await createClient();

    // Fetch products with most reviews (highest engagement = best sellers)
    const { data: reviewStats } = await supabase
      .from('reviews')
      .select('product_id');

    // Count reviews per product
    const countMap: Record<string, number> = {};
    for (const r of reviewStats ?? []) {
      countMap[r.product_id] = (countMap[r.product_id] ?? 0) + 1;
    }

    const topIds = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => id);

    // If we have reviewed products, fetch those first; fill remainder with newest active
    let products: Product[] = [];

    if (topIds.length > 0) {
      const { data: reviewed } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .in('id', topIds);
      products = (reviewed ?? []) as Product[];
    }

    // Fill up to 8 with newest if not enough reviewed products
    if (products.length < 8) {
      const existingIds = products.map(p => p.id);
      const { data: rest } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .not('id', 'in', existingIds.length > 0 ? `(${existingIds.join(',')})` : '(null)')
        .order('created_at', { ascending: false })
        .limit(8 - products.length);
      products = [...products, ...((rest ?? []) as Product[])];
    }

    // If still empty (no products at all), just fetch newest
    if (products.length === 0) {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      products = (data ?? []) as Product[];
    }

    return withReviewStats(products);
  } catch {
    return [];
  }
}

async function getHomeReviews(locale: string): Promise<HomeReview[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('reviews')
      .select(`
        id, rating, title, body, created_at,
        profiles ( full_name ),
        products ( name_en, name_ar, slug )
      `)
      .gte('rating', 4)
      .not('body', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8) as any;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      created_at: r.created_at,
      reviewer_name: r.profiles?.full_name ?? (locale === 'ar' ? 'عميل' : 'Customer'),
      product_name: locale === 'ar' ? (r.products?.name_ar ?? r.products?.name_en ?? '') : (r.products?.name_en ?? ''),
      product_slug: r.products?.slug ?? '',
    }));
  } catch { return []; }
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tw = await getTranslations({ locale, namespace: 'common' });
  const isRTL = locale === 'ar';

  const supabase = await createClient();
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, slug, name_en, name_ar, icon')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  const categories = (categoriesData ?? []) as { id: string; slug: string; name_en: string; name_ar: string; icon: string }[];

  const [featuredProducts, homeReviews] = await Promise.all([
    getFeaturedProducts(),
    getHomeReviews(locale),
  ]);

  const whyItems = [
    { icon: Truck,        title: t('whyDelivery'),  desc: t('whyDeliveryDesc')  },
    { icon: ShieldCheck,  title: t('whyAuthentic'), desc: t('whyAuthenticDesc') },
    { icon: Award,        title: t('whyWarranty'),  desc: t('whyWarrantyDesc')  },
    { icon: Headphones,   title: t('whySupport'),   desc: t('whySupportDesc')   },
  ];

  const brands = ['NVIDIA', 'AMD', 'Intel', 'ASUS', 'MSI', 'Corsair', 'Samsung', 'Seagate', 'Gigabyte', 'Kingston'];

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <HeroSection
        locale={locale}
        heroTitle={t('heroTitle')}
        heroHighlight={t('heroHighlight')}
        heroSubtitle={t('heroSubtitle')}
        shopNow={t('shopNow')}
        buildPC={t('buildPC')}
      />

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <AnimateInView className="flex items-center justify-between mb-10">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
                01 — Explore
              </p>
              <h2 className="font-black text-4xl uppercase">
                {t('categoriesTitle')}
              </h2>
            </div>
            <Link
              href={`/${locale}/store`}
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 shrink-0 transition-colors"
            >
              {tw('viewAll')}
              {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Link>
          </AnimateInView>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((cat, i) => (
              <AnimateInView key={cat.slug} variant="scale" delay={i * 60} threshold={0.05}>
                <Link
                  href={`/${locale}/store/${cat.slug}`}
                  className="relative group flex flex-col gap-2 p-4 border border-border hover:border-primary/60 transition-all duration-300 bg-card hover:bg-accent/20"
                >
                  {/* Number watermark */}
                  <span className="absolute top-3 right-3 text-[10px] font-mono text-muted-foreground/25">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Icon */}
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-primary">
                    <CategoryIcon name={cat.icon} className="h-5 w-5" />
                  </div>

                  <span className="text-sm font-semibold leading-tight mt-1">
                    {locale === 'ar' ? cat.name_ar : cat.name_en}
                  </span>

                  {/* Bottom animated line */}
                  <div className="w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────── */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <AnimateInView className="flex items-center justify-between mb-10">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
                02 — Handpicked
              </p>
              <h2 className="font-black text-4xl uppercase text-white">
                {t('featuredTitle')}
              </h2>
            </div>
            <Link
              href={`/${locale}/store?sort=featured`}
              className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 transition-colors"
            >
              {tw('viewAll')}
              {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Link>
          </AnimateInView>

          {featuredProducts.length > 0 ? (
            <ProductSlider products={featuredProducts} locale={locale} />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[220px] sm:w-[240px] border border-white/10 bg-zinc-900 p-3 flex flex-col gap-3">
                  <Skeleton className="aspect-square w-full rounded-none bg-zinc-800" />
                  <Skeleton className="h-3 w-1/3 rounded-none bg-zinc-800" />
                  <Skeleton className="h-4 w-full rounded-none bg-zinc-800" />
                  <Skeleton className="h-4 w-3/4 rounded-none bg-zinc-800" />
                  <Skeleton className="h-8 w-full mt-auto rounded-none bg-zinc-800" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WHY NEXUSPC ──────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <AnimateInView className="mb-10">
            <p className={`text-[11px] uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              03 — Trust
            </p>
            <h2 className={`font-black text-4xl uppercase mb-2 ${isRTL ? 'text-right' : ''}`}>
              {t('whyTitle')}
            </h2>
            <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
              {locale === 'ar' ? 'نحن نهتم بتجربتك من البداية حتى النهاية' : 'We care about your experience from start to finish'}
            </p>
          </AnimateInView>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
            {whyItems.map(({ icon: Icon, title, desc }, i) => (
              <AnimateInView key={title} variant="fade-up" delay={i * 100}>
                <div
                  className={cn(
                    'p-8 flex flex-col gap-4 border-border transition-colors hover:bg-accent/20 h-full',
                    i < whyItems.length - 1 ? 'border-r' : '',
                    isRTL ? 'text-right' : '',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="text-primary h-6 w-6" />
                    <span className="text-5xl font-black text-muted-foreground/10 self-end leading-none">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="font-bold text-sm">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>

      {/* ── PC BUILDER CTA ───────────────────────────────────── */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <AnimateInView variant="scale">
            <div className="relative overflow-hidden border border-primary/25 p-10 lg:p-16">
              {/* BG grid pattern */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, rgba(139,92,246,0.04) 0px, rgba(139,92,246,0.04) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, rgba(139,92,246,0.04) 0px, rgba(139,92,246,0.04) 1px, transparent 1px, transparent 80px)`,
                }}
              />

              <div className={`relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 ${isRTL ? 'text-right' : ''}`}>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                    <Wrench className="h-3 w-3" /> PC Builder
                  </p>
                  <h2 className="font-black uppercase text-white leading-[0.9] mb-4" style={{ fontSize: 'clamp(2rem,5vw,4.5rem)' }}>
                    {t('builderTitle')}
                  </h2>
                  <p className="text-zinc-400 text-base max-w-md">
                    {t('builderSubtitle')}
                  </p>
                </div>
                <Link
                  href={`/${locale}/pc-builder`}
                  className="bg-primary text-white px-10 py-5 font-bold uppercase tracking-wider text-sm hover:bg-primary/90 transition-colors flex items-center gap-3 shrink-0"
                >
                  <Wrench className="h-4 w-4" />
                  {t('startBuilding')}
                </Link>
              </div>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* ── BRANDS ───────────────────────────────────────────── */}
      <section className="py-5 bg-background border-y border-border/40 overflow-hidden">
        <div className="overflow-hidden">
          <div className="animate-marquee">
            {[...brands, ...brands].map((brand, i) => (
              <span
                key={i}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mx-8 hover:text-muted-foreground/70 transition-colors whitespace-nowrap"
              >
                {brand}
                <span className="ml-8 text-muted-foreground/20">◆</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS ─────────────────────────────────── */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <AnimateInView className="flex items-center justify-between mb-10">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
                04 — Verified
              </p>
              <h2 className="font-black text-4xl uppercase text-white">
                {locale === 'ar' ? 'آراء العملاء' : 'Customer Reviews'}
              </h2>
            </div>
            <Link
              href={`/${locale}/store`}
              className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 transition-colors"
            >
              {tw('viewAll')}
              {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Link>
          </AnimateInView>

          {homeReviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {homeReviews.map((review, i) => (
                <AnimateInView key={review.id} variant="fade-up" delay={i * 60} threshold={0.05}>
                  <div className="flex flex-col gap-4 border border-white/10 bg-zinc-900/60 p-5 h-full hover:border-primary/30 transition-colors">
                    {/* Quote icon + stars */}
                    <div className="flex items-start justify-between">
                      <Quote className="h-5 w-5 text-primary/40 shrink-0" />
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s < review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    {review.title && (
                      <p className={`text-sm font-bold text-white leading-snug ${isRTL ? 'text-right' : ''}`}>
                        {review.title}
                      </p>
                    )}

                    {/* Body */}
                    <p className={`text-xs text-zinc-400 leading-relaxed flex-1 line-clamp-4 ${isRTL ? 'text-right' : ''}`}>
                      {review.body}
                    </p>

                    {/* Product link */}
                    {review.product_slug && (
                      <Link
                        href={`/${locale}/store/product/${review.product_slug}`}
                        className="text-[11px] text-primary/70 hover:text-primary transition-colors truncate font-mono"
                      >
                        ↗ {review.product_name}
                      </Link>
                    )}

                    {/* Reviewer + date */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/8">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-zinc-300 font-medium truncate max-w-[100px]">
                          {review.reviewer_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-600 shrink-0">
                        {new Date(review.created_at).toLocaleDateString(
                          locale === 'ar' ? 'ar-DZ' : 'en-GB',
                          { month: 'short', year: 'numeric' },
                        )}
                      </span>
                    </div>
                  </div>
                </AnimateInView>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-white/10 bg-zinc-900/40">
              <Star className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">
                {locale === 'ar' ? 'لا توجد تقييمات بعد — كن أول من يقيّم!' : 'No reviews yet — be the first to review!'}
              </p>
              <Link href={`/${locale}/store`} className="text-primary text-sm hover:underline mt-2 inline-block">
                {locale === 'ar' ? 'تسوق الآن' : 'Shop now'}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
