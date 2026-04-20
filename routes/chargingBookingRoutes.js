import express from 'express';
import {
  createChargingBooking,
  getAllChargingBookings,
  updateChargingBooking,
  deleteChargingBooking,
} from '../controllers/chargingBookingController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/charging-bookings
 * @desc    Create charging station booking (Protected)
 * @access  Private (User)
 */
router.post('/', protect, createChargingBooking);

/**
 * @route   GET /api/charging-bookings
 * @desc    Get all charging bookings (Admin)
 * @access  Private (Admin)
 */
router.get('/', protect, isAdmin, getAllChargingBookings);

/**
 * @route   PUT /api/charging-bookings/:id
 * @desc    Update booking status
 * @access  Private (Admin)
 */
router.put('/:id', protect, isAdmin, validateObjectId('id'), updateChargingBooking);

/**
 * @route   DELETE /api/charging-bookings/:id
 * @desc    Delete booking
 * @access  Private (Admin)
 */
router.delete('/:id', protect, isAdmin, validateObjectId('id'), deleteChargingBooking);

export default router;
