import User from '../models/User.js';
import Driver from '../models/Driver.js';
import { generateToken } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';
// TODO: enable when email/WhatsApp needed
// import { sendWelcomeEmail } from '../services/emailService.js';
// import { sendWelcomeWhatsApp } from '../services/whatsappService.js';
import crypto from 'crypto';

const getGoogleClient = () => new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firstName, lastName, email, mobile number, and password',
      });
    }

    // Validate password length
    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Normalize phone to 10 digits (Indian format)
    const phoneClean = String(phone).replace(/\D/g, '').slice(-10);
    if (phoneClean.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number',
      });
    }

    if (!/^[6-9]/.test(phoneClean)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number should start with 6-9',
      });
    }

    const emailLower = String(email).toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email: emailLower }, { phone: phoneClean }],
    });

    if (userExists) {
      if (userExists.email === emailLower) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists',
      });
    }

    // Create user
    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: emailLower,
      phone: phoneClean,
      password: String(password),
      role: 'user',
    });

    // Generate token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured. Add it to your .env file.');
    }
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register user error:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors || {})
        .map((e) => e.message)
        .join('. ');
      return res.status(400).json({
        success: false,
        message: msg || 'Validation failed',
      });
    }

    // MongoDB duplicate key
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'email' ? 'email' : 'phone number';
      return res.status(400).json({
        success: false,
        message: `User with this ${fieldName} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const emailLower = String(email).toLowerCase().trim();

    // Find user (include password for verification)
    const user = await User.findOne({ email: emailLower }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured. Add it to your .env file.');
    }
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in',
    });
  }
};

/**
 * @desc    Register driver
 * @route   POST /api/auth/register-driver
 * @access  Public
 */
export const registerDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      licenseNumber,
      licenseExpiry,
      vehicleDetails,
    } = req.body;

    // Check if driver already exists
    const driverExists = await Driver.findOne({ $or: [{ email }, { phone }, { licenseNumber }] });

    if (driverExists) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this email, phone, or license number already exists',
      });
    }

    // Create driver
    const driver = await Driver.create({
      name,
      email,
      phone,
      password,
      licenseNumber,
      licenseExpiry,
      vehicleDetails,
      status: 'pending',
      isApproved: false,
    });

    res.status(201).json({
      success: true,
      message: 'Driver registration submitted. Your account will be reviewed by admin.',
      data: {
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          status: driver.status,
        },
      },
    });
  } catch (error) {
    console.error('Register driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering driver',
      error: error.message,
    });
  }
};

/**
 * @desc    Login driver
 * @route   POST /api/auth/login-driver
 * @access  Public
 */
export const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const driver = await Driver.findOne({ email }).select('+password');

    if (!driver) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if driver is approved
    if (!driver.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your driver account is pending approval',
      });
    }

    // Check if driver is blocked
    if (driver.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your driver account has been blocked. Please contact support.',
      });
    }

    const isPasswordValid = await driver.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(driver._id, 'driver');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          role: 'driver',
          status: driver.status,
          availability: driver.availability,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current logged in user/driver
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    let userData;

    if (req.userType === 'driver') {
      userData = await Driver.findById(req.user._id).select('-password');
    } else {
      userData = await User.findById(req.user._id).select('-password');
    }

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message,
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    // For JWT, logout is handled on client side by removing token
    // But we can blacklist tokens if needed (requires Redis or DB storage)
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message,
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
    }

    let user;
    if (req.userType === 'driver') {
      user = await Driver.findById(req.user._id).select('+password');
    } else {
      user = await User.findById(req.user._id).select('+password');
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message,
    });
  }
};

/**
 * @desc    Login or Register with Google
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google authentication is not configured',
      });
    }

    const ticket = await getGoogleClient().verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Google',
      });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture) user.profileImage = picture;
        await user.save();
      }
    } else {
      // Split name into firstName and lastName for Google login
      const nameParts = (name || email.split('@')[0]).split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await User.create({
        firstName,
        lastName,
        email,
        googleId,
        profileImage: picture || '',
        isEmailVerified: true,
        role: 'user',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
          isEmailVerified: user.isEmailVerified,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: error.message?.includes('Token') ? 'Invalid Google token' : 'Google authentication failed',
      error: error.message,
    });
  }
};

/**
 * @desc    Forgot password - Send reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email (implement this)
    // await sendPasswordResetEmail(user, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: error.message,
    });
  }
};

export default {
  registerUser,
  loginUser,
  registerDriver,
  loginDriver,
  googleAuth,
  getMe,
  logout,
  updatePassword,
  forgotPassword,
};