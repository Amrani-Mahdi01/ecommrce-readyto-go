'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product, ProductFilters } from '@/types/product';

interface ProductsState {
  products: Product[];
  total: number;
  loading: boolean;
  error: string | null;
}

const PAGE_SIZE = 12;

export function useProducts(filters: ProductFilters = {}): ProductsState {
  const [state, setState] = useState<ProductsState>({
    products: [],
    total: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const fetch = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const page = filters.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .range(from, to);

        if (filters.category) query = query.eq('category_id', filters.category);
        if (filters.brand) query = query.eq('brand', filters.brand);
        if (filters.minPrice) query = query.gte('price', filters.minPrice);
        if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
        if (filters.inStock) query = query.gt('stock_qty', 0);
        if (filters.search)
          query = query.or(
            `name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`,
          );

        switch (filters.sort) {
          case 'price_asc':  query = query.order('price', { ascending: true }); break;
          case 'price_desc': query = query.order('price', { ascending: false }); break;
          case 'newest':     query = query.order('created_at', { ascending: false }); break;
          default:           query = query.order('is_featured', { ascending: false }); break;
        }

        const { data, count, error } = await query;
        if (cancelled) return;
        if (error) throw error;
        setState({ products: (data ?? []) as Product[], total: count ?? 0, loading: false, error: null });
      } catch (err) {
        if (!cancelled)
          setState((s) => ({ ...s, loading: false, error: (err as Error).message }));
      }
    };

    void fetch();
    return () => { cancelled = true; };
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
