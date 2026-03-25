import express from 'express';
import { protect } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';
import { 
  createPaymentOrder, 
  createPartnerRegistrationPayment,
  verifyPartnerRegistrationPayment,
  getPaymentStatus,
  createRidePaymentOrder,
  verifyRidePayment,
  getPaymentHistory,
  createTourPaymentOrder,
  verifyTourPayment
} from '../controllers/paymentController.js';

const router = express.Router();

// Public routes (no auth required for partner registration)
router.post('/partner/create-order', paymentLimiter, createPartnerRegistrationPayment);
router.post('/partner/verify', verifyPartnerRegistrationPayment);
router.get('/status/:paymentId', getPaymentStatus);

// Protected routes
router.use(protect);

router.post('/create-order', paymentLimiter, createPaymentOrder);
router.post('/verify', (req, res) => {
  res.json({ success: true, message: 'Verify payment' });
});

// Ride booking payment routes
router.post('/ride/create-order', paymentLimiter, createRidePaymentOrder);
router.post('/ride/verify', verifyRidePayment);

// Tour booking payment routes
router.post('/tour/create-order', paymentLimiter, createTourPaymentOrder);
router.post('/tour/verify', verifyTourPayment);

// Payment history route
router.get('/history', getPaymentHistory);

export default router;