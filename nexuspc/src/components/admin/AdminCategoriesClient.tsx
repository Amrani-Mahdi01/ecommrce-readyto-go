'use client';

import { useState } from 'react';
import { Plus, X, Pencil, Trash2, Check, Package, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { CategoryRow } from '@/app/actions/categories';
import {
  createCategory, updateCategory,
  toggleCategoryActive, deleteCategory,
} from '@/app/actions/categories';
import { ICON_MAP, CategoryIcon } from '@/lib/category-icons';

const ICON_NAMES = Object.keys(ICON_MAP);

// ── Types ────────────────────────────────────────────────────────────────────
interface FormState {
  name_en: string;
  name_ar: string;
  icon: string;
  description_en: string;
  description_ar: string;
  display_order: string;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  name_en: '', name_ar: '', icon: 'Package',
  description_en: '', description_ar: '',
  display_order: '0', is_active: true,
});

// ── Component ────────────────────────────────────────────────────────────────
export function AdminCategoriesClient({
  locale,
  categories: initial,
}: {
  locale: string;
  categories: CategoryRow[];
}) {
  const isRTL = locale === 'ar';
  const [categories, setCategories] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = iconSearch.trim()
    ? ICON_NAMES.filter(n => n.toLowerCase().includes(iconSearch.toLowerCase()))
    : ICON_NAMES;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), display_order: String(categories.length) });
    setIconSearch('');
    setShowModal(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setForm({
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      icon: cat.icon,
      description_en: cat.description_en ?? '',
      description_ar: cat.description_ar ?? '',
      display_order: String(cat.display_order),
      is_active: cat.is_active,
    });
    setIconSearch('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name_en.trim()) {
      toast.error(isRTL ? 'اسم الفئة (EN) مطلوب' : 'Category name (EN) is required');
      return;
    }
    setSaving(true);
    const payload = {
      name_en: form.name_en,
      name_ar: form.name_ar,
      icon: form.icon,
      description_en: form.description_en,
      description_ar: form.description_ar,
      display_order: parseInt(form.display_order) || 0,
      is_active: form.is_active,
    };

    const result = editing
      ? await updateCategory(editing.id, payload)
      : await createCategory(payload);

    setSaving(false);
    if (result.error) { toast.error(result.error); return; }

    toast.success(editing
      ? (isRTL ? 'تم تحديث الفئة' : 'Category updated')
      : (isRTL ? 'تم إنشاء الفئة' : 'Category created'));
    closeModal();
    window.location.reload();
  };

  const handleToggle = async (cat: CategoryRow) => {
    const result = await toggleCategoryActive(cat.id, !cat.is_active);
    if (result.error) { toast.error(result.error); return; }
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDelete = async (cat: CategoryRow) => {
    if (!confirm(isRTL ? `حذف "${cat.name_en}"؟` : `Delete "${cat.name_en}"?`)) return;
    const result = await deleteCategory(cat.id);
    if (result.error) { toast.error(result.error); return; }
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    toast.success(isRTL ? 'تم الحذف' : 'Deleted');
  };

  return (
    <div className={`p-6 ${isRTL ? 'font-cairo' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">
          {isRTL ? 'الفئات' : 'Categories'}
        </h1>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {isRTL ? 'فئة جديدة' : 'New Category'}
        </Button>
      </div>

      {/* Grid */}
      {categories.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
          <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'لا توجد فئات بعد' : 'No categories yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`group rounded-xl border bg-card p-4 flex flex-col gap-3 transition-colors ${cat.is_active ? 'border-border/60' : 'border-border/30 opacity-60'}`}
            >
              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CategoryIcon name={cat.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{cat.name_en}</p>
                  <p className="text-xs text-muted-foreground truncate">{cat.name_ar}</p>
                </div>
              </div>

              {/* Slug */}
              <p className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md truncate">
                /{cat.slug}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                <button
                  onClick={() => handleToggle(cat)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${cat.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}
                >
                  {cat.is_active ? (isRTL ? 'مفعّل' : 'Active') : (isRTL ? 'معطّل' : 'Inactive')}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
              <h2 className="text-lg font-bold">
                {editing
                  ? (isRTL ? 'تعديل الفئة' : 'Edit Category')
                  : (isRTL ? 'إنشاء فئة جديدة' : 'New Category')}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <Field label={isRTL ? 'الاسم (EN) *' : 'Name (EN) *'}>
                  <input value={form.name_en} onChange={set('name_en')} placeholder="Graphics Cards" className={inp} />
                </Field>
                <Field label={isRTL ? 'الاسم (AR)' : 'Name (AR)'}>
                  <input value={form.name_ar} onChange={set('name_ar')} placeholder="بطاقات الرسومات" dir="rtl" className={inp} />
                </Field>
              </div>

              {/* Icon picker */}
              <Field label={isRTL ? 'الأيقونة' : 'Icon'}>
                {/* Selected icon preview */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <CategoryIcon name={form.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{form.icon}</span>
                </div>
                {/* Icon search */}
                <input
                  value={iconSearch}
                  onChange={e => setIconSearch(e.target.value)}
                  placeholder={isRTL ? 'ابحث عن أيقونة...' : 'Search icons...'}
                  className={`${inp} mb-2`}
                />
                {/* Icon grid */}
                <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto p-1 rounded-lg border border-input bg-muted/30">
                  {filteredIcons.map(name => (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => setForm(prev => ({ ...prev, icon: name }))}
                      className={`relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${form.icon === name ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                    >
                      <CategoryIcon name={name} className="h-4 w-4" />
                      {form.icon === name && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                          <Check className="h-2 w-2 text-primary-foreground" />
                        </span>
                      )}
                    </button>
                  ))}
                  {filteredIcons.length === 0 && (
                    <p className="col-span-8 text-center text-xs text-muted-foreground py-4">
                      {isRTL ? 'لا توجد نتائج' : 'No icons found'}
                    </p>
                  )}
                </div>
              </Field>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <Field label={isRTL ? 'الوصف (EN)' : 'Description (EN)'}>
                  <textarea value={form.description_en} onChange={set('description_en')} rows={2} placeholder="Optional description..." className={`${inp} h-auto resize-none py-2`} />
                </Field>
                <Field label={isRTL ? 'الوصف (AR)' : 'Description (AR)'}>
                  <textarea value={form.description_ar} onChange={set('description_ar')} rows={2} dir="rtl" placeholder="وصف اختياري..." className={`${inp} h-auto resize-none py-2`} />
                </Field>
              </div>

              {/* Order + Active */}
              <div className="flex items-center gap-4">
                <Field label={isRTL ? 'ترتيب العرض' : 'Display Order'}>
                  <input type="number" min="0" value={form.display_order} onChange={set('display_order')} className={`${inp} w-28`} />
                </Field>
                <div className={`flex items-center gap-2 mt-5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    role="switch"
                    aria-checked={form.is_active}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {isRTL ? 'مفعّل' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 shrink-0">
              <Button variant="outline" onClick={closeModal} disabled={saving}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {editing ? (isRTL ? 'حفظ التغييرات' : 'Save Changes') : (isRTL ? 'إنشاء' : 'Create')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = 'w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
