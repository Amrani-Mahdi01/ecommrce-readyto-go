'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Menu, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  locale: string;
  links: NavLink[];
}

export function MobileMenu({ locale: localeProp, links }: MobileMenuProps) {
  const params = useParams();
  const locale = (params?.locale as string) || localeProp;
  const [open, setOpen] = useState(false);
  const t = useTranslations('auth');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* SheetTrigger itself is already a <button> — no nested Button needed */}
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-9 w-9 md:hidden',
        )}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent side={locale === 'ar' ? 'right' : 'left'} className="w-72 flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-primary font-bold text-lg">
            <Zap className="h-5 w-5 fill-primary" />
            NexusPC
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 mt-4 flex-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-4" />

        <div className="flex items-center gap-2 pb-2">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle />
          {/* Link renders as <a>, no button nesting */}
          <Link
            href={`/${locale}/login`}
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ size: 'sm' }), 'flex-1 justify-center')}
          >
            {t('loginTitle')}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
