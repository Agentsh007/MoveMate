// Booking Routes
import { Router } from 'express';
import {
  createBooking, getBookings, getBookingDetail,
  updateBookingStatus, processPayment,
  scheduleVisit, createAgreement
} from '../controllers/booking.controller.js';
import { protect, ownerOnly } from '../middleware/auth.js';
import { createStripeSession } from '../controllers/stripe.controller.js';
const router = Router();

router.post('/', protect, createBooking);
router.get('/', protect, getBookings);
router.get('/:id', protect, getBookingDetail);
router.put('/:id/status', protect, ownerOnly, updateBookingStatus);
router.post('/:id/pay', protect, processPayment);
router.post('/:id/visit', protect, ownerOnly, scheduleVisit);
router.post('/:id/agreement', protect, ownerOnly, createAgreement);
router.post('/create-stripe-session', protect, createStripeSession);

export default router;
