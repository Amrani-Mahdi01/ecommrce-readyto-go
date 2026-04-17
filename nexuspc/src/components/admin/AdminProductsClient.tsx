'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Search, Plus, PackageX, Eye, Pencil, Trash2, X, Save, Upload, Sparkles, Loader2, Monitor, Cpu, MemoryStick, HardDrive, Zap, Wind, Package, CircuitBoard, LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/product';
import { toast } from 'sonner';
import { addProduct, updateProduct, toggleProductActive, deleteProduct as deleteProductAction } from '@/app/actions/products';
import { generateProductDescription } from '@/app/actions/ai';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

const CATEGORIES = [
  { slug: 'gpu',         en: 'Graphics Cards' },
  { slug: 'cpu',         en: 'Processors' },
  { slug: 'ram',         en: 'Memory (RAM)' },
  { slug: 'storage',     en: 'Storage' },
  { slug: 'psu',         en: 'Power Supplies' },
  { slug: 'cooling',     en: 'Cooling' },
  { slug: 'cases',       en: 'Cases' },
  { slug: 'motherboard', en: 'Motherboards' },
];

const CAT_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  gpu:         { icon: Monitor,      color: 'text-violet-500',  bg: 'bg-violet-500/10' },
  cpu:         { icon: Cpu,          color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  ram:         { icon: MemoryStick,  color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  storage:     { icon: HardDrive,    color: 'text-amber-500',   bg: 'bg-amber-500/10' },
  psu:         { icon: Zap,          color: 'text-yellow-500',  bg: 'bg-yellow-500/10' },
  cooling:     { icon: Wind,         color: 'text-cyan-500',    bg: 'bg-cyan-500/10' },
  cases:       { icon: Package,      color: 'text-orange-500',  bg: 'bg-orange-500/10' },
  motherboard: { icon: CircuitBoard, color: 'text-rose-500',    bg: 'bg-rose-500/10' },
};

type FormData = {
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  price: string;
  compare_price: string;
  stock_qty: string;
  brand: string;
  category_slug: string;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  specs: string;
};

const empty: FormData = {
  name_en: '', name_ar: '', slug: '',
  description_en: '', description_ar: '',
  price: '', compare_price: '',
  stock_qty: '0', brand: '',
  category_slug: 'gpu',
  is_featured: false, is_active: true,
  images: [],
  specs: '',
};

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function AdminProductsClient({
  locale,
  products: initialProducts,
  categories,
  aiEnabled = true,
}: {
  locale: string;
  products: Product[];
  categories: { id: string; slug: string; name_en: string }[];
  aiEnabled?: boolean;
}) {
  const t = useTranslations('admin');
  const isRTL = locale === 'ar';

  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => products.filter((p) => {
    const name = locale === 'ar' ? p.name_ar : p.name_en;
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (p.brand?.toLowerCase() ?? '').includes(search.toLowerCase());
    const matchActive = !activeOnly || p.is_active;
    const cat = categories.find(c => c.id === p.category_id);
    const matchCat = selectedCat === 'all' || cat?.slug === selectedCat;
    return matchSearch && matchActive && matchCat;
  }), [products, search, activeOnly, selectedCat, categories, locale]);

  // Group filtered products by category for the "All" view
  const grouped = useMemo(() => {
    return categories.map(cat => ({
      cat,
      items: filtered.filter(p => p.category_id === cat.id),
    })).filter(g => g.items.length > 0);
  }, [filtered, categories]);

  // Count per category (ignores search/active filter, only counts total)
  const countByCat = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    for (const p of products) {
      const cat = categories.find(c => c.id === p.category_id);
      if (cat) map[cat.slug] = (map[cat.slug] ?? 0) + 1;
    }
    return map;
  }, [products, categories]);

  const openAdd = () => {
    setForm(empty);
    setEditing(null);
    setModal('add');
  };

  const openEdit = (p: Product) => {
    const cat = categories.find(c => c.id === p.category_id);
    setForm({
      name_en: p.name_en,
      name_ar: p.name_ar,
      slug: p.slug,
      description_en: p.description_en ?? '',
      description_ar: p.description_ar ?? '',
      price: String(p.price),
      compare_price: p.compare_price ? String(p.compare_price) : '',
      stock_qty: String(p.stock_qty),
      brand: p.brand ?? '',
      category_slug: cat?.slug ?? 'gpu',
      is_featured: p.is_featured,
      is_active: p.is_active,
      images: p.images ?? [],
      specs: '',
    });
    setEditing(p);
    setModal('edit');
  };

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => {
      const next = { ...prev, [field]: val };
      if (field === 'name_en' && !editing) next.slug = toSlug(next.name_en as string);
      return next;
    });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.url) {
          urls.push(json.url);
        } else {
          toast.error(json.error ?? 'Upload failed');
        }
      } catch {
        toast.error('Upload error');
      }
    }
    if (urls.length) {
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const moveImage = (from: number, to: number) => {
    setForm(prev => {
      const imgs = [...prev.images];
      const [item] = imgs.splice(from, 1);
      imgs.splice(to, 0, item);
      return { ...prev, images: imgs };
    });
  };

  const canGenerate = form.name_en.trim().length >= 3;

  const handleGenerate = async () => {
    if (!canGenerate) { toast.error('Enter a product name (at least 3 characters) so the AI knows what to write'); return; }
    setGenerating(true);
    const cat = categories.find(c => c.slug === form.category_slug);
    const result = await generateProductDescription({
      name_en: form.name_en,
      name_ar: form.name_ar,
      brand: form.brand,
      category: cat?.name_en ?? form.category_slug,
      price: form.price,
      specs: form.specs,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setForm(prev => ({
        ...prev,
        name_en: result.name_en || prev.name_en,
        name_ar: result.name_ar || prev.name_ar,
        slug: (result.name_en && !editing) ? toSlug(result.name_en) : prev.slug,
        description_en: result.description_en,
        description_ar: result.description_ar,
      }));
      toast.success(locale === 'ar' ? 'تم توليد العنوان والوصف بالذكاء الاصطناعي' : 'AI titles & descriptions generated');
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!form.name_en || !form.price || !form.slug) {
      toast.error('Name (EN), slug, and price are required');
      return;
    }
    setSaving(true);
    const cat = categories.find(c => c.slug === form.category_slug);
    const payload = {
      name_en: form.name_en,
      name_ar: form.name_ar,
      slug: form.slug,
      description_en: form.description_en,
      description_ar: form.description_ar,
      price: form.price,
      compare_price: form.compare_price,
      stock_qty: form.stock_qty,
      brand: form.brand,
      category_id: cat?.id ?? '',
      is_featured: form.is_featured,
      is_active: form.is_active,
      images: form.images,
    };

    if (modal === 'add') {
      const result = await addProduct(payload);
      if (result.error) { toast.error(result.error); setSaving(false); return; }
      setProducts(prev => [result.data as unknown as Product, ...prev]);
      toast.success(locale === 'ar' ? 'تم إضافة المنتج' : 'Product added');
    } else if (editing) {
      const result = await updateProduct(editing.id, payload);
      if (result.error) { toast.error(result.error); setSaving(false); return; }
      setProducts(prev => prev.map(p => p.id === editing.id ? result.data as unknown as Product : p));
      toast.success(locale === 'ar' ? 'تم تحديث المنتج' : 'Product updated');
    }
    setSaving(false);
    setModal(null);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const result = await toggleProductActive(id, !current);
    if (result.error) { toast.error(result.error); return; }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const result = await deleteProductAction(id);
    if (result.error) { toast.error(result.error); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success(locale === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
  };

  return (
    <div className={`p-6 space-y-5 ${isRTL ? 'font-cairo' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('products')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} {locale === 'ar' ? 'منتج في المخزن' : 'products in catalog'}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          {t('addProduct')}
        </Button>
      </div>

      {/* Search + Active filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`w-full h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
          {t('activeOnly')}
        </label>
        {(search || activeOnly) && (
          <span className="text-sm text-muted-foreground">{filtered.length} {locale === 'ar' ? 'نتيجة' : 'results'}</span>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {/* All tab */}
        <button
          onClick={() => setSelectedCat('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors shrink-0
            ${selectedCat === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border/60 bg-card hover:bg-accent text-muted-foreground'}`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          {locale === 'ar' ? 'الكل' : 'All'}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${selectedCat === 'all' ? 'bg-white/20' : 'bg-muted'}`}>
            {countByCat.all ?? 0}
          </span>
        </button>

        {categories.map(cat => {
          const meta = CAT_META[cat.slug] ?? { icon: Package, color: 'text-muted-foreground', bg: 'bg-muted/30' };
          const Icon = meta.icon;
          const count = countByCat[cat.slug] ?? 0;
          const isActive = selectedCat === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCat(cat.slug)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors shrink-0
                ${isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/60 bg-card hover:bg-accent text-muted-foreground'}`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary-foreground' : meta.color}`} />
              {cat.name_en}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20' : 'bg-muted'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Product tables — grouped when "All", single table when category selected */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card py-16 text-center text-muted-foreground">
          <PackageX className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{locale === 'ar' ? 'لا توجد منتجات' : 'No products found'}</p>
        </div>
      ) : selectedCat !== 'all' ? (
        /* Single category table */
        <ProductTable
          products={filtered}
          locale={locale}
          isRTL={isRTL}
          catSlug={selectedCat}
          categories={categories}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggle={toggleActive}
        />
      ) : (
        /* Grouped tables */
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
            <ProductTable
              key={cat.id}
              products={items}
              locale={locale}
              isRTL={isRTL}
              catSlug={cat.slug}
              categories={categories}
              showHeader
              catName={cat.name_en}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={toggleActive}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold">
                {modal === 'add' ? (locale === 'ar' ? 'إضافة منتج' : 'Add Product') : (locale === 'ar' ? 'تعديل المنتج' : 'Edit Product')}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name (EN) *">
                  <input name="name_en" value={form.name_en} onChange={set('name_en')} placeholder="Product name in English" className={input} />
                </Field>
                <Field label="Name (AR)">
                  <input name="name_ar" value={form.name_ar} onChange={set('name_ar')} placeholder="اسم المنتج بالعربية" dir="rtl" className={input} />
                </Field>
              </div>

              <Field label="Slug *">
                <input name="slug" value={form.slug} onChange={set('slug')} placeholder="product-slug" className={`${input} font-mono text-xs`} />
              </Field>

              {/* Pricing + Stock */}
              <div className="grid grid-cols-3 gap-4">
                <Field label="Price (DZD) *">
                  <input name="price" type="number" value={form.price} onChange={set('price')} placeholder="0" className={input} />
                </Field>
                <Field label="Compare Price">
                  <input name="compare_price" type="number" value={form.compare_price} onChange={set('compare_price')} placeholder="0" className={input} />
                </Field>
                <Field label="Stock">
                  <input name="stock_qty" type="number" min="0" value={form.stock_qty} onChange={e => { if (Number(e.target.value) >= 0) set('stock_qty')(e); }} placeholder="0" className={input} />
                </Field>
              </div>

              {/* Brand + Category */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Brand">
                  <input name="brand" value={form.brand} onChange={set('brand')} placeholder="NVIDIA, AMD..." className={input} />
                </Field>
                <Field label="Category">
                  <select name="category_slug" value={form.category_slug} onChange={set('category_slug')} className={input}>
                    {categories.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name_en}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Tech Specs (AI input only) */}
              <Field label="Tech Specs (for AI — not saved)">
                <textarea
                  value={form.specs}
                  onChange={e => setForm(prev => ({ ...prev, specs: e.target.value }))}
                  placeholder={`6 Cores / 12 Threads\nBase: 2.5 GHz / Boost: 4.9 GHz\n18MB Intel Smart Cache\nTDP: 65W\nSocket: LGA 1700\nNo integrated graphics`}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                />
                <p className="text-[11px] text-muted-foreground -mt-1">
                  Paste the real specs so the AI writes accurate, specific descriptions. One spec per line.
                </p>
              </Field>

              {/* AI generate button */}
              {aiEnabled && <div className={`flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${canGenerate ? 'border-violet-400/50 bg-violet-500/5' : 'border-border/40 bg-muted/20'}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold flex items-center gap-1.5 ${canGenerate ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}>
                    <Sparkles className="h-4 w-4 shrink-0" />
                    {locale === 'ar' ? 'توليد العنوان والوصف بالذكاء الاصطناعي' : 'AI Title & Description Generator'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {canGenerate
                      ? (locale === 'ar'
                          ? 'سيحسّن الذكاء الاصطناعي العنوان ويولّد وصفًا محسّنًا لمحركات البحث باللغتين.'
                          : 'AI will optimize the title and generate SEO descriptions in both languages.')
                      : (locale === 'ar'
                          ? 'أدخل اسم المنتج أولاً (3 أحرف على الأقل) حتى يعرف الذكاء الاصطناعي ما يكتب.'
                          : 'Enter a product name first (min. 3 characters) so the AI knows what to write.')}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !canGenerate}
                  className="shrink-0 gap-2 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40"
                  size="sm"
                >
                  {generating
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{locale === 'ar' ? 'جاري التوليد...' : 'Generating...'}</>
                    : <><Sparkles className="h-3.5 w-3.5" />{locale === 'ar' ? 'توليد' : 'Generate'}</>}
                </Button>
              </div>}

              {/* Description EN (rich text) */}
              <Field label="Description (EN)">
                <RichTextEditor
                  value={form.description_en}
                  onChange={(html) => setForm(prev => ({ ...prev, description_en: html }))}
                  placeholder="Product description in English..."
                  dir="ltr"
                />
              </Field>

              {/* Description AR (rich text) */}
              <Field label="Description (AR)">
                <RichTextEditor
                  value={form.description_ar}
                  onChange={(html) => setForm(prev => ({ ...prev, description_ar: html }))}
                  placeholder="وصف المنتج بالعربية..."
                  dir="rtl"
                />
              </Field>

              {/* Images */}
              <Field label={`Images (${form.images.length})`}>
                <div className="space-y-3">
                  {/* Upload zone */}
                  <div
                    className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                    />
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {uploading
                        ? 'Uploading...'
                        : 'Click or drag & drop images here (JPEG, PNG, WEBP · max 5 MB each)'}
                    </p>
                  </div>

                  {/* Thumbnails */}
                  {form.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.images.map((url, i) => (
                        <div
                          key={url}
                          className="relative w-20 h-20 rounded-lg border border-border/60 bg-muted/20 overflow-hidden group"
                        >
                          <Image src={url} alt={`img-${i}`} fill className="object-contain p-1" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(i, i - 1)}
                                className="text-white text-xs bg-white/20 rounded px-1"
                                title="Move left"
                              >←</button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="text-white bg-destructive/80 rounded p-0.5"
                              title="Remove"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {i < form.images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(i, i + 1)}
                                className="text-white text-xs bg-white/20 rounded px-1"
                                title="Move right"
                              >→</button>
                            )}
                          </div>
                          {i === 0 && (
                            <span className="absolute bottom-0.5 left-0 right-0 text-[9px] text-center bg-primary/80 text-primary-foreground">Main</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              {/* Flags */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="w-4 h-4 accent-primary" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 accent-primary" />
                  Featured
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 sticky bottom-0 bg-card">
              <Button variant="outline" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || uploading} className="gap-2">
                {saving ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                {modal === 'add' ? 'Add Product' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const input = 'w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50';

function ProductTable({
  products, locale, isRTL, catSlug, categories, showHeader, catName,
  onEdit, onDelete, onToggle,
}: {
  products: Product[];
  locale: string;
  isRTL: boolean;
  catSlug: string;
  categories: { id: string; slug: string; name_en: string }[];
  showHeader?: boolean;
  catName?: string;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, current: boolean) => void;
}) {
  const meta = CAT_META[catSlug] ?? { icon: Package, color: 'text-muted-foreground', bg: 'bg-muted/30' };
  const Icon = meta.icon;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {showHeader && catName && (
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-muted/20`}>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg}`}>
            <Icon className={`h-4 w-4 ${meta.color}`} />
          </div>
          <span className="font-bold text-sm">{catName}</span>
          <span className="text-xs text-muted-foreground font-medium ml-1">
            {products.length} {locale === 'ar' ? 'منتج' : 'items'}
          </span>
        </div>
      )}
      <table className="w-full text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
        <thead>
          <tr className="border-b border-border/40 bg-muted/10">
            {[
              locale === 'ar' ? 'المنتج'    : 'Product',
              locale === 'ar' ? 'السعر'     : 'Price',
              locale === 'ar' ? 'المخزون'   : 'Stock',
              locale === 'ar' ? 'الحالة'    : 'Status',
              locale === 'ar' ? 'الإجراءات' : 'Actions',
            ].map(h => (
              <th key={h} className={`px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            const name = locale === 'ar' ? product.name_ar : product.name_en;
            const image = product.images?.[0] ?? null;
            return (
              <tr key={product.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
                      {image
                        ? <Image src={image} alt={name} width={36} height={36} className="w-full h-full object-contain p-1" />
                        : <div className="w-full h-full flex items-center justify-center"><PackageX className="h-3.5 w-3.5 text-muted-foreground/30" /></div>
                      }
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-medium text-xs line-clamp-1 max-w-[220px]">{name}</p>
                      {product.brand && <p className="text-[10px] text-muted-foreground">{product.brand}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-xs">{formatPrice(product.price)}</span>
                  {product.compare_price && (
                    <span className="block text-[10px] text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold text-xs ${product.stock_qty > 10 ? 'text-emerald-500' : product.stock_qty > 0 ? 'text-amber-500' : 'text-destructive'}`}>
                    {product.stock_qty > 0 ? product.stock_qty : locale === 'ar' ? 'نفد' : 'Out'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggle(product.id, product.is_active)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${product.is_active
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'}`}
                  >
                    {product.is_active
                      ? (locale === 'ar' ? 'نشط' : 'Active')
                      : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <a href={`/${locale}/store/product/${product.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground" title="View">
                      <Eye className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => onEdit(product)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDelete(product.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
