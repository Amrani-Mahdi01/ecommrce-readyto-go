'use server';

import { createClient } from '@/lib/supabase/server';

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function addProduct(formData: {
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  price: string;
  compare_price: string;
  stock_qty: string;
  brand: string;
  category_id: string;
  is_featured: boolean;
  is_active: boolean;
  images?: string[];
}) {
  const supabase = await createClient();
  const slug = formData.slug || toSlug(formData.name_en);

  const { data, error } = await (supabase.from('products') as any).insert({
    name_en: formData.name_en,
    name_ar: formData.name_ar || formData.name_en,
    slug,
    description_en: formData.description_en || null,
    description_ar: formData.description_ar || null,
    price: parseFloat(formData.price),
    compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
    stock_qty: Math.max(0, parseInt(formData.stock_qty) || 0),
    brand: formData.brand || null,
    category_id: formData.category_id || null,
    is_featured: formData.is_featured,
    is_active: formData.is_active,
    images: formData.images ?? [],
  }).select().single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateProduct(id: string, formData: {
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  price: string;
  compare_price: string;
  stock_qty: string;
  brand: string;
  category_id: string;
  is_featured: boolean;
  is_active: boolean;
  images?: string[];
}) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from('products') as any).update({
    name_en: formData.name_en,
    name_ar: formData.name_ar || formData.name_en,
    slug: formData.slug,
    description_en: formData.description_en || null,
    description_ar: formData.description_ar || null,
    price: parseFloat(formData.price),
    compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
    stock_qty: Math.max(0, parseInt(formData.stock_qty) || 0),
    brand: formData.brand || null,
    category_id: formData.category_id || null,
    is_featured: formData.is_featured,
    is_active: formData.is_active,
    images: formData.images ?? [],
  }).eq('id', id).select().single();

  if (error) return { error: error.message };
  return { data };
}

export async function toggleProductActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await (supabase.from('products') as any).update({ is_active }).eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await (supabase.from('products') as any).delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}
