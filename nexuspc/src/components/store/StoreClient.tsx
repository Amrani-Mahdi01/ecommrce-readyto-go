'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Grid3X3, LayoutList, PackageX,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductRow } from '@/components/product/ProductRow';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';
interface Category {
  slug: string;
  name_en: string;
  name_ar: string;
  icon?: string;
  description_en?: string | null;
  description_ar?: string | null;
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

export function StoreClient({
  locale,
  initialProducts,
  total,
  brands,
  categories,
  filters,
}: StoreClientProps) {
  const t = useTranslations('store');
  const tc = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const isRTL = locale === 'ar';

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFiltersCount = [
    filters.category, filters.brand, filters.minPrice,
    filters.maxPrice, filters.inStock, filters.search,
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

  const clearAll = () => {
    setSearchInput('');
    startTransition(() => router.push(pathname));
  };

  const sortOptions = [
    { value: '',           label: t('sortRelevance') },
    { value: 'newest',     label: t('sortNewest') },
    { value: 'featured',   label: t('sortFeatured') },
    { value: 'price_asc',  label: t('sortPriceAsc') },
    { value: 'price_desc', label: t('sortPriceDesc') },
  ];

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'font-cairo' : ''}`}>
      {/* ── Top bar ── */}
      <div className="border-b border-border/60 bg-background/98 backdrop-blur-sm sticky top-[56px] z-30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          {/* Search */}
          <form
            className="flex-1 min-w-[200px] relative"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ search: searchInput || undefined });
            }}
          >
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={`w-full h-9 rounded-none border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </form>

          {/* Sort */}
          <select
            value={filters.sort ?? ''}
            onChange={(e) => navigate({ sort: e.target.value || undefined })}
            className="h-9 rounded-none border border-input bg-background text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9 rounded-none"
            onClick={() => setSidebarOpen((p) => !p)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('filters')}
            {activeFiltersCount > 0 && (
              <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* View mode */}
          <div className="flex items-center border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>

          {/* Results count */}
          <span className="text-sm text-muted-foreground hidden sm:block">
            {total} {t('results')}
          </span>
        </div>

        {/* Active filter pills */}
        {activeFiltersCount > 0 && (
          <div className="container mx-auto px-4 pb-2 flex items-center gap-2 flex-wrap">
            {filters.category && (
              <FilterPill
                label={categories.find(c => c.slug === filters.category)?.[locale === 'ar' ? 'name_ar' : 'name_en'] ?? filters.category}
                onRemove={() => navigate({ category: undefined })}
              />
            )}
            {filters.brand && (
              <FilterPill label={filters.brand} onRemove={() => navigate({ brand: undefined })} />
            )}
            {filters.search && (
              <FilterPill label={`"${filters.search}"`} onRemove={() => { setSearchInput(''); navigate({ search: undefined }); }} />
            )}
            {filters.inStock && (
              <FilterPill label={t('inStockOnly')} onRemove={() => navigate({ inStock: false })} />
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <FilterPill
                label={`${Math.round(filters.minPrice ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} – ${filters.maxPrice ? Math.round(filters.maxPrice).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '∞'} DA`}
                onRemove={() => navigate({ minPrice: undefined, maxPrice: undefined })}
              />
            )}
            <button onClick={clearAll} className="text-xs text-destructive hover:underline ml-1">
              {tc('clearAll')}
            </button>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* ── Sidebar ── */}
        <aside
          className={cn(
            'shrink-0 transition-all duration-300 overflow-hidden',
            sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none',
          )}
        >
          <div className="w-64 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">◆</span>
                {t('categoriesTitle')}
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => navigate({ category: undefined })}
                  className={cn(
                    `w-full text-sm px-3 py-1.5 transition-colors ${isRTL ? 'text-right' : 'text-left'}`,
                    !filters.category ? 'bg-primary text-primary-foreground rounded-none' : 'hover:bg-accent rounded-none',
                  )}
                >
                  {t('allCategories')}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => navigate({ category: cat.slug })}
                    className={cn(
                      `w-full text-sm px-3 py-1.5 transition-colors ${isRTL ? 'text-right' : 'text-left'}`,
                      filters.category === cat.slug ? 'bg-primary text-primary-foreground rounded-none' : 'hover:bg-accent rounded-none',
                    )}
                  >
                    {locale === 'ar' ? cat.name_ar : cat.name_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            {brands.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">◆</span>
                  {t('brandsTitle')}
                </h3>
                <div className="space-y-1">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => navigate({ brand: filters.brand === brand ? undefined : brand })}
                      className={cn(
                        'w-full text-left text-sm px-3 py-1.5 transition-colors flex items-center justify-between',
                        filters.brand === brand ? 'bg-primary text-primary-foreground rounded-none' : 'hover:bg-accent rounded-none',
                      )}
                    >
                      {brand}
                      {filters.brand === brand && <X className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">◆</span>
                {t('priceRange')}
              </h3>
              <div className="space-y-2">
                {[
                  { label: locale === 'ar' ? 'أقل من 10.000 DA' : 'Under 10.000 DA', min: undefined, max: 10000 },
                  { label: '10.000 – 30.000 DA', min: 10000, max: 30000 },
                  { label: '30.000 – 60.000 DA', min: 30000, max: 60000 },
                  { label: locale === 'ar' ? 'أكثر من 60.000 DA' : 'Over 60.000 DA', min: 60000, max: undefined },
                ].map((range) => {
                  const active = filters.minPrice === range.min && filters.maxPrice === range.max;
                  return (
                    <button
                      key={range.label}
                      onClick={() => navigate({ minPrice: range.min, maxPrice: range.max })}
                      className={cn(
                        `w-full text-sm px-3 py-1.5 transition-colors ${isRTL ? 'text-right' : 'text-left'}`,
                        active ? 'bg-primary text-primary-foreground rounded-none' : 'hover:bg-accent rounded-none',
                      )}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In stock toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!filters.inStock}
                  onChange={(e) => navigate({ inStock: e.target.checked || undefined as any })}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm">{t('inStockOnly')}</span>
              </label>
            </div>
          </div>
        </aside>

        {/* ── Product grid ── */}
        <div className="flex-1 min-w-0">
          {isPending && (
            <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {initialProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="flex items-center justify-center">
                <PackageX className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-lg font-semibold">{t('noProducts')}</p>
              <p className="text-sm text-muted-foreground">{t('noProductsDesc')}</p>
              <Button variant="outline" className="rounded-none" onClick={clearAll}>{tc('clearAll')}</Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {initialProducts.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {initialProducts.map((product) => (
                <ProductRow key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none"
                disabled={filters.page <= 1}
                onClick={() => navigate({ page: filters.page - 1 })}
              >
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - filters.page) <= 2)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) + 1 < p) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={item}
                      variant={filters.page === item ? 'default' : 'outline'}
                      size="sm"
                      className="w-9 h-9 rounded-none"
                      onClick={() => navigate({ page: item as number })}
                    >
                      {item}
                    </Button>
                  ),
                )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-none"
                disabled={filters.page >= totalPages}
                onClick={() => navigate({ page: filters.page + 1 })}
              >
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 border border-primary/30 bg-primary/5 text-primary text-xs px-2.5 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-destructive transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
