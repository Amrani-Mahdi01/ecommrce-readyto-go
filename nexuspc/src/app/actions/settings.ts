'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';

// ─── Chargily ────────────────────────────────────────────────────────────────

export async function getChargilySettings() {
  try {
    const supabase = await getServiceSupabase();
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['chargily_api_key', 'chargily_webhook_secret', 'payment_online_enabled']);

    const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));

    const rawKey: string    = map['chargily_api_key'] ?? '';
    const rawSecret: string = map['chargily_webhook_secret'] ?? '';

    return {
      onlineEnabled:  map['payment_online_enabled'] !== 'false',
      apiKeyIsSet:    rawKey.length > 0,
      maskedApiKey:   rawKey.length > 0 ? `${rawKey.slice(0, 10)}••••••••` : '',
      secretIsSet:    rawSecret.length > 0,
      maskedSecret:   rawSecret.length > 0 ? `${rawSecret.slice(0, 10)}••••••••` : '',
    };
  } catch {
    return { onlineEnabled: true, apiKeyIsSet: false, maskedApiKey: '', secretIsSet: false, maskedSecret: '' };
  }
}

export async function saveChargilySettings(data: {
  onlineEnabled?: boolean;
  apiKey: string | null;
  webhookSecret: string | null;
}) {
  try {
    const supabase = await getServiceSupabase();
    const updates: { key: string; value: string }[] = [];

    if (data.onlineEnabled !== undefined) updates.push({ key: 'payment_online_enabled', value: data.onlineEnabled ? 'true' : 'false' });
    if (data.apiKey !== null)             updates.push({ key: 'chargily_api_key',        value: data.apiKey.trim() });
    if (data.webhookSecret !== null)      updates.push({ key: 'chargily_webhook_secret', value: data.webhookSecret.trim() });

    if (updates.length === 0) return { success: true };

    const { error } = await (supabase as any)
      .from('site_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to save settings' };
  }
}

// Used by checkout page to decide whether to show online payment option
export async function getOnlinePaymentEnabled(): Promise<boolean> {
  try {
    const supabase = await getServiceSupabase();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'payment_online_enabled')
      .single() as any;
    return (data as any)?.value !== 'false';
  } catch {
    return true;
  }
}

// Used at runtime by API routes — DB key takes priority over env var
export async function getChargilyConfig(): Promise<{ apiKey: string; webhookSecret: string }> {
  try {
    const supabase = await getServiceSupabase();
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['chargily_api_key', 'chargily_webhook_secret']);

    const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));

    return {
      apiKey:        map['chargily_api_key']        || process.env.CHARGILY_API_KEY        || '',
      webhookSecret: map['chargily_webhook_secret'] || process.env.CHARGILY_WEBHOOK_SECRET || '',
    };
  } catch {
    return {
      apiKey:        process.env.CHARGILY_API_KEY        ?? '',
      webhookSecret: process.env.CHARGILY_WEBHOOK_SECRET ?? '',
    };
  }
}

async function getServiceSupabase() {
  try {
    return await createServiceClient();
  } catch {
    return await createClient();
  }
}

export async function getAISettings() {
  try {
    const supabase = await getServiceSupabase();
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['ai_enabled', 'groq_api_key']);

    const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));

    const rawKey: string = map['groq_api_key'] ?? '';
    const keyIsSet = rawKey.length > 0;
    // Mask key for display — show first 8 chars then ****
    const maskedKey = keyIsSet ? `${rawKey.slice(0, 8)}••••••••` : '';

    return {
      enabled: map['ai_enabled'] !== 'false',
      keyIsSet,
      maskedKey,
    };
  } catch {
    return { enabled: false, keyIsSet: false, maskedKey: '' };
  }
}

export async function saveAISettings(data: {
  enabled: boolean;
  apiKey: string | null; // null = don't update the key
}) {
  try {
    const supabase = await getServiceSupabase();

    const updates: { key: string; value: string }[] = [
      { key: 'ai_enabled', value: data.enabled ? 'true' : 'false' },
    ];

    if (data.apiKey !== null) {
      updates.push({ key: 'groq_api_key', value: data.apiKey.trim() });
    }

    const { error } = await (supabase as any)
      .from('site_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to save settings' };
  }
}

// Used by ai.ts to get the live API key and enabled flag
export async function getAIConfig(): Promise<{ enabled: boolean; apiKey: string }> {
  try {
    const supabase = await getServiceSupabase();
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['ai_enabled', 'groq_api_key']);

    const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));

    const enabled = map['ai_enabled'] !== 'false';
    // DB key takes priority over env var
    const apiKey: string = map['groq_api_key'] || process.env.GROQ_API_KEY || '';

    return { enabled, apiKey };
  } catch {
    // Fallback to env var if DB is unavailable
    return { enabled: true, apiKey: process.env.GROQ_API_KEY ?? '' };
  }
}
