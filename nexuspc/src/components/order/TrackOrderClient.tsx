'use client';

import { useState } from 'react';
import {
  Search, Package, CheckCircle2, XCircle, Phone, Star,
  ChevronDown, ChevronUp, Clock, Truck, RotateCcw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { DownloadInvoiceButton } from '@/components/order/DownloadInvoiceButton';
import { InlineReviewForm } from '@/components/product/ReviewsSection';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method?: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  phone: string;
  full_name: string;
  wilaya: string;
  commune: string;
  notes: string | null;
  items: any[];
  created_at: string;
}

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'] as const;
const STEP_NUM: Record<string, number> = {
  placed: 1, confirmed: 2, processing: 3, shipped: 4, delivered: 5, cancelled: 0,
};

function statusBadgeClass(status: string) {
  if (status === 'delivered')  return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800';
  if (status === 'cancelled')  return 'bg-destructive/10 text-destructive border border-destructive/30';
  if (status === 'shipped')    return 'bg-primary/10 text-primary border border-primary/30';
  return 'bg-amber-950/40 text-amber-400 border border-amber-800';
}

function statusIcon(status: string) {
  if (status === 'delivered')  return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'cancelled')  return <XCircle className="h-4 w-4" />;
  if (status === 'shipped')    return <Truck className="h-4 w-4" />;
  if (status === 'processing') return <RotateCcw className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

/* ── Shared order detail panel ─────────────────────────────── */
function OrderDetail({ order, locale, isRTL, t, reviewedProductIds = [] }: {
  order: Order; locale: string; isRTL: boolean; t: any; reviewedProductIds?: string[];
}) {
  const [reviewingItem, setReviewingItem] = useState<string | null>(null);
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set(reviewedProductIds));
  const currentStep = STEP_NUM[order.status] ?? 0;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Status card */}
      <div className="border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={isRTL ? 'text-right' : ''}>
            <p className="text-xs text-muted-foreground">{t('orderId')}</p>
            <p className="font-black text-xl font-mono">{order.order_number}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.created_at).toLocaleDateString(isRTL ? 'ar-DZ' : 'en-DZ')}
            </p>
          </div>
          <Badge className={`capitalize text-xs px-3 py-1.5 font-bold uppercase tracking-wider ${statusBadgeClass(order.status)}`}>
            {t(order.status as any)}
          </Badge>
        </div>

        {/* Progress stepper */}
        {order.status !== 'cancelled' && (
          <div className="relative flex items-start justify-between">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border/60" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
              style={{ width: `calc(${((currentStep - 1) / (STATUS_STEPS.length - 1)) * 100}% - 8px)` }}
            />
            {STATUS_STEPS.map((step, i) => {
              const done = currentStep >= i + 1;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                  <div className={`w-8 h-8 border-2 flex items-center justify-center transition-all duration-300 ${
                    done ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border/60 text-muted-foreground/40'
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <span className="text-[9px] text-center text-muted-foreground leading-tight max-w-[50px]">
                    {t(step as any)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {order.status === 'cancelled' && (
          <div className="flex items-center gap-2 text-destructive text-sm mt-2">
            <XCircle className="h-5 w-5" />
            <span>{locale === 'ar' ? 'تم إلغاء هذا الطلب' : 'This order has been cancelled'}</span>
          </div>
        )}
      </div>

      {/* Items */}
      {order.items?.length > 0 && (
        <div className="border border-border bg-card p-5">
          <h3 className={`font-semibold text-sm uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : ''}`}>
            {locale === 'ar' ? 'المنتجات' : 'Items'}
          </h3>
          <div className="space-y-3">
            {order.items.map((item: any, i: number) => {
              const itemName = isRTL
                ? (item.product_name_ar ?? item.product_snapshot?.name_ar ?? '')
                : (item.product_name_en ?? item.product_snapshot?.name_en ?? '');
              const itemPrice = item.price ?? item.unit_price ?? 0;
              return (
                <div key={i} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 bg-muted/30 border border-border/40 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.product_snapshot?.image
                      ? <img src={item.product_snapshot.image} alt="" className="w-full h-full object-contain p-1" />
                      : <Package className="h-5 w-5 text-muted-foreground/30" />}
                  </div>
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium line-clamp-1">
                      {itemName || (locale === 'ar' ? 'منتج' : 'Product')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'ar' ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                      {' · '}{formatPrice(itemPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery info */}
      <div className="border border-border bg-card p-5">
        <h3 className={`font-semibold text-sm uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : ''}`}>{t('deliveryInfo')}</h3>
        <div className={`grid grid-cols-2 gap-4 text-sm ${isRTL ? 'text-right' : ''}`}>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</p>
            <p className="font-medium">{order.full_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t('phone')}</p>
            <p className="font-medium flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{order.phone}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{locale === 'ar' ? 'الولاية' : 'Wilaya'}</p>
            <p className="font-medium">{order.wilaya}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{locale === 'ar' ? 'البلدية' : 'Commune'}</p>
            <p className="font-medium">{order.commune}</p>
          </div>
        </div>
        {order.notes && (
          <div className={`mt-3 pt-3 border-t border-border/40 ${isRTL ? 'text-right' : ''}`}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Total + download */}
      <div className="border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wider text-sm">{t('orderTotal')}</span>
          <span className="text-xl font-extrabold text-primary">{formatPrice(order.total)}</span>
        </div>
        {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) && (
          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <DownloadInvoiceButton orderId={order.id} locale={locale} variant="outline" size="sm" />
          </div>
        )}
      </div>

      {/* Review products when delivered */}
      {order.status === 'delivered' && order.items?.length > 0 && (
        <div className="border border-primary/20 bg-card p-5">
          <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Star className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">
              {locale === 'ar' ? 'قيّم منتجاتك' : 'Rate Your Products'}
            </h3>
          </div>
          <div className="space-y-3">
            {order.items.map((item: any, i: number) => {
              const name = isRTL
                    ? (item.product_name_ar ?? item.product_snapshot?.name_ar ?? '')
                    : (item.product_name_en ?? item.product_snapshot?.name_en ?? '');
              const productId = item.product_id;
              if (!productId) return null;
              const isDone = reviewedItems.has(productId);
              return (
                <div key={i} className="border border-border/40 p-3">
                  <div className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <p className="text-sm font-medium line-clamp-1 flex-1">{name}</p>
                    {!isDone && reviewingItem !== productId && (
                      <button
                        onClick={() => setReviewingItem(productId)}
                        className="shrink-0 flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 hover:bg-primary/10 transition-colors"
                      >
                        <Star className="h-3 w-3" />
                        {locale === 'ar' ? 'اكتب تقييم' : 'Write Review'}
                      </button>
                    )}
                    {isDone && (
                      <span className="text-xs text-emerald-500 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {locale === 'ar' ? 'تم التقييم' : 'Reviewed'}
                      </span>
                    )}
                  </div>
                  {reviewingItem === productId && (
                    <InlineReviewForm
                      productId={productId}
                      productName={name}
                      locale={locale}
                      onDone={() => {
                        setReviewingItem(null);
                        setReviewedItems((prev) => new Set([...prev, productId]));
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Logged-in: orders list card ───────────────────────────── */
function OrderCard({ order, locale, isRTL, t, reviewedProductIds = [] }: {
  order: Order; locale: string; isRTL: boolean; t: any; reviewedProductIds?: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-4 p-4 hover:bg-accent/20 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-4 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-1.5 ${statusBadgeClass(order.status)} px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shrink-0`}>
            {statusIcon(order.status)}
            {t(order.status as any)}
          </div>
          <div className={`min-w-0 ${isRTL ? 'text-right' : ''}`}>
            <p className="font-black font-mono text-sm">{order.order_number}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString(isRTL ? 'ar-DZ' : 'en-DZ')}
              {' · '}{order.items?.length ?? 0} {locale === 'ar' ? 'منتج' : 'item(s)'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-3 shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="font-extrabold text-primary text-sm">{formatPrice(order.total)}</span>
          {open
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-border p-4">
          <OrderDetail order={order} locale={locale} isRTL={isRTL} t={t} reviewedProductIds={reviewedProductIds} />
        </div>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */
export function TrackOrderClient({
  locale,
  userOrders,
  reviewedProductIds = [],
}: {
  locale: string;
  userOrders: Order[] | null;
  reviewedProductIds?: string[];
}) {
  const t = useTranslations('order');
  const isRTL = locale === 'ar';

  // ── Guest: search by order number + phone ──
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setError(locale === 'ar' ? 'الخدمة غير متاحة' : 'Service unavailable');
        return;
      }
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderId.trim().toUpperCase())
        .eq('phone', phone.trim())
        .single();
      if (err || !data) {
        setError(locale === 'ar'
          ? 'لم يتم العثور على الطلب. تحقق من الرقم والهاتف.'
          : 'Order not found. Please check the order number and phone.');
        return;
      }
      setOrder(data as Order);
    } catch {
      setError(locale === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── LOGGED-IN VIEW ──────────────────────────────────────────
  if (userOrders !== null) {
    return (
      <div className={`min-h-screen bg-background py-12 ${isRTL ? 'font-cairo' : ''}`}>
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className={`mb-10 ${isRTL ? 'text-right' : ''}`}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-2">
              {locale === 'ar' ? 'حسابي' : 'My Account'}
            </p>
            <h1 className="font-black text-3xl uppercase mb-2">
              {locale === 'ar' ? 'طلباتي' : 'My Orders'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {locale === 'ar'
                ? `${userOrders.length} طلب إجمالي`
                : `${userOrders.length} order${userOrders.length !== 1 ? 's' : ''} total`}
            </p>
          </div>

          {userOrders.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="font-semibold mb-1">{locale === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'ستظهر طلباتك هنا بعد إتمام أول عملية شراء' : 'Your orders will appear here after your first purchase'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userOrders.map((o) => (
                <OrderCard key={o.id} order={o} locale={locale} isRTL={isRTL} t={t} reviewedProductIds={reviewedProductIds} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── GUEST VIEW ──────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-background py-12 ${isRTL ? 'font-cairo' : ''}`}>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 border border-primary/30 bg-primary/5 flex items-center justify-center mx-auto mb-6">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="font-black text-3xl uppercase mb-2">{t('trackTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('trackSubtitle')}</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="border border-border bg-card p-6 space-y-4">
          <div className="space-y-1.5">
            <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('orderId')}</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder={t('orderIdPlaceholder')}
              className="w-full h-10 px-3 rounded-none border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full h-10 px-3 rounded-none border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              dir="ltr"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full gap-2 rounded-none" disabled={loading}>
            {loading
              ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Search className="h-4 w-4" />}
            {locale === 'ar' ? 'تتبع الطلب' : 'Track Order'}
          </Button>
        </form>

        {order && (
          <div className="mt-6">
            <OrderDetail order={order} locale={locale} isRTL={isRTL} t={t} />
          </div>
        )}
      </div>
    </div>
  );
}
