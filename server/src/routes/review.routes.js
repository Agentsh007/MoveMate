// Review Routes
import { Router } from 'express';
import { createReview, getPropertyReviews, updateReview, checkEligibility } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createReview);
router.get('/property/:propertyId', getPropertyReviews);
router.get('/eligibility/:propertyId', protect, checkEligibility);
router.put('/:id', protect, updateReview);

export default router;
