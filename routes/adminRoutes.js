import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import { uploadImageMemory } from '../config/multer.js';
import { uploadPackageImage } from '../controllers/uploadController.js';
import { changePassword } from '../controllers/userController.js';
import {
  getAllBookings,
  getAnalytics,
  createPackage,
  getAdminPackages,
  getAdminTourBookings,
  updateTourBookingStatus,
  getTourBookingPayments,
  updatePackage,
  deletePackage,
  getAdminFeedback,
  getAllUsers,
  deleteUserAdmin,
  updateUserStatusAdmin,
  getAllDriversAdmin,
  deleteDriverAdmin,
  updateDriverStatusAdmin,
  deleteBookingAdmin,
  updateBookingStatusAdmin,
  deleteTourBookingAdmin,
  deleteFeedbackAdmin,
  getAllPaymentsAdmin,
  getAdminProfile,
  getAdminPricingRates,
  updateAdminPricingRate,
  bulkUpdateAdminPricingRates,
  updateAirportRidePricing,
  getPendingRideBookings,
  approveRideBooking,
  rejectRideBooking,
  completeRideBooking,
  collectRemainingPayment,
  getPendingPayments,
  getAdminCabPartners,
  updateAdminCabPartner,
  deleteAdminCabPartner,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(isAdmin);
router.use(adminLimiter); // Apply admin-specific rate limiter (1000 req/15min for authenticated admins)

// ============ ANALYTICS ============
router.get('/analytics', getAnalytics);

// ============ USERS MANAGEMENT ============
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUserAdmin);
router.patch('/users/:id/status', updateUserStatusAdmin);

// ============ DRIVERS MANAGEMENT ============
router.get('/drivers', getAllDriversAdmin);
router.delete('/drivers/:id', deleteDriverAdmin);
router.patch('/drivers/:id/status', updateDriverStatusAdmin);

// ============ BOOKINGS MANAGEMENT ============
router.get('/bookings', getAllBookings);
router.delete('/bookings/:id', deleteBookingAdmin);
router.patch('/bookings/:id/status', updateBookingStatusAdmin);

// ============ RIDE BOOKINGS MANAGEMENT (NEW APPROVAL FLOW) ============
router.get('/ride-bookings/pending', getPendingRideBookings);
router.patch('/ride-bookings/:id/approve', approveRideBooking);
router.patch('/ride-bookings/:id/reject', rejectRideBooking);
router.patch('/ride-bookings/:id/complete', completeRideBooking);

// ============ PAYMENT COLLECTION (80% Collection from Driver/Office) ============
router.get('/pending-payments', getPendingPayments);
router.post('/bookings/:id/collect-payment', collectRemainingPayment);

// ============ TOUR BOOKINGS MANAGEMENT ============
router.get('/tour-bookings', getAdminTourBookings);
router.get('/tour-bookings/:tourBookingId/payments', getTourBookingPayments);
router.patch('/tour-bookings/:id', updateTourBookingStatus);
router.delete('/tour-bookings/:id', deleteTourBookingAdmin);

// ============ PACKAGES MANAGEMENT ============
router.get('/packages', getAdminPackages);
router.post('/packages', createPackage);
router.post('/upload-image', uploadImageMemory.single('image'), uploadPackageImage);
router.put('/packages/:id', updatePackage);
router.delete('/packages/:id', deletePackage);

// ============ FEEDBACK MANAGEMENT ============
router.get('/feedback', getAdminFeedback);
router.delete('/feedback/:id', deleteFeedbackAdmin);

// ============ ADMIN SETTINGS ============
router.get('/profile', getAdminProfile);
router.post('/change-password', changePassword);

// ============ PAYMENTS MANAGEMENT ============
router.get('/payments', getAllPaymentsAdmin);

// ============ PRICING MANAGEMENT ============
router.get('/pricing/rates', getAdminPricingRates);
router.patch('/pricing/rates/:rateId', updateAdminPricingRate);
router.post('/pricing/rates/bulk', bulkUpdateAdminPricingRates);
router.patch('/pricing/airport/:cabType', updateAirportRidePricing);

// ============ CAB PARTNER MANAGEMENT ============
router.get('/cab-partners', getAdminCabPartners);
router.put('/cab-partners/:id', updateAdminCabPartner);
router.delete('/cab-partners/:id', deleteAdminCabPartner);

export default router;