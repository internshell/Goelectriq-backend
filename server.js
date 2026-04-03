import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
// express-mongo-sanitize is incompatible with Express 5 (req.query/params getters)
// TODO: switch to mongo-sanitizer when ready, or downgrade to Express 4
// import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load environment variables (from server directory so .env is found when run from project root)
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

// Import configurations
import connectDB from './config/database.js';
// TODO: enable when email/WhatsApp needed
// import { verifyEmailConfig } from './config/nodemailer.js';
// import { verifyWhatsAppConfig } from './config/whatsapp.js';

// Import middleware
import errorHandler, { notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import tourBookingRoutes from './routes/tourBookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Connect to database
connectDB();

// TODO: enable when email/WhatsApp needed
// verifyEmailConfig();
// verifyWhatsAppConfig();

// Middleware

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com', 'https://*.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://checkout.razorpay.com', 'https://*.razorpay.com'],
      frameSrc: ["'self'", 'https://checkout.razorpay.com', 'https://*.razorpay.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Permissions policy - block sensor access and tracking from third-party scripts
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), gyroscope=(), magnetometer=(), camera=(), microphone=(), geolocation=self'
  );
  next();
});

// CORS
const allowedOrigins = [
  ...(process.env.CLIENT_URLS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim()] : []),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || uniqueAllowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data (disabled - express-mongo-sanitize incompatible with Express 5)
// app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// Static files - with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}, express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/tour-bookings', tourBookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/partners', partnerRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Electric Cab Booking API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n🚀 ======================================');
  console.log(`   Server running in ${process.env.NODE_ENV} mode`);
  console.log(`   Port: ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('======================================\n');
});

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
  console.log(`\n👋 ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      // Close MongoDB connection
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    } catch (error) {
      console.error(`❌ Error closing MongoDB connection: ${error.message}`);
    }
    console.log('💀 Process terminated');
    process.exit(0);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  gracefulShutdown('Unhandled Rejection');
});

// Handle SIGTERM
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle SIGINT (Ctrl+C) - override the one in connectDB
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;