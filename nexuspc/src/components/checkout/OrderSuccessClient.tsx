'use client';

import Link from 'next/link';
import { CheckCircle2, Package, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface OrderSuccessClientProps {
  locale: string;
  orderNumber?: string;
  phone?: string;
}

export function OrderSuccessClient({ locale, orderNumber, phone }: OrderSuccessClientProps) {
  const t = useTranslations('checkout');
  const isRTL = locale === 'ar';

  return (
    <div className={`min-h-screen bg-zinc-950 flex items-center justify-center py-12 px-4 relative overflow-hidden ${isRTL ? 'font-cairo' : ''}`}>
      {/* Background diagonal grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(139,92,246,0.04) 0px, rgba(139,92,246,0.04) 1px, transparent 1px, transparent 60px)',
        }}
      />

      {/* Violet orb top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-emerald-500/8 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md text-center space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        </div>

        <div>
          <h1 className="font-display font-black text-4xl uppercase text-white mb-3">{t('successTitle')}</h1>
          {phone && (
            <p className="text-zinc-400 text-sm mt-2">
              {t('successMessage', { phone })}
            </p>
          )}
        </div>

        {/* Order number */}
        {orderNumber && (
          <div className="border border-white/10 bg-zinc-900 p-6">
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-2">{t('yourOrderNumber')}</p>
            <p className="font-display font-black text-3xl text-primary tracking-widest font-mono">{orderNumber}</p>
            <p className="text-xs text-zinc-500 mt-2">
              {locale === 'ar'
                ? 'احتفظ بهذا الرقم لتتبع طلبك'
                : 'Keep this number to track your order'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          {orderNumber && (
            <Link
              href={`/${locale}/track-order`}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full gap-2 rounded-none border border-white/20 text-zinc-200 hover:border-white/50')}
            >
              <Package className="h-4 w-4" />
              {t('trackOrder')}
            </Link>
          )}
          <Link
            href={`/${locale}/store`}
            className={cn(buttonVariants(), 'w-full gap-2 rounded-none bg-primary text-white')}
          >
            <Home className="h-4 w-4" />
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
