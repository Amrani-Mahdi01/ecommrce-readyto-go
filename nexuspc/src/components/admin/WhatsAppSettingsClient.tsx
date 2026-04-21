'use client';

import { useState } from 'react';
import { Eye, EyeOff, Save, Copy, CheckCheck, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { saveWhatsAppSettings } from '@/app/actions/whatsapp';

interface Props {
  locale: string;
  siteUrl: string;
  initial: {
    enabled: boolean;
    sidIsSet: boolean;
    maskedSid: string;
    tokenIsSet: boolean;
    maskedToken: string;
    phoneIsSet: boolean;
    phone: string;
    botName: string;
  };
}

export function WhatsAppSettingsClient({ locale, siteUrl, initial }: Props) {
  const isRTL = locale === 'ar';
  const webhookUrl = `${siteUrl}/api/whatsapp/webhook`;

  const [enabled, setEnabled]       = useState(initial.enabled);
  const [savingToggle, setSavingToggle] = useState(false);

  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken]   = useState('');
  const [phoneNumber, setPhoneNumber] = useState(initial.phone || '');
  const [botName, setBotName]       = useState(initial.botName || '');
  const [showToken, setShowToken]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [copied, setCopied]         = useState(false);

  const handleToggle = async () => {
    setSavingToggle(true);
    const result = await saveWhatsAppSettings({ enabled });
    setSavingToggle(false);
    if (result.error) toast.error(result.error);
    else toast.success(enabled
      ? (isRTL ? 'تم تفعيل بوت واتساب' : 'WhatsApp bot enabled')
      : (isRTL ? 'تم تعطيل بوت واتساب' : 'WhatsApp bot disabled'));
  };

  const handleSaveCredentials = async () => {
    setSaving(true);
    const result = await saveWhatsAppSettings({
      accountSid:  accountSid.trim()  || null,
      authToken:   authToken.trim()   || null,
      phoneNumber: phoneNumber.trim() || null,
      botName:     botName.trim()     || null,
    });
    setSaving(false);
    if (result.error) { toast.error(result.error); }
    else {
      toast.success(isRTL ? 'تم حفظ إعدادات واتساب' : 'WhatsApp settings saved');
      setAccountSid('');
      setAuthToken('');
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  const isConnected = initial.sidIsSet && initial.tokenIsSet && initial.phoneIsSet;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5 lg:col-span-2">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled && isConnected ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {isRTL ? 'بوت واتساب (Twilio + Groq)' : 'WhatsApp Bot (Twilio + Groq)'}
              </p>
              {isConnected && (
                <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-2 py-0.5 font-semibold">
                  {isRTL ? 'متصل' : 'Connected'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? 'ردود ذكاء اصطناعي على رسائل العملاء عبر واتساب'
                : 'AI replies to customer messages on WhatsApp using your product catalog'}
            </p>
          </div>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            dir="ltr"
            onClick={() => setEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${enabled ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
            role="switch"
            aria-checked={enabled}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <Button size="sm" onClick={handleToggle} disabled={savingToggle} variant="outline" className="gap-2 shrink-0">
            {savingToggle ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isRTL ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Webhook URL — the most important part */}
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 space-y-2">
        <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
          {isRTL ? 'رابط الـ Webhook — انسخه إلى Twilio' : 'Your Webhook URL — paste this into Twilio'}
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-background border border-border rounded-lg px-3 py-2 text-foreground truncate">
            {webhookUrl}
          </code>
          <button
            type="button"
            onClick={copyWebhook}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
          >
            {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? (isRTL ? 'تم النسخ!' : 'Copied!') : (isRTL ? 'نسخ' : 'Copy')}
          </button>
        </div>
      </div>

      {/* Step-by-step setup guide */}
      <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {isRTL ? 'خطوات الإعداد' : 'Setup Steps'}
        </p>
        <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
          {[
            isRTL
              ? ['١', 'افتح Twilio Console', 'https://console.twilio.com', '→ سجّل دخول أو أنشئ حساباً مجاناً']
              : ['1', 'Open Twilio Console', 'https://console.twilio.com', '→ sign in or create a free account'],
            isRTL
              ? ['٢', 'فعّل WhatsApp Sandbox', null, 'Messaging → Try it out → Send a WhatsApp message']
              : ['2', 'Enable WhatsApp Sandbox', null, 'Messaging → Try it out → Send a WhatsApp message'],
            isRTL
              ? ['٣', 'الصق رابط Webhook', null, 'في حقل "When a message comes in" → الصق الرابط أعلاه']
              : ['3', 'Paste the Webhook URL', null, 'In "When a message comes in" field → paste the URL above'],
            isRTL
              ? ['٤', 'انسخ بيانات الاعتماد', null, 'Account SID و Auth Token من الصفحة الرئيسية لـ Twilio']
              : ['4', 'Copy your credentials', null, 'Account SID and Auth Token from your Twilio dashboard home'],
            isRTL
              ? ['٥', 'أدخل البيانات أدناه واحفظ', null, 'ثم فعّل البوت بالمفتاح في الأعلى']
              : ['5', 'Enter credentials below and save', null, 'Then flip the toggle above to enable the bot'],
          ].map(([step, title, link, desc]) => (
            <li key={step as string} className="flex items-start gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold mt-0.5">
                {step}
              </span>
              <span>
                {link
                  ? <a href={link as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">{title}<ExternalLink className="h-2.5 w-2.5" /></a>
                  : <span className="text-foreground font-medium">{title}</span>
                }
                {' '}{desc}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Credentials form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-border/40">
        {/* Account SID */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {isRTL ? 'Account SID' : 'Account SID'}
          </label>
          {initial.sidIsSet && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              {isRTL ? 'الحالي:' : 'Current:'} <span className="font-mono">{initial.maskedSid}</span>
            </div>
          )}
          <input
            type="text"
            value={accountSid}
            onChange={e => setAccountSid(e.target.value)}
            placeholder={initial.sidIsSet ? '••••••••••••' : 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
            dir="ltr"
            className="w-full h-10 rounded-lg border border-input bg-background text-sm font-mono px-3 focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {/* Auth Token */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {isRTL ? 'Auth Token' : 'Auth Token'}
          </label>
          {initial.tokenIsSet && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              {isRTL ? 'الحالي:' : 'Current:'} <span className="font-mono">{initial.maskedToken}</span>
            </div>
          )}
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={authToken}
              onChange={e => setAuthToken(e.target.value)}
              placeholder={initial.tokenIsSet ? '••••••••••••' : 'your_auth_token'}
              dir="ltr"
              className="w-full h-10 rounded-lg border border-input bg-background text-sm font-mono pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* WhatsApp phone number */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {isRTL ? 'رقم واتساب (Twilio)' : 'WhatsApp Phone Number (Twilio)'}
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            placeholder="whatsapp:+14155238886"
            dir="ltr"
            className="w-full h-10 rounded-lg border border-input bg-background text-sm font-mono px-3 focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <p className="text-[10px] text-muted-foreground">
            {isRTL ? 'الرقم الموجود في Twilio Sandbox بصيغة whatsapp:+1...' : 'The number from Twilio Sandbox, format: whatsapp:+1...'}
          </p>
        </div>

        {/* Bot name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {isRTL ? 'اسم البوت' : 'Bot Name'}
          </label>
          <input
            type="text"
            value={botName}
            onChange={e => setBotName(e.target.value)}
            placeholder={isRTL ? 'مساعد المتجر' : 'Store Assistant'}
            className="w-full h-10 rounded-lg border border-input bg-background text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <p className="text-[10px] text-muted-foreground">
            {isRTL ? 'الاسم الذي يعرّف به البوت نفسه في الرسائل' : 'Name the bot uses when greeting customers'}
          </p>
        </div>
      </div>

      {/* Groq key reminder */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
        <span className="text-base leading-none">💡</span>
        <span>
          {isRTL
            ? 'البوت يستخدم مفتاح Groq API المحفوظ في قسم AI أعلاه. تأكد من إدخاله هناك أولاً.'
            : 'The bot reuses the Groq API key saved in the AI section above. Make sure it\'s set there first.'}
        </span>
      </div>

      <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
        <Button
          onClick={handleSaveCredentials}
          disabled={saving || (!accountSid.trim() && !authToken.trim() && !phoneNumber.trim() && !botName.trim())}
          className="gap-2"
        >
          {saving
            ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <Save className="h-3.5 w-3.5" />}
          {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
