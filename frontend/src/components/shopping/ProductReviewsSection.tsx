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

function StarRating({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(null)}
          onClick={() => interactive && onRate && onRate(star)}
          className={`w-4 h-4 transition-transform ${
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

        // If user has existing review, populate form
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

  const [reviewerName, setReviewerName] = useState('');

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
      <div className="p-8 rounded-3xl border border-border bg-card shadow-lg flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const averageRating = summaryData?.averageRating || 0;
  const totalReviews = summaryData?.totalReviews || 0;
  const distribution = summaryData?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const latestReviews = summaryData?.latestReviews || [];
  const userReview = summaryData?.userReview;

  return (
    <section className="space-y-8 p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-xl">
      {/* Header Title & Rating Badge */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Community Feedback</span>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
            <span>Ratings & Customer Reviews</span>
            <span className="text-sm font-bold text-muted-foreground">
              ⭐ {averageRating.toFixed(1)} · {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
            </span>
          </h2>
        </div>

        {!userReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Write a Review (রিভিউ লিখুন)</span>
          </button>
        )}
      </div>

      {/* ── Overview Breakdown Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-secondary/30 p-6 rounded-3xl border border-border">
        {/* Left Col: Big Score */}
        <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6 space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Score</span>
          <div className="flex items-baseline gap-2 justify-center md:justify-start">
            <span className="text-5xl font-black text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-base text-muted-foreground font-bold">/ 5.0</span>
          </div>
          <StarRating rating={Math.round(averageRating)} />
          <p className="text-xs text-muted-foreground pt-1">
            Based on {totalReviews} verified community ratings
          </p>
        </div>

        {/* Right Col: Star Distribution Bars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (distribution as any)[star] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-foreground flex items-center gap-1">
                  {star} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden border border-border">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-muted-foreground text-[11px] font-mono">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── User Review Submission / Edit Box ── */}
      {(showForm || isEditing) && (
        <div className="p-6 rounded-3xl bg-secondary/50 border border-emerald-500/30 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>{isEditing ? 'Edit Your Review' : 'Write a Product Review'}</span>
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
              }}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1.5">Select Star Rating *</label>
              <StarRating rating={ratingInput} interactive onRate={setRatingInput} />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Your Review Comment</label>
              <textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Share your experience regarding quality, packaging, freshness, and delivery speed..."
                className="w-full p-3.5 rounded-2xl bg-background border border-border text-foreground text-xs focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
              />
            </div>

            {summaryData?.hasPurchased && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verified Purchaser badge will be added to your review</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-secondary text-foreground font-bold hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── User's Own Existing Review Box ── */}
      {userReview && !isEditing && (
        <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300">Your Review</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-xl bg-background hover:bg-secondary text-xs font-bold text-foreground flex items-center gap-1 border border-border shadow-2xs cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteReview(userReview.id)}
                className="p-1.5 rounded-xl bg-background hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold text-rose-600 flex items-center gap-1 border border-border shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StarRating rating={userReview.rating} />
            <span className="text-xs text-muted-foreground">
              {new Date(userReview.createdAt).toLocaleDateString()}
            </span>
          </div>

          {userReview.comment && (
            <p className="text-xs text-foreground leading-relaxed">{userReview.comment}</p>
          )}
        </div>
      )}

      {/* ── Latest Reviews Display ── */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wider">
          Recent Reviews ({latestReviews.length})
        </h3>

        {latestReviews.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-secondary/30 rounded-3xl border border-border p-6">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <p className="font-bold text-foreground text-base">No reviews yet</p>
            <p className="text-xs text-muted-foreground">Be the first to review this product!</p>
            {!userReview && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Write First Review (প্রথম রিভিউটি আপনি দিন)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {latestReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-3xl border border-border bg-background shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-600/10 border border-emerald-600/30 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                      {(rev.user?.name || 'A')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground text-xs">{rev.user?.name || 'DOHS Resident'}</h4>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={rev.rating} />
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-foreground leading-relaxed pl-12">{rev.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── View All Reviews Button ── */}
      {totalReviews > 2 && (
        <div className="text-center pt-2">
          <button
            onClick={openViewAllModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-extrabold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span>View All Reviews ({totalReviews})</span>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* ── View All Reviews Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-background border border-border rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="font-black text-foreground text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>All Customer Reviews ({totalReviews})</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {modalReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-2xl border border-border bg-secondary/20 space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/10 border border-emerald-600/30 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {(rev.user?.name || 'A')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-xs">{rev.user?.name || 'DOHS Resident'}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={rev.rating} />
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-foreground leading-relaxed pl-11">{rev.comment}</p>
                  )}
                </div>
              ))}
            </div>

            {hasMoreModal && (
              <div className="text-center pt-2 shrink-0 border-t border-border">
                <button
                  onClick={loadMoreModalReviews}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
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
