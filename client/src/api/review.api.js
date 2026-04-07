// =============================================
// Review API  —  /api/reviews
// =============================================
import api from './axiosInstance'
export const reviewAPI = {
    /** GET /api/reviews/property/:propertyId  — public */
    getByProperty: (propertyId) =>
        api.get(`/reviews/property/${propertyId}`),

    /** POST /api/reviews  — protected (create, one per booking) */
    create: (data) =>
        api.post('/reviews', data),
    /**
     * PUT /api/reviews/:id  — protected (edit own review)
     * Only rating + comment can change; booking_id/property_id are immutable.
     */
    update: (reviewId, { rating, comment }) =>
        api.put(`/reviews/${reviewId}`, { rating, comment }),

    /**
     * GET /api/reviews/eligibility/:propertyId  — protected
     * Check if user can review, get booking ID and existing review
     */
    checkEligibility: (propertyId) =>
        api.get(`/reviews/eligibility/${propertyId}`),
};