import { useState } from 'react';
import { Star, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewAPI } from '../../api/review.api';

export default function ReviewForm({ propertyId, bookingId, existingReview, onReviewSubmitted }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);

  const isEditing = !!existingReview;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await reviewAPI.update(existingReview.id, { rating, comment });
        toast.success('Review updated successfully!');
      } else {
        await reviewAPI.create({ property_id: propertyId, booking_id: bookingId, rating, comment });
        toast.success('Review submitted! Thank you.');
      }
      onReviewSubmitted(); // Trigger a re-fetch of the reviews list
    } catch (err) {
      console.error('Submit review error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-primary/20 p-6 mb-8 shadow-sm">
      <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
        {isEditing ? 'Update Your Review' : 'Rate your stay'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating *</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={
                    star <= (hoverRating || rating)
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-gray-200 fill-gray-50'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share your experience (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like about this property? What could be improved?"
            rows={4}
            className="input-field w-full resize-y text-sm"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isEditing ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
