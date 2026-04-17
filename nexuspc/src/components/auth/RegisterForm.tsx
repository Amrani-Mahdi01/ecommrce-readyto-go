'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { registerAction } from '@/app/actions/auth';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { useState } from 'react';

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations('auth');
  const isRTL = locale === 'ar';

  const [showPw, setShowPw] = useState(false);
  const [state, formAction, pending] = useActionState(registerAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success && state.redirect) {
      toast.success(locale === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      window.location.href = state.redirect;
    }
  }, [state]);

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center py-12 px-4 ${isRTL ? 'font-cairo' : ''}`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-primary font-extrabold text-2xl tracking-tight">
            NexusPC
          </Link>
          <h1 className="text-xl font-bold mt-4">{t('registerTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('registerSubtitle')}</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <form action={formAction} className="space-y-4">
            {/* Hidden locale */}
            <input type="hidden" name="locale" value={locale} />

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('fullName')}</label>
              <input
                name="fullName"
                type="text"
                required
                placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Your full name'}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('email')}</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('phone')}</label>
              <input
                name="phone"
                type="tel"
                required
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('password')}</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  dir="ltr"
                  className={`w-full h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${isRTL ? 'pl-10 pr-3' : 'pl-3 pr-10'}`}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRTL ? 'left-3' : 'right-3'}`}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block ${isRTL ? 'text-right' : ''}`}>{t('confirmPassword')}</label>
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={pending}>
              {pending
                ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <UserPlus className="h-4 w-4" />}
              {locale === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-muted-foreground shrink-0">
                {locale === 'ar' ? 'أو' : 'OR'}
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <GoogleAuthButton locale={locale} label={t('signInWithGoogle')} />
          </div>

          <div className="mt-5 pt-5 border-t border-border/60 text-center text-sm">
            <span className="text-muted-foreground">{t('haveAccount')} </span>
            <Link href={`/${locale}/login`} className="text-primary font-medium hover:underline">
              {locale === 'ar' ? 'سجّل دخولك' : 'Sign In'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
