'use client';

import { useRef, useId } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types/product';

interface ProductSliderProps {
  products: Product[];
  locale: string;
}

export function ProductSlider({ products, locale }: ProductSliderProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const paginationId = useId().replace(/:/g, '');
  const paginationSelector = `#pag-${paginationId}`;

  return (
    <div className="relative group/slider">
      {/* Prev button */}
      <button
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute left-0 top-[calc(50%-20px)] -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 flex items-center justify-center bg-zinc-900 border border-white/10 text-white opacity-0 group-hover/slider:opacity-100 hover:border-violet-500 hover:bg-violet-500/10 transition-all duration-200"
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="overflow-hidden">
        <Swiper
          modules={[FreeMode, Pagination, Autoplay]}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          freeMode={{ enabled: true, momentum: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true, el: paginationSelector }}
          slidesPerView="auto"
          spaceBetween={16}
          className="product-slider-swiper"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} style={{ width: 240, height: 'auto' }}>
              <ProductCard product={product} locale={locale} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* External pagination — rendered outside overflow-hidden */}
      <div id={`pag-${paginationId}`} className="product-slider-pagination flex justify-center gap-1.5 mt-5" />

      {/* Next button */}
      <button
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute right-0 top-[calc(50%-20px)] -translate-y-1/2 translate-x-4 z-10 w-9 h-9 flex items-center justify-center bg-zinc-900 border border-white/10 text-white opacity-0 group-hover/slider:opacity-100 hover:border-violet-500 hover:bg-violet-500/10 transition-all duration-200"
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
