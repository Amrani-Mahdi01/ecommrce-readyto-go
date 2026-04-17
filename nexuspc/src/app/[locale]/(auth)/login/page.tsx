import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/LoginForm';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: `NexusPC — ${t('loginTitle')}` };
}

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params;
  return <LoginForm locale={locale} />;
}
