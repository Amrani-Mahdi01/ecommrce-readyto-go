'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, Zap } from 'lucide-react';
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
    <div className={`min-h-screen bg-zinc-950 flex items-center justify-center py-12 px-4 relative overflow-hidden ${isRTL ? 'font-cairo' : ''}`}>
      {/* Diagonal grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(139,92,246,1) 0px, rgba(139,92,246,1) 1px, transparent 1px, transparent 60px)' }}
      />
      {/* Violet orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 fill-white text-white" />
            </div>
            <span className="font-black text-lg uppercase tracking-widest text-white">NexusPC</span>
          </Link>
          <h1 className="font-black text-3xl uppercase text-white mb-2">{t('registerTitle')}</h1>
          <p className="text-zinc-400 text-sm">{t('registerSubtitle')}</p>
        </div>

        {/* Form card */}
        <div className="rounded-none border border-white/10 bg-zinc-900 p-6 space-y-4">
          <form action={formAction} className="space-y-4">
            {/* Hidden locale */}
            <input type="hidden" name="locale" value={locale} />

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block text-white ${isRTL ? 'text-right' : ''}`}>{t('fullName')}</label>
              <input
                name="fullName"
                type="text"
                required
                placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Your full name'}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full h-10 px-3 rounded-none border border-white/20 bg-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-primary focus:ring-0 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block text-white ${isRTL ? 'text-right' : ''}`}>{t('email')}</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                dir="ltr"
                className="w-full h-10 px-3 rounded-none border border-white/20 bg-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-primary focus:ring-0 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block text-white ${isRTL ? 'text-right' : ''}`}>{t('phone')}</label>
              <input
                name="phone"
                type="tel"
                required
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="w-full h-10 px-3 rounded-none border border-white/20 bg-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-primary focus:ring-0 focus:outline-none"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block text-white ${isRTL ? 'text-right' : ''}`}>{t('password')}</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  dir="ltr"
                  className={`w-full h-10 rounded-none border border-white/20 bg-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-primary focus:ring-0 focus:outline-none ${isRTL ? 'pl-10 pr-3' : 'pl-3 pr-10'}`}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} className={`absolute top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white ${isRTL ? 'left-3' : 'right-3'}`}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block text-white ${isRTL ? 'text-right' : ''}`}>{t('confirmPassword')}</label>
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                dir="ltr"
                className="w-full h-10 px-3 rounded-none border border-white/20 bg-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-primary focus:ring-0 focus:outline-none"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" className="w-full gap-2 rounded-none" disabled={pending}>
              {pending
                ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <UserPlus className="h-4 w-4" />}
              {locale === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-zinc-600 shrink-0">
                {locale === 'ar' ? 'أو' : 'OR'}
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <GoogleAuthButton locale={locale} label={t('signInWithGoogle')} />
          </div>

          <div className="mt-5 pt-5 border-t border-white/10 text-center text-sm">
            <span className="text-zinc-500">{t('haveAccount')} </span>
            <Link href={`/${locale}/login`} className="text-primary font-medium hover:underline">
              {locale === 'ar' ? 'سجّل دخولك' : 'Sign In'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
