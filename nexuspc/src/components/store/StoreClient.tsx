'use client';

import { useState, useCallback, useTransition, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Grid3X3, LayoutList, PackageX, ChevronDown, Check,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductRow } from '@/components/product/ProductRow';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';

interface Category {
  slug: string;
  name_en: string;
  name_ar: string;
  icon?: string;
}

const PAGE_SIZE = 16;

interface Filters {
  category?: string;
  search?: string;
  sort?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page: number;
}

interface StoreClientProps {
  locale: string;
  initialProducts: Product[];
  total: number;
  brands: string[];
  categories: Category[];
  filters: Filters;
}

const PRICE_RANGES = [
  { key: 'u10',  min: undefined, max: 10000,  en: 'Under 10,000 DA',   ar: 'أقل من 10.000 DA' },
  { key: '1030', min: 10000,     max: 30000,  en: '10,000 – 30,000 DA', ar: '10.000 – 30.000 DA' },
  { key: '3060', min: 30000,     max: 60000,  en: '30,000 – 60,000 DA', ar: '30.000 – 60.000 DA' },
  { key: 'o60',  min: 60000,     max: undefined, en: 'Over 60,000 DA',  ar: 'أكثر من 60.000 DA' },
];

export function StoreClient({
  locale, initialProducts, total, brands, categories, filters,
}: StoreClientProps) {
  const t  = useTranslations('store');
  const tc = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [viewMode, setViewMode]       = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const isRTL = locale === 'ar';

  // Local draft filters inside the drawer
  const [draftBrand,    setDraftBrand]    = useState(filters.brand);
  const [draftMinPrice, setDraftMinPrice] = useState(filters.minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(filters.maxPrice);
  const [draftInStock,  setDraftInStock]  = useState(!!filters.inStock);

  // Sync draft when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setDraftBrand(filters.brand);
      setDraftMinPrice(filters.minPrice);
      setDraftMaxPrice(filters.maxPrice);
      setDraftInStock(!!filters.inStock);
    }
  }, [drawerOpen, filters]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFiltersCount = [
    filters.brand, filters.minPrice, filters.maxPrice, filters.inStock,
  ].filter(Boolean).length;

  const buildUrl = useCallback((overrides: Partial<Filters>) => {
    const next = { ...filters, ...overrides, page: overrides.page ?? 1 };
    const sp = new URLSearchParams();
    if (next.category)  sp.set('category', next.category);
    if (next.search)    sp.set('search', next.search);
    if (next.sort)      sp.set('sort', next.sort);
    if (next.brand)     sp.set('brand', next.brand);
    if (next.minPrice)  sp.set('minPrice', String(next.minPrice));
    if (next.maxPrice)  sp.set('maxPrice', String(next.maxPrice));
    if (next.inStock)   sp.set('inStock', 'true');
    if (next.page > 1)  sp.set('page', String(next.page));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [filters, pathname]);

  const navigate = useCallback((overrides: Partial<Filters>) => {
    startTransition(() => router.push(buildUrl(overrides)));
  }, [buildUrl, router]);

  const clearAll = () => { setSearchInput(''); startTransition(() => router.push(pathname)); };

  const applyDrawer = () => {
    navigate({
      brand: draftBrand,
      minPrice: draftMinPrice,
      maxPrice: draftMaxPrice,
      inStock: draftInStock || undefined as any,
    });
    setDrawerOpen(false);
  };

  const resetDrawer = () => {
    setDraftBrand(undefined);
    setDraftMinPrice(undefined);
    setDraftMaxPrice(undefined);
    setDraftInStock(false);
  };

  const sortOptions = [
    { value: '',           label: t('sortRelevance') },
    { value: 'newest',     label: t('sortNewest') },
    { value: 'featured',   label: t('sortFeatured') },
    { value: 'price_asc',  label: t('sortPriceAsc') },
    { value: 'price_desc', label: t('sortPriceDesc') },
  ];

  const activePriceRange = PRICE_RANGES.find(r => r.min === draftMinPrice && r.max === draftMaxPrice);

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'font-cairo' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Sticky toolbar ── */}
      <div className="border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-[56px] z-30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2">

          {/* Search */}
          <form
            className="flex-1 min-w-0 relative"
            onSubmit={(e) => { e.preventDefault(); navigate({ search: searchInput || undefined }); }}
          >
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholder')}
              dir={isRTL ? 'rtl' : 'ltr'}
              className={`w-full h-9 border border-input bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-colors ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); navigate({ search: undefined }); }}
                className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${isRTL ? 'left-3' : 'right-3'}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Sort — compact dropdown */}
          <SortDropdown
            value={filters.sort ?? ''}
            options={sortOptions}
            onChange={(v) => navigate({ sort: v || undefined })}
            isRTL={isRTL}
          />

          {/* Filter button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'flex items-center gap-1.5 h-9 px-3 border text-sm font-medium transition-colors shrink-0',
              activeFiltersCount > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input bg-background hover:bg-accent text-foreground',
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t('filters')}
            {activeFiltersCount > 0 && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View toggle */}
          <div className="flex border border-border overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground')}
              aria-label="Grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground')}
              aria-label="List"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Category pills (horizontal scroll) ── */}
        <div className="border-t border-border/40">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
              <CategoryPill
                label={t('allCategories')}
                active={!filters.category}
                onClick={() => navigate({ category: undefined })}
              />
              {categories.map((cat) => (
                <CategoryPill
                  key={cat.slug}
                  label={locale === 'ar' ? cat.name_ar : cat.name_en}
                  active={filters.category === cat.slug}
                  onClick={() => navigate({ category: filters.category === cat.slug ? undefined : cat.slug })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {(activeFiltersCount > 0 || filters.search) && (
          <div className="border-t border-border/30">
            <div className="container mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground shrink-0">
                {total} {t('results')}
              </span>
              {filters.search && (
                <FilterChip label={`"${filters.search}"`} onRemove={() => { setSearchInput(''); navigate({ search: undefined }); }} />
              )}
              {filters.brand && (
                <FilterChip label={filters.brand} onRemove={() => navigate({ brand: undefined })} />
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <FilterChip
                  label={PRICE_RANGES.find(r => r.min === filters.minPrice && r.max === filters.maxPrice)?.[locale === 'ar' ? 'ar' : 'en'] ?? 'Price'}
                  onRemove={() => navigate({ minPrice: undefined, maxPrice: undefined })}
                />
              )}
              {filters.inStock && (
                <FilterChip label={t('inStockOnly')} onRemove={() => navigate({ inStock: false })} />
              )}
              <button onClick={clearAll} className="text-[11px] text-destructive hover:underline ms-auto">
                {tc('clearAll')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Full-screen loader ── */}
      {isPending && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 pointer-events-none">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            {isRTL ? 'جارٍ التحميل…' : 'Loading…'}
          </p>
        </div>
      )}

      {/* ── Products ── */}
      <div className="container mx-auto px-4 py-6">

        {initialProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center gap-4">
            <PackageX className="h-16 w-16 text-muted-foreground/20" />
            <p className="text-lg font-bold">{t('noProducts')}</p>
            <p className="text-sm text-muted-foreground">{t('noProductsDesc')}</p>
            <Button variant="outline" onClick={clearAll} className="rounded-none mt-2">{tc('clearAll')}</Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {initialProducts.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {initialProducts.map((p) => <ProductRow key={p.id} product={p} locale={locale} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-12">
            <Button variant="outline" size="sm" className="rounded-none h-9 w-9 p-0"
              disabled={filters.page <= 1} onClick={() => navigate({ page: filters.page - 1 })}>
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - filters.page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (arr[idx - 1] as number) + 1 < p) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`d${idx}`} className="px-2 text-muted-foreground text-sm">…</span>
                ) : (
                  <Button key={item} size="sm"
                    variant={filters.page === item ? 'default' : 'outline'}
                    className="rounded-none h-9 w-9 p-0"
                    onClick={() => navigate({ page: item as number })}>
                    {item}
                  </Button>
                ),
              )}
            <Button variant="outline" size="sm" className="rounded-none h-9 w-9 p-0"
              disabled={filters.page >= totalPages} onClick={() => navigate({ page: filters.page + 1 })}>
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>

      {/* ── Filter Drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div
            className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} z-50 h-full w-80 bg-card border-${isRTL ? 'r' : 'l'} border-border/60 shadow-2xl flex flex-col`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">{t('filters')}</span>
                {activeFiltersCount > 0 && (
                  <span className="text-[11px] text-muted-foreground">({activeFiltersCount} {locale === 'ar' ? 'مفعّل' : 'active'})</span>
                )}
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 hover:bg-accent transition-colors text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

              {/* Brands */}
              {brands.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {t('brandsTitle')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brand) => {
                      const active = draftBrand === brand;
                      return (
                        <button
                          key={brand}
                          onClick={() => setDraftBrand(active ? undefined : brand)}
                          className={cn(
                            'text-xs px-3 py-1.5 border font-medium transition-colors',
                            active
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-input hover:border-primary/60 hover:bg-accent',
                          )}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Price range */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {t('priceRange')}
                </h3>
                <div className="space-y-1.5">
                  {PRICE_RANGES.map((range) => {
                    const active = draftMinPrice === range.min && draftMaxPrice === range.max;
                    return (
                      <button
                        key={range.key}
                        onClick={() => {
                          if (active) { setDraftMinPrice(undefined); setDraftMaxPrice(undefined); }
                          else { setDraftMinPrice(range.min); setDraftMaxPrice(range.max); }
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 border text-sm transition-colors',
                          active
                            ? 'bg-primary/10 border-primary text-primary font-semibold'
                            : 'border-transparent hover:border-border hover:bg-accent',
                        )}
                      >
                        <span>{locale === 'ar' ? range.ar : range.en}</span>
                        {active && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* In stock */}
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {locale === 'ar' ? 'التوفر' : 'Availability'}
                </h3>
                <button
                  onClick={() => setDraftInStock(!draftInStock)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 border text-sm transition-colors',
                    draftInStock
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'border-input hover:bg-accent',
                  )}
                >
                  <span>{t('inStockOnly')}</span>
                  <div className={cn(
                    'w-8 h-4 rounded-full transition-colors relative shrink-0',
                    draftInStock ? 'bg-primary' : 'bg-muted',
                  )}>
                    <span className={cn(
                      'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all',
                      draftInStock ? (isRTL ? 'right-0.5' : 'left-4') : (isRTL ? 'right-4' : 'left-0.5'),
                    )} />
                  </div>
                </button>
              </section>
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-border/60 flex gap-3 shrink-0">
              <button
                onClick={resetDrawer}
                className="flex-1 h-10 border border-input text-sm font-medium hover:bg-accent transition-colors"
              >
                {locale === 'ar' ? 'إعادة ضبط' : 'Reset'}
              </button>
              <button
                onClick={applyDrawer}
                className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                {locale === 'ar' ? 'تطبيق' : 'Apply'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold border transition-colors shrink-0',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
      )}
    >
      {label}
    </button>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 border border-primary/30 bg-primary/8 text-primary text-xs px-2.5 py-1 font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-destructive transition-colors ms-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function SortDropdown({ value, options, onChange, isRTL }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  isRTL: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-9 px-3 border border-input bg-background text-sm hover:bg-accent transition-colors whitespace-nowrap"
      >
        <span className="text-muted-foreground text-xs">{isRTL ? 'ترتيب:' : 'Sort:'}</span>
        <span className="font-medium">{current.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className={`absolute top-full mt-1 ${isRTL ? 'left-0' : 'right-0'} z-50 w-44 bg-card border border-border shadow-lg py-1`}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'w-full px-3 py-2 text-sm text-start flex items-center justify-between hover:bg-accent transition-colors',
                value === opt.value && 'text-primary font-semibold',
              )}
            >
              {opt.label}
              {value === opt.value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
