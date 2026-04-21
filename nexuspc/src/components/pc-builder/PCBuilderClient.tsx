'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Cpu, Monitor, Database, HardDrive, Zap, Wind, Package, CircuitBoard,
  Plus, X, ShoppingCart, ChevronDown, ChevronUp, Search, PackageX,
  Sparkles, Loader2, Gamepad2, Briefcase, CircleCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/product';
import { toast } from 'sonner';
import { generatePCBuild, type BuildPurpose } from '@/app/actions/ai';

const SLOTS = [
  'cpu', 'motherboard', 'gpu', 'ram', 'storage', 'psu', 'case', 'cooler',
] as const;
type Slot = typeof SLOTS[number];

const SLOT_ICONS: Record<Slot, React.ElementType> = {
  cpu:         Cpu,
  motherboard: CircuitBoard,
  gpu:         Monitor,
  ram:         Database,
  storage:     HardDrive,
  psu:         Zap,
  case:        Package,
  cooler:      Wind,
};

interface PCBuilderClientProps {
  locale: string;
  productsBySlot: Record<string, Product[]>;
  aiEnabled?: boolean;
}

export function PCBuilderClient({ locale, productsBySlot: productsBySlot_prop, aiEnabled = true }: PCBuilderClientProps) {
  const t = useTranslations('pcBuilder');
  const tc = useTranslations('common');
  const { addItem } = useCart();
  const isRTL = locale === 'ar';

  const [selected, setSelected] = useState<Partial<Record<Slot, Product>>>({});
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [search, setSearch] = useState('');

  // AI Build state
  const [budget, setBudget] = useState('');
  const [purpose, setPurpose] = useState<BuildPurpose>('gaming');
  const [aiBuilding, setAiBuilding] = useState(false);
  const [aiReasons, setAiReasons] = useState<Partial<Record<string, string>>>({});
  const [aiSummary, setAiSummary] = useState('');

  // Rate limit: 3 uses per 30 min stored in localStorage
  const RATE_KEY = 'ai_build_uses';
  const RATE_LIMIT = 3;
  const RATE_WINDOW_MS = 30 * 60 * 1000;

  const getRateData = (): number[] => {
    try {
      const raw = localStorage.getItem(RATE_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch { return []; }
  };

  const getUsesLeft = (): number => {
    const now = Date.now();
    const recent = getRateData().filter(t => now - t < RATE_WINDOW_MS);
    return Math.max(0, RATE_LIMIT - recent.length);
  };

  const getBlockedMinutes = (): number => {
    const now = Date.now();
    const recent = getRateData().filter(t => now - t < RATE_WINDOW_MS);
    if (recent.length < RATE_LIMIT) return 0;
    const oldest = Math.min(...recent);
    return Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 60000);
  };

  const [usesLeft, setUsesLeft] = useState(RATE_LIMIT);
  const [blockedMin, setBlockedMin] = useState(0);

  // Sync rate state on mount (localStorage is client-only)
  useEffect(() => {
    setUsesLeft(getUsesLeft());
    setBlockedMin(getBlockedMinutes());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPrice = useMemo(
    () => Object.values(selected).reduce((sum, p) => sum + (p?.price ?? 0), 0),
    [selected],
  );

  const filledSlots = Object.keys(selected).length;

  const handleSelect = (slot: Slot, product: Product) => {
    setSelected((prev) => ({ ...prev, [slot]: product }));
    setActiveSlot(null);
    setSearch('');
  };

  const handleRemove = (slot: Slot) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const handleAIBuild = async () => {
    const budgetNum = parseInt(budget.replace(/\D/g, ''), 10);
    if (!budgetNum || budgetNum < 100000) {
      toast.error(locale === 'ar' ? 'الحد الأدنى للميزانية هو 100.000 دج' : 'Minimum budget is 100.000 DZD');
      return;
    }

    // Rate limit check
    const now = Date.now();
    const recent = getRateData().filter(t => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_LIMIT) {
      const mins = Math.ceil((RATE_WINDOW_MS - (now - Math.min(...recent))) / 60000);
      toast.error(
        locale === 'ar'
          ? `لقد استنفدت المحاولات الثلاث. حاول مجدداً بعد ${mins} دقيقة.`
          : `You've used all 3 attempts. Try again in ${mins} min.`
      );
      return;
    }

    // Record this use
    const updated = [...recent, now];
    localStorage.setItem(RATE_KEY, JSON.stringify(updated));
    setUsesLeft(Math.max(0, RATE_LIMIT - updated.length));
    setBlockedMin(updated.length >= RATE_LIMIT ? 30 : 0);

    setAiBuilding(true);
    setAiReasons({});
    setAiSummary('');

    // Build slim catalog for AI
    const slimCatalog: Record<string, { id: string; name: string; price: number }[]> = {};
    for (const [slot, products] of Object.entries(productsBySlot_prop)) {
      slimCatalog[slot] = products.map(p => ({ id: p.id, name: p.name_en, price: p.price }));
    }

    const result = await generatePCBuild({ budget: budgetNum, purpose, productsBySlot: slimCatalog });

    if (result.error) {
      toast.error(result.error);
      setAiBuilding(false);
      return;
    }

    // Map returned IDs back to full Product objects
    const newSelected: Partial<Record<Slot, Product>> = {};
    for (const slot of SLOTS) {
      const id = result.selections[slot];
      if (!id) continue;
      const product = (productsBySlot_prop[slot] ?? []).find(p => p.id === id);
      if (product) newSelected[slot] = product;
    }

    // ── Hard budget enforcement ───────────────────────────────────────────
    // Drop order: least important slot for this purpose first
    // Drop extras first, never touch core (cpu/motherboard/ram/psu/storage) until all extras are gone
    const dropOrder: Record<BuildPurpose, Slot[]> = {
      gaming: ['case', 'cooler', 'gpu',  'storage', 'psu', 'ram', 'motherboard', 'cpu'],
      office: ['gpu',  'case',   'cooler', 'storage', 'psu', 'ram', 'motherboard', 'cpu'],
    };

    const getTotal = (sel: Partial<Record<Slot, Product>>) =>
      Object.values(sel).reduce((s, p) => s + (p?.price ?? 0), 0);

    const droppedSlots: Slot[] = [];
    while (getTotal(newSelected) > budgetNum) {
      const toDrop = dropOrder[purpose].find(s => newSelected[s]);
      if (!toDrop) break; // nothing left to drop
      delete newSelected[toDrop];
      droppedSlots.push(toDrop);
    }

    const finalTotal = getTotal(newSelected);

    setSelected(newSelected);
    setAiReasons(result.reasons);
    setAiSummary(result.summary);

    if (droppedSlots.length > 0) {
      toast.warning(
        locale === 'ar'
          ? `تم حذف ${droppedSlots.join(', ')} للبقاء ضمن الميزانية`
          : `Removed ${droppedSlots.join(', ')} to stay within budget`,
        { description: locale === 'ar' ? `الإجمالي: ${finalTotal.toLocaleString()} دج` : `Total: ${formatPrice(finalTotal)}` }
      );
    } else {
      toast.success(locale === 'ar' ? 'تم بناء الجهاز بالذكاء الاصطناعي!' : 'AI build ready!');
    }
    setAiBuilding(false);
  };

  const handleAddAll = () => {
    const items = Object.values(selected);
    if (items.length === 0) return;
    items.forEach((p) => p && addItem(p));
    toast.success(
      locale === 'ar' ? 'تمت إضافة جميع المكوّنات!' : 'All components added to cart!',
      { description: locale === 'ar' ? `${items.length} منتج` : `${items.length} items` },
    );
  };

  const slotProducts = activeSlot
    ? (productsBySlot_prop[activeSlot] ?? []).filter((p) => {
        const name = locale === 'ar' ? p.name_ar : p.name_en;
        return (
          !search ||
          name.toLowerCase().includes(search.toLowerCase()) ||
          (p.brand?.toLowerCase() ?? '').includes(search.toLowerCase())
        );
      })
    : [];

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'font-cairo' : ''}`}>
      {/* Header */}
      <div className="border-b border-border/40 bg-zinc-950 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-black text-4xl uppercase text-white mb-2">{t('title')}</h1>
          <p className="text-zinc-400 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* ── AI Build Panel ── */}
        {aiEnabled && <div className="mb-6 border border-primary/25 bg-primary/[0.03] p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h2 className="font-bold text-base text-violet-600 dark:text-violet-400">
                {locale === 'ar' ? 'بناء الجهاز بالذكاء الاصطناعي' : 'AI Build Assistant'}
              </h2>
            </div>
            {/* Usage indicator */}
            <div className="flex items-center gap-1.5">
              {blockedMin > 0 ? (
                <span className="text-[11px] text-destructive font-medium">
                  {locale === 'ar' ? `متاح بعد ${blockedMin} دقيقة` : `Available in ${blockedMin} min`}
                </span>
              ) : (
                <>
                  {[...Array(RATE_LIMIT)].map((_, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${i < usesLeft ? 'bg-violet-500' : 'bg-muted-foreground/30'}`} />
                  ))}
                  <span className="text-[11px] text-muted-foreground ml-1">
                    {locale === 'ar' ? `${usesLeft}/3 محاولات` : `${usesLeft}/3 left`}
                  </span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {locale === 'ar'
              ? 'أدخل ميزانيتك واختر الغرض. الذكاء الاصطناعي يختار أفضل ما يناسب ميزانيتك — حتى لو كان مكوّناً واحداً فقط.'
              : 'Enter your budget and purpose. AI picks the best it can afford — even a single component if budget is tight.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Budget input */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                {locale === 'ar' ? 'الميزانية (دج)' : 'Budget (DZD)'}
              </label>
              <input
                type="number"
                min={50000}
                step={5000}
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder={locale === 'ar' ? 'مثال: 150000 (الحد الأدنى 100.000)' : 'e.g. 150000 (min 100.000)'}
                className="w-full h-10 px-3 rounded-none border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Purpose selector */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                {locale === 'ar' ? 'الغرض من الجهاز' : 'Build Purpose'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 h-10">
                {([
                  { key: 'gaming', Icon: Gamepad2,  label: locale === 'ar' ? 'ألعاب' : 'Gaming' },
                  { key: 'office', Icon: Briefcase, label: locale === 'ar' ? 'مكتب'  : 'Office' },
                ] as { key: BuildPurpose; Icon: React.ElementType; label: string }[]).map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setPurpose(key)}
                    className={`flex items-center justify-center gap-1 rounded-none text-xs font-medium transition-colors border h-full
                      ${purpose === key
                        ? 'bg-primary text-white border-primary'
                        : 'border-border/60 bg-background hover:bg-accent text-muted-foreground'}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Build button */}
            <div className="flex items-end">
              <Button
                onClick={handleAIBuild}
                disabled={aiBuilding || !budget || blockedMin > 0 || usesLeft === 0}
                className="rounded-none gap-2 bg-primary hover:bg-primary/90 text-white h-10 px-5 whitespace-nowrap disabled:opacity-50"
              >
                {aiBuilding
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{locale === 'ar' ? 'جاري البناء...' : 'Building...'}</>
                  : blockedMin > 0
                  ? <>{locale === 'ar' ? `انتظر ${blockedMin} دقيقة` : `Wait ${blockedMin} min`}</>
                  : <><Sparkles className="h-4 w-4" />{locale === 'ar' ? 'ابنِ لي' : 'Build for me'}</>}
              </Button>
            </div>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div className="mt-4 flex items-start gap-2 bg-primary/[0.08] border border-primary/20 px-4 py-3">
              <CircleCheck className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-700 dark:text-violet-300">{aiSummary}</p>
            </div>
          )}
        </div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Component slots ── */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {SLOTS.map((slot) => {
              const Icon = SLOT_ICONS[slot];
              const product = selected[slot];
              const isOpen = activeSlot === slot;

              return (
                <div key={slot} className="border border-border bg-card overflow-hidden">
                  {/* Slot row */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/20 transition-colors"
                    onClick={() => {
                      setActiveSlot(isOpen ? null : slot);
                      setSearch('');
                    }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {t(`slots.${slot}`)}
                      </p>
                      {product ? (
                        <p className="text-sm font-medium truncate">
                          {locale === 'ar' ? product.name_ar : product.name_en}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('selectComponent')}</p>
                      )}
                    </div>

                    {product ? (
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-sm">{formatPrice(product.price)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemove(slot); }}
                          className="p-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="rounded-none gap-1 h-8 text-xs">
                          <Plus className="h-3.5 w-3.5" />
                          {locale === 'ar' ? 'اختر' : 'Choose'}
                        </Button>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    )}
                  </div>

                  {/* AI reason */}
                  {!isOpen && product && aiReasons[slot] && (
                    <div className="px-4 pb-3 -mt-1">
                      <p className="text-[11px] text-violet-500 dark:text-violet-400 flex items-start gap-1">
                        <Sparkles className="h-3 w-3 shrink-0 mt-0.5" />
                        {aiReasons[slot]}
                      </p>
                    </div>
                  )}

                  {/* Product picker dropdown */}
                  {isOpen && (
                    <div className="border-t border-border/60">
                      {/* Search */}
                      <div className="p-3 border-b border-border/40">
                        <div className="relative">
                          <Search className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                          <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('searchComponent', { slot: t(`slots.${slot}`) })}
                            dir={isRTL ? 'rtl' : 'ltr'}
                            className={`w-full h-8 text-xs rounded-none border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
                          />
                        </div>
                      </div>

                      {/* Product list */}
                      <div className="max-h-72 overflow-y-auto">
                        {slotProducts.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                            <PackageX className="h-8 w-8 opacity-30" />
                            <p className="text-xs">{tc('noResults')}</p>
                          </div>
                        ) : (
                          slotProducts.map((p) => {
                            const name = locale === 'ar' ? p.name_ar : p.name_en;
                            const isSelected = selected[slot]?.id === p.id;
                            return (
                              <button
                                key={p.id}
                                onClick={() => handleSelect(slot, p)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0 ${isSelected ? 'bg-primary/10' : ''} ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                {/* Thumbnail */}
                                <div className="shrink-0 w-10 h-10 border border-border/60 bg-muted/30 overflow-hidden">
                                  {p.images[0] ? (
                                    <Image src={p.images[0]} alt={name} width={40} height={40} className="w-full h-full object-contain p-1" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <PackageX className="h-4 w-4 text-muted-foreground/30" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  {p.brand && <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{p.brand}</p>}
                                  <p className="text-xs font-medium truncate">{name}</p>
                                </div>

                                <span className="shrink-0 text-sm font-bold">{formatPrice(p.price)}</span>
                                {isSelected && <Badge className="shrink-0 rounded-none text-[10px]">{locale === 'ar' ? 'مختار' : 'Selected'}</Badge>}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Build summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border/60">
                <h2 className={`font-bold text-lg uppercase mb-1 ${isRTL ? 'text-right' : ''}`}>
                  {locale === 'ar' ? 'ملخص البناء' : 'Build Summary'}
                </h2>
                <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                  {filledSlots} / {SLOTS.length} {locale === 'ar' ? 'مكوّنات' : 'components selected'}
                </p>

                {/* Progress bar */}
                <div className="mt-3 h-1 bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(filledSlots / SLOTS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Selected items */}
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {SLOTS.map((slot) => {
                  const product = selected[slot];
                  const Icon = SLOT_ICONS[slot];
                  return (
                    <div key={slot} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      {product ? (
                        <>
                          <span className={`flex-1 text-xs truncate ${isRTL ? 'text-right' : ''}`}>
                            {locale === 'ar' ? product.name_ar : product.name_en}
                          </span>
                          <span className="shrink-0 text-xs font-medium">{formatPrice(product.price)}</span>
                        </>
                      ) : (
                        <span className={`flex-1 text-xs text-muted-foreground/40 italic ${isRTL ? 'text-right' : ''}`}>
                          {t(`slots.${slot}`)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total + CTA */}
              <div className="p-5 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t('totalPrice')}</span>
                  <span className="text-xl font-extrabold text-primary">{formatPrice(totalPrice)}</span>
                </div>
                <Button
                  className="w-full gap-2 rounded-none"
                  disabled={filledSlots === 0}
                  onClick={handleAddAll}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {t('addAllToCart')}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  {locale === 'ar' ? 'الدفع عند الاستلام متاح' : 'Cash on Delivery available'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
