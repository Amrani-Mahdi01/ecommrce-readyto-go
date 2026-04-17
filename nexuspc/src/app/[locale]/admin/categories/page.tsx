import type { Metadata } from 'next';
import { getCategories } from '@/app/actions/categories';
import { AdminCategoriesClient } from '@/components/admin/AdminCategoriesClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'NexusPC Admin — Categories' };
}

export default async function AdminCategoriesPage({ params }: PageProps) {
  const { locale } = await params;
  const categories = await getCategories();

  return <AdminCategoriesClient locale={locale} categories={categories} />;
}
