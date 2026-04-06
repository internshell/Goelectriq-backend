import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  downloadInvoice,
  confirmBooking,
  completeBooking,
  collectPayment,
  getAllBookings,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';
import { validateObjectId } from '../middleware/validation.js';
import { authorize } from '../middleware/roleCheck.js';

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Booking routes
router.route('/')
  .get(getMyBookings)
  .post(bookingLimiter, createBooking);

router.route('/:id')
  .get(validateObjectId('id'), getBookingById);

router.put('/:id/cancel', validateObjectId('id'), cancelBooking);
router.get('/:id/invoice', validateObjectId('id'), downloadInvoice);

// Admin actions for bookings
router.put(
  '/:id/confirm',
  authorize('admin'),
  validateObjectId('id'),
  confirmBooking
);

router.put(
  '/:id/complete',
  authorize('admin'),
  validateObjectId('id'),
  completeBooking
);

router.post(
  '/:id/collect-payment',
  authorize('admin'),
  validateObjectId('id'),
  collectPayment
);

export default router;