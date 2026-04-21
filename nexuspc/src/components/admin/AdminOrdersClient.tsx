'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Bell, Download, CheckSquare, Square, FileDown,
  X, Truck, Building2, Package, User, Phone, MapPin,
  MessageSquare, ChevronDown, Calendar, Loader2,
  TrendingUp, ShoppingBag, PhoneCall, MessageCircle,
  CheckCheck, Clock, AlertCircle, Receipt,
  Banknote, CreditCard, ShieldX, ShieldCheck,
} from 'lucide-react';
import { DownloadInvoiceButton } from '@/components/order/DownloadInvoiceButton';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from '@/app/actions/orders';
import { blockIp, unblockIp, getBlockedIps } from '@/app/actions/place-order';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  placed:     'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
  confirmed:  'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  processing: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  shipped:    'bg-primary/10 text-primary',
  delivered:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  cancelled:  'bg-destructive/10 text-destructive',
};

const STATUS_LABELS_AR: Record<string, string> = {
  placed:     'تم الطلب',
  confirmed:  'مؤكد',
  processing: 'قيد المعالجة',
  shipped:    'تم الشحن',
  delivered:  'تم التسليم',
  cancelled:  'ملغي',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  product_id: string;
  product_name_en: string;
  product_name_ar: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  full_name: string;
  phone: string;
  wilaya: string;
  commune?: string;
  notes?: string;
  total: number;
  delivery_type?: string;
  delivery_price?: number;
  payment_method?: 'cod' | 'online';
  payment_status?: string;
  chargily_checkout_id?: string;
  status: string;
  items?: OrderItem[];
  created_at: string;
  ip_address?: string;
}

interface BlockedIp {
  ip: string;
  reason: string | null;
  blocked_by: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {}
}

function getDayLabel(dateStr: string, locale: string): string {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today)     return locale === 'ar' ? 'اليوم'  : 'Today';
  if (dateStr === yesterday) return locale === 'ar' ? 'أمس'   : 'Yesterday';
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function toWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? '213' + digits.slice(1) : digits;
  return `https://wa.me/${normalized}`;
}

function downloadCSV(orders: Order[], filename: string) {
  const headers = ['Order #','Date','Customer','Phone','Wilaya','Commune','Delivery','Status','Total (DZD)','Items','Notes'];
  const escape  = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = orders.map(o => [
    escape(o.order_number), escape(o.created_at.slice(0, 10)),
    escape(o.full_name), escape(o.phone), escape(o.wilaya),
    escape(o.commune ?? ''), escape(o.delivery_type ?? 'home'),
    escape(o.status), escape(o.total),
    escape(Array.isArray(o.items) ? o.items.length : ''), escape(o.notes ?? ''),
  ].join(','));
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── KPI cards ─────────────────────────────────────────────────────────────────

function KpiCards({ orders, locale }: { orders: Order[]; locale: string }) {
  const isRTL = locale === 'ar';
  const total     = orders.reduce((s, o) => s + o.total, 0);
  const count     = orders.length;
  const avg       = count > 0 ? Math.round(total / count) : 0;
  const pending   = orders.filter(o => o.status === 'placed').length;

  const cards = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-emerald-500',
      bg:    'bg-emerald-500/10',
      label: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue',
      value: formatPrice(total),
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      color: 'text-primary',
      bg:    'bg-primary/10',
      label: isRTL ? 'عدد الطلبات' : 'Orders',
      value: count.toString(),
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-violet-500',
      bg:    'bg-violet-500/10',
      label: isRTL ? 'متوسط قيمة الطلب' : 'Avg. Order Value',
      value: formatPrice(avg),
    },
    {
      icon: <AlertCircle className="h-5 w-5" />,
      color: pending > 0 ? 'text-orange-500' : 'text-muted-foreground',
      bg:    pending > 0 ? 'bg-orange-500/10' : 'bg-muted/40',
      label: isRTL ? 'تحتاج متابعة' : 'Needs Action',
      value: pending.toString(),
      sub:   isRTL ? 'طلبات جديدة' : 'placed orders',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl border border-border/60 bg-card px-4 py-3 flex items-center gap-3">
          <div className={`rounded-lg p-2 shrink-0 ${c.bg}`}>
            <span className={c.color}>{c.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">{c.label}</p>
            <p className={`text-lg font-extrabold leading-tight ${c.color}`}>{c.value}</p>
            {c.sub && <p className="text-[10px] text-muted-foreground">{c.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Order detail panel ────────────────────────────────────────────────────────

function OrderPanel({
  order,
  locale,
  onClose,
  onStatusChange,
  updating,
}: {
  order: Order;
  locale: string;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  updating: string | null;
}) {
  const isRTL = locale === 'ar';
  const items       = Array.isArray(order.items) ? order.items as OrderItem[] : [];
  const subtotal    = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = order.delivery_price ?? 0;
  const isOffice    = order.delivery_type === 'office';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const time = new Date(order.created_at).toLocaleTimeString(
    locale === 'ar' ? 'ar-DZ' : 'en-GB',
    { hour: '2-digit', minute: '2-digit' },
  );
  const date = new Date(order.created_at).toLocaleDateString(
    locale === 'ar' ? 'ar-DZ' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} z-50 h-full w-full max-w-md bg-card border-${isRTL ? 'r' : 'l'} border-border/60 shadow-2xl flex flex-col overflow-hidden`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-primary">{order.order_number}</span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground'}`}>
              {isRTL ? (STATUS_LABELS_AR[order.status] ?? order.status) : order.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Date + status update */}
          <div className="px-5 py-4 border-b border-border/40 space-y-3">
            <p className="text-xs text-muted-foreground">{date} · {time}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">
                {locale === 'ar' ? 'تغيير الحالة:' : 'Update status:'}
              </span>
              <div className="relative flex-1">
                <select
                  value={order.status}
                  onChange={e => onStatusChange(order.id, e.target.value)}
                  disabled={updating === order.id}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="w-full h-8 text-xs rounded-lg border border-input bg-background px-3 pe-7 focus:outline-none focus:ring-1 focus:ring-ring/50 cursor-pointer disabled:opacity-50 appearance-none"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{isRTL ? (STATUS_LABELS_AR[s] ?? s) : s}</option>
                  ))}
                </select>
                <ChevronDown className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2' : 'right-2'} h-3.5 w-3.5 text-muted-foreground pointer-events-none`} />
              </div>
              {updating === order.id && (
                <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="px-5 py-4 border-b border-border/40 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {locale === 'ar' ? 'معلومات العميل' : 'Customer'}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium flex-1">{order.full_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span dir="ltr" className="font-mono flex-1">{order.phone}</span>
            </div>
            {/* Contact buttons */}
            <div className="flex gap-2 pt-1">
              <a
                href={`tel:${order.phone}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-input bg-background text-xs font-medium hover:bg-accent transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />
                {locale === 'ar' ? 'اتصال' : 'Call'}
              </a>
              <a
                href={toWhatsApp(order.phone)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-medium transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Payment method */}
          <div className="px-5 py-4 border-b border-border/40 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            </p>
            {order.payment_method === 'online' ? (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
                {locale === 'ar' ? 'دفع إلكتروني (Chargily)' : 'Online Payment (Chargily)'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <Banknote className="h-4 w-4" />
                {locale === 'ar' ? 'الدفع عند التسليم' : 'Cash on Delivery'}
              </span>
            )}
            {order.chargily_checkout_id && (
              <div className="mt-2 rounded-lg bg-muted/40 border border-border/40 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  {locale === 'ar' ? 'معرّف الدفع (Chargily)' : 'Chargily Payment ID'}
                </p>
                <p className="font-mono text-xs text-foreground break-all select-all">{order.chargily_checkout_id}</p>
              </div>
            )}
          </div>

          {/* Delivery */}
          <div className="px-5 py-4 border-b border-border/40 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {locale === 'ar' ? 'معلومات التوصيل' : 'Delivery'}
            </p>
            <div className="flex items-center gap-2 text-sm">
              {isOffice
                ? <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                : <Truck className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className="text-muted-foreground text-xs">
                {isOffice
                  ? (locale === 'ar' ? 'سحب من مكتب' : 'Office Pickup')
                  : (locale === 'ar' ? 'توصيل للمنزل' : 'Home Delivery')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {order.wilaya}
                {order.commune ? <span className="text-muted-foreground"> — {order.commune}</span> : null}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs">
                {locale === 'ar' ? 'رسوم التوصيل:' : 'Delivery fee:'}
              </span>
              <span className={`text-xs font-semibold ${deliveryFee === 0 ? 'text-emerald-500' : ''}`}>
                {deliveryFee === 0
                  ? (locale === 'ar' ? 'مجاني' : 'Free')
                  : formatPrice(deliveryFee)}
              </span>
            </div>
            {order.notes && (
              <div className="flex items-start gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-xs">{order.notes}</span>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="px-5 py-4 border-b border-border/40">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {locale === 'ar' ? `المنتجات (${items.length})` : `Products (${items.length})`}
            </p>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {locale === 'ar' ? 'لا توجد منتجات' : 'No products'}
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const name = locale === 'ar'
                    ? (item.product_name_ar || item.product_name_en)
                    : (item.product_name_en || item.product_name_ar);
                  return (
                    <div key={idx} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                      <div className="rounded-md bg-muted p-1.5 shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-bold shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing summary */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{locale === 'ar' ? 'التوصيل' : 'Delivery'}</span>
              <span className={deliveryFee === 0 ? 'text-emerald-500' : ''}>
                {deliveryFee === 0 ? (locale === 'ar' ? 'مجاني' : 'Free') : formatPrice(deliveryFee)}
              </span>
            </div>
            {subtotal + deliveryFee !== order.total && (
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                <span>{locale === 'ar' ? 'خصم' : 'Discount'}</span>
                <span>-{formatPrice(subtotal + deliveryFee - order.total)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border/40">
              <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateInput(d: Date) { return d.toISOString().slice(0, 10); }
function defaultFrom() { const d = new Date(); d.setDate(d.getDate() - 6); return toDateInput(d); }
function defaultTo()   { return toDateInput(new Date()); }

// ── Main component ────────────────────────────────────────────────────────────

export function AdminOrdersClient({ locale, orders: initialOrders }: { locale: string; orders: Order[] }) {
  const t = useTranslations('admin');
  const isRTL = locale === 'ar';

  const [orders, setOrders]             = useState(initialOrders);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [updating, setUpdating]         = useState<string | null>(null);
  const [newCount, setNewCount]         = useState(0);
  const [newIds, setNewIds]             = useState<Set<string>>(new Set());
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [openOrder, setOpenOrder]       = useState<Order | null>(null);
  const [bulkStatus, setBulkStatus]     = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [blockedIps, setBlockedIps]     = useState<BlockedIp[]>([]);
  const [showBlockedIps, setShowBlockedIps] = useState(false);
  const knownIds = useRef(new Set(initialOrders.map(o => o.id)));

  // On mount (client only): mark orders newer than last_seen as new so red rows
  // appear when navigating here after seeing the sidebar badge notification.
  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem('admin_orders_last_seen') ?? new Date(0).toISOString();
      const unseenIds = initialOrders
        .filter(o => o.created_at > lastSeen)
        .map(o => o.id);
      if (unseenIds.length > 0) {
        setNewIds(new Set(unseenIds));
        setNewCount(unseenIds.length);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load blocked IPs on mount
  useEffect(() => {
    getBlockedIps().then(setBlockedIps);
  }, []);

  // ── Date range ──
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo,   setDateTo]   = useState(defaultTo);
  const [fetching, setFetching] = useState(false);

  const fetchRange = useCallback(async (from: string, to: string) => {
    if (!from || !to || from > to) return;
    setFetching(true);
    try {
      const { createClient: createBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createBrowserClient();
      const { data, error } = await (supabase.from('orders') as any)
        .select('*')
        .neq('status', 'pending_payment')
        .gte('created_at', from + 'T00:00:00.000Z')
        .lte('created_at', to  + 'T23:59:59.999Z')
        .order('created_at', { ascending: false });
      if (error) { toast.error(error.message); return; }
      setOrders(data ?? []);
      knownIds.current = new Set((data ?? []).map((o: Order) => o.id));
      setSelected(new Set());
    } finally { setFetching(false); }
  }, []);

  const applyRange = (from: string, to: string) => {
    setDateFrom(from); setDateTo(to); fetchRange(from, to);
  };

  const QUICK_RANGES = [
    { label: locale === 'ar' ? 'اليوم'        : 'Today',       days: 0  },
    { label: locale === 'ar' ? 'آخر 7 أيام'   : 'Last 7 days', days: 6  },
    { label: locale === 'ar' ? 'آخر 30 يومًا' : 'Last 30 days',days: 29 },
  ];

  // ── Realtime ──
  const handleNewOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
    setNewCount(c => c + 1);
    setNewIds(prev => new Set([...prev, order.id]));
    playNotificationSound();
    toast.success(
      <div className="flex flex-col gap-0.5">
        <span className="font-bold">{locale === 'ar' ? 'طلب جديد!' : 'New Order!'}</span>
        <span className="text-xs opacity-80">{order.order_number} — {order.full_name} — {formatPrice(order.total)}</span>
      </div>,
      { duration: 6000, icon: '🛒' },
    );
  }, [locale]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const order = payload.new as Order;
        // Skip pending_payment inserts — only show after Chargily webhook confirms
        if (order.status === 'pending_payment') return;
        if (!knownIds.current.has(order.id)) {
          knownIds.current.add(order.id);
          handleNewOrder(order);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new as Order;
        const oldStatus = (payload.old as Partial<Order>).status;
        // Order was pending_payment (hidden) and just got confirmed → add it now
        if (oldStatus === 'pending_payment' && updated.status !== 'pending_payment') {
          if (!knownIds.current.has(updated.id)) {
            knownIds.current.add(updated.id);
            handleNewOrder(updated);
            return;
          }
        }
        // If still pending_payment after update, keep it hidden
        if (updated.status === 'pending_payment') return;
        setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
        setOpenOrder(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [handleNewOrder]);

  // ── Derived ──
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.order_number.toLowerCase().includes(q) ||
      o.full_name.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      o.wilaya.toLowerCase().includes(q);
    const matchStatus   = !statusFilter   || o.status === statusFilter;
    const matchDelivery = !deliveryFilter || (o.delivery_type ?? 'home') === deliveryFilter;
    const matchPayment  = !paymentFilter  || (o.payment_method ?? 'cod') === paymentFilter;
    return matchSearch && matchStatus && matchDelivery && matchPayment;
  });

  // Status counts for the whole loaded set (not filtered)
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  // Group by day
  const dayMap = filtered.reduce<Record<string, Order[]>>((acc, o) => {
    const day = o.created_at.slice(0, 10);
    (acc[day] ??= []).push(o);
    return acc;
  }, {});
  const sortedDays = Object.keys(dayMap).sort((a, b) => b.localeCompare(a));

  // Selection
  const allFilteredSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => { const n = new Set(prev); filtered.forEach(o => n.delete(o.id)); return n; });
    } else {
      setSelected(prev => new Set([...prev, ...filtered.map(o => o.id)]));
    }
  };
  const toggleOne = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Export
  const handleDownload = (mode: 'selected' | 'filtered' | 'all') => {
    const map = { selected: orders.filter(o => selected.has(o.id)), filtered, all: orders };
    const toExport = map[mode];
    if (!toExport.length) { toast.error('No orders to export'); return; }
    downloadCSV(toExport, `orders-${mode}-${toExport.length}.csv`);
    toast.success(`Exported ${toExport.length} orders`);
  };

  // Single status update (panel + table)
  const updateStatus = useCallback(async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const { error } = await updateOrderStatus(id, newStatus);
      if (error) { toast.error(error); return; }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      setOpenOrder(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
      toast.success(locale === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
    } finally { setUpdating(null); }
  }, [locale]);

  // Bulk status update
  const handleBulkUpdate = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkUpdating(true);
    const ids = [...selected];
    let errorCount = 0;
    await Promise.all(ids.map(async id => {
      const { error } = await updateOrderStatus(id, bulkStatus);
      if (error) errorCount++;
    }));
    if (errorCount > 0) {
      toast.error(`${errorCount} orders failed to update`);
    } else {
      setOrders(prev => prev.map(o => selected.has(o.id) ? { ...o, status: bulkStatus } : o));
      setSelected(new Set());
      setBulkStatus('');
      toast.success(
        locale === 'ar'
          ? `تم تحديث ${ids.length} طلب`
          : `Updated ${ids.length} orders`,
      );
    }
    setBulkUpdating(false);
  };

  return (
    <div className={`p-6 space-y-5 ${isRTL ? 'font-cairo' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold">{t('orders')}</h1>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {locale === 'ar' ? 'مباشر' : 'Live'}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {newCount > 0 && (
            <button
              onClick={() => {
                setNewCount(0);
                setNewIds(new Set());
                // Persist seen timestamp + sync sidebar badge
                try { localStorage.setItem('admin_orders_last_seen', new Date().toISOString()); } catch {}
                window.dispatchEvent(new Event('admin-orders-cleared'));
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse hover:animate-none hover:bg-red-600 transition-colors"
            >
              <Bell className="h-3.5 w-3.5" />
              {newCount} {locale === 'ar' ? 'طلب جديد' : newCount === 1 ? 'new order' : 'new orders'}
            </button>
          )}
          <button
            onClick={() => setShowBlockedIps(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              showBlockedIps
                ? 'bg-destructive text-destructive-foreground border-destructive'
                : 'bg-background text-muted-foreground border-input hover:text-foreground hover:border-foreground/40'
            }`}
          >
            <ShieldX className="h-3.5 w-3.5" />
            {locale === 'ar' ? `IPs المحظورة (${blockedIps.length})` : `Blocked IPs (${blockedIps.length})`}
          </button>
          <span className="text-sm text-muted-foreground">
            {filtered.length} {locale === 'ar' ? 'طلب' : 'orders'}
          </span>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <KpiCards orders={orders} locale={locale} />

      {/* ── Blocked IPs panel ── */}
      {showBlockedIps && (
        <div className="rounded-xl border border-destructive/40 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-2">
              <ShieldX className="h-4 w-4 text-destructive" />
              <span className="text-sm font-bold text-destructive">
                {locale === 'ar' ? 'عناوين IP المحظورة' : 'Blocked IP Addresses'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{blockedIps.length}</span>
          </div>
          {blockedIps.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground text-center">
              {locale === 'ar' ? 'لا توجد عناوين IP محظورة' : 'No blocked IP addresses'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {(isRTL
                      ? ['عنوان IP', 'السبب', 'بواسطة', 'التاريخ', 'إجراء']
                      : ['IP Address', 'Reason', 'Blocked By', 'Date', 'Action']
                    ).map(h => (
                      <th key={h} className={`px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blockedIps.map(entry => (
                    <tr key={entry.ip} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                      <td className="px-4 py-3 font-mono text-xs text-destructive font-semibold">{entry.ip}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{entry.reason ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{entry.blocked_by}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'en-GB')}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={async () => {
                            const { error } = await unblockIp(entry.ip);
                            if (error) { toast.error(error); return; }
                            setBlockedIps(prev => prev.filter(b => b.ip !== entry.ip));
                            toast.success(locale === 'ar' ? 'تم رفع الحظر' : 'IP unblocked');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-emerald-600 border border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {locale === 'ar' ? 'رفع الحظر' : 'Unblock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Status pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors ${
            !statusFilter
              ? 'bg-foreground text-background border-foreground'
              : 'bg-background border-input text-muted-foreground hover:text-foreground hover:border-foreground/40'
          }`}
        >
          {locale === 'ar' ? 'الكل' : 'All'} · {orders.length}
        </button>
        {STATUSES.map(s => {
          const count = statusCounts[s] ?? 0;
          if (count === 0) return null;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? '' : s)}
              className={`h-7 px-3 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? STATUS_COLORS[s] + ' border-current'
                  : 'bg-background border-input text-muted-foreground hover:text-foreground hover:border-foreground/40'
              }`}
            >
              {isRTL ? (STATUS_LABELS_AR[s] ?? s) : s} · {count}
            </button>
          );
        })}
      </div>

      {/* ── Filters + export ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'ابحث بالاسم، الهاتف، الولاية، رقم الطلب...' : 'Search by name, phone, wilaya, order #...'}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`w-full h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
          />
        </div>

        {/* Delivery type toggle */}
        <div className="flex h-9 rounded-lg border border-input bg-background overflow-hidden text-xs font-medium">
          {[
            { value: '',       label: isRTL ? 'الكل'   : 'All'    },
            { value: 'home',   label: isRTL ? 'منزل'   : 'Home'   },
            { value: 'office', label: isRTL ? 'مكتب'   : 'Office' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setDeliveryFilter(opt.value)}
              className={`px-3 transition-colors ${
                deliveryFilter === opt.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Payment method toggle */}
        <div className="flex h-9 rounded-lg border border-input bg-background overflow-hidden text-xs font-medium">
          {[
            { value: '',       label: isRTL ? 'الكل'       : 'All',    icon: null },
            { value: 'cod',    label: isRTL ? 'عند التسليم' : 'COD',   icon: <Banknote className="h-3 w-3" /> },
            { value: 'online', label: isRTL ? 'أونلاين'    : 'Online', icon: <CreditCard className="h-3 w-3" /> },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setPaymentFilter(opt.value)}
              className={`flex items-center gap-1 px-3 transition-colors ${
                paymentFilter === opt.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {QUICK_RANGES.map(({ label, days }) => {
            const qTo   = toDateInput(new Date());
            const qFrom = toDateInput(new Date(Date.now() - days * 86400000));
            const active = dateFrom === qFrom && dateTo === qTo;
            return (
              <button
                key={label}
                onClick={() => applyRange(qFrom, qTo)}
                disabled={fetching}
                className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                {label}
              </button>
            );
          })}

          <div className="flex items-center gap-1.5 border border-input rounded-lg bg-background px-2 h-9">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={e => setDateFrom(e.target.value)}
              className="h-full bg-transparent text-xs focus:outline-none text-foreground"
            />
            <span className="text-muted-foreground text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={e => setDateTo(e.target.value)}
              className="h-full bg-transparent text-xs focus:outline-none text-foreground"
            />
          </div>

          <Button
            size="sm"
            onClick={() => fetchRange(dateFrom, dateTo)}
            disabled={fetching || !dateFrom || !dateTo || dateFrom > dateTo}
            className="h-9 gap-1.5"
          >
            {fetching
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Calendar className="h-3.5 w-3.5" />}
            {locale === 'ar' ? 'تطبيق' : 'Apply'}
          </Button>
        </div>

        {/* Export */}
        <div className="flex items-center gap-1.5">
          {someSelected && (
            <Button size="sm" onClick={() => handleDownload('selected')} className="gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="h-3.5 w-3.5" />
              {locale === 'ar' ? `المحدد (${selected.size})` : `Selected (${selected.size})`}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handleDownload('filtered')} className="gap-1.5 h-9">
            <FileDown className="h-3.5 w-3.5" />
            {locale === 'ar' ? `النتائج (${filtered.length})` : `Filtered (${filtered.length})`}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDownload('all')} className="gap-1.5 h-9 text-muted-foreground">
            <Download className="h-3.5 w-3.5" />
            {locale === 'ar' ? 'الكل' : 'All'}
          </Button>
        </div>
      </div>

      {/* ── Selection / bulk action bar ── */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 flex-wrap">
          <span className="text-sm font-medium text-primary shrink-0">
            {selected.size} {locale === 'ar' ? 'طلب محدد' : selected.size === 1 ? 'order selected' : 'orders selected'}
          </span>

          {/* Bulk status */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="relative flex-1">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full h-8 text-xs rounded-lg border border-input bg-background px-3 pe-7 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="">{locale === 'ar' ? 'تغيير الحالة إلى...' : 'Change status to…'}</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{isRTL ? (STATUS_LABELS_AR[s] ?? s) : s}</option>
                ))}
              </select>
              <ChevronDown className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2' : 'right-2'} h-3.5 w-3.5 text-muted-foreground pointer-events-none`} />
            </div>
            <Button
              size="sm"
              onClick={handleBulkUpdate}
              disabled={!bulkStatus || bulkUpdating}
              className="h-8 gap-1.5 shrink-0"
            >
              {bulkUpdating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCheck className="h-3.5 w-3.5" />}
              {locale === 'ar' ? 'تطبيق' : 'Apply'}
            </Button>
          </div>

          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground underline shrink-0 ms-auto"
          >
            {locale === 'ar' ? 'إلغاء التحديد' : 'Clear'}
          </button>
        </div>
      )}

      {/* ── Orders grouped by day ── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card py-12 text-center text-muted-foreground">
          {locale === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map(day => {
            const dayOrders      = dayMap[day];
            const dayTotal       = dayOrders.reduce((s, o) => s + o.total, 0);
            const allDaySelected = dayOrders.every(o => selected.has(o.id));

            return (
              <div key={day}>
                {/* Day header */}
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => {
                      if (allDaySelected) {
                        setSelected(prev => { const n = new Set(prev); dayOrders.forEach(o => n.delete(o.id)); return n; });
                      } else {
                        setSelected(prev => new Set([...prev, ...dayOrders.map(o => o.id)]));
                      }
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title={allDaySelected ? 'Deselect day' : 'Select day'}
                  >
                    {allDaySelected
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4" />}
                  </button>
                  <span className="text-sm font-bold text-foreground">{getDayLabel(day, locale)}</span>
                  <span className="text-xs text-muted-foreground">
                    {dayOrders.length} {locale === 'ar' ? 'طلب' : dayOrders.length === 1 ? 'order' : 'orders'}
                    {' · '}{formatPrice(dayTotal)}
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <table className="w-full text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="w-10 px-3 py-2.5">
                          <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-colors">
                            {allFilteredSelected
                              ? <CheckSquare className="h-4 w-4 text-primary" />
                              : <Square className="h-4 w-4" />}
                          </button>
                        </th>
                        {(isRTL
                          ? ['رقم الطلب', 'العميل', 'الهاتف', 'الولاية', 'التوصيل', 'الدفع', 'المجموع', 'الحالة', 'الوقت', 'فاتورة', 'الحماية']
                          : ['Order #', 'Customer', 'Phone', 'Wilaya', 'Delivery', 'Payment', 'Total', 'Status', 'Time', 'Invoice', 'Guard']
                        ).map(h => (
                          <th key={h} className={`px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dayOrders.map(order => {
                        const isSelected = selected.has(order.id);
                        const isNew      = newIds.has(order.id);
                        const isOpen     = openOrder?.id === order.id;
                        const isOffice   = order.delivery_type === 'office';
                        const isPlaced   = order.status === 'placed';

                        return (
                          <tr
                            key={order.id}
                            onClick={() => setOpenOrder(order)}
                            className={`border-b border-border/30 last:border-0 cursor-pointer transition-colors ${
                              isOpen     ? 'bg-primary/8 '      + (isRTL ? 'border-r-2 border-r-primary'   : 'border-l-2 border-l-primary') :
                              isSelected ? 'bg-primary/5 '      + (isRTL ? 'border-r-2 border-r-primary'   : 'border-l-2 border-l-primary') :
                              isNew      ? 'bg-red-500/8 '      + (isRTL ? 'border-r-2 border-r-red-500'   : 'border-l-2 border-l-red-500') :
                              isPlaced   ? 'bg-orange-500/8 hover:bg-orange-500/12 ' + (isRTL ? 'border-r-2 border-r-orange-400' : 'border-l-2 border-l-orange-400') :
                              'hover:bg-muted/20'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="w-10 px-3 py-3" onClick={e => e.stopPropagation()}>
                              <button onClick={() => toggleOne(order.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                                {isSelected
                                  ? <CheckSquare className="h-4 w-4 text-primary" />
                                  : <Square className="h-4 w-4" />}
                              </button>
                            </td>

                            {/* Order # */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isNew && (
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                  </span>
                                )}
                                <span className="font-mono font-semibold text-xs text-primary">{order.order_number}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3 font-medium">{order.full_name}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs" dir="ltr">{order.phone}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{order.wilaya}</td>

                            {/* Delivery type */}
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                isOffice
                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {isOffice
                                  ? <><Building2 className="h-3 w-3" />{locale === 'ar' ? 'مكتب' : 'Office'}</>
                                  : <><Truck className="h-3 w-3" />{locale === 'ar' ? 'منزل' : 'Home'}</>}
                              </span>
                            </td>

                            {/* Payment method */}
                            <td className="px-4 py-3">
                              {order.payment_method === 'online' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                  <CreditCard className="h-3 w-3" />
                                  {locale === 'ar' ? 'أونلاين' : 'Online'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                  <Banknote className="h-3 w-3" />
                                  {locale === 'ar' ? 'عند التسليم' : 'COD'}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                                {isRTL ? (STATUS_LABELS_AR[order.status] ?? order.status) : order.status}
                              </span>
                            </td>

                            {/* Time */}
                            <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                              {new Date(order.created_at).toLocaleTimeString(
                                locale === 'ar' ? 'ar-DZ' : 'en-GB',
                                { hour: '2-digit', minute: '2-digit' },
                              )}
                            </td>

                            {/* Invoice */}
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <DownloadInvoiceButton
                                orderId={order.id}
                                locale={locale}
                                variant="ghost"
                                size="sm"
                                iconOnly
                              />
                            </td>

                            {/* Guard — blocked / clean */}
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              {order.ip_address && order.ip_address !== 'unknown' ? (
                                blockedIps.some(b => b.ip === order.ip_address) ? (
                                  <button
                                    onClick={async () => {
                                      const ip = order.ip_address!;
                                      const { error } = await unblockIp(ip);
                                      if (error) { toast.error(error); return; }
                                      setBlockedIps(prev => prev.filter(b => b.ip !== ip));
                                      toast.success(locale === 'ar' ? 'تم رفع الحظر' : 'IP unblocked');
                                    }}
                                    title={locale === 'ar' ? 'رفع الحظر' : 'Unblock IP'}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  >
                                    <ShieldX className="h-3 w-3" />
                                    {locale === 'ar' ? 'محظور' : 'Blocked'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      const ip = order.ip_address!;
                                      const { error } = await blockIp(ip, 'Manual block by admin');
                                      if (error) { toast.error(error); return; }
                                      setBlockedIps(prev => prev.some(b => b.ip === ip) ? prev : [{ ip, reason: 'Manual block by admin', blocked_by: 'admin', created_at: new Date().toISOString() }, ...prev]);
                                      toast.success(locale === 'ar' ? 'تم الحظر' : 'IP blocked');
                                    }}
                                    title={locale === 'ar' ? 'حظر عنوان IP' : 'Block IP'}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                  >
                                    <ShieldCheck className="h-3 w-3" />
                                    {locale === 'ar' ? 'سليم' : 'Clean'}
                                  </button>
                                )
                              ) : (
                                <span className="text-[11px] text-muted-foreground/30">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Order detail panel ── */}
      {openOrder && (
        <OrderPanel
          order={openOrder}
          locale={locale}
          onClose={() => setOpenOrder(null)}
          onStatusChange={updateStatus}
          updating={updating}
        />
      )}
    </div>
  );
}
