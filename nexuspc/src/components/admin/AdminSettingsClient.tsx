'use client';

import { useState } from 'react';
import { Eye, EyeOff, Save, Sparkles, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { saveAISettings, saveChargilySettings } from '@/app/actions/settings';

interface Props {
  locale: string;
  initial: {
    enabled: boolean;
    keyIsSet: boolean;
    maskedKey: string;
  };
  chargilyInitial: {
    onlineEnabled: boolean;
    apiKeyIsSet: boolean;
    maskedApiKey: string;
    secretIsSet: boolean;
    maskedSecret: string;
  };
}

export function AdminSettingsClient({ locale, initial, chargilyInitial }: Props) {
  const isRTL = locale === 'ar';

  // ── AI ────────────────────────────────────────────────────────────────────
  const [enabled, setEnabled]           = useState(initial.enabled);
  const [savingToggle, setSavingToggle] = useState(false);
  const [apiKey, setApiKey]             = useState('');
  const [showKey, setShowKey]           = useState(false);
  const [savingKey, setSavingKey]       = useState(false);

  // ── Chargily ──────────────────────────────────────────────────────────────
  const [onlineEnabled, setOnlineEnabled]               = useState(chargilyInitial.onlineEnabled);
  const [savingOnlineToggle, setSavingOnlineToggle]     = useState(false);

  const [chargilyApiKey, setChargilyApiKey]         = useState('');
  const [showChargilyApiKey, setShowChargilyApiKey] = useState(false);
  const [savingChargilyApiKey, setSavingChargilyApiKey] = useState(false);

  const [chargilySecret, setChargilySecret]         = useState('');
  const [showChargilySecret, setShowChargilySecret] = useState(false);
  const [savingChargilySecret, setSavingChargilySecret] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────

  const handleSaveToggle = async () => {
    setSavingToggle(true);
    const result = await saveAISettings({ enabled, apiKey: null });
    setSavingToggle(false);
    if (result.error) toast.error(result.error);
    else toast.success(enabled
      ? (isRTL ? 'تم تفعيل الذكاء الاصطناعي' : 'AI enabled')
      : (isRTL ? 'تم تعطيل الذكاء الاصطناعي' : 'AI disabled'));
  };

  const handleSaveGroqKey = async () => {
    if (!apiKey.trim()) {
      toast.error(isRTL ? 'أدخل المفتاح أولاً' : 'Enter an API key first');
      return;
    }
    setSavingKey(true);
    const result = await saveAISettings({ enabled, apiKey: apiKey.trim() });
    setSavingKey(false);
    if (result.error) { toast.error(result.error); }
    else { toast.success(isRTL ? 'تم حفظ المفتاح' : 'API key saved'); setApiKey(''); }
  };

  const handleSaveOnlineToggle = async () => {
    setSavingOnlineToggle(true);
    const result = await saveChargilySettings({ onlineEnabled, apiKey: null, webhookSecret: null });
    setSavingOnlineToggle(false);
    if (result.error) toast.error(result.error);
    else toast.success(onlineEnabled
      ? (isRTL ? 'تم تفعيل الدفع الإلكتروني' : 'Online payment enabled')
      : (isRTL ? 'تم تعطيل الدفع الإلكتروني' : 'Online payment disabled'));
  };

  const handleSaveChargilyApiKey = async () => {
    if (!chargilyApiKey.trim()) {
      toast.error(isRTL ? 'أدخل المفتاح أولاً' : 'Enter an API key first');
      return;
    }
    setSavingChargilyApiKey(true);
    const result = await saveChargilySettings({ apiKey: chargilyApiKey.trim(), webhookSecret: null });
    setSavingChargilyApiKey(false);
    if (result.error) { toast.error(result.error); }
    else { toast.success(isRTL ? 'تم حفظ مفتاح Chargily' : 'Chargily API key saved'); setChargilyApiKey(''); }
  };

  const handleSaveChargilySecret = async () => {
    if (!chargilySecret.trim()) {
      toast.error(isRTL ? 'أدخل السر أولاً' : 'Enter the webhook secret first');
      return;
    }
    setSavingChargilySecret(true);
    const result = await saveChargilySettings({ apiKey: null, webhookSecret: chargilySecret.trim() });
    setSavingChargilySecret(false);
    if (result.error) { toast.error(result.error); }
    else { toast.success(isRTL ? 'تم حفظ سر Webhook' : 'Webhook secret saved'); setChargilySecret(''); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── AI toggle ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isRTL ? 'تفعيل الذكاء الاصطناعي' : 'AI Features'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL
                  ? 'توليد وصف المنتج + مساعد بناء الكمبيوتر'
                  : 'Product description generator & PC build assistant'}
              </p>
            </div>
          </div>
          <button
            type="button"
            dir="ltr"
            onClick={() => setEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            role="switch"
            aria-checked={enabled}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className={`flex items-center justify-between gap-3 pt-1 border-t border-border/40 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <p className={`text-xs ${enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
            {enabled
              ? (isRTL ? 'الذكاء الاصطناعي مفعّل' : 'AI is currently enabled')
              : (isRTL ? 'الذكاء الاصطناعي معطّل — الأزرار ستختفي من واجهة المتجر' : 'AI is disabled — buttons will be hidden across the store')}
          </p>
          <Button size="sm" onClick={handleSaveToggle} disabled={savingToggle} className="gap-2 shrink-0">
            {savingToggle
              ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Save className="h-3.5 w-3.5" />}
            {isRTL ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>

      {/* ── Groq API key ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold">
            {isRTL ? 'مفتاح Groq API' : 'Groq API Key'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRTL
              ? 'يُستخدم لتوليد الوصف ومساعد البناء. احصل عليه من console.groq.com'
              : 'Used for description generation and the PC build assistant. Get it from console.groq.com'}
          </p>
        </div>
        {initial.keyIsSet && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            {isRTL ? 'المفتاح الحالي:' : 'Current key:'}{' '}
            <span className="font-mono">{initial.maskedKey}</span>
          </div>
        )}
        <KeyInput
          value={apiKey}
          onChange={setApiKey}
          show={showKey}
          onToggleShow={() => setShowKey(v => !v)}
          placeholder={initial.keyIsSet ? '••••••••••••' : 'gsk_...'}
          isRTL={isRTL}
          label={initial.keyIsSet
            ? (isRTL ? 'تغيير المفتاح' : 'Replace key')
            : (isRTL ? 'أدخل المفتاح' : 'Enter API key')}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSaveGroqKey} disabled={savingKey || !apiKey.trim()} className="gap-2">
            {savingKey
              ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Save className="h-3.5 w-3.5" />}
            {isRTL ? 'حفظ المفتاح' : 'Save Key'}
          </Button>
        </div>
      </div>

      {/* ── Chargily Pay ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Chargily Pay</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? 'بوابة الدفع الجزائرية — Edahabia و CIB. احصل على المفاتيح من pay.chargily.net'
                : 'Algerian payment gateway — Edahabia & CIB. Get keys from pay.chargily.net'}
            </p>
          </div>
        </div>

        {/* Online payment toggle */}
        <div className="pt-1 border-t border-border/40 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                {isRTL ? 'تفعيل الدفع الإلكتروني' : 'Online Payment'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL
                  ? 'عند التعطيل، تختفي خيار الدفع الإلكتروني من صفحة الدفع'
                  : 'When disabled, the online payment option is hidden from checkout'}
              </p>
            </div>
            <button
              type="button"
              dir="ltr"
              onClick={() => setOnlineEnabled(v => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${onlineEnabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
              role="switch"
              aria-checked={onlineEnabled}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${onlineEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <p className={`text-xs ${onlineEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              {onlineEnabled
                ? (isRTL ? 'الدفع الإلكتروني مفعّل' : 'Online payment is active')
                : (isRTL ? 'الدفع الإلكتروني معطّل — COD فقط' : 'Online payment disabled — COD only')}
            </p>
            <Button size="sm" onClick={handleSaveOnlineToggle} disabled={savingOnlineToggle} className="gap-2 shrink-0">
              {savingOnlineToggle
                ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Save className="h-3.5 w-3.5" />}
              {isRTL ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>

        {/* API key section */}
        <div className="space-y-3 pt-1 border-t border-border/40">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isRTL ? 'مفتاح API' : 'API Key'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? 'مفتاح اختبار: test_sk_... — مفتاح حقيقي: sk_... — يتم التبديل تلقائياً'
                : 'Test key starts with test_sk_ — Live key starts with sk_ — mode switches automatically'}
            </p>
          </div>
          {chargilyInitial.apiKeyIsSet && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              {isRTL ? 'المفتاح الحالي:' : 'Current key:'}{' '}
              <span className="font-mono">{chargilyInitial.maskedApiKey}</span>
            </div>
          )}
          <KeyInput
            value={chargilyApiKey}
            onChange={setChargilyApiKey}
            show={showChargilyApiKey}
            onToggleShow={() => setShowChargilyApiKey(v => !v)}
            placeholder={chargilyInitial.apiKeyIsSet ? '••••••••••••' : 'test_sk_... or sk_...'}
            isRTL={isRTL}
            label={chargilyInitial.apiKeyIsSet
              ? (isRTL ? 'تغيير المفتاح' : 'Replace key')
              : (isRTL ? 'أدخل مفتاح API' : 'Enter API key')}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveChargilyApiKey} disabled={savingChargilyApiKey || !chargilyApiKey.trim()} className="gap-2">
              {savingChargilyApiKey
                ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Save className="h-3.5 w-3.5" />}
              {isRTL ? 'حفظ المفتاح' : 'Save Key'}
            </Button>
          </div>
        </div>

        {/* Webhook secret section */}
        <div className="space-y-3 pt-1 border-t border-border/40">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isRTL ? 'سر Webhook' : 'Webhook Secret'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? 'يجب أن يطابق السر المضبوط في لوحة Chargily بالضبط وإلا ستفشل الـ Webhooks'
                : 'Must exactly match the secret set on your Chargily dashboard — webhooks will fail otherwise'}
            </p>
          </div>

          {/* Warning banner */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {isRTL
                ? 'بعد التغيير، تأكد من تحديث السر في إعدادات Webhook على موقع Chargily أيضاً'
                : 'After saving, make sure to update the secret in your Chargily webhook settings too'}
            </span>
          </div>

          {chargilyInitial.secretIsSet && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              {isRTL ? 'السر الحالي:' : 'Current secret:'}{' '}
              <span className="font-mono">{chargilyInitial.maskedSecret}</span>
            </div>
          )}
          <KeyInput
            value={chargilySecret}
            onChange={setChargilySecret}
            show={showChargilySecret}
            onToggleShow={() => setShowChargilySecret(v => !v)}
            placeholder={chargilyInitial.secretIsSet ? '••••••••••••' : 'test_sk_... or sk_...'}
            isRTL={isRTL}
            label={chargilyInitial.secretIsSet
              ? (isRTL ? 'تغيير السر' : 'Replace secret')
              : (isRTL ? 'أدخل السر' : 'Enter secret')}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveChargilySecret} disabled={savingChargilySecret || !chargilySecret.trim()} className="gap-2">
              {savingChargilySecret
                ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Save className="h-3.5 w-3.5" />}
              {isRTL ? 'حفظ السر' : 'Save Secret'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared key input component ────────────────────────────────────────────────
function KeyInput({
  value, onChange, show, onToggleShow, placeholder, isRTL, label,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
  isRTL: boolean;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          dir="ltr"
          className={`w-full h-10 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/50 ${isRTL ? 'pl-10 pr-3' : 'pl-3 pr-10'}`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${isRTL ? 'left-3' : 'right-3'}`}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
