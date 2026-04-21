'use server';

import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

export interface CategoryRow {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  icon: string;
  description_en: string | null;
  description_ar: string | null;
  display_order: number;
  is_active: boolean;
}

export async function getCategories(): Promise<CategoryRow[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('categories')
      .select('id, name_en, name_ar, slug, icon, description_en, description_ar, display_order, is_active')
      .order('display_order', { ascending: true });
    return (data ?? []) as CategoryRow[];
  } catch { return []; }
}

export async function createCategory(input: {
  name_en: string;
  name_ar: string;
  icon: string;
  description_en: string;
  description_ar: string;
  display_order: number;
  is_active: boolean;
}) {
  const supabase = await createClient();
  const slug = slugify(input.name_en);

  const { error } = await supabase.from('categories').insert({
    name_en: input.name_en.trim(),
    name_ar: input.name_ar.trim(),
    slug,
    icon: input.icon,
    description_en: input.description_en.trim() || null,
    description_ar: input.description_ar.trim() || null,
    image_url: null,
    parent_id: null,
    display_order: input.display_order,
    is_active: input.is_active,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateCategory(id: string, input: {
  name_en: string;
  name_ar: string;
  icon: string;
  description_en: string;
  description_ar: string;
  display_order: number;
  is_active: boolean;
}) {
  const supabase = await createClient();
  const slug = slugify(input.name_en);

  const { error } = await supabase.from('categories').update({
    name_en: input.name_en.trim(),
    name_ar: input.name_ar.trim(),
    slug,
    icon: input.icon,
    description_en: input.description_en.trim() || null,
    description_ar: input.description_ar.trim() || null,
    display_order: input.display_order,
    is_active: input.is_active,
  }).eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleCategoryActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').update({ is_active }).eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  // Block delete if products exist in this category
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if (count && count > 0) {
    return { error: `Cannot delete — ${count} product(s) are assigned to this category` };
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}
