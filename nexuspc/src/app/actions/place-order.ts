'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

function getClientIp(headersList: Headers): string {
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  );
}

export interface PlaceOrderPayload {
  userId: string | null;
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  notes: string | null;
  status: string;
  total: number;
  deliveryType: string;
  deliveryPrice: number;
  officeId: string | null;
  items: any[];
  paymentMethod: string;
  captchaA: number;
  captchaB: number;
  captchaOp: '+' | '-';
  captchaAnswer: number;
}

export async function checkAndPlaceOrder(
  payload: PlaceOrderPayload,
): Promise<{ orderId: string | null; orderNumber: string | null; error: string | null }> {
  const headersList = await headers();
  const ip = getClientIp(headersList as any);

  // 1. Validate captcha server-side
  const expected = payload.captchaOp === '+'
    ? payload.captchaA + payload.captchaB
    : payload.captchaA - payload.captchaB;
  if (payload.captchaAnswer !== expected) {
    return { orderId: null, orderNumber: null, error: 'captcha_failed' };
  }

  try {
    const supabase = await createClient();
    const serviceClient = await createServiceClient();

    // 2. Check if IP is blocked
    const { data: blocked } = await (serviceClient.from('blocked_ips') as any)
      .select('ip')
      .eq('ip', ip)
      .maybeSingle();

    if (blocked) {
      return { orderId: null, orderNumber: null, error: 'ip_blocked' };
    }

    // 3. Generate order number
    const orderNumber = 'NPC-' + String(Date.now()).slice(-6);

    // 4. Insert order with IP
    const { data: inserted, error: insertError } = await (supabase.from('orders') as any)
      .insert({
        order_number: orderNumber,
        user_id: payload.userId,
        full_name: payload.fullName,
        phone: payload.phone,
        wilaya: payload.wilaya,
        commune: payload.commune,
        notes: payload.notes,
        status: payload.status,
        total: payload.total,
        delivery_type: payload.deliveryType,
        delivery_price: payload.deliveryPrice,
        office_id: payload.officeId,
        items: payload.items,
        payment_method: payload.paymentMethod,
        ip_address: ip,
      })
      .select('id, order_number')
      .single();

    if (insertError) {
      return { orderId: null, orderNumber: null, error: insertError.message };
    }

    return { orderId: inserted.id, orderNumber: inserted.order_number, error: null };
  } catch (e: any) {
    return { orderId: null, orderNumber: null, error: e?.message ?? 'Server error' };
  }
}

export async function blockIp(ip: string, reason: string, blockedBy = 'admin'): Promise<{ error: string | null }> {
  try {
    const serviceClient = await createServiceClient();
    const { error } = await (serviceClient.from('blocked_ips') as any)
      .upsert({ ip, reason, blocked_by: blockedBy }, { onConflict: 'ip' });
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed' };
  }
}

export async function unblockIp(ip: string): Promise<{ error: string | null }> {
  try {
    const serviceClient = await createServiceClient();
    const { error } = await (serviceClient.from('blocked_ips') as any)
      .delete()
      .eq('ip', ip);
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed' };
  }
}

export async function getBlockedIps(): Promise<{ ip: string; reason: string | null; blocked_by: string; created_at: string }[]> {
  try {
    const serviceClient = await createServiceClient();
    const { data } = await (serviceClient.from('blocked_ips') as any)
      .select('ip, reason, blocked_by, created_at')
      .order('created_at', { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}
