import express from 'express';
import { protect } from '../middleware/auth.js';
import { isDriver } from '../middleware/roleCheck.js';
import { getMyBookings, getDriverStats } from '../controllers/driverController.js';

const router = express.Router();

// All routes require authentication and driver role
router.use(protect);
router.use(isDriver);

// Get driver's bookings
router.get('/my-bookings', getMyBookings);

// Get driver statistics
router.get('/stats', getDriverStats);

export default router;