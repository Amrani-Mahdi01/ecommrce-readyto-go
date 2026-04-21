'use client';

import { useState, useTransition } from 'react';
import { Star, PenLine, CheckCircle2, LogIn, ShoppingBag, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { submitReview, type ReviewWithProfile } from '@/app/actions/reviews';
import type { ReviewEligibility } from '@/app/actions/reviews';

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  locale: string;
  reviews: ReviewWithProfile[];
  eligibility: ReviewEligibility;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              s <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = 4 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-${size} w-${size} ${
            s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsSection({ productId, productSlug, locale, reviews, eligibility }: ReviewsSectionProps) {
  const isRTL = locale === 'ar';
  const [rating, setRating] = useState(eligibility.existingReview?.rating ?? 0);
  const [title, setTitle] = useState(eligibility.existingReview?.title ?? '');
  const [body, setBody] = useState(eligibility.existingReview?.body ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError(isRTL ? 'يرجى اختيار تقييم' : 'Please select a rating'); return; }
    setError('');
    startTransition(async () => {
      const result = await submitReview({ productId, productSlug, locale, rating, title, body });
      if (result.success) setSubmitted(true);
      else setError(result.error ?? 'Error');
    });
  };

  return (
    <div className={`mt-12 ${isRTL ? 'font-cairo' : ''}`} id="reviews">
      {/* Section header */}
      <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-1">
            {isRTL ? 'آراء العملاء' : 'Customer Reviews'}
          </p>
          <h2 className="font-black text-2xl uppercase">
            {isRTL ? 'التقييمات' : 'Reviews'}
            <span className="text-muted-foreground font-normal text-base ms-2">({reviews.length})</span>
          </h2>
        </div>

        {/* Average score */}
        {reviews.length > 0 && (
          <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
            <p className="font-black text-5xl text-foreground leading-none">{avgRating.toFixed(1)}</p>
            <StarDisplay rating={avgRating} size={4} />
            <p className="text-xs text-muted-foreground mt-1">
              {isRTL ? `من ${reviews.length} تقييم` : `from ${reviews.length} review${reviews.length > 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </div>

      {/* Rating distribution */}
      {reviews.length > 0 && (
        <div className="mb-8 space-y-1.5 max-w-xs">
          {ratingCounts.map(({ star, count }) => (
            <div key={star} className={`flex items-center gap-2 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-muted-foreground w-3">{star}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 h-1.5 bg-muted/40 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-muted-foreground w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── REVIEW FORM / ELIGIBILITY MESSAGES ── */}
      <div className="mb-10">
        {/* Not logged in */}
        {eligibility.reason === 'not_logged_in' && (
          <div className={`border border-border bg-card p-5 flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
              <LogIn className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{isRTL ? 'سجّل دخولك لكتابة تقييم' : 'Sign in to write a review'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL ? 'يمكنك كتابة تقييم بعد استلام طلبك' : 'You can review after your order is delivered'}
              </p>
            </div>
            <Link
              href={`/${locale}/login`}
              className="shrink-0 bg-primary text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          </div>
        )}

        {/* Logged in but no delivered order */}
        {eligibility.reason === 'no_delivered_order' && (
          <div className={`border border-border bg-card p-5 flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {isRTL ? 'اشتر المنتج لتتمكن من تقييمه' : 'Purchase this product to leave a review'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL
                  ? 'التقييم متاح فقط للعملاء الذين استلموا طلباتهم'
                  : 'Reviews are available only to customers who received their order'}
              </p>
            </div>
          </div>
        )}

        {/* Already reviewed */}
        {eligibility.reason === 'already_reviewed' && eligibility.existingReview && (
          <div className={`border border-emerald-800/40 bg-emerald-950/20 p-5 flex items-start gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-emerald-400">
                {isRTL ? 'لقد قيّمت هذا المنتج' : 'You already reviewed this product'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StarDisplay rating={eligibility.existingReview.rating} size={3} />
                {eligibility.existingReview.title && (
                  <span className="text-xs text-muted-foreground">— {eligibility.existingReview.title}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Eligible — show form */}
        {eligibility.canReview && !submitted && (
          <div className="border border-border bg-card p-6">
            <div className={`flex items-center gap-2 mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <PenLine className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wider">
                {isRTL ? 'اكتب تقييمك' : 'Write Your Review'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
              {/* Star rating */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                  {isRTL ? 'تقييمك *' : 'Your Rating *'}
                </label>
                <StarInput value={rating} onChange={setRating} />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {isRTL ? 'عنوان التقييم (اختياري)' : 'Review Title (optional)'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'ملخص تجربتك...' : 'Summarize your experience...'}
                  maxLength={120}
                  className="w-full h-10 px-3 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 rounded-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {isRTL ? 'تفاصيل التقييم (اختياري)' : 'Review Details (optional)'}
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={isRTL ? 'شارك تجربتك مع المنتج...' : 'Share your experience with the product...'}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 rounded-none resize-none"
                />
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}

              <Button
                type="submit"
                disabled={isPending || rating === 0}
                className="gap-2 rounded-none"
              >
                {isPending ? (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
                {isRTL ? 'إرسال التقييم' : 'Submit Review'}
              </Button>
            </form>
          </div>
        )}

        {/* Submitted success */}
        {submitted && (
          <div className={`border border-emerald-800/40 bg-emerald-950/20 p-5 flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="font-semibold text-sm text-emerald-400">
              {isRTL ? 'شكراً! تم إرسال تقييمك بنجاح.' : 'Thank you! Your review has been submitted.'}
            </p>
          </div>
        )}
      </div>

      {/* ── REVIEWS LIST ── */}
      {reviews.length === 0 ? (
        <div className={`border border-border/40 bg-card/50 p-10 text-center ${isRTL ? 'font-cairo' : ''}`}>
          <Star className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!' : 'No reviews yet. Be the first to review this product!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className={`border border-border bg-card p-5 ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-start justify-between gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar placeholder */}
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0 font-bold text-xs text-primary">
                    {(review.profiles?.full_name ?? 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {review.profiles?.full_name ?? (isRTL ? 'مجهول' : 'Anonymous')}
                    </p>
                    <div className={`flex items-center gap-2 mt-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <StarDisplay rating={review.rating} size={3} />
                      {review.is_verified_purchase && (
                        <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          {isRTL ? 'شراء موثّق' : 'Verified Purchase'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(review.created_at).toLocaleDateString(isRTL ? 'ar-DZ' : 'en-DZ')}
                </span>
              </div>

              {review.title && (
                <p className="font-bold text-sm mb-1">{review.title}</p>
              )}
              {review.body && (
                <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Compact inline version for TrackOrderClient */
export function InlineReviewForm({
  productId,
  productName,
  locale,
  onDone,
}: {
  productId: string;
  productName: string;
  locale: string;
  onDone: () => void;
}) {
  const isRTL = locale === 'ar';
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    startTransition(async () => {
      const result = await submitReview({ productId, productSlug: '', locale, rating, title: '', body });
      if (result.success) { setSubmitted(true); setTimeout(onDone, 1500); }
      else setError(result.error ?? 'Error');
    });
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-emerald-500 text-sm py-2">
        <CheckCircle2 className="h-4 w-4" />
        {isRTL ? 'تم إرسال تقييمك!' : 'Review submitted!'}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-border/40 pt-3" dir={isRTL ? 'rtl' : 'ltr'}>
      <p className="text-xs text-muted-foreground font-medium">
        {isRTL ? `قيّم "${productName}"` : `Rate "${productName}"`}
      </p>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={isRTL ? 'رأيك في المنتج... (اختياري)' : 'Your thoughts... (optional)'}
        rows={2}
        className="w-full px-3 py-2 border border-input bg-background text-sm rounded-none resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || rating === 0} className="rounded-none gap-1.5">
          {isPending && <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          {isRTL ? 'إرسال' : 'Submit'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} className="rounded-none">
          {isRTL ? 'إلغاء' : 'Cancel'}
        </Button>
      </div>
    </form>
  );
}
