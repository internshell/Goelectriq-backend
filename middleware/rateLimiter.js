import { rateLimit } from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const RATE_LIMIT_WINDOW_MINUTES = parsePositiveInt(process.env.RATE_LIMIT_WINDOW, 15);
const RATE_LIMIT_MAX_REQUESTS = parsePositiveInt(process.env.RATE_LIMIT_MAX_REQUESTS, 500);

const shouldSkipGeneralLimiter = (req) => {
  // Never throttle auth here, auth has a dedicated limiter.
  if (req.originalUrl?.includes('/auth')) return true;

  // Keep local development responsive and avoid noisy 429s while iterating.
  if (!isProduction) return true;

  // Public read endpoints on home page are intentionally high traffic.
  if (req.method === 'GET') {
    const url = req.originalUrl || '';
    if (url.startsWith('/api/packages') || url.startsWith('/api/feedback')) {
      return true;
    }
  }

  return false;
};

/**
 * General API rate limiter (skips auth - auth has its own limiter)
 * Increased limits to handle admin dashboard polling and high-traffic scenarios
 */
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipGeneralLimiter,
});

/**
 * Auth route rate limiter (stricter)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window (was 5 - too strict for registration)
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

/**
 * Payment route rate limiter
 */
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many payment requests, please try again later.',
  },
});

/**
 * Booking route rate limiter
 */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 bookings per hour
  message: {
    success: false,
    message: 'Too many booking requests, please try again later.',
  },
});

/**
 * OTP rate limiter
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per window
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 15 minutes.',
  },
});

/**
 * Admin dashboard rate limiter (more permissive for authenticated admin users)
 * Allows higher request rates for admin operations and polling
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes (about 67 req/min - allows for polling and rapid interactions)
  message: {
    success: false,
    message: 'Admin dashboard rate limit exceeded. Please wait before making more requests.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users with valid auth token
    // This is checked in admin routes with protect + isAdmin middleware
    return !req.user || !req.user.isAdmin;
  },
});

export default {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  bookingLimiter,
  otpLimiter,
  adminLimiter,

};