// Review Routes
import { Router } from 'express';
import { createReview, getPropertyReviews } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createReview);
router.get('/property/:propertyId', getPropertyReviews);

export default router;
