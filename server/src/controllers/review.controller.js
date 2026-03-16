// =============================================
// Review Controller
// =============================================

import { query } from '../config/db.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../config/email.js';

/**
 * POST /api/reviews
 * Submit a review (requires a completed booking)
 */
export const createReview = asyncHandler(async (req, res) => {
  const { property_id, booking_id, rating, comment } = req.body;

  if (!property_id || !booking_id || !rating) {
    throw new AppError('Property ID, booking ID, and rating are required', 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Verify booking belongs to user and is completed
  const bookingResult = await query(
    `SELECT b.*, p.title AS property_title, p.owner_id
     FROM bookings b JOIN properties p ON b.property_id = p.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [booking_id, req.user.id]
  );

  if (!bookingResult.rows[0]) {
    throw new AppError('Booking not found or not yours', 404);
  }

  const booking = bookingResult.rows[0];

  // Check for duplicate review
  const existingReview = await query(
    'SELECT id FROM reviews WHERE booking_id = $1',
    [booking_id]
  );
  if (existingReview.rows.length > 0) {
    throw new AppError('You already reviewed this booking', 409);
  }

  // Create review
  const { rows } = await query(locationQueries.createReview, [
    property_id, req.user.id, booking_id, rating, comment || null
  ]);

  // Notify property owner
  await query(locationQueries.createNotification, [
    booking.owner_id,
    'new_review',
    'New Review',
    `Your property "${booking.property_title}" received a ${rating}-star review.`,
    JSON.stringify({ property_id, review_id: rows[0].id })
  ]);

  // Get owner email for notification
  const ownerResult = await query('SELECT email, name FROM users WHERE id = $1', [booking.owner_id]);
  if (ownerResult.rows[0]) {
    await sendEmail({
      to: ownerResult.rows[0].email,
      subject: `New ${rating}★ Review — "${booking.property_title}" — MoveMate`,
      html: `
        <h2>New Review ⭐</h2>
        <p>Hi ${ownerResult.rows[0].name},</p>
        <p>Your property <strong>"${booking.property_title}"</strong> received a <strong>${rating}-star</strong> review.</p>
        ${comment ? `<p>"${comment}"</p>` : ''}
        <br/><p>— MoveMate Team</p>
      `,
    });
  }

  res.status(201).json({ success: true, review: rows[0] });
});

/**
 * GET /api/reviews/property/:propertyId
 * Get all reviews for a property
 */
export const getPropertyReviews = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.getByProperty, [req.params.propertyId]);

  // Calculate rating breakdown
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  rows.forEach(r => {
    breakdown[r.rating]++;
    totalRating += r.rating;
  });

  res.json({
    success: true,
    reviews: rows,
    summary: {
      count: rows.length,
      average: rows.length > 0 ? (totalRating / rows.length).toFixed(1) : 0,
      breakdown,
    },
  });
});
