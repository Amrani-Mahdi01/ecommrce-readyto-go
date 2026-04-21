'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ReviewWithProfile {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export async function getProductReviews(productId: string): Promise<ReviewWithProfile[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    return (data ?? []) as ReviewWithProfile[];
  } catch {
    return [];
  }
}

export interface ReviewEligibility {
  userId: string | null;
  canReview: boolean;
  reason: 'not_logged_in' | 'already_reviewed' | 'no_delivered_order' | 'eligible' | null;
  existingReview: ReviewWithProfile | null;
}

export async function getReviewEligibility(productId: string): Promise<ReviewEligibility> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { userId: null, canReview: false, reason: 'not_logged_in', existingReview: null };
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { userId: null, canReview: false, reason: 'not_logged_in', existingReview: null };

    // Check existing review
    const { data: existing } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return { userId: user.id, canReview: false, reason: 'already_reviewed', existingReview: existing as ReviewWithProfile };
    }

    // Check delivered orders containing this product
    const { data: deliveredOrders } = await supabase
      .from('orders')
      .select('id, items')
      .eq('user_id', user.id)
      .eq('status', 'delivered');

    const hasProduct = (deliveredOrders ?? []).some((order) =>
      (order.items ?? []).some((item: { product_id: string }) => item.product_id === productId)
    );

    if (!hasProduct) {
      return { userId: user.id, canReview: false, reason: 'no_delivered_order', existingReview: null };
    }

    return { userId: user.id, canReview: true, reason: 'eligible', existingReview: null };
  } catch {
    return { userId: null, canReview: false, reason: 'not_logged_in', existingReview: null };
  }
}

export async function submitReview(data: {
  productId: string;
  productSlug: string;
  locale: string;
  rating: number;
  title: string;
  body: string;
}): Promise<{ success?: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: 'Service unavailable' };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'not_logged_in' };
    if (data.rating < 1 || data.rating > 5) return { error: 'invalid_rating' };

    // Re-verify eligibility server-side
    const { data: deliveredOrders } = await supabase
      .from('orders')
      .select('id, items')
      .eq('user_id', user.id)
      .eq('status', 'delivered');

    const hasProduct = (deliveredOrders ?? []).some((order) =>
      (order.items ?? []).some((item: { product_id: string }) => item.product_id === data.productId)
    );

    if (!hasProduct) return { error: 'not_eligible' };

    const { error } = await supabase.from('reviews').upsert(
      {
        product_id: data.productId,
        user_id: user.id,
        rating: data.rating,
        title: data.title.trim() || null,
        body: data.body.trim() || null,
        is_verified_purchase: true,
      },
      { onConflict: 'product_id,user_id' }
    );

    if (error) return { error: error.message };

    revalidatePath(`/${data.locale}/store/product/${data.productSlug}`);
    return { success: true };
  } catch (e) {
    return { error: 'unknown_error' };
  }
}
