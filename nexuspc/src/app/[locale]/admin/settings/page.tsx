import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { getAISettings, getChargilySettings } from '@/app/actions/settings';
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'NexusPC Admin — Settings' };
}

export default async function AdminSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const isRTL = locale === 'ar';
  const [aiSettings, chargilySettings] = await Promise.all([
    getAISettings(),
    getChargilySettings(),
  ]);

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'font-cairo' : ''}`}>
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
          <Settings className="h-5 w-5" />
        </div>
        <div className={isRTL ? 'text-right' : ''}>
          <h1 className="text-2xl font-extrabold">
            {isRTL ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'إدارة إعدادات الموقع والذكاء الاصطناعي' : 'Manage site and AI configuration'}
          </p>
        </div>
      </div>

      <AdminSettingsClient
        locale={locale}
        initial={aiSettings}
        chargilyInitial={chargilySettings}
      />
    </div>
  );
}
