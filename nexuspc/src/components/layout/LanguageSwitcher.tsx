'use client';

import { usePathname, useParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  locale: string;
}

export function LanguageSwitcher({ locale: localeProp }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || localeProp;

  const targetLocale = locale === 'en' ? 'ar' : 'en';
  const label = locale === 'en' ? 'عربي' : 'EN';

  const handleSwitch = () => {
    const segments = pathname.split('/');
    segments[1] = targetLocale;
    // Hard navigation so the root layout re-runs and <html lang/dir> updates correctly.
    // Soft router.push() leaves the root layout shell stale (html dir stays old locale).
    window.location.href = segments.join('/');
  };

  // This is a real <button> triggering a client-side action (not navigation)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSwitch}
      className="gap-1.5 font-medium text-sm h-9 px-2.5"
      aria-label={`Switch to ${targetLocale === 'ar' ? 'Arabic' : 'English'}`}
    >
      <Globe className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
