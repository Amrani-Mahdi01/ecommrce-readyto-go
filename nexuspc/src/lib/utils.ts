import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price in DZD — e.g. 45000 → "45 000 DA"
 */
export function formatPrice(amount: number): string {
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} DA`;
}

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-');
}

/**
 * Pick the localised field based on current locale
 */
export function localise(
  obj: Record<string, string>,
  field: string,
  locale: string,
): string {
  const key = `${field}_${locale}`;
  return obj[key] ?? obj[`${field}_en`] ?? '';
}
