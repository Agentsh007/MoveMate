// =============================================
// Property SQL Queries
// =============================================

export const propertyQueries = {
  // Create a new property
  create: `
    INSERT INTO properties (owner_id, title, description, property_type, booking_model,
      address, city, latitude, longitude, bedrooms, bathrooms, area_sqft, max_guests,
      base_price, price_unit, instant_book, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `,

  // List properties with filters
  // This is built dynamically in the controller based on query params
  listBase: `
    SELECT p.*,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count,
      u.name AS owner_name
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    WHERE p.status = 'active' AND p.deleted_at IS NULL
  `,

  // Get single property detail (for authenticated users — includes owner contact)
  detailAuth: `
    SELECT p.*,
      u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone,
      up.avatar_url AS owner_avatar,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `,

  // Get single property detail (for guests — NO owner phone/email)
  detailGuest: `
    SELECT p.*,
      u.name AS owner_name,
      up.avatar_url AS owner_avatar,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `,

  // Get images for a property
  getImages: `
    SELECT * FROM property_images
    WHERE property_id = $1
    ORDER BY display_order ASC
  `,


  // Add image
  addImage: `
    INSERT INTO property_images (property_id, url, is_primary, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,

  // Delete image
  deleteImage: `
    DELETE FROM property_images WHERE id = $1 AND property_id = $2
    RETURNING *
  `,

  // Get amenities
  getAmenities: `SELECT * FROM property_amenities WHERE property_id = $1`,

  // Add amenity
  addAmenity: `
    INSERT INTO property_amenities (property_id, name) VALUES ($1, $2) RETURNING *
  `,

  // Delete all amenities (for update — delete then re-insert)
  deleteAmenities: `DELETE FROM property_amenities WHERE property_id = $1`,

  // Get rules
  getRules: `SELECT * FROM property_rules WHERE property_id = $1`,
  // Add rule
  addRule: `
    INSERT INTO property_rules (property_id, rule_text) VALUES ($1, $2) RETURNING *
  `,

  // Delete all rules
  deleteRules: `DELETE FROM property_rules WHERE property_id = $1`,

  // Update property
  update: `
    UPDATE properties SET
      title = $2, description = $3, property_type = $4, booking_model = $5,
      address = $6, city = $7, latitude = $8, longitude = $9, bedrooms = $10,
      bathrooms = $11, area_sqft = $12, max_guests = $13, base_price = $14,
      price_unit = $15, instant_book = $16, status = $17
    WHERE id = $1 AND owner_id = $18 AND deleted_at IS NULL
    RETURNING *
  `,
  // Update the database partially
  updatePartial: `
    UPDATE properties 
    SET ${'placeholder'} , updated_at = NOW()
    WHERE id = $1 AND owner_id = $2
    RETURNING *
  `,
  // Delete property → Soft Delete
  softDelete: `
    UPDATE properties 
    SET deleted_at = NOW(), 
        status = 'deleted',
        updated_at = NOW()
    WHERE id = $1 AND owner_id = $2 
      AND deleted_at IS NULL
    RETURNING id, title
  `,

  // Delete property (owner only)
  // delete: `DELETE FROM properties WHERE id = $1 AND owner_id = $2 RETURNING *`,

  // Get properties by owner
  getByOwner: `
    SELECT p.*,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count
    FROM properties p
    WHERE p.owner_id = $1 AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
  `,

  // Featured (latest active properties)
  featured: `
    SELECT p.*,
      (SELECT url FROM property_images WHERE property_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
      (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.property_id = p.id) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id) AS review_count,
      u.name AS owner_name
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    WHERE p.status = 'active' AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT $1
  `,
};
