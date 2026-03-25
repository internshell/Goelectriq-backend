import { validationResult } from 'express-validator';

/**
 * Validate request using express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  }
  
  next();
};

/**
 * Sanitize and validate MongoDB ObjectId
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }
    
    next();
  };
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (req, res, next) => {
  const { pickup, drop } = req.body;
  
  if (!pickup || !pickup.latitude || !pickup.longitude) {
    return res.status(400).json({
      success: false,
      message: 'Valid pickup coordinates are required',
    });
  }
  
  if (!drop || !drop.latitude || !drop.longitude) {
    return res.status(400).json({
      success: false,
      message: 'Valid drop coordinates are required',
    });
  }
  
  // Validate latitude range
  if (pickup.latitude < -90 || pickup.latitude > 90 || drop.latitude < -90 || drop.latitude > 90) {
    return res.status(400).json({
      success: false,
      message: 'Latitude must be between -90 and 90',
    });
  }
  
  // Validate longitude range
  if (pickup.longitude < -180 || pickup.longitude > 180 || drop.longitude < -180 || drop.longitude > 180) {
    return res.status(400).json({
      success: false,
      message: 'Longitude must be between -180 and 180',
    });
  }
  
  next();
};

/**
 * Validate date format
 */
export const validateDate = (fieldName) => {
  return (req, res, next) => {
    const date = req.body[fieldName];
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required`,
      });
    }
    
    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${fieldName} format`,
      });
    }
    
    // Check if date is in the past
    if (parsedDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} cannot be in the past`,
      });
    }
    
    next();
  };
};

/**
 * Validate phone number
 */
export const validatePhone = (req, res, next) => {
  const phone = req.body.phone;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required',
    });
  }
  
  // Indian phone number validation (10 digits starting with 6-9)
  const phoneRegex = /^[6-9]\d{9}$/;
  
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid 10-digit phone number',
    });
  }
  
  next();
};

/**
 * Validate email format
 */
export const validateEmail = (req, res, next) => {
  const email = req.body.email;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }
  
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }
  
  next();
};

export default {
  validate,
  validateObjectId,
  validateCoordinates,
  validateDate,
  validatePhone,
  validateEmail,
};