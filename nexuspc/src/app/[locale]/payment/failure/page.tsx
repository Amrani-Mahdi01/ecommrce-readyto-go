import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}

export default async function PaymentFailurePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { order } = await searchParams;
  const isRTL = locale === 'ar';

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${isRTL ? 'font-cairo' : ''}`}>
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold">
            {isRTL ? 'فشل الدفع' : 'Payment Failed'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL
              ? 'لم تتم معالجة دفعتك. يمكنك المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.'
              : "Your payment wasn't processed. You can try again or choose Cash on Delivery."}
          </p>
          {order && (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {isRTL ? 'رقم الطلب:' : 'Order ref:'} {order}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
          <Link
            href={`/${locale}/store`}
            className={cn(buttonVariants())}
          >
            {isRTL ? 'متابعة التسوق' : 'Continue Shopping'}
          </Link>
        </div>
      </div>
    </div>
  );
}
