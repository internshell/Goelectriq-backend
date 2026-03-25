import express from 'express';
import { protect } from '../middleware/auth.js';
import { createTourBooking, getMyTourBookings } from '../controllers/tourBookingController.js';

const router = express.Router();

// Create tour booking
router.post('/', protect, createTourBooking);

// Get user's tour bookings
router.get('/my-bookings', protect, getMyTourBookings);

export default router;
