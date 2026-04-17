import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createChargilyCheckout } from '@/lib/chargily';
import { getChargilyConfig } from '@/app/actions/settings';

export async function POST(req: NextRequest) {
  try {
    const { orderId, locale } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Fetch the order from DB to get amount + customer info
    const supabase = await createClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total, full_name, status')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!['placed', 'pending_payment'].includes(order.status)) {
      return NextResponse.json({ error: 'Order is not in a payable state' }, { status: 400 });
    }

    const { apiKey } = await getChargilyConfig();

    const result = await createChargilyCheckout({
      orderId: order.id,
      amount: order.total,
      customerName: order.full_name,
      description: `NexusPC — Order ${order.order_number}`,
      locale: locale ?? 'en',
    }, apiKey);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Store the chargily checkout id on the order for later reference
    await supabase
      .from('orders')
      .update({ chargily_checkout_id: result.checkout.id } as any)
      .eq('id', orderId);

    return NextResponse.json({ checkout_url: result.checkout.checkout_url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
