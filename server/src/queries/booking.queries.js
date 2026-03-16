// =============================================
// Booking SQL Queries
// =============================================

export const bookingQueries = {
  // Create a booking
  create: `
    INSERT INTO bookings (property_id, user_id, booking_type, check_in, check_out, guests, total_price, status, message)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `,

  // Get booking by ID with property and user info
  findById: `
    SELECT b.*,
      p.title AS property_title, p.address AS property_address,
      p.base_price, p.price_unit, p.booking_model, p.owner_id,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS property_image,
      u.name AS user_name, u.email AS user_email, u.phone AS user_phone
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users u ON b.user_id = u.id
    WHERE b.id = $1
  `,

  // Get bookings by user
  findByUser: `
    SELECT b.*,
      p.title AS property_title, p.address AS property_address,
      p.base_price, p.price_unit,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS property_image
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
  `,

  // Get bookings for owner's properties
  findByOwner: `
    SELECT b.*,
      p.title AS property_title, p.address AS property_address,
      u.name AS user_name, u.email AS user_email, u.phone AS user_phone
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users u ON b.user_id = u.id
    WHERE p.owner_id = $1
    ORDER BY b.created_at DESC
  `,

  // Update booking status
  updateStatus: `
    UPDATE bookings SET status = $2 WHERE id = $1 RETURNING *
  `,

  // Create booking request (for short-term non-instant)
  createRequest: `
    INSERT INTO booking_requests (booking_id, user_message, status)
    VALUES ($1, $2, 'pending')
    RETURNING *
  `,

  // Get booking request
  getRequest: `
    SELECT * FROM booking_requests WHERE booking_id = $1
  `,

  // Update booking request (owner responds)
  updateRequest: `
    UPDATE booking_requests SET owner_response = $2, status = $3, responded_at = NOW()
    WHERE booking_id = $1
    RETURNING *
  `,

  // Create rental visit (long-term)
  createVisit: `
    INSERT INTO rental_visits (booking_id, scheduled_at, notes)
    VALUES ($1, $2, $3)
    RETURNING *
  `,

  // Get visits for a booking
  getVisits: `
    SELECT * FROM rental_visits WHERE booking_id = $1 ORDER BY scheduled_at ASC
  `,

  // Update visit status
  updateVisit: `
    UPDATE rental_visits SET status = $2, notes = $3 WHERE id = $1 RETURNING *
  `,

  // Create rental agreement (long-term)
  createAgreement: `
    INSERT INTO rental_agreements (booking_id, deposit_amount, advance_amount, monthly_rent,
      contract_start, contract_end, document_url, signed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `,

  // Get agreement for a booking
  getAgreement: `
    SELECT * FROM rental_agreements WHERE booking_id = $1
  `,

  // Create payment
  createPayment: `
    INSERT INTO payments (booking_id, payer_id, amount, payment_method, timing, status, transaction_id, paid_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `,

  // Get payments for a booking
  getPayments: `
    SELECT * FROM payments WHERE booking_id = $1 ORDER BY paid_at DESC
  `,
};
