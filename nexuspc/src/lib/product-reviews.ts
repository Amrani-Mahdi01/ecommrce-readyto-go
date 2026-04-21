import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types/product';

/**
 * Fetches review counts + average ratings for a list of products
 * and merges them into the product objects.
 */
export async function withReviewStats<T extends Pick<Product, 'id'>>(
  products: T[],
): Promise<(T & { review_count: number; avg_rating: number })[]> {
  if (products.length === 0) return products.map(p => ({ ...p, review_count: 0, avg_rating: 0 }));

  try {
    const supabase = await createClient();
    const ids = products.map(p => p.id);

    const { data } = await supabase
      .from('reviews')
      .select('product_id, rating')
      .in('product_id', ids);

    const statsMap: Record<string, { count: number; total: number }> = {};
    for (const row of data ?? []) {
      if (!statsMap[row.product_id]) statsMap[row.product_id] = { count: 0, total: 0 };
      statsMap[row.product_id].count++;
      statsMap[row.product_id].total += row.rating;
    }

    return products.map(p => {
      const s = statsMap[p.id];
      return {
        ...p,
        review_count: s?.count ?? 0,
        avg_rating:   s ? Math.round((s.total / s.count) * 10) / 10 : 0,
      };
    });
  } catch {
    return products.map(p => ({ ...p, review_count: 0, avg_rating: 0 }));
  }
}
