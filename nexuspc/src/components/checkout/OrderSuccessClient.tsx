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
    <div className={`min-h-screen bg-background flex items-center justify-center py-12 px-4 ${isRTL ? 'font-cairo' : ''}`}>
      <div className="w-full max-w-md text-center space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold">{t('successTitle')}</h1>
          {phone && (
            <p className="text-sm text-muted-foreground mt-2">
              {t('successMessage', { phone })}
            </p>
          )}
        </div>

        {/* Order number */}
        {orderNumber && (
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1">{t('yourOrderNumber')}</p>
            <p className="text-2xl font-bold font-mono text-primary tracking-widest">{orderNumber}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {locale === 'ar'
                ? 'احتفظ بهذا الرقم لتتبع طلبك'
                : 'Keep this number to track your order'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {orderNumber && (
            <Link
              href={`/${locale}/track-order`}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full gap-2')}
            >
              <Package className="h-4 w-4" />
              {t('trackOrder')}
            </Link>
          )}
          <Link
            href={`/${locale}/store`}
            className={cn(buttonVariants(), 'w-full gap-2')}
          >
            <Home className="h-4 w-4" />
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
