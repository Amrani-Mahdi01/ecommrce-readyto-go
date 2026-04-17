'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, PackageX, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/product';
import { toast } from 'sonner';

interface ProductRowProps {
  product: Product;
  locale: string;
}

export function ProductRow({ product, locale }: ProductRowProps) {
  const t = useTranslations('product');
  const tc = useTranslations('common');
  const { addItem } = useCart();

  const name = locale === 'ar' ? product.name_ar : product.name_en;
  const desc = locale === 'ar' ? product.description_ar : product.description_en;
  const image = product.images[0] ?? null;
  const inStock = product.stock_qty > 0;
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_price!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(product);
    toast.success(t('addedToCart'), { description: name });
  };

  return (
    <div className="group flex gap-4 border border-border bg-card p-3 hover:border-primary/40 transition-all duration-200">
      {/* Image */}
      <Link
        href={`/${locale}/store/product/${product.slug}`}
        className="shrink-0 relative w-28 h-28 sm:w-36 sm:h-36 overflow-hidden bg-muted/30"
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <PackageX className="h-10 w-10" />
          </div>
        )}
        {hasDiscount && (
          <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-none">
            -{discountPct}%
          </Badge>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {product.brand && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
            {product.brand}
          </span>
        )}
        <Link
          href={`/${locale}/store/product/${product.slug}`}
          className="text-sm font-semibold leading-snug hover:text-primary transition-colors line-clamp-2"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          {name}
        </Link>
        {desc && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {desc}
          </p>
        )}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">(0)</span>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="shrink-0 flex flex-col items-end justify-between gap-2">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-base font-bold">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_price!)}</span>
          )}
          <span className={`text-[10px] font-medium ${inStock ? 'text-emerald-500' : 'text-destructive'}`}>
            {inStock ? t('inStock') : t('outOfStock')}
          </span>
        </div>
        <Button
          size="sm"
          className="gap-1.5 whitespace-nowrap rounded-none"
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {tc('addToCart')}
        </Button>
      </div>
    </div>
  );
}
