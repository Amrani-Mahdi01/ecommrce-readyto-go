import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  ShoppingCart, Package, Users, TrendingUp,
  AlertTriangle, Clock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: `NexusPC Admin — ${t('dashboard')}` };
}

async function getStats() {
  const empty = {
    todayRevenue: 0, yesterdayRevenue: 0,
    ordersToday: 0, totalCustomers: 0,
    pendingCount: 0,
    statusCounts: {} as Record<string, number>,
    recentOrders: [] as any[],
    lowStock: [] as any[],
    topProducts: [] as { name: string; qty: number; revenue: number }[],
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const supabase = await createClient();

    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [
      { count: totalCustomers },
      { data: allOrders },
      { data: recentOrders },
      { data: lowStock },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('id, status, total, created_at, items').neq('status', 'pending_payment'),
      supabase.from('orders').select('*').neq('status', 'pending_payment').order('created_at', { ascending: false }).limit(5),
      supabase.from('products')
        .select('id, name_en, name_ar, stock_qty, price')
        .lte('stock_qty', 5)
        .eq('is_active', true)
        .order('stock_qty', { ascending: true })
        .limit(6),
    ]);

    const orders = allOrders ?? [];

    // Revenue today / yesterday
    const todayRevenue = orders
      .filter(o => o.status !== 'cancelled' && o.created_at?.slice(0, 10) === today)
      .reduce((s: number, o: any) => s + (o.total ?? 0), 0);

    const yesterdayRevenue = orders
      .filter(o => o.status !== 'cancelled' && o.created_at?.slice(0, 10) === yesterday)
      .reduce((s: number, o: any) => s + (o.total ?? 0), 0);

    // Orders today count
    const ordersToday = orders.filter(o => o.created_at?.slice(0, 10) === today).length;

    // Pending orders (placed — need confirmation)
    const pendingCount = orders.filter(o => o.status === 'placed').length;

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    }

    // Top 5 products this month
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      if (!o.created_at || o.created_at < monthStart) continue;
      const items: any[] = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        if (!item.product_id) continue;
        const existing = productMap.get(item.product_id);
        const qty = item.quantity ?? 1;
        const rev = qty * (item.price ?? 0);
        if (!existing) {
          productMap.set(item.product_id, { name: item.product_name_en ?? 'Unknown', qty, revenue: rev });
        } else {
          existing.qty += qty;
          existing.revenue += rev;
        }
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      todayRevenue,
      yesterdayRevenue,
      ordersToday,
      totalCustomers: totalCustomers ?? 0,
      pendingCount,
      statusCounts,
      recentOrders: (recentOrders ?? []) as any[],
      lowStock: (lowStock ?? []) as any[],
      topProducts,
    };
  } catch {
    return empty;
  }
}

const STATUS_COLORS: Record<string, string> = {
  placed:     'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  confirmed:  'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  processing: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  shipped:    'bg-primary/10 text-primary',
  delivered:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  cancelled:  'bg-destructive/10 text-destructive',
};

const STATUS_LABELS_EN: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};

const STATUS_LABELS_AR: Record<string, string> = {
  placed: 'تم الطلب', confirmed: 'مؤكد', processing: 'قيد المعالجة',
  shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي',
};

const STATUS_ORDER = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function revenueDelta(today: number, yesterday: number) {
  if (yesterday === 0) return null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

export default async function AdminDashboard({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const isRTL = locale === 'ar';
  const s = await getStats();
  const delta = revenueDelta(s.todayRevenue, s.yesterdayRevenue);

  return (
    <div className={`p-6 space-y-8 ${isRTL ? 'font-cairo' : ''}`}>
      {/* Header */}
      <div className={isRTL ? 'text-right' : ''}>
        <h1 className="text-2xl font-extrabold">{t('dashboard')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'en-DZ', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Today's revenue */}
        <div className="rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-emerald-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'إيرادات اليوم' : "Today's Revenue"}
            </p>
            <p className="text-xl font-extrabold mt-0.5">{formatPrice(s.todayRevenue)}</p>
            {delta !== null && (
              <p className={`text-xs flex items-center gap-0.5 mt-0.5 ${isRTL ? 'justify-end' : ''} ${delta >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {delta >= 0
                  ? <ArrowUpRight className="h-3 w-3" />
                  : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(delta)}% {isRTL ? 'مقارنة بالأمس' : 'vs yesterday'}
              </p>
            )}
          </div>
        </div>

        {/* Orders today */}
        <div className="rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-xs text-muted-foreground">{t('ordersToday')}</p>
            <p className="text-xl font-extrabold mt-0.5">{s.ordersToday}</p>
          </div>
        </div>

        {/* Pending orders */}
        <Link href={`/${locale}/admin/orders`} className="rounded-xl border bg-card p-5 flex items-center gap-4 transition-colors hover:bg-muted/20 group
          border-border/60">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 ${s.pendingCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
            <Clock className="h-5 w-5" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'طلبات معلّقة' : 'Pending Orders'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xl font-extrabold">{s.pendingCount}</p>
              {s.pendingCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                  {isRTL ? 'تحتاج تأكيد' : 'Need action'}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Total customers */}
        <div className="rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-violet-500">
            <Users className="h-5 w-5" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-xs text-muted-foreground">{t('totalCustomers')}</p>
            <p className="text-xl font-extrabold mt-0.5">{s.totalCustomers}</p>
          </div>
        </div>
      </div>

      {/* Orders by status */}
      <div>
        <h2 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 ${isRTL ? 'text-right' : ''}`}>
          {isRTL ? 'الطلبات حسب الحالة' : 'Orders by Status'}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STATUS_ORDER.map((status) => {
            const count = s.statusCounts[status] ?? 0;
            return (
              <div key={status} className={`rounded-xl border border-border/60 bg-card px-3 py-3 text-center`}>
                <p className="text-xl font-extrabold">{count}</p>
                <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
                  {isRTL ? STATUS_LABELS_AR[status] : STATUS_LABELS_EN[status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orders + side panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders — takes 2/3 */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : ''}`}>
              {t('recentOrders')}
            </h2>
            <Link href={`/${locale}/admin/orders`} className="text-xs text-primary hover:underline">
              {isRTL ? 'عرض الكل' : 'View all'}
            </Link>
          </div>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            {s.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {isRTL ? 'لا توجد طلبات بعد' : 'No orders yet'}
              </div>
            ) : (
              <table className="w-full text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    {(isRTL
                      ? ['رقم الطلب', 'العميل', 'المجموع', 'الحالة', 'التاريخ']
                      : ['Order #', 'Customer', 'Total', 'Status', 'Date']
                    ).map((h) => (
                      <th key={h} className={`px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-xs">{order.order_number}</td>
                      <td className="px-4 py-3 max-w-[120px] truncate">{order.full_name}</td>
                      <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {isRTL ? (STATUS_LABELS_AR[order.status] ?? order.status) : (STATUS_LABELS_EN[order.status] ?? order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(order.created_at).toLocaleDateString(isRTL ? 'ar-DZ' : 'en-DZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Low stock */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {s.lowStock.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                {isRTL ? 'مخزون منخفض' : 'Low Stock'}
              </h2>
              <Link href={`/${locale}/admin/products`} className="text-xs text-primary hover:underline">
                {isRTL ? 'عرض الكل' : 'View all'}
              </Link>
            </div>
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              {s.lowStock.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted-foreground text-center">
                  {isRTL ? 'كل المنتجات متوفرة' : 'All products well stocked'}
                </p>
              ) : (
                <ul className="divide-y divide-border/30">
                  {s.lowStock.map((p: any) => (
                    <li key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                      <span className="text-sm truncate">{isRTL ? p.name_ar : p.name_en}</span>
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${p.stock_qty === 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                        {p.stock_qty === 0 ? (isRTL ? 'نفد' : 'Out') : `${p.stock_qty} ${isRTL ? 'قطعة' : 'left'}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Top products this month */}
          <div>
            <h2 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 ${isRTL ? 'text-right' : ''}`}>
              {isRTL ? 'الأكثر مبيعاً هذا الشهر' : 'Top Sellers This Month'}
            </h2>
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              {s.topProducts.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted-foreground text-center">
                  {isRTL ? 'لا توجد بيانات بعد' : 'No sales data yet'}
                </p>
              ) : (
                <ul className="divide-y divide-border/30">
                  {s.topProducts.map((p, i) => (
                    <li key={p.name} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="shrink-0 w-5 text-xs font-bold text-muted-foreground/50 text-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.qty} {isRTL ? 'مباع' : 'sold'}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(p.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
