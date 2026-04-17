import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const isRTL = locale === 'ar';

  // Auth guard
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/${locale}/login`);

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as any;
    if ((profile as any)?.role !== 'admin') redirect(`/${locale}`);
  }

  const labels = {
    dashboard:   t('dashboard'),
    products:    t('products'),
    orders:      t('orders'),
    customers:   t('customers'),
    promos:      locale === 'ar' ? 'أكواد الخصم' : 'Promo Codes',
    analytics:   locale === 'ar' ? 'التحليلات' : 'Analytics',
    delivery:    locale === 'ar' ? 'التوصيل' : 'Delivery',
    categories:  locale === 'ar' ? 'الفئات' : 'Categories',
    settings:    locale === 'ar' ? 'الإعدادات' : 'Settings',
    backToStore: locale === 'ar' ? 'العودة إلى المتجر' : 'Back to Store',
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={`flex min-h-screen bg-muted/30 ${isRTL ? 'font-cairo' : ''}`}>
      <AdminSidebar locale={locale} labels={labels} />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
