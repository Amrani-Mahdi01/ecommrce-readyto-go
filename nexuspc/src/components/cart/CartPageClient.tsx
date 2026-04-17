'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, PackageX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { buttonVariants as bv } from '@/components/ui/button';

export function CartPageClient({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const tco = useTranslations('checkout');
  const { items, totalPrice, updateQuantity, removeItem } = useCart();
  const isRTL = locale === 'ar';

  if (items.length === 0) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center py-12 ${isRTL ? 'font-cairo' : ''}`}>
        <div className="text-center space-y-5">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
            </div>
          </div>
          <h2 className="text-xl font-bold">{locale === 'ar' ? 'سلتك فارغة' : 'Your cart is empty'}</h2>
          <p className="text-sm text-muted-foreground">
            {locale === 'ar' ? 'أضف بعض المنتجات للمتابعة' : 'Add some products to continue'}
          </p>
          <Link href={`/${locale}/store`} className={cn(bv(), 'gap-2')}>
            <ShoppingBag className="h-4 w-4" />
            {locale === 'ar' ? 'تصفح المتجر' : 'Browse Store'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background py-8 ${isRTL ? 'font-cairo' : ''}`}>
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className={`text-2xl font-extrabold mb-8 ${isRTL ? 'text-right' : ''}`}>
          {t('cart')} ({items.reduce((s, i) => s + i.quantity, 0)})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(({ product, quantity }) => {
              const name = locale === 'ar' ? product.name_ar : product.name_en;
              const image = product.images[0] ?? null;
              return (
                <div key={product.id} className="flex gap-4 rounded-xl border border-border/60 bg-card p-4">
                  {/* Image */}
                  <Link href={`/${locale}/store/product/${product.slug}`} className="shrink-0 w-24 h-24 rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
                    {image ? (
                      <Image src={image} alt={name} width={96} height={96} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PackageX className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className={`flex-1 min-w-0 flex flex-col gap-1.5 ${isRTL ? 'text-right' : ''}`}>
                    {product.brand && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{product.brand}</span>
                    )}
                    <Link
                      href={`/${locale}/store/product/${product.slug}`}
                      className="text-sm font-semibold leading-snug hover:text-primary transition-colors line-clamp-2"
                    >
                      {name}
                    </Link>
                    <span className="text-base font-bold text-primary">{formatPrice(product.price)}</span>
                  </div>

                  {/* Controls */}
                  <div className="shrink-0 flex flex-col justify-between gap-3 items-end">
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className={`flex items-center border border-border/60 rounded-lg overflow-hidden ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock_qty}
                        className="w-8 h-8 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <h2 className={`font-semibold ${isRTL ? 'text-right' : ''}`}>{tco('orderSummary')}</h2>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tco('subtotal')}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tco('shipping')}</span>
                  <span className="text-emerald-500 font-medium">{tco('freeShipping')}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-base pt-3 border-t border-border/40">
                  <span>{tco('total')}</span>
                  <span className="text-primary text-lg">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Link
                href={`/${locale}/checkout`}
                className={cn(bv({ size: 'lg' }), 'w-full gap-2 justify-center')}
              >
                {locale === 'ar' ? 'إتمام الشراء' : 'Proceed to Checkout'}
                {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Link>

              <Link
                href={`/${locale}/store`}
                className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {tc('backToStore')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
