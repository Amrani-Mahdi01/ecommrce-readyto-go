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
    <div className={`min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden ${isRTL ? 'font-cairo' : ''}`}>
      {/* Background diagonal grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(139,92,246,0.04) 0px, rgba(139,92,246,0.04) 1px, transparent 1px, transparent 60px)',
        }}
      />

      {/* Red/destructive orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-red-500/8 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 border-2 border-destructive flex items-center justify-center mx-auto">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-black text-4xl uppercase text-white">
            {isRTL ? 'فشل الدفع' : 'Payment Failed'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {isRTL
              ? 'لم تتم معالجة دفعتك. يمكنك المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.'
              : "Your payment wasn't processed. You can try again or choose Cash on Delivery."}
          </p>
          {order && (
            <p className="text-xs text-zinc-600 font-mono mt-1">
              {isRTL ? 'رقم الطلب:' : 'Order ref:'} {order}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className={cn(buttonVariants({ variant: 'outline' }), 'rounded-none')}
          >
            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
          <Link
            href={`/${locale}/store`}
            className={cn(buttonVariants(), 'rounded-none')}
          >
            {isRTL ? 'متابعة التسوق' : 'Continue Shopping'}
          </Link>
        </div>
      </div>
    </div>
  );
}
