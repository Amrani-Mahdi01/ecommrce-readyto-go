import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LocaleSync } from '@/components/layout/LocaleSync';
import { Toaster } from '@/components/ui/sonner';
import { createClient } from '@/lib/supabase/server';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  return {
    title: {
      default: 'NexusPC',
      template: '%s — NexusPC',
    },
    description: t('heroSubtitle'),
    metadataBase: new URL(siteUrl),
    openGraph: {
      siteName: 'NexusPC',
      locale: locale === 'ar' ? 'ar_DZ' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_DZ',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@NexusPC_DZ',
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'en': `${siteUrl}/en`,
        'ar': `${siteUrl}/ar`,
        'x-default': `${siteUrl}/en`,
      },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound();
  }

  const messages = await getMessages();
  const isRTL = locale === 'ar';

  // Verify user server-side so Navbar renders correctly on first paint
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleSync />
      <CartProvider>
        <Navbar locale={locale} initialUser={user} initialProfile={profile} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <Toaster richColors position={isRTL ? 'bottom-left' : 'bottom-right'} />
      </CartProvider>
    </NextIntlClientProvider>
  );
}
