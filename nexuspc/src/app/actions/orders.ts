'use server';

import { createClient } from '@/lib/supabase/server';

interface OrderItem {
  product_id: string;
  quantity: number;
  [key: string]: unknown;
}

/**
 * Update order status and adjust product stock accordingly:
 *  - any → confirmed : decrement stock (floor at 0)
 *  - confirmed → cancelled : restore stock
 *  - other transitions : no stock change
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // 1. Fetch the order (current status + items)
  const { data: order, error: fetchErr } = await (supabase
    .from('orders') as any)
    .select('status, items')
    .eq('id', orderId)
    .single() as { data: { status: string; items: OrderItem[] } | null; error: any };

  if (fetchErr || !order) {
    return { error: fetchErr?.message ?? 'Order not found' };
  }

  const oldStatus = order.status;

  // 2. Update order status
  const { error: updateErr } = await (supabase
    .from('orders') as any)
    .update({ status: newStatus })
    .eq('id', orderId);

  if (updateErr) return { error: updateErr.message };

  // 3. Determine stock direction
  const shouldDecrement = oldStatus !== 'confirmed' && newStatus === 'confirmed';
  const shouldRestore   = oldStatus === 'confirmed'  && newStatus === 'cancelled';

  if (shouldDecrement || shouldRestore) {
    // 4. Parse items
    const items = (Array.isArray(order.items) ? order.items : []) as OrderItem[];

    if (items.length > 0) {
      // 5. Fetch current stock
      const productIds = items.map((i) => i.product_id).filter(Boolean);
      const { data: products, error: stockErr } = await (supabase
        .from('products') as any)
        .select('id, stock_qty')
        .in('id', productIds) as { data: { id: string; stock_qty: number }[] | null; error: any };

      if (stockErr || !products) return { error: stockErr?.message ?? 'Could not fetch stock' };

      const stockMap = new Map(products.map((p) => [p.id, p.stock_qty]));

      // 6. Update each product
      const updates = items
        .filter((item) => item.product_id && stockMap.has(item.product_id))
        .map((item) => {
          const current = stockMap.get(item.product_id) ?? 0;
          const qty     = Number(item.quantity) || 0;
          const newQty  = shouldDecrement ? Math.max(0, current - qty) : current + qty;
          return (supabase.from('products') as any)
            .update({ stock_qty: newQty })
            .eq('id', item.product_id);
        });

      const results = await Promise.all(updates);
      const firstErr = results.find((r: any) => r.error)?.error;
      if (firstErr) return { error: firstErr.message };
    }
  }

  // Auto-block IP if 3+ cancellations
  if (newStatus === 'cancelled') {
    const { data: orderWithIp } = await (supabase.from('orders') as any)
      .select('ip_address')
      .eq('id', orderId)
      .single();

    const ip = orderWithIp?.ip_address;
    if (ip && ip !== 'unknown') {
      const { count } = await (supabase.from('orders') as any)
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('status', 'cancelled');

      if ((count ?? 0) >= 3) {
        const { createServiceClient } = await import('@/lib/supabase/server');
        const sc = await createServiceClient();
        await (sc.from('blocked_ips') as any)
          .upsert(
            { ip, reason: `Auto-blocked: ${count} cancelled orders`, blocked_by: 'system' },
            { onConflict: 'ip' },
          );
      }
    }
  }

  return { error: null };
}
