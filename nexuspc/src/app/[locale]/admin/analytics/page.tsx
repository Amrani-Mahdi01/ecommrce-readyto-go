import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsClient } from '@/components/admin/AnalyticsClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: `NexusPC Admin — ${t('analytics')}` };
}

async function getAnalyticsData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const supabase = await createClient();
    const { data: rawOrders } = await (supabase as any)
      .from('orders')
      .select('id, created_at, total, status, wilaya, user_id, items')
      .order('created_at', { ascending: true });

    if (!rawOrders || rawOrders.length === 0) return null;
    const orders: any[] = rawOrders;

    const now = new Date();

    // ── 1. Revenue trend (last 90 days, daily) ──────────────────────────────
    const dayMap = new Map<string, { revenue: number; orders: number; cancelled: number }>();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0, cancelled: 0 });
    }
    for (const o of orders) {
      const key = o.created_at.slice(0, 10);
      if (dayMap.has(key)) {
        const day = dayMap.get(key)!;
        day.orders++;
        if (o.status !== 'cancelled') day.revenue += o.total ?? 0;
        if (o.status === 'cancelled') day.cancelled++;
      }
    }
    const revenueTrend = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,               // YYYY-MM-DD (client will format)
      revenue: Math.round(v.revenue),
      orders: v.orders,
      cancelled: v.cancelled,
    }));

    // ── 2. Wilaya breakdown ──────────────────────────────────────────────────
    const wilayaMap = new Map<string, { orders: number; revenue: number; cancelled: number }>();
    for (const o of orders) {
      const w = o.wilaya || 'Unknown';
      if (!wilayaMap.has(w)) wilayaMap.set(w, { orders: 0, revenue: 0, cancelled: 0 });
      const ws = wilayaMap.get(w)!;
      ws.orders++;
      if (o.status !== 'cancelled') ws.revenue += o.total ?? 0;
      if (o.status === 'cancelled') ws.cancelled++;
    }
    const wilayaData = Array.from(wilayaMap.entries())
      .map(([wilaya, s]) => ({
        wilaya,
        orders: s.orders,
        revenue: Math.round(s.revenue),
        cancelled: s.cancelled,
        cancelRate: Math.round((s.cancelled / s.orders) * 100),
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 15);

    // ── 3. Status distribution ───────────────────────────────────────────────
    const STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const statusMap = new Map<string, number>(STATUSES.map(s => [s, 0]));
    for (const o of orders) statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
    const statusCounts = STATUSES.map(s => ({ status: s, count: statusMap.get(s) ?? 0 }));

    // ── 4. Top products (from items JSONB, excluding cancelled orders) ───────
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      if (!o.items || o.status === 'cancelled') continue;
      const items: any[] = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        if (!item.product_id) continue;
        if (!productMap.has(item.product_id)) {
          productMap.set(item.product_id, {
            name: item.product_name_en || 'Unknown',
            qty: 0,
            revenue: 0,
          });
        }
        const p = productMap.get(item.product_id)!;
        p.qty += item.quantity ?? 1;
        p.revenue += (item.quantity ?? 1) * (item.price ?? 0);
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ── 5. KPIs ──────────────────────────────────────────────────────────────
    const totalOrders = orders.length;
    const active = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = active.reduce((s, o) => s + (o.total ?? 0), 0);
    const avgOrderValue = active.length ? totalRevenue / active.length : 0;
    const cancelCount = orders.filter(o => o.status === 'cancelled').length;
    const cancelRate = totalOrders ? Math.round((cancelCount / totalOrders) * 100) : 0;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const deliveryRate = totalOrders ? Math.round((deliveredCount / totalOrders) * 100) : 0;

    // ── 6. Monthly customer type (last 6 months) ─────────────────────────────
    const monthMap = new Map<string, { label: string; guests: number; registered: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en', { month: 'short' });
      monthMap.set(key, { label, guests: 0, registered: 0 });
    }
    for (const o of orders) {
      const key = o.created_at.slice(0, 7);
      if (monthMap.has(key)) {
        const m = monthMap.get(key)!;
        if (o.user_id) m.registered++;
        else m.guests++;
      }
    }
    const customerTrend = Array.from(monthMap.values());

    // ── 7. Inventory health ───────────────────────────────────────────────────
    const { data: rawProducts } = await (supabase as any)
      .from('products')
      .select('id, name_en, stock_qty, price, category_id');

    const { data: rawCategories } = await (supabase as any)
      .from('categories')
      .select('id, slug, name_en');

    const catById = new Map<string, { slug: string; name: string }>();
    const catNameBySlug = new Map<string, string>();
    for (const c of (rawCategories ?? [])) {
      catById.set(c.id, { slug: c.slug, name: c.name_en });
      catNameBySlug.set(c.slug, c.name_en);
    }

    const allProducts: any[] = rawProducts ?? [];
    const lowStockItems = allProducts
      .filter(p => p.stock_qty > 0 && p.stock_qty <= 5)
      .map(p => ({
        id: p.id,
        name: p.name_en,
        stock: p.stock_qty,
        price: p.price ?? 0,
        category: catById.get(p.category_id)?.slug ?? 'other',
      }))
      .sort((a, b) => a.stock - b.stock);

    const outOfStockCount = allProducts.filter(p => p.stock_qty === 0 || p.stock_qty === null).length;
    const totalInventoryValue = allProducts.reduce(
      (s, p) => s + (p.price ?? 0) * (p.stock_qty ?? 0), 0,
    );

    // ── 8. Revenue by category ────────────────────────────────────────────────
    const productCatSlug = new Map<string, string>();
    for (const p of allProducts) {
      productCatSlug.set(p.id, catById.get(p.category_id)?.slug ?? 'other');
    }

    const catRevenueMap = new Map<string, number>();
    for (const o of orders) {
      if (!o.items || o.status === 'cancelled') continue;
      const items: any[] = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        if (!item.product_id) continue;
        const slug = productCatSlug.get(item.product_id) ?? 'other';
        catRevenueMap.set(slug, (catRevenueMap.get(slug) ?? 0) + (item.quantity ?? 1) * (item.price ?? 0));
      }
    }
    const revenueByCategory = Array.from(catRevenueMap.entries())
      .map(([slug, revenue]) => ({
        slug,
        name: catNameBySlug.get(slug) ?? slug,
        revenue: Math.round(revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      revenueTrend,
      wilayaData,
      statusCounts,
      topProducts,
      customerTrend,
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue),
        cancelRate,
        deliveryRate,
      },
      inventoryHealth: {
        lowStockItems,
        outOfStockCount,
        totalInventoryValue: Math.round(totalInventoryValue),
      },
      revenueByCategory,
    };
  } catch (e) {
    console.error('Analytics error:', e);
    return null;
  }
}

export default async function AdminAnalyticsPage({ params }: PageProps) {
  const { locale } = await params;
  const data = await getAnalyticsData();

  return <AnalyticsClient locale={locale} data={data} />;
}
