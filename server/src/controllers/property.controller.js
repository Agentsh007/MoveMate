// =============================================
// Property Controller — CRUD + Image Upload
// =============================================
// KEY CONCEPT: Owner Contact Gating
// The property detail endpoint checks if the request is authenticated.
// - Authenticated: returns owner name, email, phone, avatar
// - Guest: returns only owner name and avatar (NO phone/email)
// This is enforced HERE at the API level, not just hidden in frontend.
// =============================================

import { query, getClient } from '../config/db.js';
import { propertyQueries } from '../queries/property.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * GET /api/properties
 * List properties with dynamic filters
 */
export const listProperties = asyncHandler(async (req, res) => {
  const {
    type, minPrice, maxPrice, city, bedrooms,
    lat, lng, radius, guests, page = 1, limit = 12, sort
  } = req.query;

  // Start with base query and build WHERE clauses dynamically
  let sql = propertyQueries.listBase;
  const params = [];
  let paramCount = 0;

  // Add filters
  if (type) {
    paramCount++;
    sql += ` AND p.property_type = $${paramCount}`;
    params.push(type);
  }

  if (minPrice) {
    paramCount++;
    sql += ` AND p.base_price >= $${paramCount}`;
    params.push(minPrice);
  }

  if (maxPrice) {
    paramCount++;
    sql += ` AND p.base_price <= $${paramCount}`;
    params.push(maxPrice);
  }

  if (city) {
    paramCount++;
    sql += ` AND LOWER(p.city) = LOWER($${paramCount})`;
    params.push(city);
  }

  if (bedrooms) {
    paramCount++;
    sql += ` AND p.bedrooms >= $${paramCount}`;
    params.push(bedrooms);
  }

  if (guests) {
    paramCount++;
    sql += ` AND p.max_guests >= $${paramCount}`;
    params.push(guests);
  }

  // Location radius filter (uses earthdistance)
  if (lat && lng && radius) {
    paramCount++;
    const latParam = paramCount;
    paramCount++;
    const lngParam = paramCount;
    paramCount++;
    const radiusParam = paramCount;
    sql += ` AND earth_box(ll_to_earth($${latParam}, $${lngParam}), $${radiusParam} * 1000) @> ll_to_earth(p.latitude, p.longitude)
             AND earth_distance(ll_to_earth($${latParam}, $${lngParam}), ll_to_earth(p.latitude, p.longitude)) <= $${radiusParam} * 1000`;
    params.push(lat, lng, radius);
  }

  // Sorting
  switch (sort) {
    case 'price_low':
      sql += ' ORDER BY p.base_price ASC';
      break;
    case 'price_high':
      sql += ' ORDER BY p.base_price DESC';
      break;
    case 'rating':
      sql += ' ORDER BY avg_rating DESC';
      break;
    default:
      sql += ' ORDER BY p.created_at DESC';
  }

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  params.push(parseInt(limit));
  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  params.push(offset);

  const { rows } = await query(sql, params);

  // Get total count for pagination
  let countSql = `SELECT COUNT(*) FROM properties p WHERE p.status = 'active'`;
  // Re-apply filters for count (simplified)
  const countParams = [];
  let countParamIdx = 0;
  if (type) { countParamIdx++; countSql += ` AND p.property_type = $${countParamIdx}`; countParams.push(type); }
  if (minPrice) { countParamIdx++; countSql += ` AND p.base_price >= $${countParamIdx}`; countParams.push(minPrice); }
  if (maxPrice) { countParamIdx++; countSql += ` AND p.base_price <= $${countParamIdx}`; countParams.push(maxPrice); }
  if (city) { countParamIdx++; countSql += ` AND LOWER(p.city) = LOWER($${countParamIdx})`; countParams.push(city); }

  const countResult = await query(countSql, countParams);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    properties: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * GET /api/properties/featured
 * Get featured listings for homepage
 */
export const getFeatured = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  const { rows } = await query(propertyQueries.featured, [parseInt(limit)]);
  res.json({ success: true, properties: rows });
});

/**
 * GET /api/properties/:id
 * Get property detail — owner contact shown only to authenticated users
 */
export const getPropertyDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Use different query based on authentication
  const queryText = req.user
    ? propertyQueries.detailAuth
    : propertyQueries.detailGuest;

  const { rows } = await query(queryText, [id]);

  if (!rows[0]) {
    throw new AppError('Property not found', 404);
  }

  // Get images, amenities, rules
  const [images, amenities, rules] = await Promise.all([
    query(propertyQueries.getImages, [id]),
    query(propertyQueries.getAmenities, [id]),
    query(propertyQueries.getRules, [id]),
  ]);

  const property = {
    ...rows[0],
    images: images.rows,
    amenities: amenities.rows,
    rules: rules.rows,
  };

  res.json({ success: true, property });
});

/**
 * POST /api/properties
 * Create a new property (owner only)
 */
export const createProperty = asyncHandler(async (req, res) => {
  const {
    title, description, property_type, booking_model,
    address, city, latitude, longitude, bedrooms, bathrooms,
    area_sqft, max_guests, base_price, price_unit,
    instant_book, amenities, rules
  } = req.body;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Create property
    const { rows } = await client.query(propertyQueries.create, [
      req.user.id, title, description, property_type, booking_model,
      address, city || 'Dhaka', latitude, longitude,
      bedrooms || 1, bathrooms || 1, area_sqft || null,
      max_guests || 2, base_price, price_unit, instant_book || false, 'active'
    ]);

    const property = rows[0];

    // Add amenities
    if (amenities && Array.isArray(amenities)) {
      for (const name of amenities) {
        await client.query(propertyQueries.addAmenity, [property.id, name]);
      }
    }

    // Add rules
    if (rules && Array.isArray(rules)) {
      for (const ruleText of rules) {
        await client.query(propertyQueries.addRule, [property.id, ruleText]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ success: true, property });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * PUT /api/properties/:id
 * Update a property (owner only)
 */
export const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title, description, property_type, booking_model,
    address, city, latitude, longitude, bedrooms, bathrooms,
    area_sqft, max_guests, base_price, price_unit,
    instant_book, status, amenities, rules
  } = req.body;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(propertyQueries.update, [
      id, title, description, property_type, booking_model,
      address, city, latitude, longitude, bedrooms, bathrooms,
      area_sqft, max_guests, base_price, price_unit,
      instant_book, status || 'active', req.user.id
    ]);

    if (!rows[0]) {
      throw new AppError('Property not found or not authorized', 404);
    }

    // Replace amenities
    if (amenities && Array.isArray(amenities)) {
      await client.query(propertyQueries.deleteAmenities, [id]);
      for (const name of amenities) {
        await client.query(propertyQueries.addAmenity, [id, name]);
      }
    }

    // Replace rules
    if (rules && Array.isArray(rules)) {
      await client.query(propertyQueries.deleteRules, [id]);
      for (const ruleText of rules) {
        await client.query(propertyQueries.addRule, [id, ruleText]);
      }
    }

    await client.query('COMMIT');

    res.json({ success: true, property: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/properties/:id
 * Delete a property (owner only)
 */
export const deleteProperty = asyncHandler(async (req, res) => {
  const { rows } = await query(propertyQueries.delete, [req.params.id, req.user.id]);

  if (!rows[0]) {
    throw new AppError('Property not found or not authorized', 404);
  }

  res.json({ success: true, message: 'Property deleted' });
});

/**
 * POST /api/properties/:id/images
 * Upload property images to Supabase Storage
 */
export const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    throw new AppError('No images provided', 400);
  }

  const uploadedImages = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const ext = file.originalname.split('.').pop();
    const fileName = `${id}/${Date.now()}_${i}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('property-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('property-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Save to DB
    const isPrimary = i === 0 && uploadedImages.length === 0;
    const { rows } = await query(propertyQueries.addImage, [
      id, publicUrl, isPrimary, i
    ]);

    uploadedImages.push(rows[0]);
  }

  res.status(201).json({ success: true, images: uploadedImages });
});

/**
 * DELETE /api/properties/:id/images/:imageId
 * Remove a property image from DB and Supabase Storage
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  // Get the image URL before deleting
  const { rows: imageRows } = await query(
    'SELECT url FROM property_images WHERE id = $1 AND property_id = $2',
    [imageId, id]
  );

  const { rows } = await query(propertyQueries.deleteImage, [imageId, id]);

  if (!rows[0]) {
    throw new AppError('Image not found', 404);
  }

  // Try to delete from Supabase Storage (best-effort)
  if (imageRows[0]?.url?.includes('supabase')) {
    const path = imageRows[0].url.split('/property-images/')[1];
    if (path) {
      await supabaseAdmin.storage.from('property-images').remove([path]).catch(() => {});
    }
  }

  res.json({ success: true, message: 'Image deleted' });
});

/**
 * GET /api/properties/owner/my-listings
 * Get properties owned by the current user
 */
export const getMyListings = asyncHandler(async (req, res) => {
  const { rows } = await query(propertyQueries.getByOwner, [req.user.id]);
  res.json({ success: true, properties: rows });
});
