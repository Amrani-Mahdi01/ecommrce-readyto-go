'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp, ShoppingCart, CheckCircle2,
  BarChart2, Package, Users, TrendingDown, AlertTriangle,
  Boxes, PackageX,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// ApexCharts must be dynamically imported (no SSR) in Next.js
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ── colour palette ───────────────────────────────────────────────────────────
const P = {
  orange:  '#f97316',
  purple:  '#a855f7',
  violet:  '#8b5cf6',
  cyan:    '#06b6d4',
  emerald: '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  rose:    '#fb7185',
  indigo:  '#6366f1',
};

const STATUS_COLORS: Record<string, string> = {
  placed:     P.cyan,
  confirmed:  P.indigo,
  processing: P.amber,
  shipped:    P.purple,
  delivered:  P.emerald,
  cancelled:  P.red,
};

// ── category colour map (matches AdminProductsClient CAT_META) ────────────────
const CAT_COLORS: Record<string, string> = {
  gpu:         '#8b5cf6',
  cpu:         '#3b82f6',
  ram:         '#10b981',
  storage:     '#f59e0b',
  psu:         '#eab308',
  cooling:     '#06b6d4',
  cases:       '#f97316',
  motherboard: '#fb7185',
};
function catColor(slug: string) { return CAT_COLORS[slug] ?? P.indigo; }

// ── types ────────────────────────────────────────────────────────────────────
interface RevDay        { date: string; revenue: number; orders: number; cancelled: number }
interface WilayaRow     { wilaya: string; orders: number; revenue: number; cancelled: number; cancelRate: number }
interface StatusRow     { status: string; count: number }
interface Product       { name: string; qty: number; revenue: number }
interface MonthRow      { label: string; guests: number; registered: number }
interface InventoryItem { id: string; name: string; stock: number; price: number; category: string }
interface CatRevRow     { slug: string; name: string; revenue: number }

interface AnalyticsData {
  revenueTrend:  RevDay[];
  wilayaData:    WilayaRow[];
  statusCounts:  StatusRow[];
  topProducts:   Product[];
  customerTrend: MonthRow[];
  kpis: {
    totalRevenue:  number;
    totalOrders:   number;
    avgOrderValue: number;
    cancelRate:    number;
    deliveryRate:  number;
  };
  inventoryHealth?: {
    lowStockItems:       InventoryItem[];
    outOfStockCount:     number;
    totalInventoryValue: number;
  };
  revenueByCategory?: CatRevRow[];
}

interface Props {
  locale: string;
  data: AnalyticsData | null;
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}20`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-extrabold mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Arabic month name map ─────────────────────────────────────────────────────
const MONTH_AR: Record<string, string> = {
  Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس',  Apr: 'أبريل',
  May: 'مايو',  Jun: 'يونيو',  Jul: 'يوليو', Aug: 'أغسطس',
  Sep: 'سبتمبر',Oct: 'أكتوبر',Nov: 'نوفمبر',Dec: 'ديسمبر',
};

// ── Arabic status label map ───────────────────────────────────────────────────
const STATUS_LABELS_AR: Record<string, string> = {
  placed:     'تم الطلب',
  confirmed:  'مؤكد',
  processing: 'قيد المعالجة',
  shipped:    'تم الشحن',
  delivered:  'تم التسليم',
  cancelled:  'ملغي',
};

// ── shared chart defaults ─────────────────────────────────────────────────────
function baseOptions(isDark: boolean, isRTL: boolean): ApexCharts.ApexOptions {
  return {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
      fontFamily: isRTL ? 'Cairo, inherit' : 'inherit',
      animations: { enabled: true, speed: 600 },
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    grid: {
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      style: { fontSize: '12px', fontFamily: isRTL ? 'Cairo, inherit' : 'inherit' },
    },
  };
}

// ── main component ────────────────────────────────────────────────────────────
export function AnalyticsClient({ locale, data }: Props) {
  const isRTL = locale === 'ar';
  const [period, setPeriod] = useState<30 | 90 | 0>(30);
  const [isDark, setIsDark] = useState(false);
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<string>>(new Set());
  const [hiddenCustomerSeries, setHiddenCustomerSeries] = useState<Set<string>>(new Set());

  // Track dark mode changes
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const revenueData = useMemo(() => {
    if (!data) return [];
    return period === 0 ? data.revenueTrend : data.revenueTrend.slice(-period);
  }, [data, period]);

  const periodRevenue = useMemo(() => revenueData.reduce((s, d) => s + d.revenue, 0), [revenueData]);
  const periodOrders  = useMemo(() => revenueData.reduce((s, d) => s + d.orders,  0), [revenueData]);

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <BarChart2 className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">
            {locale === 'ar'
              ? 'لا توجد بيانات كافية للتحليل بعد'
              : 'No data yet — place some orders to see analytics'}
          </p>
        </div>
      </div>
    );
  }

  const { kpis, wilayaData, statusCounts, topProducts, customerTrend, inventoryHealth, revenueByCategory } = data;
  const totalStatusCount = statusCounts.reduce((s, r) => s + r.count, 0);
  const base = baseOptions(isDark, isRTL);

  const toggleStatus = (status: string) => {
    setHiddenStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  };

  const toggleCustomerSeries = (name: string) => {
    if (typeof window !== 'undefined' && (window as any).ApexCharts) {
      (window as any).ApexCharts.exec('customers', 'toggleSeries', name);
    }
    setHiddenCustomerSeries(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  // ── chart configs ──────────────────────────────────────────────────────────

  // 1. Revenue area chart — reverse arrays manually for RTL (xaxis.reversed API doesn't work)
  const revenueCategories = revenueData.map(d => d.date.slice(5).replace('-', '/'));
  const revenueValues     = revenueData.map(d => d.revenue);
  const revCats = isRTL ? [...revenueCategories].reverse() : revenueCategories;
  const revVals = isRTL ? [...revenueValues].reverse()     : revenueValues;
  const revenueOptions: ApexCharts.ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'area', id: 'revenue' },
    colors: [P.orange],
    fill: {
      type: 'gradient',
      gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.4, opacityFrom: 0.5, opacityTo: 0.02 },
    },
    stroke: { curve: 'smooth', width: 2.5 },
    xaxis: {
      categories: revCats,
      tickAmount: period === 30 ? 6 : period === 90 ? 8 : 10,
      labels: {
        style: { fontSize: '10px', colors: isDark ? '#94a3b8' : '#64748b' },
        rotate: 0,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      opposite: isRTL,
      labels: {
        formatter: (v) => `${(v / 1000).toFixed(0)}k`,
        style: { fontSize: '10px', colors: [isDark ? '#94a3b8' : '#64748b'] },
      },
    },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    tooltip: {
      ...base.tooltip,
      y: { formatter: (v) => formatPrice(v) },
    },
  };

  const revenueSeries = [{ name: locale === 'ar' ? 'الإيراد' : 'Revenue', data: revVals }];

  // 2. Wilaya horizontal bar
  // RTL: the chart container is CSS-flipped (scaleX -1); yaxis stays left → appears right after flip
  const wilayaOptions: ApexCharts.ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar', id: 'wilaya' },
    colors: wilayaData.map(w =>
      w.cancelRate > 25 ? P.red : w.cancelRate > 15 ? P.amber : P.purple,
    ),
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        distributed: true,
        dataLabels: { position: 'top' },
      },
    },
    xaxis: {
      categories: wilayaData.map(w => w.wilaya),
      labels: { style: { fontSize: '10px', colors: isDark ? '#94a3b8' : '#64748b' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: '10px', colors: [isDark ? '#94a3b8' : '#64748b'] },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      ...base.tooltip,
      y: { formatter: (v) => `${v} orders` },
      custom: ({ dataPointIndex }: any) => {
        const w = wilayaData[dataPointIndex];
        if (!w) return '';
        const ordersLabel   = isRTL ? 'طلبات'   : 'orders';
        const cancelledLabel = isRTL ? '% ملغي' : '% cancelled';
        const dir = isRTL ? 'rtl' : 'ltr';
        return `
          <div style="padding:8px 12px;font-size:12px;line-height:1.7;direction:${dir};font-family:${isRTL ? 'Cairo,sans-serif' : 'inherit'}">
            <b>${w.wilaya}</b><br/>
            ${w.orders} ${ordersLabel}<br/>
            ${formatPrice(w.revenue)}<br/>
            <span style="color:${w.cancelRate > 25 ? P.red : w.cancelRate > 15 ? P.amber : P.emerald}">
              ${w.cancelRate}${cancelledLabel}
            </span>
          </div>`;
      },
    },
  };

  const wilayaSeries = [{ name: locale === 'ar' ? 'الطلبات' : 'Orders', data: wilayaData.map(w => w.orders) }];

  // 3. Status donut
  const activeStatuses = statusCounts.filter(s => s.count > 0);
  const visibleStatuses = activeStatuses.filter(s => !hiddenStatuses.has(s.status));
  const visibleStatusCount = visibleStatuses.reduce((s, r) => s + r.count, 0);
  const statusOptions: ApexCharts.ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'donut', id: 'status' },
    colors: visibleStatuses.map(s => STATUS_COLORS[s.status] ?? P.indigo),
    labels: visibleStatuses.map(s => isRTL ? (STATUS_LABELS_AR[s.status] ?? s.status) : s.status),
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: locale === 'ar' ? 'المجموع' : 'Total',
              fontSize: '13px',
              fontWeight: 600,
              formatter: () => String(visibleStatusCount),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      ...base.tooltip,
      y: {
        formatter: (v) => `${v} (${Math.round((v / visibleStatusCount) * 100)}%)`,
      },
    },
    stroke: { width: 2, colors: [isDark ? '#1e1e2e' : '#ffffff'] },
  };

  const statusSeries = visibleStatuses.map(s => s.count);

  // 4. Customer stacked bar — always reversed so newest month (Apr) is on the left
  const customerTrendRev = [...customerTrend].reverse();
  const customerLabels = customerTrendRev.map(m =>
    isRTL ? (MONTH_AR[m.label] ?? m.label) : m.label,
  );
  const customerOptions: ApexCharts.ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar', id: 'customers', stacked: true },
    colors: [P.orange, P.violet],
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: '55%' },
    },
    xaxis: {
      categories: customerLabels,
      labels: { style: { fontSize: '11px', colors: isDark ? '#94a3b8' : '#64748b' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      opposite: isRTL,
      labels: {
        style: { fontSize: '10px', colors: [isDark ? '#94a3b8' : '#64748b'] },
        formatter: (v: number) => String(Math.round(v)),
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { ...base.tooltip },
  };

  const customerSeries = [
    { name: locale === 'ar' ? 'مسجل' : 'Registered', data: customerTrendRev.map(m => m.registered) },
    { name: locale === 'ar' ? 'ضيف' : 'Guest',       data: customerTrendRev.map(m => m.guests) },
  ];

  // ── Revenue by Category chart config ────────────────────────────────────────
  const catRevData = revenueByCategory ?? [];
  const catRevOptions: ApexCharts.ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar', id: 'cat-revenue' },
    colors: catRevData.map(c => catColor(c.slug)),
    plotOptions: {
      bar: { horizontal: true, borderRadius: 4, distributed: true, dataLabels: { position: 'top' } },
    },
    xaxis: {
      categories: catRevData.map(c => isRTL ? c.slug : c.name),
      labels: { style: { fontSize: '10px', colors: isDark ? '#94a3b8' : '#64748b' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { fontSize: '11px', colors: [isDark ? '#94a3b8' : '#64748b'] } },
    },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => `${(v / 1000).toFixed(0)}k`,
      style: { fontSize: '10px', colors: [isDark ? '#e2e8f0' : '#1e293b'] },
      offsetX: 4,
    },
    legend: { show: false },
    tooltip: {
      ...base.tooltip,
      y: { formatter: (v: number) => formatPrice(v) },
    },
  };
  const catRevSeries = [{ name: locale === 'ar' ? 'الإيراد' : 'Revenue', data: catRevData.map(c => c.revenue) }];

  return (
    <div className={`p-6 space-y-8 ${isRTL ? 'font-cairo text-right' : ''}`}>

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-extrabold">
          {locale === 'ar' ? 'التحليلات' : 'Analytics'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === 'ar' ? 'نظرة شاملة على أداء متجرك' : 'A full picture of your store performance'}
        </p>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp}   label={locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}      value={formatPrice(kpis.totalRevenue)}  color={P.orange}  />
        <KpiCard icon={ShoppingCart} label={locale === 'ar' ? 'إجمالي الطلبات'  : 'Total Orders'}        value={String(kpis.totalOrders)}         color={P.purple}  />
        <KpiCard icon={TrendingDown} label={locale === 'ar' ? 'نسبة الإلغاء'    : 'Cancellation Rate'}   value={`${kpis.cancelRate}%`}            color={kpis.cancelRate > 20 ? P.red : P.amber} sub={locale === 'ar' ? 'من إجمالي الطلبات' : 'of all orders'} />
        <KpiCard icon={CheckCircle2} label={locale === 'ar' ? 'نسبة التسليم'    : 'Delivery Rate'}       value={`${kpis.deliveryRate}%`}          color={P.emerald} sub={locale === 'ar' ? 'طلبات مسلّمة' : 'orders delivered'} />
      </div>

      {/* ── Revenue trend ── */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-base">{locale === 'ar' ? 'الإيرادات اليومية' : 'Daily Revenue'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatPrice(periodRevenue)} &nbsp;·&nbsp; {periodOrders} {locale === 'ar' ? 'طلب' : 'orders'}
            </p>
          </div>
          <div className="flex items-center rounded-lg border border-border/60 overflow-hidden text-xs font-medium">
            {([30, 90, 0] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 transition-colors ${period === p ? 'text-white' : 'hover:bg-accent text-muted-foreground'}`}
                style={period === p ? { background: P.orange } : {}}
              >
                {p === 0 ? (locale === 'ar' ? 'الكل' : 'All') : `${p}${locale === 'ar' ? 'ي' : 'd'}`}
              </button>
            ))}
          </div>
        </div>
        <ApexChart
          key={`revenue-${period}-${isDark}-${isRTL}`}
          type="area"
          options={revenueOptions}
          series={revenueSeries}
          height={250}
        />
      </div>

      {/* ── Wilaya + Status ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Wilaya */}
        <div className="xl:col-span-3 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="font-bold text-base">{locale === 'ar' ? 'الطلبات حسب الولاية' : 'Orders by Wilaya'}</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            {locale === 'ar'
              ? 'أعلى 15 ولاية — أحمر = نسبة إلغاء عالية'
              : 'Top 15 wilayas — red = high cancellation rate'}
          </p>
          {/* CSS scaleX(-1) flips bars right→left; counter-flip text so labels stay readable */}
          <div className={isRTL
            ? 'scale-x-[-1] [&_text]:[transform-box:fill-box] [&_text]:[transform-origin:center] [&_text]:scale-x-[-1] [&_.apexcharts-tooltip]:scale-x-[-1]'
            : ''}>
            <ApexChart
              key={`wilaya-${isDark}-${isRTL}`}
              type="bar"
              options={wilayaOptions}
              series={wilayaSeries}
              height={360}
            />
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: P.purple }} /> {locale === 'ar' ? 'عادي' : 'Normal'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: P.amber }}  /> &gt;15% {locale === 'ar' ? 'إلغاء' : 'cancel'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: P.red }}    /> &gt;25% {locale === 'ar' ? 'إلغاء' : 'cancel'}</span>
          </div>
        </div>

        {/* Status donut */}
        <div className="xl:col-span-2 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="font-bold text-base">{locale === 'ar' ? 'توزيع الطلبات' : 'Order Status'}</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            {locale === 'ar' ? 'الحالة الحالية لكل الطلبات' : 'Current status breakdown'}
          </p>
          <ApexChart
            key={`status-${isDark}-${isRTL}-${[...hiddenStatuses].join(',')}`}
            type="donut"
            options={statusOptions}
            series={statusSeries}
            height={220}
          />
          {/* Legend */}
          <div className="mt-3 space-y-2">
            {activeStatuses.map(({ status, count }) => {
              const isHidden = hiddenStatuses.has(status);
              const label = isRTL ? (STATUS_LABELS_AR[status] ?? status) : status;
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`w-full flex items-center justify-between text-xs transition-opacity hover:opacity-80 ${isHidden ? 'opacity-35' : 'opacity-100'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: isHidden ? (isDark ? '#4b5563' : '#d1d5db') : (STATUS_COLORS[status] ?? P.indigo) }}
                    />
                    <span className={`capitalize text-muted-foreground ${isHidden ? 'line-through' : ''}`}>{label}</span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {count}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({Math.round((count / totalStatusCount) * 100)}%)
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Top products + Customer trend ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Top products table */}
        <div className="xl:col-span-3 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="p-5 border-b border-border/60">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Package className="h-4 w-4" style={{ color: P.orange }} />
              {locale === 'ar' ? 'أفضل المنتجات مبيعًا' : 'Top Selling Products'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === 'ar' ? 'مرتبة حسب الإيراد (بدون الملغاة)' : 'Ranked by revenue, cancelled orders excluded'}
            </p>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {locale === 'ar' ? 'لا توجد بيانات' : 'No data yet'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  {['#',
                    locale === 'ar' ? 'المنتج'   : 'Product',
                    locale === 'ar' ? 'الكمية'   : 'Qty',
                    locale === 'ar' ? 'الإيراد'  : 'Revenue',
                  ].map(h => (
                    <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => {
                  const pct = Math.round((p.revenue / topProducts[0].revenue) * 100);
                  return (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-bold text-muted-foreground/50 w-8">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-xs line-clamp-1 max-w-[200px]">{p.name}</p>
                        <div className="mt-1 h-1 w-full rounded-full bg-muted/40 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: P.orange }} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-semibold tabular-nums">{p.qty}</td>
                      <td className="px-4 py-2.5 text-xs font-bold tabular-nums whitespace-nowrap" style={{ color: P.orange }}>{formatPrice(p.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Customer trend */}
        <div className="xl:col-span-2 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: P.violet }} />
            {locale === 'ar' ? 'العملاء' : 'Customers'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            {locale === 'ar' ? 'مسجل vs ضيف — آخر 6 أشهر' : 'Registered vs Guest — last 6 months'}
          </p>
          <ApexChart
            key={`customers-${isDark}-${isRTL}`}
            type="bar"
            options={customerOptions}
            series={customerSeries}
            height={210}
          />
          <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
            {([
              { key: locale === 'ar' ? 'مسجل' : 'Registered', color: P.orange },
              { key: locale === 'ar' ? 'ضيف'  : 'Guest',       color: P.violet },
            ] as const).map(({ key, color }) => {
              const isHidden = hiddenCustomerSeries.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleCustomerSeries(key)}
                  className={`flex items-center gap-1.5 transition-opacity hover:opacity-80 ${isHidden ? 'opacity-35' : 'opacity-100'}`}
                >
                  <span className="w-3 h-3 rounded-sm" style={{ background: isHidden ? (isDark ? '#4b5563' : '#d1d5db') : color }} />
                  <span className={isHidden ? 'line-through' : ''}>{key}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Revenue by Category + Inventory Health ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Revenue by Category chart */}
        <div className="xl:col-span-3 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="font-bold text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4" style={{ color: P.violet }} />
            {locale === 'ar' ? 'الإيراد حسب الفئة' : 'Revenue by Category'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            {locale === 'ar' ? 'إجمالي الإيرادات لكل فئة (الملغاة مستثناة)' : 'Total revenue per category, cancelled orders excluded'}
          </p>
          {catRevData.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              {locale === 'ar' ? 'لا توجد بيانات' : 'No data yet'}
            </div>
          ) : (
            <div className={isRTL
              ? 'scale-x-[-1] [&_text]:[transform-box:fill-box] [&_text]:[transform-origin:center] [&_text]:scale-x-[-1] [&_.apexcharts-tooltip]:scale-x-[-1]'
              : ''}>
              <ApexChart
                key={`cat-rev-${isDark}-${isRTL}`}
                type="bar"
                options={catRevOptions}
                series={catRevSeries}
                height={Math.max(200, catRevData.length * 42)}
              />
            </div>
          )}
        </div>

        {/* Inventory Health Panel */}
        <div className="xl:col-span-2 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="p-5 border-b border-border/60">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Boxes className="h-4 w-4" style={{ color: P.emerald }} />
              {locale === 'ar' ? 'صحة المخزون' : 'Inventory Health'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === 'ar' ? 'تحذيرات المخزون المنخفض وإجمالي القيمة' : 'Low stock alerts and total stock value'}
            </p>
          </div>

          {/* 3 mini KPIs */}
          <div className="grid grid-cols-3 divide-x divide-border/60">
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {locale === 'ar' ? 'مخزون منخفض' : 'Low Stock'}
              </p>
              <p className="text-xl font-extrabold mt-1" style={{ color: P.amber }}>
                {inventoryHealth?.lowStockItems.length ?? 0}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {locale === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
              </p>
              <p className="text-xl font-extrabold mt-1" style={{ color: P.red }}>
                {inventoryHealth?.outOfStockCount ?? 0}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {locale === 'ar' ? 'قيمة المخزون' : 'Stock Value'}
              </p>
              <p className="text-base font-extrabold mt-1" style={{ color: P.emerald }}>
                {(inventoryHealth?.totalInventoryValue ?? 0) >= 1_000_000
                  ? `${((inventoryHealth?.totalInventoryValue ?? 0) / 1_000_000).toFixed(1)}M`
                  : `${((inventoryHealth?.totalInventoryValue ?? 0) / 1000).toFixed(0)}k`} DA
              </p>
            </div>
          </div>

          {/* Low stock table */}
          {inventoryHealth && inventoryHealth.lowStockItems.length > 0 ? (
            <div className="border-t border-border/60 overflow-y-auto max-h-64">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/60">
                    <th className={`px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>
                      {locale === 'ar' ? 'المنتج' : 'Product'}
                    </th>
                    <th className="px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-center">
                      {locale === 'ar' ? 'المتبقي' : 'Left'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryHealth.lowStockItems.map(item => {
                    const urgency = item.stock <= 1 ? P.red : item.stock <= 3 ? P.amber : P.orange;
                    return (
                      <tr key={item.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColor(item.category) }} />
                            <span className="font-medium line-clamp-1 max-w-[150px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-extrabold text-white"
                            style={{ background: urgency }}
                          >
                            {item.stock}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-xs border-t border-border/60">
              <PackageX className="h-8 w-8 mx-auto mb-2 opacity-30" />
              {locale === 'ar' ? 'جميع المنتجات متوفرة بكميات جيدة' : 'All products are well stocked'}
            </div>
          )}
        </div>
      </div>

      {/* ── Cancellation alert ── */}
      {wilayaData.some(w => w.cancelRate > 25) && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                {locale === 'ar' ? 'تحذير: نسبة إلغاء عالية' : 'High cancellation rate alert'}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                <strong>{wilayaData.filter(w => w.cancelRate > 25).map(w => w.wilaya).join(', ')}</strong>
                {' '}{locale === 'ar'
                  ? '— نسبة إلغاء تتجاوز 25%. فكّر في طلب تأكيد هاتفي قبل الشحن لهذه الولايات.'
                  : '— cancel rate above 25%. Require phone confirmation before shipping to these wilayas.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
