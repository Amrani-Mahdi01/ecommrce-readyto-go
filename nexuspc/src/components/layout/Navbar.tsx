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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-xl shrink-0 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            NexusPC
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {link.label}
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
          <Link
            href={`/${locale}/cart`}
            aria-label={t('cart')}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9 relative')}
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <Badge className={`absolute -top-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-0 pointer-events-none ${isRTL ? '-left-1' : '-right-1'}`}>
                {totalItems > 99 ? '99+' : totalItems}
              </Badge>
            )}
          </Link>

          {/* User area */}
          {user ? (
            <div ref={menuRef} className="relative hidden md:block">
              {/* Avatar button */}
              <button
                onClick={() => setMenuOpen((p) => !p)}
                className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-full border border-border/60 bg-card hover:border-primary/40 hover:bg-accent transition-all duration-200 group"
              >
                {/* Avatar circle */}
                <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <span className="text-sm font-medium max-w-[100px] truncate hidden lg:block">
                  {displayName}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className={`absolute top-11 ${isRTL ? 'left-0' : 'right-0'} w-56 rounded-xl border border-border/60 bg-card shadow-xl shadow-black/10 overflow-hidden animate-scale-in origin-top-right z-50`}>
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                    <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'مسجل دخول بـ' : 'Signed in as'}</p>
                    <p className="text-sm font-semibold truncate mt-0.5">{displayName}</p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                    {profile?.role === 'admin' && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-9')}
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/register`}
                className={cn(buttonVariants({ size: 'sm' }), 'h-9')}
              >
                {t('register')}
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <MobileMenu locale={locale} links={navLinks} />
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
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
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
