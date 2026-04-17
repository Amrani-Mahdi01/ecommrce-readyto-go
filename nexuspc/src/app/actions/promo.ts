'use server';

import { createClient } from '@/lib/supabase/server';

export async function validatePromoCode(code: string, subtotal: number) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('promo_codes') as any)
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { error: 'Invalid promo code' };
  }

  const now = new Date().toISOString();
  if (data.expires_at && data.expires_at < now) {
    return { error: 'Promo code has expired' };
  }
  if (data.usage_limit !== null && data.usage_count >= data.usage_limit) {
    return { error: 'Promo code usage limit reached' };
  }
  if (data.min_order_amount && subtotal < data.min_order_amount) {
    return {
      error: `Minimum order of ${data.min_order_amount} DZD required`,
    };
  }

  const discount =
    data.discount_type === 'percent'
      ? Math.round((subtotal * data.discount_value) / 100)
      : data.discount_value;

  return {
    promo: {
      id: data.id as string,
      code: data.code as string,
      discountType: data.discount_type as 'percent' | 'fixed',
      discountValue: data.discount_value as number,
      discount: discount as number,
    },
  };
}

export async function incrementPromoUsage(promoId: string) {
  const supabase = await createClient();
  await (supabase.rpc as any)('increment_promo_usage', { promo_id: promoId });
}

// ── Admin actions ─────────────────────────────────────────────────────────────

export async function createPromoCode(data: {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  usage_limit: number | null;
  expires_at: string | null;
}) {
  const supabase = await createClient();

  const { error } = await (supabase.from('promo_codes') as any).insert({
    code: data.code.trim().toUpperCase(),
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    min_order_amount: data.min_order_amount,
    usage_limit: data.usage_limit,
    expires_at: data.expires_at || null,
    is_active: true,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function togglePromoActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await (supabase.from('promo_codes') as any)
    .update({ is_active })
    .eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deletePromoCode(id: string) {
  const supabase = await createClient();
  const { error } = await (supabase.from('promo_codes') as any).delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}
