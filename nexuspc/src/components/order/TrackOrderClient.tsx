'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, XCircle, Clock, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { DownloadInvoiceButton } from '@/components/order/DownloadInvoiceButton';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method?: string;
  total: number;
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

export function TrackOrderClient({ locale }: { locale: string }) {
  const t = useTranslations('order');
  const isRTL = locale === 'ar';

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
        setError(locale === 'ar' ? 'الخدمة غير متاحة حالياً' : 'Service unavailable');
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
        setError(
          locale === 'ar'
            ? 'لم يتم العثور على الطلب. تحقق من الرقم والهاتف.'
            : 'Order not found. Please check the order number and phone.',
        );
        return;
      }
      setOrder(data as Order);
    } catch {
      setError(locale === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? (STEP_NUM[order.status] ?? 0) : 0;

  return (
    <div className={`min-h-screen bg-background py-12 ${isRTL ? 'font-cairo' : ''}`}>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold mb-2">{t('trackTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('trackSubtitle')}</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <div className="space-y-1.5">
            <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('orderId')}</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder={t('orderIdPlaceholder')}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              dir="ltr"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {locale === 'ar' ? 'تتبع الطلب' : 'Track Order'}
          </Button>
        </form>

        {/* Result */}
        {order && (
          <div className="mt-6 space-y-4 animate-fade-in-up">
            {/* Status card */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-xs text-muted-foreground">{t('orderId')}</p>
                  <p className="font-bold text-lg font-mono">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'en-DZ')}
                  </p>
                </div>
                <Badge
                  className={`capitalize text-xs px-3 py-1.5 rounded-full font-semibold ${
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                    order.status === 'shipped'   ? 'bg-primary/10 text-primary' :
                    'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                  }`}
                >
                  {t(order.status as any)}
                </Badge>
              </div>

              {/* Progress stepper */}
              {order.status !== 'cancelled' && (
                <div className="relative flex items-start justify-between">
                  {/* Connector line */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-border/60" />
                  <div
                    className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
                    style={{ width: `calc(${((currentStep - 1) / (STATUS_STEPS.length - 1)) * 100}% - 8px)` }}
                  />

                  {STATUS_STEPS.map((step, i) => {
                    const stepNum = i + 1;
                    const done = currentStep >= stepNum;
                    return (
                      <div key={step} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          done
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-card border-border/60 text-muted-foreground/40'
                        }`}>
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{stepNum}</span>}
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

            {/* Delivery info */}
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h3 className={`font-semibold text-sm mb-4 ${isRTL ? 'text-right' : ''}`}>{t('deliveryInfo')}</h3>
              <div className={`grid grid-cols-2 gap-4 text-sm ${isRTL ? 'text-right' : ''}`}>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</p>
                  <p className="font-medium">{order.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">{t('phone')}</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {order.phone}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">{locale === 'ar' ? 'الولاية' : 'Wilaya'}</p>
                  <p className="font-medium">{order.wilaya}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">{locale === 'ar' ? 'البلدية' : 'Commune'}</p>
                  <p className="font-medium">{order.commune}</p>
                </div>
              </div>
              {order.notes && (
                <div className={`mt-3 pt-3 border-t border-border/40 ${isRTL ? 'text-right' : ''}`}>
                  <p className="text-muted-foreground text-xs mb-1">{locale === 'ar' ? 'ملاحظات التوصيل' : 'Delivery Notes'}</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Total + download */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t('orderTotal')}</span>
                <span className="text-xl font-extrabold text-primary">{formatPrice(order.total)}</span>
              </div>
              {/* Show download only for confirmed/paid orders */}
              {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                  <DownloadInvoiceButton
                    orderId={order.id}
                    locale={locale}
                    variant="outline"
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
