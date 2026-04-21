import Link from 'next/link';
import { ChevronRight, Wrench, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  locale: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  shopNow: string;
  buildPC: string;
}

const particles = [
  { top: '15%', left: '8%',  delay: '0s',    duration: '5s'  },
  { top: '70%', left: '5%',  delay: '1.5s',  duration: '6.5s' },
  { top: '30%', left: '55%', delay: '0.8s',  duration: '5.8s' },
  { top: '80%', left: '72%', delay: '2s',    duration: '7s'  },
  { top: '50%', left: '87%', delay: '0.4s',  duration: '5.4s' },
  { top: '10%', left: '78%', delay: '1.2s',  duration: '6.2s' },
];

export function HeroSection({ locale, heroTitle, heroHighlight, heroSubtitle, shopNow, buildPC }: HeroSectionProps) {
  const isRTL = locale === 'ar';

  const stats = [
    { value: '500+', label: isRTL ? 'منتج'             : 'Products'         },
    { value: '58',   label: isRTL ? 'ولاية'            : 'Wilayas'          },
    { value: 'COD',  label: isRTL ? 'دفع عند الاستلام' : 'Cash on Delivery' },
  ];

  const specCards = [
    { top: '4px',  right: '-40px', title: isRTL ? 'RTX 4090'     : 'RTX 4090',       sub: isRTL ? 'متوفر'        : 'In Stock',    color: 'bg-emerald-400', delay: '0.4s',  duration: '4s' },
    { bottom: '4px', left: '-40px', title: isRTL ? 'توصيل مجاني' : 'Free Delivery',  sub: isRTL ? '58 ولاية'     : '58 Wilayas',  color: 'bg-violet-400',  delay: '1s',    duration: '5s' },
    { top: '50%',  left: '-72px',  title: isRTL ? '+500 قطعة'    : '500+ Parts',     sub: isRTL ? 'جميع الماركات': 'All brands',  color: 'bg-amber-400',   delay: '1.6s',  duration: '6s' },
  ];

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`bg-zinc-950 min-h-[100svh] flex items-center relative overflow-hidden ${isRTL ? 'font-cairo' : ''}`}
    >
      {/* Animated grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(139,92,246,0.03) 0px, rgba(139,92,246,0.03) 1px, transparent 1px, transparent 60px)',
          animation: 'hero-grid-pulse 8s ease-in-out infinite',
        }}
      />

      {/* Orbs */}
      <div
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-violet-600/6 blur-[140px] pointer-events-none rounded-full"
        style={{ animation: 'hero-orb-1 14s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-violet-800/5 blur-[100px] pointer-events-none rounded-full"
        style={{ animation: 'hero-orb-2 10s ease-in-out infinite' }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-violet-400/25 rounded-full pointer-events-none"
          style={{
            top: p.top, left: p.left,
            animation: `hero-particle ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      <div className="container mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative">

        {/* ── TEXT COLUMN ── */}
        <div className="flex flex-col items-start text-start">

          {/* Badge */}
          <div
            className="hero-fade-up inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1.5 text-primary text-[11px] uppercase tracking-[0.15em] font-semibold mb-8"
            style={{ animationDelay: '0.05s' }}
          >
            <span style={{ animation: 'hero-sparkle 2s ease-in-out infinite' }}>
              <Sparkles className="h-3 w-3" />
            </span>
            {isRTL ? 'أفضل متجر لقطع الكمبيوتر في الجزائر' : "Algeria's #1 PC Parts Store"}
          </div>

          {/* H1 */}
          <h1
            className={`font-black uppercase text-white mb-6 ${isRTL ? 'font-cairo leading-[1.15]' : 'leading-[0.9]'}`}
            style={{ fontSize: 'clamp(2.8rem,6.5vw,6rem)' }}
          >
            <span className="hero-fade-slide block" style={{ animationDelay: '0.12s' }}>{heroTitle}</span>
            <span className="hero-fade-slide block text-primary" style={{ animationDelay: '0.22s' }}>{heroHighlight}</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`hero-fade-up text-zinc-400 text-lg max-w-lg mb-10 leading-relaxed ${isRTL ? 'font-cairo' : ''}`}
            style={{ animationDelay: '0.32s' }}
          >
            {heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="hero-fade-up flex flex-wrap items-center gap-3" style={{ animationDelay: '0.42s' }}>
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
          </div>

          {/* Stats */}
          <div
            className="hero-fade-up flex gap-10 mt-10 pt-10 border-t border-white/10 w-full"
            style={{ animationDelay: '0.52s' }}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="hero-pop-in flex flex-col items-start"
                style={{ animationDelay: `${0.56 + i * 0.08}s` }}
              >
                <span className="font-black text-4xl text-white">{stat.value}</span>
                <span className={`text-zinc-500 text-xs uppercase tracking-wider mt-1 ${isRTL ? 'font-cairo' : ''}`}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DECORATIVE COLUMN ── */}
        <div className="hero-fade-up hidden lg:flex items-center justify-center" style={{ animationDelay: '0.2s' }}>
          <div className="relative w-[420px] h-[420px]">

            <div
              className="absolute inset-0 rounded-full border border-primary/15"
              style={{ animation: 'hero-spin-cw 18s linear infinite' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary/70 rounded-full shadow-[0_0_8px_2px_rgba(139,92,246,0.5)]" />
            </div>

            <div
              className="absolute inset-10 rounded-full border border-primary/10"
              style={{ animation: 'hero-spin-ccw 12s linear infinite' }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-violet-300/50 rounded-full" />
            </div>

            <div className="absolute inset-20 rounded-full border border-primary/8 bg-primary/2" />
            <div
              className="absolute inset-32 rounded-full bg-primary/4"
              style={{ animation: 'hero-pulse-scale 4s ease-in-out infinite' }}
            />

            {/* NX glitch */}
            <div
              className="absolute inset-0 flex items-center justify-center font-black leading-none select-none"
              style={{
                fontSize: '160px',
                color: 'rgba(139,92,246,0.06)',
                animation: 'hero-glitch 6s ease-in-out infinite',
              }}
            >
              NX
            </div>

            {/* Spec cards */}
            {specCards.map((card, i) => (
              <div
                key={i}
                className="absolute bg-zinc-900/90 backdrop-blur-sm border border-white/10 px-4 py-3 text-xs whitespace-nowrap"
                style={{
                  top:    'top'    in card ? card.top    : undefined,
                  bottom: 'bottom' in card ? card.bottom : undefined,
                  left:   'left'   in card ? card.left   : undefined,
                  right:  'right'  in card ? card.right  : undefined,
                  ...('top' in card && card.top === '50%' ? { transform: 'translateY(-50%)' } : {}),
                  animation: `hero-card-float ${card.duration} ease-in-out infinite`,
                  animationDelay: card.delay,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${card.color}`} />
                  <p className="text-primary font-bold">{card.title}</p>
                </div>
                <p className="text-zinc-500">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
    </section>
  );
}
