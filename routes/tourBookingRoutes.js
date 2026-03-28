import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';
import { 
  createTourBooking, 
  getMyTourBookings,
  getTourBookingById,
  getTourBookingPayments,
  confirmTourBooking,
  completeTourBooking,
  collectTourPayment,
  getAllTourBookings 
} from '../controllers/tourBookingController.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// User routes
router.post('/', protect, createTourBooking);
router.get('/my-bookings', protect, getMyTourBookings);
router.get('/:id', protect, validateObjectId('id'), getTourBookingById);
router.get('/:tourBookingId/payments', protect, validateObjectId('tourBookingId'), getTourBookingPayments);

// ===== ADMIN ROUTES =====
router.get('/admin/all-bookings', authorize('admin'), getAllTourBookings);

// Admin actions
router.put(
  '/:id/confirm',
  authorize('admin'),
  validateObjectId('id'),
  confirmTourBooking
);

router.put(
  '/:id/complete',
  authorize('admin'),
  validateObjectId('id'),
  completeTourBooking
);

router.post(
  '/:id/collect-payment',
  authorize('admin'),
  validateObjectId('id'),
  collectTourPayment
);

export default router;
