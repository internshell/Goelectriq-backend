import express from 'express';
import {
  registerUser,
  loginUser,
  registerDriver,
  loginDriver,
  googleAuth,
  getMe,
  logout,
  updatePassword,
  forgotPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.post('/register-driver', authLimiter, registerDriver);
router.post('/login-driver', authLimiter, loginDriver);
router.post('/forgot-password', authLimiter, forgotPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-password', protect, updatePassword);

export default router;