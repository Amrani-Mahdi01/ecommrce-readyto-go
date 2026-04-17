'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  ChevronRight, ChevronLeft, Tag, BarChart2, Truck, Settings, LayoutGrid,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const tones = [880, 1100];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {}
}

interface SidebarProps {
  locale: string;
  labels: {
    dashboard: string;
    products: string;
    orders: string;
    customers: string;
    promos: string;
    analytics: string;
    delivery: string;
    categories: string;
    settings: string;
    backToStore: string;
  };
}

export function AdminSidebar({ locale, labels }: SidebarProps) {
  const isRTL = locale === 'ar';
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const SEEN_KEY = 'admin_orders_last_seen';
  const [newOrderCount, setNewOrderCount] = useState(0);

  const getLastSeen = (): string => {
    try {
      return localStorage.getItem(SEEN_KEY) ?? new Date(0).toISOString();
    } catch {
      return new Date(0).toISOString();
    }
  };

  const markAllSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {}
    setNewOrderCount(0);
  };

  // Keep ref in sync so the subscription handler always sees the current pathname
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // On mount: count orders that arrived since last visit
  useEffect(() => {
    const supabase = createClient();
    const lastSeen = getLastSeen();

    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', lastSeen)
      .then(({ count }) => {
        if (count && count > 0) setNewOrderCount(count);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark all seen + clear badge when user navigates to orders page
  useEffect(() => {
    if (pathname?.includes('/admin/orders')) {
      markAllSeen();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Global new-order watcher — realtime for orders that come in during the session
  useEffect(() => {
    const supabase = createClient();
    const knownIds = new Set<string>();

    const channel = supabase
      .channel('admin-sidebar-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as any;
          if (knownIds.has(order.id)) return;
          knownIds.add(order.id);

          const onOrdersPage = pathnameRef.current?.includes('/admin/orders');

          if (!onOrdersPage) {
            setNewOrderCount((c) => c + 1);
            playNotificationSound();
            toast.success(
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">
                  {locale === 'ar' ? 'طلب جديد!' : 'New Order!'}
                </span>
                <span className="text-xs opacity-80">
                  {order.order_number} — {order.full_name} — {formatPrice(order.total)}
                </span>
              </div>,
              { duration: 8000, icon: '🛒' },
            );
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const navItems = [
    { href: `/${locale}/admin`,            icon: LayoutDashboard, label: labels.dashboard,  badge: 0 },
    { href: `/${locale}/admin/products`,   icon: Package,         label: labels.products,   badge: 0 },
    { href: `/${locale}/admin/orders`,     icon: ShoppingCart,    label: labels.orders,     badge: newOrderCount },
    { href: `/${locale}/admin/customers`,  icon: Users,           label: labels.customers,  badge: 0 },
    { href: `/${locale}/admin/promos`,     icon: Tag,             label: labels.promos,     badge: 0 },
    { href: `/${locale}/admin/analytics`,  icon: BarChart2,       label: labels.analytics,  badge: 0 },
    { href: `/${locale}/admin/delivery`,    icon: Truck,        label: labels.delivery,    badge: 0 },
    { href: `/${locale}/admin/categories`, icon: LayoutGrid,   label: labels.categories,  badge: 0 },
    { href: `/${locale}/admin/settings`,   icon: Settings,     label: labels.settings,    badge: 0 },
  ];

  return (
    <aside className="w-56 shrink-0 border-e border-border/60 bg-card flex flex-col">
      <div className="p-4 border-b border-border/60">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="font-extrabold text-primary text-lg">NexusPC</span>
          <span className="text-[10px] bg-primary/10 text-primary rounded-md px-1.5 py-0.5 font-semibold uppercase tracking-wide">
            Admin
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors group"
          >
            <Icon className="h-4 w-4 group-hover:text-primary transition-colors shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border/60">
        <Link
          href={`/${locale}/store`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {isRTL
            ? <ChevronLeft className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
          {labels.backToStore}
        </Link>
      </div>
    </aside>
  );
}
