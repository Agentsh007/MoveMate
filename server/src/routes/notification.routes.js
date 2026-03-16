// Notification Routes
import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);

export default router;
