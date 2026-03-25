/**
 * Authorize roles - Check if user has required role
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route',
        });
      }
  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `User role '${req.user.role}' is not authorized to access this route`,
        });
      }
  
      next();
    };
  };
  
  /**
   * Check if user is admin
   */
  export const isAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }
  
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }
  
    next();
  };
  
  /**
   * Check if user is driver
   */
  export const isDriver = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }
  
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Drivers only.',
      });
    }
  
    next();
  };
  
  /**
   * Check if user's account is active
   */
  export const checkAccountStatus = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }
  
    // Check if user account is active
    if (req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }
  
    // Check if driver account is approved
    if (req.userType === 'driver' && !req.user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your driver account is pending approval.',
      });
    }
  
    // Check if driver account is blocked
    if (req.userType === 'driver' && req.user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your driver account has been blocked. Please contact support.',
      });
    }
  
    next();
  };
  
  /**
   * Check ownership - user can only access their own resources
   */
  export const checkOwnership = (resourceType) => {
    return (req, res, next) => {
      const resourceUserId = req[resourceType]?.user?.toString() || req[resourceType]?.userId?.toString();
      const currentUserId = req.user._id.toString();
  
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }
  
      // Check if user owns the resource
      if (resourceUserId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource',
        });
      }
  
      next();
    };
  };
  
  export default {
    authorize,
    isAdmin,
    isDriver,
    checkAccountStatus,
    checkOwnership,
  };