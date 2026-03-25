import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Driver from '../models/Driver.js';

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check user type and get user
      if (decoded.role === 'driver') {
        req.driver = await Driver.findById(decoded.id).select('-password');
        if (!req.driver) {
          return res.status(401).json({
            success: false,
            message: 'Driver not found',
          });
        }
        req.user = req.driver; // For generic access
        req.userType = 'driver';
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User not found',
          });
        }
        req.userType = 'user';
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * Optional auth - doesn't block if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === 'driver') {
          req.driver = await Driver.findById(decoded.id).select('-password');
          req.user = req.driver;
          req.userType = 'driver';
        } else {
          req.user = await User.findById(decoded.id).select('-password');
          req.userType = 'user';
        }
      } catch (error) {
        // Invalid token, but we don't block the request
        console.log('Invalid token in optional auth:', error.message);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export default { protect, generateToken, optionalAuth };