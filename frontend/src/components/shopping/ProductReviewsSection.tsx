'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import {
  fetchProductReviewSummary,
  submitProductReview,
  updateProductReview,
  deleteProductReview,
  ProductReviewItem,
  ProductReviewSummaryResponse,
} from '@/services/reviewAndRating';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Loader2,
  ShieldCheck,
  User,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface ProductReviewsSectionProps {
  productIdOrSlug: string;
  onRatingUpdated?: (averageRating: number, totalReviews: number) => void;
}

function StarRating({ rating, interactive = false, onRate, size = 'md' }: { rating: number; interactive?: boolean; onRate?: (r: number) => void; size?: 'sm' | 'md' }) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const activeRating = hoverRating !== null ? hoverRating : rating;
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-4.5 sm:h-4.5';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(null)}
          onClick={() => interactive && onRate && onRate(star)}
          className={`${starSize} transition-transform ${
            interactive ? 'cursor-pointer hover:scale-110' : ''
          } ${
            star <= activeRating
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-300 dark:text-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export function ProductReviewsSection({ productIdOrSlug, onRatingUpdated }: ProductReviewsSectionProps) {
  const { user } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<ProductReviewSummaryResponse | null>(null);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // View All Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [modalReviews, setModalReviews] = useState<ProductReviewItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreModal, setHasMoreModal] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetchProductReviewSummary(productIdOrSlug, 1, 10);
      if (res?.success && res.data) {
        setSummaryData(res.data);
        if (onRatingUpdated) {
          onRatingUpdated(res.data.averageRating, res.data.totalReviews);
        }

        if (res.data.userReview) {
          setRatingInput(res.data.userReview.rating);
          setCommentInput(res.data.userReview.comment || '');
        }
      }
    } catch (err) {
      console.error('Error fetching product reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productIdOrSlug, onRatingUpdated]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingInput < 1 || ratingInput > 5) {
      toastError('Please select a rating between 1 and 5 stars.');
      return;
    }

    setSubmitting(true);
    try {
      const productId = summaryData?.productId || productIdOrSlug;
      const res = await submitProductReview({
        productId,
        rating: ratingInput,
        comment: commentInput.trim(),
      });

      if (res?.success) {
        toastSuccess('Review Submitted!', 'Thank you for sharing your feedback with the DOHS community.');
        setShowForm(false);
        setIsEditing(false);
        await loadSummary();
      } else {
        throw new Error(res?.message || 'Failed to submit review.');
      }
    } catch (err: any) {
      toastError('Review Error', err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    try {
      const res = await deleteProductReview(reviewId);
      if (res?.success) {
        toastSuccess('Review Deleted', 'Your review has been removed.');
        setCommentInput('');
        setRatingInput(5);
        setIsEditing(false);
        await loadSummary();
      }
    } catch (err: any) {
      toastError('Error', err?.message || 'Failed to delete review.');
    }
  };

  const openViewAllModal = async () => {
    setModalOpen(true);
    setModalPage(1);
    try {
      const res = await fetchProductReviewSummary(productIdOrSlug, 1, 10);
      if (res?.success && res.data) {
        setModalReviews(res.data.reviews);
        setHasMoreModal(res.data.page < res.data.totalPages);
      }
    } catch (err) {
      console.error('Error opening reviews modal:', err);
    }
  };

  const loadMoreModalReviews = async () => {
    const nextPage = modalPage + 1;
    setLoadingMore(true);
    try {
      const res = await fetchProductReviewSummary(productIdOrSlug, nextPage, 10);
      if (res?.success && res.data) {
        setModalReviews((prev) => [...prev, ...res.data.reviews]);
        setModalPage(nextPage);
        setHasMoreModal(res.data.page < res.data.totalPages);
      }
    } catch (err) {
      console.error('Error loading more reviews:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border bg-card shadow-lg flex items-center justify-center py-10">
        <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const averageRating = summaryData?.averageRating || 0;
  const totalReviews = summaryData?.totalReviews || 0;
  const distribution = summaryData?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const latestReviews = summaryData?.latestReviews || [];
  const userReview = summaryData?.userReview;

  return (
    <section className="space-y-5 sm:space-y-8 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-border bg-card shadow-lg sm:shadow-xl">
      {/* Header Title & Rating Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-600 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Feedback</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex flex-wrap items-center gap-2">
            <span>Ratings & Reviews</span>
            <span className="text-xs sm:text-sm font-bold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border">
              ⭐ {averageRating.toFixed(1)} · {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
            </span>
          </h2>
        </div>

        {!userReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Write a Review (রিভিউ লিখুন)</span>
          </button>
        )}
      </div>

      {/* ── Compact Responsive Breakdown Card ── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center bg-secondary/30 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border">
        {/* Left Col: Big Score */}
        <div className="sm:col-span-4 text-center sm:text-left border-b sm:border-b-0 sm:border-r border-border pb-3 sm:pb-0 sm:pr-6 space-y-1">
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Score</span>
          <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
            <span className="text-3xl sm:text-5xl font-black text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-xs sm:text-base text-muted-foreground font-bold">/ 5.0</span>
          </div>
          <div className="flex justify-center sm:justify-start">
            <StarRating rating={Math.round(averageRating)} />
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground pt-0.5">
            {totalReviews} verified community ratings
          </p>
        </div>

        {/* Right Col: Star Distribution Bars */}
        <div className="sm:col-span-8 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (distribution as any)[star] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-2 text-[11px] sm:text-xs">
                <span className="w-10 sm:w-12 font-bold text-foreground flex items-center gap-0.5 shrink-0">
                  {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 sm:h-2.5 rounded-full bg-secondary overflow-hidden border border-border">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 sm:w-12 text-right text-muted-foreground text-[10px] sm:text-[11px] font-mono shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── User Review Submission / Edit Box ── */}
      {(showForm || isEditing) && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-secondary/50 border border-emerald-500/30 space-y-3 sm:space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="font-extrabold text-foreground text-xs sm:text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>{isEditing ? 'Edit Your Review' : 'Write a Product Review (পণ্য রিভিউ দিন)'}</span>
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
              }}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1">Rating (রেটিং নির্বাচন করুন) *</label>
              <StarRating rating={ratingInput} interactive onRate={setRatingInput} />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Your Review Comment (মতামত বা মন্তব্য)</label>
              <textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Share your experience regarding quality, packaging, freshness, and delivery speed..."
                className="w-full p-3 rounded-xl sm:rounded-2xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
              />
            </div>

            {summaryData?.hasPurchased && (
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2 sm:p-2.5 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verified Purchaser badge will be added to your review</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                }}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground font-bold hover:bg-secondary/80 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 transition-all text-xs"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEditing ? 'Update Review' : 'Submit Review (জমা দিন)'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── User's Own Existing Review Box ── */}
      {userReview && !isEditing && (
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300">Your Review</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1 rounded-xl bg-background hover:bg-secondary text-[11px] font-bold text-foreground flex items-center gap-1 border border-border shadow-2xs cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-emerald-600" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteReview(userReview.id)}
                className="px-2.5 py-1 rounded-xl bg-background hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold text-rose-600 flex items-center gap-1 border border-border shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <StarRating rating={userReview.rating} size="sm" />
            <span className="text-[11px] text-muted-foreground">
              {new Date(userReview.createdAt).toLocaleDateString()}
            </span>
          </div>

          {userReview.comment && (
            <p className="text-xs text-foreground leading-relaxed">{userReview.comment}</p>
          )}
        </div>
      )}

      {/* ── Latest Reviews Display ── */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="font-extrabold text-foreground text-xs sm:text-sm uppercase tracking-wider">
          Recent Reviews ({latestReviews.length})
        </h3>

        {latestReviews.length === 0 ? (
          <div className="text-center py-8 sm:py-12 space-y-2.5 bg-secondary/30 rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6">
            <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mx-auto opacity-40" />
            <p className="font-bold text-foreground text-sm sm:text-base">No reviews yet</p>
            <p className="text-xs text-muted-foreground">Be the first to review this product!</p>
            {!userReview && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-1 inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Write First Review (প্রথম রিভিউটি দিন)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {latestReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-border bg-background shadow-2xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600/10 border border-emerald-600/30 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                      {(rev.user?.name || 'A')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-foreground text-xs">{rev.user?.name || 'DOHS Resident'}</h4>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={rev.rating} size="sm" />
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-foreground leading-relaxed pt-1 sm:pl-11">{rev.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── View All Reviews Button ── */}
      {totalReviews > 2 && (
        <div className="text-center pt-1">
          <button
            onClick={openViewAllModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-extrabold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span>View All Reviews ({totalReviews})</span>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* ── View All Reviews Modal / Bottom Sheet ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-background border border-border rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="font-black text-foreground text-base sm:text-lg flex items-center gap-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <span>All Customer Reviews ({totalReviews})</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {modalReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 sm:p-5 rounded-2xl border border-border bg-secondary/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/10 border border-emerald-600/30 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {(rev.user?.name || 'A')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-xs">{rev.user?.name || 'DOHS Resident'}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={rev.rating} size="sm" />
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-foreground leading-relaxed pt-1 sm:pl-10">{rev.comment}</p>
                  )}
                </div>
              ))}
            </div>

            {hasMoreModal && (
              <div className="text-center pt-2 shrink-0 border-t border-border">
                <button
                  onClick={loadMoreModalReviews}
                  disabled={loadingMore}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Load More Reviews</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
