'use client';

import { useState } from 'react';
import { Plus, X, Trash2, Tag, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import {
  createPromoCode,
  togglePromoActive,
  deletePromoCode,
} from '@/app/actions/promo';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface FormState {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  usage_limit: string;
  expires_at: string;
}

const empty: FormState = {
  code: '',
  discount_type: 'percent',
  discount_value: '10',
  min_order_amount: '',
  usage_limit: '',
  expires_at: '',
};

export function AdminPromosClient({
  locale,
  promos: initial,
}: {
  locale: string;
  promos: PromoCode[];
}) {
  const isRTL = locale === 'ar';
  const [promos, setPromos] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast.error('Code and discount value are required');
      return;
    }
    setSaving(true);
    const result = await createPromoCode({
      code: form.code,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      expires_at: form.expires_at || null,
    });
    setSaving(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(locale === 'ar' ? 'تم إنشاء الكود' : 'Promo code created');
    setShowModal(false);
    setForm(empty);
    // Reload from server — optimistic add with partial data
    window.location.reload();
  };

  const handleToggle = async (id: string, current: boolean) => {
    const result = await togglePromoActive(id, !current);
    if (result.error) { toast.error(result.error); return; }
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'حذف هذا الكود؟' : 'Delete this promo code?')) return;
    const result = await deletePromoCode(id);
    if (result.error) { toast.error(result.error); return; }
    setPromos((prev) => prev.filter((p) => p.id !== id));
    toast.success(locale === 'ar' ? 'تم الحذف' : 'Deleted');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={`p-6 space-y-5 ${isRTL ? 'font-cairo' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">
          {locale === 'ar' ? 'أكواد الخصم' : 'Promo Codes'}
        </h1>
        <Button size="sm" className="gap-1.5" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          {locale === 'ar' ? 'إنشاء كود' : 'New Code'}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              {['Code', 'Discount', 'Min Order', 'Usage', 'Expires', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                  <Tag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  {locale === 'ar' ? 'لا توجد أكواد' : 'No promo codes yet'}
                </td>
              </tr>
            ) : (
              promos.map((p) => (
                <tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary tracking-widest">{p.code}</span>
                      <button
                        onClick={() => copyCode(p.code)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy"
                      >
                        {copied === p.code ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {p.discount_type === 'percent'
                      ? `${p.discount_value}%`
                      : formatPrice(p.discount_value)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {p.min_order_amount ? formatPrice(p.min_order_amount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={p.usage_limit && p.usage_count >= p.usage_limit ? 'text-destructive' : ''}>
                      {p.usage_count}
                      {p.usage_limit ? ` / ${p.usage_limit}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.expires_at ? p.expires_at.slice(0, 10) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(p.id, p.is_active)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        p.is_active
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="text-lg font-bold">
                {locale === 'ar' ? 'إنشاء كود خصم' : 'Create Promo Code'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field label="Code">
                <input
                  value={form.code}
                  onChange={set('code')}
                  placeholder="SUMMER20"
                  className={`${inp} uppercase font-mono tracking-widest`}
                  onInput={(e) => {
                    (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase();
                  }}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Discount Type">
                  <select value={form.discount_type} onChange={set('discount_type')} className={inp}>
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (DZD)</option>
                  </select>
                </Field>
                <Field label={form.discount_type === 'percent' ? 'Percent Off' : 'Amount Off (DZD)'}>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={set('discount_value')}
                    min="1"
                    max={form.discount_type === 'percent' ? '100' : undefined}
                    className={inp}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Min Order (DZD)">
                  <input type="number" value={form.min_order_amount} onChange={set('min_order_amount')} placeholder="Optional" className={inp} />
                </Field>
                <Field label="Usage Limit">
                  <input type="number" value={form.usage_limit} onChange={set('usage_limit')} placeholder="Unlimited" className={inp} />
                </Field>
              </div>

              <Field label="Expires At">
                <input type="date" value={form.expires_at} onChange={set('expires_at')} className={inp} />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {locale === 'ar' ? 'إنشاء' : 'Create'}
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
