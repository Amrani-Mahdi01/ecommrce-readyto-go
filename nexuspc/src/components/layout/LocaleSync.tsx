'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/**
 * Keeps <html lang> and <html dir> in sync with the active locale during
 * client-side navigation. The root layout sets these attributes on the server,
 * but Next.js does not re-execute the root layout shell during soft navigations,
 * so without this component the attributes go stale until a hard refresh.
 */
export function LocaleSync() {
  const params = useParams();
  const locale = params?.locale as string | undefined;

  useEffect(() => {
    if (!locale) return;
    const isRTL = locale === 'ar';
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [locale]);

  return null;
}
