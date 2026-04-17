'use server';

import { createClient } from '@/lib/supabase/server';

export interface DeliveryOffice {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  /** wilaya_code → price; loaded alongside the office row */
  prices: Record<number, number>;
}

// ── Home delivery (per-wilaya) ────────────────────────────────────────────────

/** Returns wilaya_code → home delivery price for all 58 wilayas. */
export async function getWilayaDeliveryPrices(): Promise<Record<number, number>> {
  const supabase = await createClient();
  const { data } = await (supabase.from('delivery_wilaya_prices') as any)
    .select('wilaya_code, price');
  const map: Record<number, number> = {};
  for (const row of (data ?? []) as { wilaya_code: number; price: number }[]) {
    map[row.wilaya_code] = Number(row.price);
  }
  return map;
}

/** Upserts prices for all 58 wilayas in one batch. */
export async function updateWilayaDeliveryPrices(
  prices: Record<number, number>,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const rows = Object.entries(prices).map(([code, price]) => ({
    wilaya_code: Number(code),
    price: Number(price),
  }));
  const { error } = await (supabase.from('delivery_wilaya_prices') as any).upsert(rows, {
    onConflict: 'wilaya_code',
  });
  return { error: error?.message ?? null };
}

// ── Offices ───────────────────────────────────────────────────────────────────

/** Returns all offices, each with their per-wilaya prices pre-loaded. */
export async function getOffices(): Promise<DeliveryOffice[]> {
  const supabase = await createClient();

  const [{ data: officeRows }, priceResult] = await Promise.all([
    (supabase.from('delivery_offices') as any).select('*').order('created_at', { ascending: true }),
    (supabase.from('delivery_office_prices') as any).select('office_id, wilaya_code, price'),
  ]);
  // priceResult.error fires when the table doesn't exist yet — treat as empty
  const priceRows = priceResult.error ? [] : (priceResult.data ?? []);

  // Group prices by office_id
  const byOffice: Record<string, Record<number, number>> = {};
  for (const p of (priceRows ?? []) as { office_id: string; wilaya_code: number; price: number }[]) {
    if (!byOffice[p.office_id]) byOffice[p.office_id] = {};
    byOffice[p.office_id][p.wilaya_code] = Number(p.price);
  }

  return ((officeRows ?? []) as Omit<DeliveryOffice, 'prices'>[]).map((o) => ({
    ...o,
    prices: byOffice[o.id] ?? {},
  }));
}

export async function createOffice(office: {
  name: string;
  address: string;
}): Promise<{ error: string | null; id?: string }> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from('delivery_offices') as any)
    .insert(office)
    .select('id')
    .single();
  if (error) return { error: error.message };
  return { error: null, id: (data as { id: string }).id };
}

export async function updateOffice(
  id: string,
  office: { name: string; address: string },
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await (supabase.from('delivery_offices') as any)
    .update(office)
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteOffice(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await (supabase.from('delivery_offices') as any)
    .delete()
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function toggleOfficeActive(
  id: string,
  is_active: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await (supabase.from('delivery_offices') as any)
    .update({ is_active })
    .eq('id', id);
  return { error: error?.message ?? null };
}

/** Upserts all 58 wilaya prices for a single office. */
export async function updateOfficePrices(
  officeId: string,
  prices: Record<number, number>,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const rows = Object.entries(prices).map(([code, price]) => ({
    office_id: officeId,
    wilaya_code: Number(code),
    price: Number(price),
  }));
  const { error } = await (supabase.from('delivery_office_prices') as any).upsert(rows, {
    onConflict: 'office_id,wilaya_code',
  });
  return { error: error?.message ?? null };
}
