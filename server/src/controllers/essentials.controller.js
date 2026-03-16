// =============================================
// Essentials Controller — Nearby Services
// =============================================

import { query } from '../config/db.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/essentials
 * Get nearby essential services
 * Query params: lat, lng, radius (km), category (UUID)
 */
export const getNearbyServices = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5, category } = req.query;

  if (!lat || !lng) {
    throw new AppError('Latitude and longitude are required', 400);
  }

  let result;
  if (category) {
    result = await query(locationQueries.getNearbyServicesByCategory, [
      parseFloat(lat), parseFloat(lng), parseFloat(radius), category
    ]);
  } else {
    result = await query(locationQueries.getNearbyServices, [
      parseFloat(lat), parseFloat(lng), parseFloat(radius)
    ]);
  }

  res.json({ success: true, services: result.rows });
});

/**
 * GET /api/essentials/categories
 * Get all essential service categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.getEssentialCategories);
  res.json({ success: true, categories: rows });
});

/**
 * POST /api/essentials/report
 * Report incorrect info for a service
 */
export const reportService = asyncHandler(async (req, res) => {
  const { service_id, reason, details } = req.body;

  // For now, log the report. In production, store in a reports table.
  console.log(`📋 Service report: ${service_id} — ${reason}: ${details}`);

  res.json({ success: true, message: 'Report submitted. Thank you!' });
});
