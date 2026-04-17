'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Truck, Building2, ChevronRight, Tag, X, Loader2, CreditCard, Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { wilayas } from '@/config/wilayas';
import { createClient } from '@/lib/supabase/client';
import { validatePromoCode, incrementPromoUsage } from '@/app/actions/promo';
import type { DeliveryOffice } from '@/app/actions/delivery';

interface FormData {
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  notes: string;
}

interface AppliedPromo {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discount: number;
}

interface Props {
  locale: string;
  /** key = numeric wilaya code (1–58), value = home delivery price in DZD */
  wilayaPrices: Record<number, number>;
  offices: DeliveryOffice[];
  onlinePaymentEnabled?: boolean;
}

export function CheckoutClient({ locale, wilayaPrices, offices, onlinePaymentEnabled = true }: Props) {
  const t = useTranslations('checkout');
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const isRTL = locale === 'ar';

  // ── Form ──
  const [form, setForm] = useState<FormData>({
    fullName: '', phone: '', wilaya: '', commune: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData | 'office', string>>>({});

  // ── Payment method ──
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  // If online payment gets disabled server-side, force back to COD
  const effectivePayment = onlinePaymentEnabled ? paymentMethod : 'cod';

  // ── Delivery type ──
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const selectedOffice = offices.find((o) => o.id === selectedOfficeId) ?? null;

  // ── Commune state — loaded per wilaya ──
  const [wilayaCode, setWilayaCode] = useState('');
  const [communes, setCommunes] = useState<string[]>([]);
  const [communesLoading, setCommunesLoading] = useState(false);

  const numericWilayaCode = wilayaCode ? parseInt(wilayaCode, 10) : null;

  // Home delivery fee — per wilaya
  const homeDeliveryFee = numericWilayaCode
    ? (wilayaPrices[numericWilayaCode] ?? 0)
    : 0;

  // Office delivery fee — selected office's price for the chosen wilaya
  const officeDeliveryFee =
    selectedOffice && numericWilayaCode
      ? (selectedOffice.prices[numericWilayaCode] ?? 0)
      : 0;

  const deliveryFee = deliveryType === 'home' ? homeDeliveryFee : officeDeliveryFee;

  // ── Promo ──
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  const promoDiscount = appliedPromo?.discount ?? 0;
  const finalPrice = Math.max(0, totalPrice - promoDiscount) + deliveryFee;

  // ── Helpers ──
  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, phone: digits }));
    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handleWilayaChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setWilayaCode(code);
    const found = wilayas.find((w) => w.code === code);
    setForm((prev) => ({
      ...prev,
      wilaya: found ? (locale === 'ar' ? found.name_ar : found.name_en) : '',
      commune: '',
    }));
    setFieldErrors((prev) => ({ ...prev, wilaya: undefined, commune: undefined }));
    setCommunes([]);
    if (!code) return;
    setCommunesLoading(true);
    try {
      const res = await fetch(`/api/communes?wilaya=${parseInt(code, 10)}`);
      if (res.ok) setCommunes(await res.json());
    } catch { /* fall back to text input */ }
    finally { setCommunesLoading(false); }
  }, [locale]);

  const handleDeliveryTypeChange = (type: 'home' | 'office') => {
    setDeliveryType(type);
    setSelectedOfficeId('');
    setFieldErrors({});
  };

  // ── Validation ──
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData | 'office', string>> = {};

    if (!/^[\p{L}\s]{3,}$/u.test(form.fullName.trim()))
      errs.fullName = locale === 'ar'
        ? 'أدخل الاسم الكامل (3 أحرف على الأقل، بدون أرقام)'
        : 'Enter your full name (at least 3 letters, no numbers)';

    if (!/^0[5-7]\d{8}$/.test(form.phone))
      errs.phone = locale === 'ar'
        ? 'أدخل رقم هاتف صحيح (05/06/07 + 8 أرقام)'
        : 'Enter a valid Algerian phone number (05/06/07 + 8 digits)';

    if (deliveryType === 'home') {
      if (!form.wilaya)
        errs.wilaya = locale === 'ar' ? 'اختر الولاية' : 'Select a wilaya';
      if (!form.commune.trim())
        errs.commune = locale === 'ar' ? 'أدخل البلدية' : 'Enter your commune';
    } else {
      if (!selectedOfficeId)
        errs.office = locale === 'ar' ? 'اختر مكتب التوصيل' : 'Select a delivery office';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Promo ──
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    const result = await validatePromoCode(promoInput, totalPrice);
    setPromoLoading(false);
    if (result.error) { setPromoError(result.error); return; }
    setAppliedPromo(result.promo!);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!validate()) return;
    setLoading(true);
    setError('');

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const fakeOrder = 'NPC-' + String(Math.floor(Math.random() * 90000) + 10000);
        clearCart();
        router.push(`/${locale}/checkout/success?order=${fakeOrder}&phone=${form.phone}`);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const orderNumber = 'NPC-' + String(Date.now()).slice(-6);

      // For office delivery, wilaya comes from the wilaya selector (same field),
      // commune is replaced by the office name.
      const deliveryWilaya = form.wilaya;
      const deliveryCommune = deliveryType === 'office' && selectedOffice
        ? selectedOffice.name
        : form.commune;

      const { data: insertedOrder, error: insertError } = await (supabase.from('orders') as any).insert({
        order_number: orderNumber,
        user_id: user?.id ?? null,
        full_name: form.fullName,
        phone: form.phone,
        wilaya: deliveryWilaya,
        commune: deliveryCommune,
        notes: form.notes || null,
        status: effectivePayment === 'online' ? 'pending_payment' : 'placed',
        total: finalPrice,
        delivery_type: deliveryType,
        delivery_price: deliveryFee,
        office_id: deliveryType === 'office' ? selectedOfficeId : null,
        items: items.map((i) => ({
          product_id: i.product.id,
          product_name_en: i.product.name_en,
          product_name_ar: i.product.name_ar,
          quantity: i.quantity,
          price: i.product.price,
        })),
        payment_method: effectivePayment,
      }).select('id').single();

      if (insertError) {
        setError(locale === 'ar' ? 'فشل تسجيل الطلب. حاول مرة أخرى.' : 'Failed to place order. Please try again.');
        return;
      }

      if (appliedPromo) await incrementPromoUsage(appliedPromo.id);

      // Online payment — redirect to Chargily
      if (effectivePayment === 'online' && insertedOrder?.id) {
        const res = await fetch('/api/chargily/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: insertedOrder.id, locale }),
        });
        const json = await res.json();
        if (json.checkout_url) {
          clearCart();
          window.location.href = json.checkout_url;
          return;
        }
        setError(json.error ?? (locale === 'ar' ? 'فشل تحميل بوابة الدفع' : 'Failed to load payment gateway'));
        return;
      }

      clearCart();
      router.push(`/${locale}/checkout/success?order=${orderNumber}&phone=${form.phone}`);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${isRTL ? 'font-cairo' : ''}`}>
        <div className="text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h2 className="text-xl font-bold">{locale === 'ar' ? 'السلة فارغة' : 'Your cart is empty'}</h2>
          <Link href={`/${locale}/store`} className="text-primary hover:underline text-sm">
            {locale === 'ar' ? 'تسوق الآن' : 'Start Shopping'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background py-8 ${isRTL ? 'font-cairo' : ''}`}>
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href={`/${locale}`} className="hover:text-foreground">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/${locale}/store`} className="hover:text-foreground">{locale === 'ar' ? 'المتجر' : 'Store'}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{t('title')}</span>
        </div>

        <h1 className={`text-2xl font-extrabold mb-8 ${isRTL ? 'text-right' : ''}`}>{t('title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">

            {/* ── Delivery type selector ── */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <h2 className={`font-semibold text-sm uppercase tracking-widest text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                {locale === 'ar' ? 'طريقة التوصيل' : 'Delivery Method'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {/* Home delivery */}
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeChange('home')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center ${
                    deliveryType === 'home'
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <Truck className={`h-6 w-6 ${deliveryType === 'home' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-semibold ${deliveryType === 'home' ? 'text-primary' : ''}`}>
                    {locale === 'ar' ? 'توصيل للمنزل' : 'Home Delivery'}
                  </span>
                  <span className={`text-xs font-bold ${deliveryType === 'home' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {!wilayaCode
                      ? (locale === 'ar' ? 'حسب الولاية' : 'By wilaya')
                      : homeDeliveryFee === 0
                        ? (locale === 'ar' ? 'مجاني' : 'Free')
                        : formatPrice(homeDeliveryFee)}
                  </span>
                </button>

                {/* Office pickup */}
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeChange('office')}
                  disabled={offices.length === 0}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed ${
                    deliveryType === 'office'
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <Building2 className={`h-6 w-6 ${deliveryType === 'office' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-semibold ${deliveryType === 'office' ? 'text-primary' : ''}`}>
                    {locale === 'ar' ? 'سحب من مكتب' : 'Office Pickup'}
                  </span>
                  <span className={`text-xs font-bold ${deliveryType === 'office' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {offices.length === 0
                      ? (locale === 'ar' ? 'غير متاح' : 'Unavailable')
                      : (locale === 'ar' ? 'يختلف حسب الولاية' : 'Varies by wilaya')}
                  </span>
                </button>
              </div>
            </div>

            {/* ── Contact info ── */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <h2 className={`font-semibold text-sm uppercase tracking-widest text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                {locale === 'ar' ? 'معلومات التواصل' : 'Contact Info'}
              </h2>

              {/* Full name */}
              <div className="space-y-1.5">
                <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('name')}</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={set('fullName')}
                  required
                  placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full name'}
                  className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${fieldErrors.fullName ? 'border-destructive' : 'border-input'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {fieldErrors.fullName && <p className="text-xs text-destructive">{fieldErrors.fullName}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('phone')}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  required
                  maxLength={10}
                  placeholder="05xxxxxxxx"
                  className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${fieldErrors.phone ? 'border-destructive' : 'border-input'}`}
                  dir="ltr"
                />
                {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
              </div>

              {/* Home delivery: wilaya + commune */}
              {deliveryType === 'home' && (
                <>
                  <div className="space-y-1.5">
                    <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('wilaya')}</label>
                    <select
                      value={wilayaCode}
                      onChange={handleWilayaChange}
                      required
                      className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer ${fieldErrors.wilaya ? 'border-destructive' : 'border-input'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <option value="">{t('selectWilaya')}</option>
                      {wilayas.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code}. {locale === 'ar' ? w.name_ar : w.name_en}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.wilaya && <p className="text-xs text-destructive">{fieldErrors.wilaya}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('commune')}</label>
                    {communesLoading ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-input bg-background">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {locale === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
                        </span>
                      </div>
                    ) : communes.length > 0 ? (
                      <select
                        value={form.commune}
                        onChange={set('commune')}
                        required
                        className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer ${fieldErrors.commune ? 'border-destructive' : 'border-input'}`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <option value="">{locale === 'ar' ? 'اختر البلدية' : 'Select commune'}</option>
                        {communes.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.commune}
                        onChange={set('commune')}
                        required
                        placeholder={locale === 'ar' ? 'البلدية / المنطقة' : 'Commune / District'}
                        className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${fieldErrors.commune ? 'border-destructive' : 'border-input'}`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    )}
                    {fieldErrors.commune && <p className="text-xs text-destructive">{fieldErrors.commune}</p>}
                  </div>
                </>
              )}

              {/* Office pickup: wilaya first, then office list with per-wilaya prices */}
              {deliveryType === 'office' && (
                <>
                  {/* Wilaya selector (shared logic with home delivery) */}
                  <div className="space-y-1.5">
                    <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('wilaya')}</label>
                    <select
                      value={wilayaCode}
                      onChange={handleWilayaChange}
                      required
                      className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer ${fieldErrors.wilaya ? 'border-destructive' : 'border-input'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <option value="">{t('selectWilaya')}</option>
                      {wilayas.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code}. {locale === 'ar' ? w.name_ar : w.name_en}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.wilaya && <p className="text-xs text-destructive">{fieldErrors.wilaya}</p>}
                  </div>

                  {/* Office selector — only shown after wilaya is picked */}
                  {wilayaCode && (
                    <div className="space-y-1.5">
                      <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>
                        {locale === 'ar' ? 'اختر مكتب التوصيل' : 'Select Delivery Office'}
                      </label>
                      <select
                        value={selectedOfficeId}
                        onChange={(e) => {
                          setSelectedOfficeId(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, office: undefined }));
                        }}
                        required
                        className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer ${fieldErrors.office ? 'border-destructive' : 'border-input'}`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <option value="">{locale === 'ar' ? 'اختر مكتبًا' : 'Select an office'}</option>
                        {offices.map((o) => {
                          const fee = numericWilayaCode ? (o.prices[numericWilayaCode] ?? 0) : 0;
                          return (
                            <option key={o.id} value={o.id}>
                              {o.name} — {fee === 0 ? (locale === 'ar' ? 'مجاني' : 'Free') : formatPrice(fee)}
                            </option>
                          );
                        })}
                      </select>
                      {fieldErrors.office && <p className="text-xs text-destructive">{fieldErrors.office}</p>}

                      {/* Selected office detail */}
                      {selectedOffice && (
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1 text-xs">
                          <p className="font-semibold text-primary">{selectedOffice.name}</p>
                          {selectedOffice.address && (
                            <p className="text-muted-foreground">{selectedOffice.address}</p>
                          )}
                          <p className="font-semibold text-primary">
                            {officeDeliveryFee === 0
                              ? (locale === 'ar' ? 'توصيل مجاني' : 'Free delivery')
                              : formatPrice(officeDeliveryFee)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>

              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={set('notes')}
                  rows={2}
                  placeholder={t('notesPlaceholder')}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Payment method selector */}
            <div className="space-y-3">
              <p className={`text-sm font-semibold ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? 'طريقة الدفع' : 'Payment Method'}
              </p>
              <div className={`gap-3 ${onlinePaymentEnabled ? 'grid grid-cols-2' : 'flex'}`}>
                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${effectivePayment === 'cod' ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-accent/50'}`}
                >
                  <Banknote className={`h-6 w-6 ${effectivePayment === 'cod' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${effectivePayment === 'cod' ? 'text-primary' : ''}`}>
                      {isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRTL ? 'ادفع عند وصول طلبك' : 'Pay when your order arrives'}
                    </p>
                  </div>
                </button>

                {/* Online — hidden when disabled */}
                {onlinePaymentEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${effectivePayment === 'online' ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-accent/50'}`}
                  >
                    <CreditCard className={`h-6 w-6 ${effectivePayment === 'online' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${effectivePayment === 'online' ? 'text-primary' : ''}`}>
                        {isRTL ? 'دفع إلكتروني' : 'Pay Online'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isRTL ? 'Edahabia · CIB' : 'Edahabia · CIB'}
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Context notice */}
              {effectivePayment === 'cod' && (
                <div className={`flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4 ${isRTL ? 'text-right' : ''}`}>
                  <Truck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-primary">{t('codNotice')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('codDescription')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('confirmNotice')}</p>
                  </div>
                </div>
              )}
              {effectivePayment === 'online' && (
                <div className={`flex items-start gap-3 rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 ${isRTL ? 'text-right' : ''}`}>
                  <CreditCard className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {isRTL ? 'دفع آمن عبر Chargily' : 'Secure payment via Chargily'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRTL
                        ? 'ستُحوَّل إلى صفحة دفع آمنة لإتمام العملية ببطاقة Edahabia أو CIB.'
                        : "You'll be redirected to a secure payment page to pay with Edahabia or CIB."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
              {loading && <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {t('placeOrder')}
            </Button>
          </form>

          {/* ── Order summary ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className="p-5 border-b border-border/60">
                <h2 className={`font-semibold ${isRTL ? 'text-right' : ''}`}>{t('orderSummary')}</h2>
              </div>

              <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                {items.map(({ product, quantity }) => {
                  const name = locale === 'ar' ? product.name_ar : product.name_en;
                  return (
                    <div key={product.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-xs">{name}</p>
                        <p className="text-muted-foreground text-xs">×{quantity}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Promo code */}
              <div className="px-5 pb-3 border-t border-border/60 pt-4">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{appliedPromo.code}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                        -{appliedPromo.discountType === 'percent' ? `${appliedPromo.discountValue}%` : formatPrice(appliedPromo.discountValue)}
                      </span>
                    </div>
                    <button onClick={removePromo} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder={locale === 'ar' ? 'كود الخصم' : 'Promo code'}
                        className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="shrink-0"
                      >
                        {promoLoading
                          ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : (locale === 'ar' ? 'تطبيق' : 'Apply')}
                      </Button>
                    </div>
                    {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="p-5 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {locale === 'ar' ? 'خصم' : 'Discount'} ({appliedPromo.code})
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      -{formatPrice(appliedPromo.discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {deliveryType === 'home'
                      ? (locale === 'ar' ? 'توصيل للمنزل' : 'Home Delivery')
                      : (locale === 'ar' ? 'توصيل عبر مكتب' : 'Office Pickup')}
                  </span>
                  <span className={deliveryFee === 0 ? 'text-emerald-500 font-medium' : 'font-medium'}>
                    {deliveryFee === 0
                      ? (locale === 'ar' ? 'مجاني' : 'Free')
                      : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold text-base pt-2 border-t border-border/40">
                  <span>{t('total')}</span>
                  <span className="text-primary text-lg">{formatPrice(finalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
