'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/product';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  locale: string;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('product');
  const tc = useTranslations('common');
  const { addItem } = useCart();
  const isRTL = locale === 'ar';

  const name = locale === 'ar' ? product.name_ar : product.name_en;
  const image = product.images[0] ?? null;
  const inStock = product.stock_qty > 0;
  const reviewCount = product.review_count ?? 0;
  const avgRating   = product.avg_rating   ?? 0;
  const filledStars = Math.round(avgRating);
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_price!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(product);
    toast.success(t('addedToCart'), { description: name });
  };

  const handleOrderNow = () => {
    if (!inStock) return;
    addItem(product);
    window.location.href = `/${locale}/checkout`;
  };

  return (
    <div className={`group/card relative flex flex-col h-full border border-border bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden ${isRTL ? 'font-cairo' : ''}`}>
      {/* Discount badge — flips side for RTL */}
      {hasDiscount && (
        <div className={`absolute top-2 z-10 ${isRTL ? 'right-2' : 'left-2'}`}>
          <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-none">
            -{discountPct}%
          </Badge>
        </div>
      )}

      {/* Image */}
      <Link href={`/${locale}/store/product/${product.slug}`} className="block aspect-square overflow-hidden bg-muted/30">
        <Image
          src={image ?? '/product-placeholder.svg'}
          alt={name}
          width={400}
          height={400}
          className="w-full h-full object-contain p-4 group-hover/card:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Content */}
      <div className={`flex flex-col gap-2 p-3 flex-1 ${isRTL ? 'text-right' : ''}`}>
        {/* Brand */}
        {product.brand && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            {product.brand}
          </span>
        )}

        {/* Name */}
        <Link
          href={`/${locale}/store/product/${product.slug}`}
          className="text-sm font-medium leading-snug line-clamp-2 hover:text-primary transition-colors"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < filledStars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
            />
          ))}
          <span className={`text-[10px] text-muted-foreground ${isRTL ? 'mr-1' : 'ml-1'}`}>
            {reviewCount > 0 ? `(${reviewCount})` : ''}
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compare_price!)}
              </span>
            )}
          </div>
        </div>

        {/* Stock status */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-medium ${
              inStock ? 'text-emerald-500' : 'text-destructive'
            }`}
          >
            {inStock ? t('inStock') : t('outOfStock')}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-1.5 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 px-3 rounded-none"
            disabled={!inStock}
            onClick={handleAddToCart}
            aria-label={inStock ? tc('addToCart') : tc('outOfStock')}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-none"
            variant="secondary"
            disabled={!inStock}
            onClick={handleOrderNow}
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            {locale === 'ar' ? 'اطلب الآن' : 'Order Now'}
          </Button>
        </div>

        {/* Bottom animated line */}
        <div className="w-0 h-px bg-primary transition-all duration-300 group-hover/card:w-full" />
      </div>
    </div>
  );
}
