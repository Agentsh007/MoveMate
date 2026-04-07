// =============================================
// Review Section — Star Ratings + Review Cards
// =============================================

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { reviewAPI } from '../../api/review.api';
import { timeAgo } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';
import ReviewForm from './ReviewForm';

export default function ReviewSection({ propertyId }) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ count: 0, average: 0, breakdown: {} });
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const { data } = await reviewAPI.getByProperty(propertyId);
      setReviews(data.reviews);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async () => {
    if (!user) return;
    try {
      const { data } = await reviewAPI.checkEligibility(propertyId);
      setEligibility(data);
    } catch (err) {
      console.error('Failed to check eligibility:', err);
    } finally {
      setEligibilityLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchReviews();
      fetchEligibility();
    }
  }, [propertyId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={14}
          className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare size={20} />
        Reviews
        <span className="text-sm font-normal text-muted">({summary?.count || 0})</span>
      </h2>

      {!user ? (
        <div className="bg-gray-50 border border-border rounded-xl p-6 text-center mb-8">
          <p className="text-gray-600 text-sm">
            Please <span className="font-semibold text-primary">Log in</span> to leave a review for this property.
          </p>
        </div>
      ) : eligibilityLoading ? (
        <p className="text-sm text-muted">
          Checking review eligibility...
        </p>
      ) : eligibility?.canReview ? (
        <ReviewForm
          propertyId={propertyId}
          bookingId={eligibility.bookingId}
          existingReview={eligibility.existingReview}
          onReviewSubmitted={() => {
            fetchReviews();
            fetchEligibility();
          }}
        />
      ) : (
        <div className="bg-gray-50 border border-border rounded-xl p-6 text-center mb-8">
          <p className="text-gray-600 text-sm">
            Only guests with a confirmed booking can leave a review.
          </p>
        </div>
      )}

      {summary?.count > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="text-center mb-4">
              <p className="text-4xl font-heading font-bold text-gray-900">
                {parseFloat(summary.average || 0).toFixed(1)}
              </p>
              <div className="flex justify-center mt-1">{renderStars(Math.round(summary.average || 0))}</div>
              <p className="text-sm text-muted mt-1">{summary.count} review{summary.count !== 1 ? 's' : ''}</p>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(n => {
                const count = summary.breakdown?.[n] || 0;
                const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-500">{n}</span>
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-gray-400 text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Cards */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {review.reviewer_avatar ? (
                      <img src={review.reviewer_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {review.reviewer_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-900">{review.reviewer_name}</p>
                      <p className="text-xs text-muted">{timeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-2xl border border-border">
          <MessageSquare size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-muted text-sm">No reviews yet</p>
        </div>
      )}
    </div>
  );
}