'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  orderId: string;
  locale: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  label?: string;
  iconOnly?: boolean;
}

export function DownloadInvoiceButton({ orderId, locale, variant = 'outline', size = 'default', label, iconOnly }: Props) {
  const isRTL = locale === 'ar';
  const defaultLabel = isRTL ? 'تحميل الفاتورة' : 'Download Receipt';

  const handleClick = () => {
    window.open(`/${locale}/invoice/${orderId}`, '_blank');
  };

  return (
    <Button variant={variant} size={size} onClick={handleClick} className="gap-2" title={iconOnly ? defaultLabel : undefined}>
      <Download className="h-4 w-4" />
      {!iconOnly && (label ?? defaultLabel)}
    </Button>
  );
}
