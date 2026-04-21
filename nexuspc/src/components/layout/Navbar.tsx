'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ShoppingCart, Zap, User as UserIcon, LogOut, Package,
  LayoutDashboard, ChevronDown, Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/user';
import { logoutAction } from '@/app/actions/auth';

interface NavbarProps {
  locale: string;
  initialUser?: User | null;
  initialProfile?: Profile | null;
}

export function Navbar({ locale: localeProp, initialUser, initialProfile }: NavbarProps) {
  const params = useParams();
  // useParams() updates immediately on client-side navigation (before server re-render)
  const locale = (params?.locale as string) || localeProp;
  const t = useTranslations('nav');
  const { totalItems } = useCart();
  const { open: openCart } = useCartDrawer();
  const { user, profile } = useAuth(initialUser, initialProfile);
  const isRTL = locale === 'ar';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logoutAction();
    toast.success(t('logoutSuccess'));
    window.location.href = `/${locale}`;
  };

  const navLinks = [
    { href: `/${locale}`,             label: t('home') },
    { href: `/${locale}/store`,       label: t('store') },
    { href: `/${locale}/pc-builder`,  label: t('pcBuilder') },
    { href: `/${locale}/track-order`, label: t('trackOrder') },
  ];

  // Get initials for avatar
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Account';

  const marqueeItems = isRTL
    ? ['توصيل لجميع الولايات الـ 58', '+500 منتج متوفر', 'الدفع عند الاستلام', 'أفضل متجر كمبيوتر في الجزائر']
    : ['Delivery to all 58 wilayas', '500+ products available', 'Pay on delivery', "Algeria's #1 PC Store"];

  // Duplicate for seamless loop
  const items = [...marqueeItems, ...marqueeItems];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ── Top announcement bar ── */}
      <div className="h-8 bg-primary overflow-hidden group" dir="ltr">
        <div className="h-full flex items-center w-max animate-marquee group-hover:[animation-play-state:paused]">
          {items.map((text, i) => (
            <span
              key={i}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/90 whitespace-nowrap px-10 flex items-center gap-6"
            >
              {text}
              <span className="opacity-40">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main nav bar ── */}
      <div className="h-14 border-b border-border/30 bg-background/98 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 fill-white text-white" />
            </div>
            <span className="font-black text-base uppercase tracking-[0.15em]">
              NexusPC
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-1">
              <LanguageSwitcher locale={locale} />
              <ThemeToggle />
            </div>

            {/* Cart */}
            <button
              onClick={openCart}
              aria-label={t('cart')}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9 relative rounded-none')}
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <Badge
                  className={cn(
                    'absolute -top-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-0 pointer-events-none rounded-none',
                    isRTL ? '-left-1' : '-right-1',
                  )}
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </Badge>
              )}
            </button>

            {/* User area */}
            {user ? (
              <div ref={menuRef} className="relative hidden md:block">
                {/* Avatar button */}
                <button
                  onClick={() => setMenuOpen((p) => !p)}
                  className="flex items-center gap-2 h-9 pl-1 pr-2.5 border border-border/60 bg-card hover:border-primary/40 hover:bg-accent transition-all duration-200 group"
                >
                  {/* Avatar square */}
                  <div className="h-7 w-7 bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate hidden lg:block">
                    {displayName}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div
                    className={cn(
                      'absolute top-11 w-56 border border-border/40 bg-card shadow-xl shadow-black/10 overflow-hidden animate-scale-in origin-top-right z-50 rounded-none',
                      isRTL ? 'left-0' : 'right-0',
                    )}
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                      <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'مسجل دخول بـ' : 'Signed in as'}</p>
                      <p className="text-sm font-semibold truncate mt-0.5">{displayName}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      )}
                      {profile?.role === 'admin' && (
                        <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-none">
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5 space-y-0.5">
                      <DropItem
                        href={`/${locale}/track-order`}
                        icon={Package}
                        label={locale === 'ar' ? 'طلباتي' : 'My Orders'}
                        onClick={() => setMenuOpen(false)}
                      />

                      {profile?.role === 'admin' && (
                        <DropItem
                          href={`/${locale}/admin`}
                          icon={LayoutDashboard}
                          label={locale === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
                          onClick={() => setMenuOpen(false)}
                          highlight
                        />
                      )}
                    </div>

                    {/* Logout */}
                    <div className="p-1.5 border-t border-border/60">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors rounded-none"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5">
                <Link
                  href={`/${locale}/login`}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-9 rounded-none')}
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className={cn(buttonVariants({ size: 'sm' }), 'h-9 rounded-none')}
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <MobileMenu locale={locale} links={navLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}

function DropItem({
  href, icon: Icon, label, onClick, highlight,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 text-sm transition-colors rounded-none',
        highlight
          ? 'text-primary hover:bg-primary/10 font-medium'
          : 'text-foreground hover:bg-accent',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
