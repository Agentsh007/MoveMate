// =============================================
// Emergency Controller — Emergency Contacts
// =============================================
// CRITICAL: This is a public endpoint — no login required.
// Emergency contacts must be accessible to everyone.
// =============================================

import { query } from '../config/db.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/emergency
 * Get emergency contacts by location or city
 * Query params: lat, lng (for location-based) OR city (fallback)
 */
export const getEmergencyContacts = asyncHandler(async (req, res) => {
  const { lat, lng, city } = req.query;

  let result;
  if (lat && lng) {
    result = await query(locationQueries.getEmergencyContacts, [
      parseFloat(lat), parseFloat(lng)
    ]);
  } else if (city) {
    result = await query(locationQueries.getEmergencyByCity, [city]);
  } else {
    // Default: return all active contacts for Dhaka
    result = await query(locationQueries.getEmergencyByCity, ['Dhaka']);
  }

  res.json({ success: true, contacts: result.rows });
});

/**
 * GET /api/emergency/categories
 * Get all emergency categories (ordered by priority)
 */
export const getEmergencyCategories = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.getEmergencyCategories);
  res.json({ success: true, categories: rows });
});

/**
 * POST /api/emergency/report
 * Report a wrong number
 */
export const reportContact = asyncHandler(async (req, res) => {
  const { contact_id, reason } = req.body;
  console.log(`🚨 Emergency report: Contact ${contact_id} — ${reason}`);
  res.json({ success: true, message: 'Report submitted. We will verify within 24 hours.' });
});
