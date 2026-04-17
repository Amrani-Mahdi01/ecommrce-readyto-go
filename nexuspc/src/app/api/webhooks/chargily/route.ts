import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyChargilySignature } from '@/lib/chargily';
import { getChargilyConfig } from '@/app/actions/settings';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('signature') ?? '';

  // Verify the request is genuinely from Chargily
  const { webhookSecret } = await getChargilyConfig();
  if (!verifyChargilySignature(rawBody, signature, webhookSecret)) {
    console.error('[Chargily webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, data } = payload;

  // We only care about checkout completion events
  if (type !== 'checkout.paid' && type !== 'checkout.failed') {
    return NextResponse.json({ received: true });
  }

  const orderId: string | undefined = data?.metadata?.order_id;
  if (!orderId) {
    return NextResponse.json({ error: 'No order_id in metadata' }, { status: 400 });
  }

  try {
    const supabase = await createServiceClient();

    if (type === 'checkout.paid') {
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
        } as any)
        .eq('id', orderId)
        .eq('status', 'pending_payment');

      console.log(`[Chargily] Order ${orderId} marked as paid`);
    }

    if (type === 'checkout.failed') {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' } as any)
        .eq('id', orderId)
        .eq('status', 'pending_payment');

      console.log(`[Chargily] Payment failed for order ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[Chargily webhook] DB error:', e?.message);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
