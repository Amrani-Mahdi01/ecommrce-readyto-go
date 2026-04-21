'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  locale: string;
}

export function CartDrawer({ locale }: CartDrawerProps) {
  const { isOpen, close } = useCartDrawer();
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart();
  const isRTL = locale === 'ar';
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={close}
        className={cn(
          'fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-[90] w-full max-w-sm bg-background border-l border-border/40 shadow-2xl flex flex-col transition-transform duration-300 ease-out',
          isRTL ? 'left-0 border-r border-l-0' : 'right-0',
          isOpen
            ? 'translate-x-0'
            : isRTL ? '-translate-x-full' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="font-bold uppercase tracking-[0.1em] text-sm">
              {isRTL ? 'سلة المشتريات' : 'Your Cart'}
            </span>
            {totalItems > 0 && (
              <span className="h-5 min-w-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={close}
            className="h-8 w-8 flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="w-16 h-16 bg-muted/40 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {isRTL ? 'السلة فارغة' : 'Your cart is empty'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL ? 'ابدأ التسوق لإضافة منتجات' : 'Start shopping to add products'}
                </p>
              </div>
              <Link
                href={`/${locale}/store`}
                onClick={close}
                className="text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-2"
              >
                {isRTL ? 'تصفح المنتجات' : 'Browse store'}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/30">
              {items.map(({ product, quantity }) => {
                const name = locale === 'ar' ? product.name_ar : product.name_en;
                const image = product.images?.[0] ?? null;
                return (
                  <li key={product.id} className="flex gap-3 p-4 hover:bg-muted/20 transition-colors">
                    {/* Image */}
                    <Link
                      href={`/${locale}/store/product/${product.slug}`}
                      onClick={close}
                      className="shrink-0 w-16 h-16 bg-muted/30 overflow-hidden"
                    >
                      <Image
                        src={image ?? '/product-placeholder.svg'}
                        alt={name}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain p-1"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <Link
                        href={`/${locale}/store/product/${product.slug}`}
                        onClick={close}
                        className="text-xs font-medium leading-snug line-clamp-2 hover:text-primary transition-colors"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        {name}
                      </Link>
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(product.price * quantity)}
                      </span>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1 mt-auto">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center border border-border/60 hover:border-primary/50 hover:bg-accent transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="h-6 w-7 flex items-center justify-center text-xs font-bold border border-border/40 bg-muted/30">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock_qty}
                          className="h-6 w-6 flex items-center justify-center border border-border/60 hover:border-primary/50 hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="ml-auto h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-border/40 p-5 space-y-3 bg-card/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                {isRTL ? 'المجموع' : 'Total'}
              </span>
              <span className="text-lg font-black">{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isRTL ? 'الشحن يُحسب عند الطلب' : 'Shipping calculated at checkout'}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/${locale}/cart`}
                onClick={close}
                className="flex-1 h-10 flex items-center justify-center border border-border/60 text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors"
              >
                {isRTL ? 'السلة' : 'View Cart'}
              </Link>
              <Link
                href={`/${locale}/checkout`}
                onClick={close}
                className="flex-1 h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
              >
                {isRTL ? 'الدفع' : 'Checkout'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
