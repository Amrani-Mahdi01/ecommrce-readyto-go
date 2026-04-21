import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Zap } from 'lucide-react';
import { categories } from '@/config/categories';
import { siteConfig } from '@/config/site';

interface FooterProps {
  locale: string;
}

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const isRTL = locale === 'ar';

  const quickLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/store`, label: t('store') },
    { href: `/${locale}/pc-builder`, label: t('pcBuilder') },
    { href: `/${locale}/track-order`, label: t('trackOrder') },
  ];

  const topCategories = categories.slice(0, 5);

  const supportLinks = [
    {
      href: `/${locale}/track-order`,
      label: locale === 'ar' ? 'تتبع طلبك' : 'Track Order',
    },
  ];

  return (
    <footer className="bg-zinc-950 text-zinc-100 mt-auto">
      {/* ── Top strip ── */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
            {locale === 'ar'
              ? 'التوصيل لجميع الولايات — الدفع عند الاستلام — الجزائر'
              : 'Delivery to all 58 wilayas — Cash on delivery — Algeria'}
          </p>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className={`container mx-auto px-4 pt-16 pb-0 ${isRTL ? 'text-right' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Brand column */}
          <div className="lg:col-span-5 flex flex-col">
            <Link href={`/${locale}`} className="flex items-center gap-3 w-fit mb-6">
              <div className="w-9 h-9 bg-primary flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 fill-white text-white" />
              </div>
              <span className="font-black text-xl uppercase tracking-widest text-zinc-100">
                NexusPC
              </span>
            </Link>

            <p className="text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed">
              {locale === 'ar' ? siteConfig.description_ar : siteConfig.description_en}
            </p>

            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <a
                href={siteConfig.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="border border-white/20 px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-colors text-zinc-300"
              >
                Instagram
              </a>
              <a
                href={siteConfig.links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="border border-white/20 px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-colors text-zinc-300"
              >
                Facebook
              </a>
            </div>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-8">
            {/* Quick Links */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-5 flex items-center gap-2">
                <span className="text-primary font-bold">01</span>
                {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              </p>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-5 flex items-center gap-2">
                <span className="text-primary font-bold">02</span>
                {locale === 'ar' ? 'الفئات' : 'Categories'}
              </p>
              <ul className="space-y-3">
                {topCategories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/${locale}/store/${cat.slug}`}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {locale === 'ar' ? cat.name_ar : cat.name_en}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-5 flex items-center gap-2">
                <span className="text-primary font-bold">03</span>
                {locale === 'ar' ? 'الدعم' : 'Support'}
              </p>
              <ul className="space-y-3 text-sm text-zinc-400">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li className="leading-relaxed">
                  {locale === 'ar' ? 'الدفع عند الاستلام فقط' : 'Cash on Delivery only'}
                </li>
                <li className="leading-relaxed">
                  {locale === 'ar' ? 'التوصيل لجميع الولايات' : 'Delivery to all 58 wilayas'}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Giant wordmark ── */}
        <div className="pt-8 pb-2 border-t border-white/10 overflow-hidden mt-12">
          <p
            className="font-black uppercase leading-none select-none text-transparent"
            style={{
              fontSize: 'clamp(3rem, 14vw, 10rem)',
              WebkitTextStroke: '1px rgba(139,92,246,0.2)',
            }}
          >
            NEXUSPC
          </p>
        </div>

        {/* ── Bottom bar ── */}
        <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center py-4 border-t border-white/10 text-xs text-zinc-600`}>
          <p>
            {locale === 'ar'
              ? `© ${new Date().getFullYear()} NexusPC الجزائر — جميع الحقوق محفوظة`
              : `© ${new Date().getFullYear()} NexusPC Algeria — All rights reserved`}
          </p>
          <p className="text-primary/60">
            {locale === 'ar' ? 'صُنع في الجزائر 🇩🇿' : 'Made in Algeria 🇩🇿'}
          </p>
        </div>
      </div>
    </footer>
  );
}
