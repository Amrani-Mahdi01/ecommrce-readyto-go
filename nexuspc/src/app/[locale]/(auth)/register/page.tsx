import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RegisterForm } from '@/components/auth/RegisterForm';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: `NexusPC — ${t('registerTitle')}` };
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;
  return <RegisterForm locale={locale} />;
}
