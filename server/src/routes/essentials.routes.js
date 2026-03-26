// Essentials Routes
import { Router } from 'express';
import { getNearbyServices, getCategories, reportService, reverseGeocode } from '../controllers/essentials.controller.js';

const router = Router();

// All essentials routes are public
router.get('/', getNearbyServices);
router.get('/categories', getCategories);
router.get('/geocode', reverseGeocode);
router.post('/report', reportService);

export default router;
