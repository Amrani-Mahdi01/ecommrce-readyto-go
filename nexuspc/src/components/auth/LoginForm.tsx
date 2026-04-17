'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { loginAction } from '@/app/actions/auth';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations('auth');
  const isRTL = locale === 'ar';

  const [showPw, setShowPw] = useState(false);
  const [state, formAction, pending] = useActionState(loginAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success && state.redirect) {
      toast.success(t('loginSuccess'));
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
            <span className="font-display font-black text-lg uppercase tracking-widest text-white">NexusPC</span>
          </Link>
          <h1 className="font-display font-black text-3xl uppercase text-white mb-2">{t('loginTitle')}</h1>
          <p className="text-zinc-400 text-sm">{t('loginSubtitle')}</p>
        </div>

        {/* Form card */}
        <div className="rounded-none border border-white/10 bg-zinc-900 p-6 space-y-4">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />

            {/* Email */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium block text-white ${isRTL ? 'text-right' : ''}`}>{t('email')}</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                dir="ltr"
                className="w-full h-10 px-3 rounded-none border border-white/20 bg-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-primary focus:ring-0 focus:outline-none"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">{t('password')}</label>
                <button type="button" className="text-xs text-primary hover:underline">
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  dir="ltr"
                  className={`w-full h-10 rounded-none border border-white/20 bg-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:border-primary focus:ring-0 focus:outline-none ${isRTL ? 'pl-10 pr-3' : 'pl-3 pr-10'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className={`absolute top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white ${isRTL ? 'left-3' : 'right-3'}`}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" className="w-full gap-2 rounded-none" disabled={pending}>
              {pending
                ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <LogIn className="h-4 w-4" />}
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
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
            <span className="text-zinc-500">{t('noAccount')} </span>
            <Link href={`/${locale}/register`} className="text-primary font-medium hover:underline">
              {t('registerTitle')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
