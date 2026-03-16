// Property Routes
import { Router } from 'express';
import {
  listProperties, getFeatured, getPropertyDetail,
  createProperty, updateProperty, deleteProperty,
  uploadImages, deleteImage, getMyListings
} from '../controllers/property.controller.js';
import { protect, ownerOnly, optionalAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

// Public routes
router.get('/', listProperties);
router.get('/featured', getFeatured);

// Owner routes (must come BEFORE /:id to avoid route conflict)
router.get('/owner/my-listings', protect, ownerOnly, getMyListings);
router.post('/', protect, ownerOnly, createProperty);

// Property detail — uses optionalAuth to gate owner contact info
router.get('/:id', optionalAuth, getPropertyDetail);

// Owner-only property management
router.put('/:id', protect, ownerOnly, updateProperty);
router.delete('/:id', protect, ownerOnly, deleteProperty);

// Image management
router.post('/:id/images', protect, ownerOnly, upload.array('images', 10), uploadImages);
router.delete('/:id/images/:imageId', protect, ownerOnly, deleteImage);

export default router;
