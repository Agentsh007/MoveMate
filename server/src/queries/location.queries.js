// =============================================
// Location SQL Queries — Essentials + Emergency
// =============================================
// These queries use PostgreSQL earthdistance extension
// to find services/contacts within a radius of a point.
//
// HOW SPATIAL QUERIES WORK:
// 1. ll_to_earth(lat, lng) converts lat/lng → 3D point on Earth
// 2. earth_distance(point1, point2) → distance in METERS
// 3. earth_box(center, radius) → bounding box for index scan
// 4. The @> operator checks if a point is inside the box
// 5. We double-check with earth_distance for precision
//    (bounding box is rectangular, but radius is circular)
//
// This two-step approach is fast AND accurate:
// Step 1 (earth_box @>): Eliminates 99% of rows using the GiST index
// Step 2 (earth_distance <=): Precise circle check on remaining rows
// =============================================

export const locationQueries = {
  // === ESSENTIALS ===

  // Get all essential categories
  getEssentialCategories: `
    SELECT * FROM essential_categories ORDER BY display_order ASC
  `,

  // Get nearby essential services within radius
  // $1 = latitude, $2 = longitude, $3 = radius in km
  getNearbyServices: `
    SELECT
      s.*,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      earth_distance(
        ll_to_earth($1, $2),
        ll_to_earth(s.latitude, s.longitude)
      ) / 1000 AS distance_km
    FROM essential_services s
    JOIN essential_categories c ON s.category_id = c.id
    WHERE
      earth_box(ll_to_earth($1, $2), $3 * 1000) @> ll_to_earth(s.latitude, s.longitude)
      AND earth_distance(ll_to_earth($1, $2), ll_to_earth(s.latitude, s.longitude)) <= $3 * 1000
    ORDER BY distance_km ASC
    LIMIT 50
  `,

  // Get nearby services filtered by category
  getNearbyServicesByCategory: `
    SELECT
      s.*,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      earth_distance(
        ll_to_earth($1, $2),
        ll_to_earth(s.latitude, s.longitude)
      ) / 1000 AS distance_km
    FROM essential_services s
    JOIN essential_categories c ON s.category_id = c.id
    WHERE
      earth_box(ll_to_earth($1, $2), $3 * 1000) @> ll_to_earth(s.latitude, s.longitude)
      AND earth_distance(ll_to_earth($1, $2), ll_to_earth(s.latitude, s.longitude)) <= $3 * 1000
      AND s.category_id = $4
    ORDER BY distance_km ASC
    LIMIT 50
  `,

  // === EMERGENCY ===

  // Get all emergency categories (ordered by priority)
  getEmergencyCategories: `
    SELECT * FROM emergency_categories ORDER BY priority_level ASC
  `,

  // Get emergency contacts by location
  getEmergencyContacts: `
    SELECT
      ec.*,
      cat.name AS category_name,
      cat.icon AS category_icon,
      cat.color AS category_color,
      cat.priority_level,
      earth_distance(
        ll_to_earth($1, $2),
        ll_to_earth(ec.latitude, ec.longitude)
      ) / 1000 AS distance_km
    FROM emergency_contacts ec
    JOIN emergency_categories cat ON ec.category_id = cat.id
    WHERE ec.is_active = true
      AND earth_box(ll_to_earth($1, $2), 50 * 1000) @> ll_to_earth(ec.latitude, ec.longitude)
    ORDER BY cat.priority_level ASC, distance_km ASC
  `,

  // Get emergency contacts by city (fallback if no location)
  getEmergencyByCity: `
    SELECT ec.*, cat.name AS category_name, cat.icon AS category_icon,
      cat.color AS category_color, cat.priority_level
    FROM emergency_contacts ec
    JOIN emergency_categories cat ON ec.category_id = cat.id
    WHERE ec.is_active = true AND ec.city = $1
    ORDER BY cat.priority_level ASC
  `,

  // Get ALL emergency contacts nationwide (ultimate fallback)
  getAllEmergencyContacts: `
    SELECT ec.*, cat.name AS category_name, cat.icon AS category_icon,
      cat.color AS category_color, cat.priority_level
    FROM emergency_contacts ec
    JOIN emergency_categories cat ON ec.category_id = cat.id
    WHERE ec.is_active = true
    ORDER BY cat.priority_level ASC
  `,

  // === NOTIFICATIONS ===

  getUserNotifications: `
    SELECT * FROM notifications WHERE user_id = $1
    ORDER BY created_at DESC LIMIT 50
  `,

  getUnreadCount: `
    SELECT COUNT(*) AS count FROM notifications
    WHERE user_id = $1 AND is_read = false
  `,

  markAsRead: `
    UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2
    RETURNING *
  `,

  markAllRead: `
    UPDATE notifications SET is_read = true WHERE user_id = $1
  `,

  createNotification: `
    INSERT INTO notifications (user_id, type, title, body, payload)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,

  // === REVIEWS ===

  createReview: `
    INSERT INTO reviews (property_id, reviewer_id, booking_id, rating, comment)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,

  getByProperty: `
    SELECT r.*, u.name AS reviewer_name, up.avatar_url AS reviewer_avatar
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE r.property_id = $1
    ORDER BY r.created_at DESC
  `,

  // === SAVED LISTINGS ===

  saveListing: `
    INSERT INTO saved_listings (user_id, property_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, property_id) DO NOTHING
    RETURNING *
  `,

  unsaveListing: `
    DELETE FROM saved_listings WHERE user_id = $1 AND property_id = $2
    RETURNING *
  `,

  getSavedListings: `
    SELECT p.*,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      sl.created_at AS saved_at
    FROM saved_listings sl
    JOIN properties p ON sl.property_id = p.id
    WHERE sl.user_id = $1
    ORDER BY sl.created_at DESC
  `,

  isSaved: `
    SELECT id FROM saved_listings WHERE user_id = $1 AND property_id = $2
  `,
};
