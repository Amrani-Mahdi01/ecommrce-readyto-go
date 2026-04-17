'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, ShoppingCart, PackageX, Star, Minus, Plus, Check, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/types/product';
import { toast } from 'sonner';

interface ProductDetailClientProps {
  product: Product;
  related: Product[];
  locale: string;
}

export function ProductDetailClient({ product, related, locale }: ProductDetailClientProps) {
  const t = useTranslations('product');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const { addItem } = useCart();
  const isRTL = locale === 'ar';

  const name = locale === 'ar' ? product.name_ar : product.name_en;
  const description = locale === 'ar' ? product.description_ar : product.description_en;
  const inStock = product.stock_qty > 0;
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_price!) * 100)
    : 0;

  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!inStock) return;
    for (let i = 0; i < qty; i++) addItem(product);
    toast.success(t('addedToCart'), { description: name });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleOrderNow = () => {
    if (!inStock) return;
    for (let i = 0; i < qty; i++) addItem(product);
    window.location.href = `/${locale}/checkout`;
  };

  const specEntries = Object.entries(product.specs ?? {}).filter(([, v]) => v !== null && v !== '');

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'font-cairo' : ''}`}>
      {/* Breadcrumbs */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <Link href={`/${locale}`} className="hover:text-foreground transition-colors">{tn('home')}</Link>
          {isRTL ? <ChevronLeft className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          <Link href={`/${locale}/store`} className="hover:text-foreground transition-colors">{tn('store')}</Link>
          {isRTL ? <ChevronLeft className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          <span className="text-foreground line-clamp-1 max-w-[200px]">{name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ── Image gallery ── */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div className="relative aspect-square border border-border bg-muted/20 overflow-hidden">
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={name}
                  fill
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                  <PackageX className="h-24 w-24" />
                </div>
              )}
              {hasDiscount && (
                <span className={`absolute top-4 bg-primary text-primary-foreground font-bold text-sm px-2 py-1 rounded-none ${isRTL ? 'right-4' : 'left-4'}`}>
                  -{discountPct}%
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-16 h-16 border-2 overflow-hidden bg-muted/20 transition-colors ${
                      selectedImage === i ? 'border-primary' : 'border-border/60 hover:border-primary/50'
                    }`}
                  >
                    <Image src={img} alt={`${name} ${i + 1}`} width={64} height={64} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div className={`flex flex-col gap-5 ${isRTL ? 'text-right' : ''}`}>
            {/* Brand + SKU */}
            <div className="flex items-center gap-3">
              {product.brand && (
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {product.brand}
                </span>
              )}
              {product.sku && (
                <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase leading-tight" dir={isRTL ? 'rtl' : 'ltr'}>
              {name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{t('noReviews')}</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-foreground">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compare_price!)}
                </span>
              )}
              {hasDiscount && (
                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-none px-2 py-0.5 text-sm font-bold">
                  {locale === 'ar' ? `وفّر ${discountPct}%` : `Save ${discountPct}%`}
                </span>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${inStock ? 'text-emerald-500' : 'text-destructive'}`}>
                <span className={`inline-block w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-destructive'}`} />
                {inStock ? `${t('inStock')} (${product.stock_qty} ${locale === 'ar' ? 'قطعة' : 'units'})` : t('outOfStock')}
              </span>
            </div>

            {/* Description */}
            {description && (
              <div
                className="rich-text text-sm text-muted-foreground border-t border-border/60 pt-4"
                dir={isRTL ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}

            {/* Qty + Add to cart */}
            <div className="flex items-center gap-3 border-t border-border/60 pt-4">
              {/* Quantity */}
              <div className={`flex items-center border border-border overflow-hidden ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={!inStock}
                  className="w-9 h-10 flex items-center justify-center hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock_qty, q + 1))}
                  disabled={!inStock}
                  className="w-9 h-10 flex items-center justify-center hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <Button
                size="lg"
                className="flex-1 gap-2 transition-all rounded-none"
                disabled={!inStock}
                onClick={handleAddToCart}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" />
                    {locale === 'ar' ? 'تمت الإضافة!' : 'Added!'}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    {inStock ? tc('addToCart') : tc('outOfStock')}
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="flex-1 gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-none"
                disabled={!inStock}
                onClick={handleOrderNow}
              >
                <Zap className="h-4 w-4 fill-current" />
                {locale === 'ar' ? 'اطلب الآن' : 'Order Now'}
              </Button>
            </div>

            {/* COD notice */}
            <div className={`flex items-start gap-2 bg-muted/30 border border-border p-3 text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
              <span className="text-lg leading-none">🚚</span>
              <span>
                {locale === 'ar'
                  ? 'الدفع عند الاستلام متاح في جميع ولايات الجزائر'
                  : 'Cash on Delivery available across all 58 Algerian wilayas'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Specs ── */}
        {specEntries.length > 0 && (
          <div className="mt-12">
            <h2 className={`font-display font-black text-xl uppercase mb-4 ${isRTL ? 'text-right' : ''}`}>{t('specs')}</h2>
            <div className="border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {specEntries.map(([key, value], i) => (
                    <tr key={key} className={i % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                      <td className={`px-4 py-2.5 font-medium text-muted-foreground w-1/3 ${isRTL ? 'text-right' : ''}`}>
                        {key}
                      </td>
                      <td className={`px-4 py-2.5 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                        {String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className={`font-display font-black text-xl uppercase mb-6 ${isRTL ? 'text-right' : ''}`}>{t('relatedProducts')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
