import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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

  return (
    <footer className="border-t border-border/40 bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 ${isRTL ? 'text-right' : ''}`}
        >
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-lg mb-3 w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                NexusPC
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {locale === 'ar' ? siteConfig.description_ar : siteConfig.description_en}
            </p>
            <div className="flex gap-3">
              <a
                href={siteConfig.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                Instagram
              </a>
              <a
                href={siteConfig.links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                Facebook
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
              {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
              {locale === 'ar' ? 'الفئات' : 'Categories'}
            </h3>
            <ul className="space-y-2">
              {topCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${locale}/store/${cat.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {locale === 'ar' ? cat.name_ar : cat.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
              {locale === 'ar' ? 'الدعم' : 'Support'}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/track-order`}
                  className="hover:text-foreground transition-colors"
                >
                  {locale === 'ar' ? 'تتبع طلبك' : 'Track Order'}
                </Link>
              </li>
              <li className="leading-relaxed">
                {locale === 'ar' ? 'الدفع عند الاستلام فقط' : 'Cash on Delivery only'}
              </li>
              <li className="leading-relaxed">
                {locale === 'ar' ? 'التوصيل لجميع الولايات' : 'Delivery to all 58 wilayas'}
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground"
        >
          <p>
            {locale === 'ar'
              ? `© ${new Date().getFullYear()} NexusPC الجزائر — جميع الحقوق محفوظة`
              : `© ${new Date().getFullYear()} NexusPC Algeria — All rights reserved`}
          </p>
          <p className="text-primary/70">
            {locale === 'ar' ? 'صُنع في الجزائر 🇩🇿' : 'Made in Algeria 🇩🇿'}
          </p>
        </div>
      </div>
    </footer>
  );
}
