import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  downloadInvoice,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';
import { validateObjectId } from '../middleware/validation.js';

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

export default router;