'use client';

import { useState } from 'react';
import { Truck, Building2, Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { wilayas } from '@/config/wilayas';
import { toast } from 'sonner';
import {
  updateWilayaDeliveryPrices,
  createOffice,
  updateOffice,
  deleteOffice,
  toggleOfficeActive,
  updateOfficePrices,
  type DeliveryOffice,
} from '@/app/actions/delivery';

interface Props {
  locale: string;
  wilayaPrices: Record<number, number>;
  offices: DeliveryOffice[];
}

const inp =
  'w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

/** Reusable 58-wilaya price grid */
function WilayaPriceGrid({
  locale,
  prices,
  onChange,
}: {
  locale: string;
  prices: Record<number, string>;
  onChange: (code: number, value: string) => void;
}) {
  const isRTL = locale === 'ar';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {wilayas.map((w) => {
        const code = parseInt(w.code, 10);
        return (
          <div
            key={w.code}
            className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
          >
            <span className="text-[11px] font-bold text-muted-foreground w-6 shrink-0">
              {w.code}
            </span>
            <span
              className="text-xs flex-1 truncate"
              title={isRTL ? w.name_ar : w.name_en}
            >
              {isRTL ? w.name_ar : w.name_en}
            </span>
            <div className="relative shrink-0 w-24">
              <input
                type="number"
                min="0"
                value={prices[code] ?? '0'}
                onChange={(e) => onChange(code, e.target.value)}
                className="w-full h-8 ps-2 pe-7 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring/50 text-end"
              />
              <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                DZ
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function initPriceStrings(prices: Record<number, number>): Record<number, string> {
  const result: Record<number, string> = {};
  for (const w of wilayas) {
    const code = parseInt(w.code, 10);
    result[code] = String(prices[code] ?? 0);
  }
  return result;
}

function parsePrices(strings: Record<number, string>): Record<number, number> | null {
  const result: Record<number, number> = {};
  for (const [code, val] of Object.entries(strings)) {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return null;
    result[Number(code)] = n;
  }
  return result;
}

export function AdminDeliveryClient({ locale, wilayaPrices: initialPrices, offices: initial }: Props) {
  const isRTL = locale === 'ar';
  const t = (en: string, ar: string) => (locale === 'ar' ? ar : en);

  // ── Home delivery prices ──────────────────────────────────────────────────
  const [homePrices, setHomePrices] = useState<Record<number, string>>(() =>
    initPriceStrings(initialPrices),
  );
  const [savingHome, setSavingHome] = useState(false);

  const saveHomePrices = async () => {
    const parsed = parsePrices(homePrices);
    if (!parsed) { toast.error(t('Invalid price value', 'قيمة سعر غير صالحة')); return; }
    setSavingHome(true);
    const { error } = await updateWilayaDeliveryPrices(parsed);
    setSavingHome(false);
    if (error) { toast.error(error); return; }
    toast.success(t('Home delivery prices saved', 'تم حفظ أسعار التوصيل للمنزل'));
  };

  // ── Offices ───────────────────────────────────────────────────────────────
  const [offices, setOffices] = useState<DeliveryOffice[]>(initial);

  // Which office has its price grid expanded
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Local price edits per office: officeId → {wilaya_code → string}
  const [officePriceEdits, setOfficePriceEdits] = useState<Record<string, Record<number, string>>>(
    () => {
      const init: Record<string, Record<number, string>> = {};
      for (const o of initial) {
        init[o.id] = initPriceStrings(o.prices);
      }
      return init;
    },
  );
  const [savingOfficePrices, setSavingOfficePrices] = useState<Record<string, boolean>>({});

  // Add / edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<DeliveryOffice | null>(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [saving, setSaving] = useState(false);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const saveOfficePrices = async (officeId: string) => {
    const parsed = parsePrices(officePriceEdits[officeId] ?? {});
    if (!parsed) { toast.error(t('Invalid price value', 'قيمة سعر غير صالحة')); return; }
    setSavingOfficePrices((prev) => ({ ...prev, [officeId]: true }));
    const { error } = await updateOfficePrices(officeId, parsed);
    setSavingOfficePrices((prev) => ({ ...prev, [officeId]: false }));
    if (error) { toast.error(error); return; }
    // Update local state so prices reflect saved values
    setOffices((prev) =>
      prev.map((o) => (o.id === officeId ? { ...o, prices: parsed } : o)),
    );
    toast.success(t('Prices saved', 'تم حفظ الأسعار'));
  };

  const openAdd = () => {
    setEditingOffice(null);
    setForm({ name: '', address: '' });
    setShowModal(true);
  };

  const openEdit = (office: DeliveryOffice) => {
    setEditingOffice(office);
    setForm({ name: office.name, address: office.address ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t('Office name is required', 'اسم المكتب مطلوب'));
      return;
    }
    const payload = { name: form.name.trim(), address: form.address.trim() };
    setSaving(true);

    if (editingOffice) {
      const { error } = await updateOffice(editingOffice.id, payload);
      setSaving(false);
      if (error) { toast.error(error); return; }
      setOffices((prev) =>
        prev.map((o) => (o.id === editingOffice.id ? { ...o, ...payload } : o)),
      );
      toast.success(t('Office updated', 'تم تحديث المكتب'));
    } else {
      const { error, id } = await createOffice(payload);
      setSaving(false);
      if (error || !id) { toast.error(error ?? 'Error'); return; }
      const newOffice: DeliveryOffice = {
        id,
        ...payload,
        is_active: true,
        created_at: new Date().toISOString(),
        prices: {},
      };
      setOffices((prev) => [...prev, newOffice]);
      setOfficePriceEdits((prev) => ({ ...prev, [id]: initPriceStrings({}) }));
      toast.success(t('Office added', 'تم إضافة المكتب'));
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Delete this office?', 'حذف هذا المكتب؟'))) return;
    const { error } = await deleteOffice(id);
    if (error) { toast.error(error); return; }
    setOffices((prev) => prev.filter((o) => o.id !== id));
    if (expandedId === id) setExpandedId(null);
    toast.success(t('Deleted', 'تم الحذف'));
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await toggleOfficeActive(id, !current);
    if (error) { toast.error(error); return; }
    setOffices((prev) => prev.map((o) => (o.id === id ? { ...o, is_active: !current } : o)));
  };

  return (
    <div className={`p-6 space-y-8 ${isRTL ? 'font-cairo' : ''}`}>
      <h1 className="text-2xl font-extrabold">{t('Delivery Settings', 'إعدادات التوصيل')}</h1>

      {/* ── Home delivery prices ── */}
      <section className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t('Home Delivery Prices', 'أسعار التوصيل للمنزل')}</h2>
          </div>
          <Button size="sm" className="gap-2" onClick={saveHomePrices} disabled={savingHome}>
            {savingHome && (
              <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <Save className="h-3.5 w-3.5" />
            {t('Save All', 'حفظ الكل')}
          </Button>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-4">
            {t(
              'Set the home delivery price per wilaya. 0 = free.',
              'حدد سعر التوصيل للمنزل لكل ولاية. 0 = مجاني.',
            )}
          </p>
          <WilayaPriceGrid
            locale={locale}
            prices={homePrices}
            onChange={(code, val) =>
              setHomePrices((prev) => ({ ...prev, [code]: val }))
            }
          />
        </div>
      </section>

      {/* ── Offices ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t('Delivery Offices', 'مكاتب التوصيل')}</h2>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            {t('Add Office', 'إضافة مكتب')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t(
            'Create an office then expand it to set per-wilaya prices.',
            'أنشئ مكتبًا ثم افتحه لضبط أسعار التوصيل لكل ولاية.',
          )}
        </p>

        {offices.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card py-12 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            {t('No offices yet', 'لا توجد مكاتب حتى الآن')}
          </div>
        ) : (
          <div className="space-y-2">
            {offices.map((office) => {
              const isExpanded = expandedId === office.id;
              const priceEdits = officePriceEdits[office.id] ?? initPriceStrings(office.prices);
              const isSaving = savingOfficePrices[office.id] ?? false;

              return (
                <div
                  key={office.id}
                  className="rounded-xl border border-border/60 bg-card overflow-hidden"
                >
                  {/* Office header row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(office.id)}
                      className="flex items-center gap-2 flex-1 text-start"
                    >
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className="font-medium text-sm">{office.name}</span>
                      {office.address && (
                        <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-xs">
                          — {office.address}
                        </span>
                      )}
                    </button>

                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggle(office.id, office.is_active)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition-colors ${
                        office.is_active
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {office.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                    </button>

                    <button
                      onClick={() => openEdit(office)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(office.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Expandable per-wilaya price grid */}
                  {isExpanded && (
                    <div className="border-t border-border/60 p-4 space-y-4 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {t(
                            'Set office delivery price per wilaya. 0 = free.',
                            'حدد سعر التوصيل عبر المكتب لكل ولاية. 0 = مجاني.',
                          )}
                        </p>
                        <Button
                          size="sm"
                          className="gap-2 shrink-0"
                          onClick={() => saveOfficePrices(office.id)}
                          disabled={isSaving}
                        >
                          {isSaving && (
                            <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          )}
                          <Save className="h-3.5 w-3.5" />
                          {t('Save', 'حفظ')}
                        </Button>
                      </div>
                      <WilayaPriceGrid
                        locale={locale}
                        prices={priceEdits}
                        onChange={(code, val) =>
                          setOfficePriceEdits((prev) => ({
                            ...prev,
                            [office.id]: { ...(prev[office.id] ?? {}), [code]: val },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Add/Edit modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-lg font-bold">
                {editingOffice ? t('Edit Office', 'تعديل المكتب') : t('Add Office', 'إضافة مكتب')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label={t('Office Name', 'اسم المكتب')}>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t('e.g. Yalidine', 'مثال: يالدين')}
                  className={inp}
                />
              </Field>
              <Field label={t('Address (optional)', 'العنوان (اختياري)')}>
                <input
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder={t('Street, district…', 'الشارع، الحي…')}
                  className={inp}
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                {t('Cancel', 'إلغاء')}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {editingOffice ? t('Update', 'تحديث') : t('Add', 'إضافة')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
