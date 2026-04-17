import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { DownloadInvoiceButton } from '@/components/order/DownloadInvoiceButton';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}

async function getOrderId(orderId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single() as any;
    // Accept pending_payment too — Chargily redirects here before webhook fires
    const allowedStatuses = ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered'];
    if (data && allowedStatuses.includes(data.status)) return data.id;
    return null;
  } catch {
    return null;
  }
}

export default async function PaymentSuccessPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { order } = await searchParams;
  const isRTL = locale === 'ar';

  // Try to resolve the order for the download button
  // The `order` param is the orderId (UUID) set in chargily success_url
  const invoiceOrderId = order ? await getOrderId(order) : null;

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${isRTL ? 'font-cairo' : ''}`}>
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold">
            {isRTL ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL
              ? 'تم استلام دفعتك وسيتم تجهيز طلبك قريباً.'
              : 'Your payment has been received and your order will be processed shortly.'}
          </p>
          {order && (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {isRTL ? 'رقم الطلب:' : 'Order ref:'} {order}
            </p>
          )}
        </div>

        {/* Download receipt button — only shown once webhook confirms the order */}
        {invoiceOrderId && (
          <div className="flex justify-center">
            <DownloadInvoiceButton
              orderId={invoiceOrderId}
              locale={locale}
              variant="default"
              size="lg"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
          <Link
            href={`/${locale}/store`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {isRTL ? 'تسوق المزيد' : 'Continue Shopping'}
          </Link>
        </div>
      </div>
    </div>
  );
}
