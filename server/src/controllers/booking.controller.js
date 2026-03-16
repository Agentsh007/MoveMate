// =============================================
// Booking Controller — 3 Booking Flows
// =============================================
// The booking_model on the property determines which flow runs:
//
// 1. HOTEL STYLE → Select dates → Price breakdown → Pay Now or Pay at Property
// 2. SHORT TERM  → Instant Book (auto-confirmed) or Request (owner approves)
// 3. LONG TERM   → Express Interest → Owner Schedules Visit → Agreement
//
// Each flow has different status transitions and child records.
// =============================================

import { query, getClient } from '../config/db.js';
import { bookingQueries } from '../queries/booking.queries.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../config/email.js';

/**
 * POST /api/bookings
 * Create a new booking — flow determined by booking_type
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    property_id, booking_type, check_in, check_out,
    guests, total_price, message
  } = req.body;

  // Determine initial status based on booking type
  let status;
  switch (booking_type) {
    case 'hotel_pay_now':
      status = 'confirmed'; // Will become confirmed after payment
      break;
    case 'hotel_pay_at_property':
      status = 'confirmed'; // Confirmed immediately (pay later)
      break;
    case 'short_term_instant':
      status = 'confirmed'; // Instant book = auto confirmed
      break;
    case 'short_term_request':
      status = 'pending'; // Needs owner approval
      break;
    case 'long_term_inquiry':
      status = 'pending'; // Needs owner response
      break;
    default:
      throw new AppError('Invalid booking type', 400);
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Create the booking
    const { rows } = await client.query(bookingQueries.create, [
      property_id, req.user.id, booking_type,
      check_in || null, check_out || null,
      guests || 1, total_price || null, status, message || null
    ]);

    const booking = rows[0];

    // For short-term request bookings, create a booking request
    if (booking_type === 'short_term_request') {
      await client.query(bookingQueries.createRequest, [
        booking.id, message || 'I would like to book this property.'
      ]);
    }

    await client.query('COMMIT');

    // Send notification email to owner
    const propertyResult = await query(
      `SELECT p.title, p.owner_id, u.email AS owner_email, u.name AS owner_name
       FROM properties p JOIN users u ON p.owner_id = u.id WHERE p.id = $1`,
      [property_id]
    );

    if (propertyResult.rows[0]) {
      const prop = propertyResult.rows[0];
      // Create in-app notification
      await query(locationQueries.createNotification, [
        prop.owner_id,
        'new_booking',
        'New Booking Request',
        `You have a new ${booking_type.replace(/_/g, ' ')} booking for "${prop.title}"`,
        JSON.stringify({ booking_id: booking.id, property_id })
      ]);

      // Send email
      await sendEmail({
        to: prop.owner_email,
        subject: `New Booking for "${prop.title}" — MoveMate`,
        html: `
          <h2>New Booking Request</h2>
          <p>Hi ${prop.owner_name},</p>
          <p>You have a new <strong>${booking_type.replace(/_/g, ' ')}</strong> booking for your property <strong>"${prop.title}"</strong>.</p>
          <p>Check-in: ${check_in || 'TBD'} | Check-out: ${check_out || 'TBD'}</p>
          <p>Please log in to MoveMate to review and respond.</p>
          <br/>
          <p>— MoveMate Team</p>
        `,
      });
    }

    res.status(201).json({ success: true, booking });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * GET /api/bookings
 * Get user's bookings (or owner's received bookings)
 */
export const getBookings = asyncHandler(async (req, res) => {
  const { role } = req.query;

  let rows;
  if (role === 'owner' && req.user.role === 'owner') {
    // Get bookings for owner's properties
    const result = await query(bookingQueries.findByOwner, [req.user.id]);
    rows = result.rows;
  } else {
    // Get user's own bookings
    const result = await query(bookingQueries.findByUser, [req.user.id]);
    rows = result.rows;
  }

  res.json({ success: true, bookings: rows });
});

/**
 * GET /api/bookings/:id
 * Get booking detail
 */
export const getBookingDetail = asyncHandler(async (req, res) => {
  const { rows } = await query(bookingQueries.findById, [req.params.id]);

  if (!rows[0]) {
    throw new AppError('Booking not found', 404);
  }

  const booking = rows[0];

  // Only allow the booking user or property owner to view
  if (booking.user_id !== req.user.id && booking.owner_id !== req.user.id) {
    throw new AppError('Not authorized', 403);
  }

  // Get related data
  const [requestResult, visitsResult, agreementResult, paymentsResult] = await Promise.all([
    query(bookingQueries.getRequest, [booking.id]),
    query(bookingQueries.getVisits, [booking.id]),
    query(bookingQueries.getAgreement, [booking.id]),
    query(bookingQueries.getPayments, [booking.id]),
  ]);

  res.json({
    success: true,
    booking: {
      ...booking,
      request: requestResult.rows[0] || null,
      visits: visitsResult.rows,
      agreement: agreementResult.rows[0] || null,
      payments: paymentsResult.rows,
    },
  });
});

/**
 * PUT /api/bookings/:id/status
 * Owner accepts or rejects a booking
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, owner_response } = req.body;
  const bookingId = req.params.id;

  // Get booking and verify owner
  const { rows: bookingRows } = await query(bookingQueries.findById, [bookingId]);
  if (!bookingRows[0]) throw new AppError('Booking not found', 404);

  const booking = bookingRows[0];
  if (booking.owner_id !== req.user.id) {
    throw new AppError('Not authorized — not the property owner', 403);
  }

  // Update booking status
  await query(bookingQueries.updateStatus, [bookingId, status]);

  // If it's a request booking, update the request too
  if (booking.booking_type === 'short_term_request') {
    await query(bookingQueries.updateRequest, [
      bookingId, owner_response || null, status
    ]);
  }

  // Notify user
  await query(locationQueries.createNotification, [
    booking.user_id,
    'booking_update',
    `Booking ${status}`,
    `Your booking for "${booking.property_title}" has been ${status}.`,
    JSON.stringify({ booking_id: bookingId })
  ]);

  // Send email to user
  await sendEmail({
    to: booking.user_email,
    subject: `Booking ${status} — "${booking.property_title}" — MoveMate`,
    html: `
      <h2>Booking ${status === 'confirmed' ? 'Confirmed ✅' : 'Update'}</h2>
      <p>Hi ${booking.user_name},</p>
      <p>Your booking for <strong>"${booking.property_title}"</strong> has been <strong>${status}</strong>.</p>
      ${owner_response ? `<p>Owner's message: "${owner_response}"</p>` : ''}
      <br/>
      <p>— MoveMate Team</p>
    `,
  });

  res.json({ success: true, message: `Booking ${status}` });
});

/**
 * POST /api/bookings/:id/pay
 * Record payment (stubbed — would integrate SSLCommerz)
 */
export const processPayment = asyncHandler(async (req, res) => {
  const { amount, payment_method, timing } = req.body;
  const bookingId = req.params.id;

  // Verify booking belongs to user
  const { rows: bookingRows } = await query(bookingQueries.findById, [bookingId]);
  if (!bookingRows[0]) throw new AppError('Booking not found', 404);
  if (bookingRows[0].user_id !== req.user.id) {
    throw new AppError('Not authorized', 403);
  }

  // TODO: Integrate SSLCommerz payment gateway
  // For now, simulate successful payment
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const { rows } = await query(bookingQueries.createPayment, [
    bookingId, req.user.id, amount, payment_method || 'bkash',
    timing || 'pay_now', 'completed', transactionId
  ]);

  // Update booking status to confirmed if payment successful
  await query(bookingQueries.updateStatus, [bookingId, 'confirmed']);

  // Notify owner
  const booking = bookingRows[0];
  await query(locationQueries.createNotification, [
    booking.owner_id,
    'payment_received',
    'Payment Received',
    `Payment of ৳${amount} received for "${booking.property_title}"`,
    JSON.stringify({ booking_id: bookingId, amount })
  ]);

  await sendEmail({
    to: booking.user_email,
    subject: `Payment Confirmed — MoveMate`,
    html: `
      <h2>Payment Confirmed ✅</h2>
      <p>Your payment of <strong>৳${amount}</strong> for <strong>"${booking.property_title}"</strong> has been confirmed.</p>
      <p>Transaction ID: ${transactionId}</p>
      <br/>
      <p>— MoveMate Team</p>
    `,
  });

  res.json({ success: true, payment: rows[0] });
});

/**
 * POST /api/bookings/:id/visit
 * Schedule a property visit (long-term flow)
 */
export const scheduleVisit = asyncHandler(async (req, res) => {
  const { scheduled_at, notes } = req.body;
  const bookingId = req.params.id;

  const { rows: bookingRows } = await query(bookingQueries.findById, [bookingId]);
  if (!bookingRows[0]) throw new AppError('Booking not found', 404);
  if (bookingRows[0].owner_id !== req.user.id) {
    throw new AppError('Only the property owner can schedule visits', 403);
  }

  const { rows } = await query(bookingQueries.createVisit, [
    bookingId, scheduled_at, notes || null
  ]);

  // Update booking status
  await query(bookingQueries.updateStatus, [bookingId, 'confirmed']);

  // Notify user
  await query(locationQueries.createNotification, [
    bookingRows[0].user_id,
    'visit_scheduled',
    'Visit Scheduled',
    `A visit has been scheduled for "${bookingRows[0].property_title}" on ${scheduled_at}`,
    JSON.stringify({ booking_id: bookingId })
  ]);

  await sendEmail({
    to: bookingRows[0].user_email,
    subject: `Visit Scheduled — "${bookingRows[0].property_title}" — MoveMate`,
    html: `
      <h2>Visit Scheduled 📅</h2>
      <p>Hi ${bookingRows[0].user_name},</p>
      <p>A visit has been scheduled for <strong>"${bookingRows[0].property_title}"</strong>.</p>
      <p>Date/Time: <strong>${scheduled_at}</strong></p>
      ${notes ? `<p>Notes: ${notes}</p>` : ''}
      <br/>
      <p>— MoveMate Team</p>
    `,
  });

  res.json({ success: true, visit: rows[0] });
});

/**
 * POST /api/bookings/:id/agreement
 * Create rental agreement (long-term flow)
 */
export const createAgreement = asyncHandler(async (req, res) => {
  const {
    deposit_amount, advance_amount, monthly_rent,
    contract_start, contract_end, document_url
  } = req.body;
  const bookingId = req.params.id;

  const { rows: bookingRows } = await query(bookingQueries.findById, [bookingId]);
  if (!bookingRows[0]) throw new AppError('Booking not found', 404);
  if (bookingRows[0].owner_id !== req.user.id) {
    throw new AppError('Only the property owner can create agreements', 403);
  }

  const { rows } = await query(bookingQueries.createAgreement, [
    bookingId, deposit_amount, advance_amount, monthly_rent,
    contract_start, contract_end, document_url || null
  ]);

  // Update booking status to contracted
  await query(bookingQueries.updateStatus, [bookingId, 'contracted']);

  // Notify user
  await query(locationQueries.createNotification, [
    bookingRows[0].user_id,
    'agreement_created',
    'Rental Agreement Created',
    `A rental agreement has been created for "${bookingRows[0].property_title}"`,
    JSON.stringify({ booking_id: bookingId })
  ]);

  await sendEmail({
    to: bookingRows[0].user_email,
    subject: `Rental Agreement — "${bookingRows[0].property_title}" — MoveMate`,
    html: `
      <h2>Rental Agreement Created 📝</h2>
      <p>Hi ${bookingRows[0].user_name},</p>
      <p>A rental agreement has been created for <strong>"${bookingRows[0].property_title}"</strong>.</p>
      <p>Monthly Rent: ৳${monthly_rent}</p>
      <p>Contract: ${contract_start} to ${contract_end}</p>
      <p>Please log in to MoveMate to review and accept.</p>
      <br/>
      <p>— MoveMate Team</p>
    `,
  });

  res.json({ success: true, agreement: rows[0] });
});
