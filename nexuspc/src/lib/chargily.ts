function getChargilyBase(apiKey: string) {
  return apiKey.startsWith('test_')
    ? 'https://pay.chargily.net/test/api/v2'
    : 'https://pay.chargily.net/api/v2';
}

export interface ChargilyCheckoutParams {
  orderId: string;
  amount: number;        // in DZD
  customerName: string;
  customerEmail?: string;
  description: string;
  locale: string;
}

export interface ChargilyCheckout {
  id: string;
  checkout_url: string;
  status: string;
}

export async function createChargilyCheckout(
  params: ChargilyCheckoutParams,
  apiKeyOverride?: string,
): Promise<{ checkout: ChargilyCheckout } | { error: string }> {
  const apiKey = apiKeyOverride || process.env.CHARGILY_API_KEY;
  if (!apiKey) return { error: 'Chargily API key not configured' };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const isPublicUrl = siteUrl.startsWith('https://');

  const body: Record<string, any> = {
    amount: params.amount,          // Chargily v2 accepts whole DZD
    currency: 'dzd',
    success_url: `${siteUrl}/${params.locale}/payment/success?order=${params.orderId}`,
    failure_url: `${siteUrl}/${params.locale}/payment/failure?order=${params.orderId}`,
    ...(isPublicUrl && { webhook_endpoint: `${siteUrl}/api/webhooks/chargily` }),
    description: params.description,
    metadata: {
      order_id: params.orderId,
    },
    // Let the customer choose Edahabia or CIB on Chargily's page
    payment_method: 'edahabia',
  };

  try {
    const res = await fetch(`${getChargilyBase(apiKey)}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg = json?.message ?? json?.error ?? `HTTP ${res.status}`;
      return { error: `Chargily: ${msg}` };
    }

    return {
      checkout: {
        id: json.id,
        checkout_url: json.checkout_url,
        status: json.status,
      },
    };
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to create checkout' };
  }
}

// Verify the webhook signature from Chargily
export function verifyChargilySignature(
  rawBody: string,
  signatureHeader: string,
  secretOverride?: string,
): boolean {
  const secret = secretOverride || process.env.CHARGILY_WEBHOOK_SECRET;
  if (!secret) return false;

  try {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expected === signatureHeader;
  } catch {
    return false;
  }
}
