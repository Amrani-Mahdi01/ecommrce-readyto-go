'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  orderId: string;
  locale: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  label?: string;
}

export function DownloadInvoiceButton({ orderId, locale, variant = 'outline', size = 'default', label }: Props) {
  const isRTL = locale === 'ar';
  const defaultLabel = isRTL ? 'تحميل الفاتورة' : 'Download Receipt';

  const handleClick = () => {
    window.open(`/${locale}/invoice/${orderId}`, '_blank');
  };

  return (
    <Button variant={variant} size={size} onClick={handleClick} className="gap-2">
      <Download className="h-4 w-4" />
      {label ?? defaultLabel}
    </Button>
  );
}
