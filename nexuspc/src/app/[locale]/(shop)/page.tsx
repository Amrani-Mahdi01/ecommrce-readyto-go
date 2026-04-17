import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  Truck, ShieldCheck, Award, Headphones,
  ChevronRight, ChevronLeft, Wrench, Sparkles,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product/ProductCard';
import { AnimateInView } from '@/components/layout/AnimateInView';
import { createClient } from '@/lib/supabase/server';
import { CategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';

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
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
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

  const featuredProducts = await getFeaturedProducts();

  const whyItems = [
    { icon: Truck,        title: t('whyDelivery'),  desc: t('whyDeliveryDesc')  },
    { icon: ShieldCheck,  title: t('whyAuthentic'), desc: t('whyAuthenticDesc') },
    { icon: Award,        title: t('whyWarranty'),  desc: t('whyWarrantyDesc')  },
    { icon: Headphones,   title: t('whySupport'),   desc: t('whySupportDesc')   },
  ];

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-40 animate-dot-pulse"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.25) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[140px] pointer-events-none animate-glow-pulse" />

        {/* Floating decorative orbs */}
        <div className="absolute top-1/4 right-[10%] w-[200px] h-[200px] rounded-full bg-violet-500/5 blur-[60px] animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-[8%] w-[150px] h-[150px] rounded-full bg-purple-400/5 blur-[50px] animate-float" style={{ animationDelay: '2.5s' }} />

        <div className={`relative container mx-auto px-4 py-24 flex flex-col items-center text-center gap-6 ${isRTL ? 'font-cairo' : ''}`}>
          {/* Eyebrow */}
          <div className="animate-fade-in-down inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            {locale === 'ar' ? 'أفضل متجر لقطع الكمبيوتر في الجزائر' : "Algeria's #1 PC Parts Store"}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight max-w-4xl">
            {t('heroTitle')}{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400 bg-clip-text text-transparent animate-gradient">
              {t('heroHighlight')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up delay-200 text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up delay-300 flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link
              href={`/${locale}/store`}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'gap-2 px-8 text-base shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow',
              )}
            >
              {t('shopNow')}
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Link>
            <Link
              href={`/${locale}/pc-builder`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'gap-2 px-8 text-base border-zinc-600 text-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-500',
              )}
            >
              <Wrench className="h-4 w-4" />
              {t('buildPC')}
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-fade-in-up delay-400 flex flex-wrap items-center justify-center gap-8 mt-6 text-zinc-500 text-sm">
            {[
              { value: '500+', label: locale === 'ar' ? 'منتج' : 'Products' },
              { value: '58',   label: locale === 'ar' ? 'ولاية' : 'Wilayas' },
              { value: 'COD',  label: locale === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="animate-fade-in delay-700 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-zinc-600">
            <div className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-zinc-600 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <AnimateInView className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold">{t('categoriesTitle')}</h2>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'تصفح جميع الفئات' : 'Browse all categories'}
              </p>
            </div>
            <Link
              href={`/${locale}/store`}
              className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0"
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
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-5 text-center hover:border-primary/50 hover:bg-accent/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 shimmer-hover"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                    <CategoryIcon name={cat.icon} className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold leading-tight">
                    {locale === 'ar' ? cat.name_ar : cat.name_en}
                  </span>
                </Link>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimateInView className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold">{t('featuredTitle')}</h2>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'أفضل المنتجات المختارة لك' : 'Hand-picked top products for you'}
              </p>
            </div>
            <Link
              href={`/${locale}/store?sort=featured`}
              className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              {tw('viewAll')}
              {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Link>
          </AnimateInView>

          {featuredProducts.length > 0 ? (
            <div className="relative">
              {/* Fade-out edge masks */}
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {featuredProducts.map((product, i) => (
                  <div key={product.id} className="snap-start shrink-0 w-[220px] sm:w-[240px] animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <ProductCard product={product} locale={locale} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Skeleton row — shown when DB not yet populated */
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[220px] sm:w-[240px] rounded-xl border border-border/60 bg-card p-3 flex flex-col gap-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full mt-auto" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WHY NEXUSPC ──────────────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <AnimateInView>
            <h2 className={`text-2xl font-bold mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>
              {t('whyTitle')}
            </h2>
            <p className={`text-sm text-muted-foreground mb-10 ${isRTL ? 'text-right' : 'text-center'}`}>
              {locale === 'ar' ? 'نحن نهتم بتجربتك من البداية حتى النهاية' : 'We care about your experience from start to finish'}
            </p>
          </AnimateInView>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyItems.map(({ icon: Icon, title, desc }, i) => (
              <AnimateInView key={title} variant="fade-up" delay={i * 100}>
                <div
                  className={`card-glow flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-6 hover:border-primary/30 transition-colors h-full ${isRTL ? 'text-right' : ''}`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>

      {/* ── PC BUILDER CTA ───────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimateInView variant="scale">
            <div className="relative rounded-2xl overflow-hidden bg-zinc-900 dark:bg-zinc-900">
              {/* Background pattern */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.4) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-900/40 via-transparent to-transparent" />
              {/* Glowing orb */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />

              <div className={`relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-12 ${isRTL ? 'text-right' : ''}`}>
                <div className="flex flex-col gap-3 max-w-lg">
                  <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                    <Wrench className="h-4 w-4" />
                    PC Builder
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {t('builderTitle')}
                  </h2>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {t('builderSubtitle')}
                  </p>
                </div>
                <Link
                  href={`/${locale}/pc-builder`}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'shrink-0 gap-2 px-8 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow',
                  )}
                >
                  <Wrench className="h-4 w-4" />
                  {t('startBuilding')}
                </Link>
              </div>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* ── BRANDS / TRUST BAR ───────────────────────────────── */}
      <section className="py-10 bg-background border-t border-border/40">
        <div className="container mx-auto px-4">
          <AnimateInView>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
              {locale === 'ar' ? 'أبرز العلامات التجارية' : 'Top Brands Available'}
            </p>
          </AnimateInView>
          <AnimateInView variant="fade-up" delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {['NVIDIA', 'AMD', 'Intel', 'ASUS', 'MSI', 'Corsair', 'Samsung', 'Seagate'].map((brand) => (
                <span
                  key={brand}
                  className="text-sm font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors tracking-wider"
                >
                  {brand}
                </span>
              ))}
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* ── TRENDING (skeleton placeholder) ──────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimateInView className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold">
                {locale === 'ar' ? 'الأكثر مبيعاً' : 'Best Sellers'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'قريباً' : 'Coming soon'}
              </p>
            </div>
          </AnimateInView>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <AnimateInView key={i} variant="scale" delay={i * 80}>
                <div className="rounded-xl border border-border/60 bg-card p-3 flex flex-col gap-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full mt-1" />
                </div>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
