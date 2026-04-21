'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';

async function getServiceSupabase() {
  try { return await createServiceClient(); }
  catch { return await createClient(); }
}

export async function getWhatsAppSettings() {
  try {
    const supabase = await getServiceSupabase();
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number', 'whatsapp_enabled', 'whatsapp_bot_name']);

    const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));

    const rawSid   = map['twilio_account_sid'] ?? '';
    const rawToken = map['twilio_auth_token']  ?? '';
    const phone    = map['twilio_phone_number'] ?? '';
    const botName  = map['whatsapp_bot_name']   ?? '';

    return {
      enabled:      map['whatsapp_enabled'] === 'true',
      sidIsSet:     rawSid.length > 0,
      maskedSid:    rawSid.length > 0   ? `${rawSid.slice(0, 8)}••••`   : '',
      tokenIsSet:   rawToken.length > 0,
      maskedToken:  rawToken.length > 0 ? `${rawToken.slice(0, 4)}••••••••` : '',
      phoneIsSet:   phone.length > 0,
      phone,
      botName,
    };
  } catch {
    return { enabled: false, sidIsSet: false, maskedSid: '', tokenIsSet: false, maskedToken: '', phoneIsSet: false, phone: '', botName: '' };
  }
}

export async function saveWhatsAppSettings(data: {
  enabled?: boolean;
  accountSid?: string | null;
  authToken?: string | null;
  phoneNumber?: string | null;
  botName?: string | null;
}) {
  try {
    const supabase = await getServiceSupabase();
    const updates: { key: string; value: string }[] = [];

    if (data.enabled !== undefined)    updates.push({ key: 'whatsapp_enabled',    value: data.enabled ? 'true' : 'false' });
    if (data.accountSid  != null)      updates.push({ key: 'twilio_account_sid',  value: data.accountSid.trim() });
    if (data.authToken   != null)      updates.push({ key: 'twilio_auth_token',   value: data.authToken.trim() });
    if (data.phoneNumber != null)      updates.push({ key: 'twilio_phone_number', value: data.phoneNumber.trim() });
    if (data.botName     != null)      updates.push({ key: 'whatsapp_bot_name',   value: data.botName.trim() });

    if (updates.length === 0) return { success: true };

    const { error } = await (supabase as any)
      .from('site_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to save WhatsApp settings' };
  }
}
