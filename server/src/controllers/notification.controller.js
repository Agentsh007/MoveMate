// =============================================
// Notification Controller
// =============================================

import { query } from '../config/db.js';
import { locationQueries } from '../queries/location.queries.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/notifications
 * Get user's notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.getUserNotifications, [req.user.id]);
  const countResult = await query(locationQueries.getUnreadCount, [req.user.id]);

  res.json({
    success: true,
    notifications: rows,
    unread_count: parseInt(countResult.rows[0].count),
  });
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { rows } = await query(locationQueries.markAsRead, [req.params.id, req.user.id]);
  res.json({ success: true, notification: rows[0] });
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
export const markAllRead = asyncHandler(async (req, res) => {
  await query(locationQueries.markAllRead, [req.user.id]);
  res.json({ success: true, message: 'All notifications marked as read' });
});
