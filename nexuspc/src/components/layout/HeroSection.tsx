'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Wrench, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  locale: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  shopNow: string;
  buildPC: string;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay },
});

const fadeSlide = (delay = 0) => ({
  initial: { opacity: 0, x: -28 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const, delay },
});

const popIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.8, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const, delay },
});

export function HeroSection({ locale, heroTitle, heroHighlight, heroSubtitle, shopNow, buildPC }: HeroSectionProps) {
  const isRTL = locale === 'ar';

  const stats = [
    { value: '500+', label: isRTL ? 'منتج'              : 'Products'         },
    { value: '58',   label: isRTL ? 'ولاية'             : 'Wilayas'          },
    { value: 'COD',  label: isRTL ? 'دفع عند الاستلام'  : 'Cash on Delivery' },
  ];

  const specCards = [
    {
      top: 4, right: -40,
      title: isRTL ? 'RTX 4090'       : 'RTX 4090',
      sub:   isRTL ? 'متوفر'          : 'In Stock',
      color: 'bg-emerald-400', delay: 0,
    },
    {
      bottom: 4, left: -40,
      title: isRTL ? 'توصيل مجاني'   : 'Free Delivery',
      sub:   isRTL ? '58 ولاية'       : '58 Wilayas',
      color: 'bg-violet-400', delay: 0.6,
    },
    {
      top: '50%', left: -72,
      title: isRTL ? '+500 قطعة'      : '500+ Parts',
      sub:   isRTL ? 'جميع الماركات'  : 'All brands',
      color: 'bg-amber-400', delay: 1.2,
    },
  ] as const;

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`bg-zinc-950 min-h-[100svh] flex items-center relative overflow-hidden ${isRTL ? 'font-cairo' : ''}`}
    >

      {/* Animated grid */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(139,92,246,0.03) 0px, rgba(139,92,246,0.03) 1px, transparent 1px, transparent 60px)' }}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-violet-600/6 blur-[140px] pointer-events-none rounded-full"
        animate={{ x: [-40, 20, -40], y: [20, -30, 20], scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-violet-800/5 blur-[100px] pointer-events-none rounded-full"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Particles */}
      {[
        { top: '15%', left: '8%',  delay: 0   },
        { top: '70%', left: '5%',  delay: 1.5 },
        { top: '30%', left: '55%', delay: 0.8 },
        { top: '80%', left: '72%', delay: 2   },
        { top: '50%', left: '87%', delay: 0.4 },
        { top: '10%', left: '78%', delay: 1.2 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-violet-400/25 rounded-full pointer-events-none"
          style={{ top: p.top, left: p.left }}
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.5, 0.15], scale: [1, 1.4, 1] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}

      <div className={`container mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative`}>

        {/* ── TEXT COLUMN ── */}
        <div className="flex flex-col items-start text-start">

          {/* Badge */}
          <motion.div
            {...fadeUp(0.05)}
            className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1.5 text-primary text-[11px] uppercase tracking-[0.15em] font-semibold mb-8"
          >
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Sparkles className="h-3 w-3" />
            </motion.span>
            {isRTL ? 'أفضل متجر لقطع الكمبيوتر في الجزائر' : "Algeria's #1 PC Parts Store"}
          </motion.div>

          {/* H1 */}
          <h1
            className={`font-black uppercase text-white mb-6 ${isRTL ? 'font-cairo leading-[1.15]' : 'leading-[0.9]'}`}
            style={{ fontSize: 'clamp(2.8rem,6.5vw,6rem)' }}
          >
            <motion.span {...fadeSlide(0.12)} className="block">{heroTitle}</motion.span>
            <motion.span {...fadeSlide(0.22)} className="block text-primary">{heroHighlight}</motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.32)}
            className={`text-zinc-400 text-lg max-w-lg mb-10 leading-relaxed ${isRTL ? 'font-cairo' : ''}`}
          >
            {heroSubtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.42)} className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/store`}
              className="group/btn bg-primary text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-all duration-300 flex items-center gap-2 relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/10 translate-x-[-110%] skew-x-[-20deg] group-hover/btn:translate-x-[110%] transition-transform duration-500" />
              {isRTL && <ChevronRight className="h-4 w-4" />}
              {shopNow}
              {!isRTL && <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" />}
            </Link>
            <Link
              href={`/${locale}/pc-builder`}
              className="border border-zinc-600 text-zinc-200 px-8 py-4 text-sm font-bold uppercase tracking-wider hover:border-primary/60 hover:text-white hover:bg-primary/5 transition-all duration-300 flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              {buildPC}
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            {...fadeUp(0.52)}
            className="flex gap-10 mt-10 pt-10 border-t border-white/10 w-full"
          >
            {stats.map((stat, i) => (
              <motion.div key={stat.label} {...popIn(0.56 + i * 0.08)} className="flex flex-col items-start">
                <span className="font-black text-4xl text-white">{stat.value}</span>
                <span className={`text-zinc-500 text-xs uppercase tracking-wider mt-1 ${isRTL ? 'font-cairo' : ''}`}>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── DECORATIVE COLUMN ── */}
        <motion.div {...fadeUp(0.2)} className="hidden lg:flex items-center justify-center">
          <div className="relative w-[420px] h-[420px]">

            <motion.div
              className="absolute inset-0 rounded-full border border-primary/15"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary/70 rounded-full shadow-[0_0_8px_2px_rgba(139,92,246,0.5)]" />
            </motion.div>

            <motion.div
              className="absolute inset-10 rounded-full border border-primary/10"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-violet-300/50 rounded-full" />
            </motion.div>

            <div className="absolute inset-20 rounded-full border border-primary/8 bg-primary/2" />
            <motion.div
              className="absolute inset-32 rounded-full bg-primary/4"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* NX glitch */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center font-black leading-none select-none"
              style={{ fontSize: '160px', color: 'rgba(139,92,246,0.06)' }}
              animate={{ opacity: [0.06, 0.06, 0.13, 0.06, 0.09, 0.06], skewX: [0, 0, -3, 2, 0, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.9, 0.93, 0.95, 0.97, 1] }}
            >
              NX
            </motion.div>

            {/* Spec cards */}
            {specCards.map((card, i) => (
              <motion.div
                key={i}
                className="absolute bg-zinc-900/90 backdrop-blur-sm border border-white/10 px-4 py-3 text-xs whitespace-nowrap"
                style={{
                  top:    'top'    in card ? card.top    : undefined,
                  bottom: 'bottom' in card ? card.bottom : undefined,
                  left:   'left'   in card ? card.left   : undefined,
                  right:  'right'  in card ? card.right  : undefined,
                  ...('top' in card && card.top === '50%' ? { transform: 'translateY(-50%)' } : {}),
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: [0, -10, 0] }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.4 + card.delay },
                  y: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: card.delay },
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${card.color}`} />
                  <p className="text-primary font-bold">{card.title}</p>
                </div>
                <p className="text-zinc-500">{card.sub}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
    </section>
  );
}
