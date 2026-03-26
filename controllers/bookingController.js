import Booking from '../models/Booking.js';
import Pricing from '../models/Pricing.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import { calculateDistanceWithGoogleMaps } from '../utils/distanceCalculator.js';
import { calculateFare } from '../utils/fareCalculator.js';
// TODO: enable when email/WhatsApp needed
// import { sendBookingConfirmationEmail } from '../services/emailService.js';
// import { sendBookingConfirmationWhatsApp } from '../services/whatsappService.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private
 */
export const createBooking = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropLocation,
      scheduledDate,
      scheduledTime,
      cabType,
      passengerDetails,
      distance,
    } = req.body;

    console.log('📥 Creating booking with payload:', {
      pickupLocation,
      dropLocation,
      cabType,
      scheduledDate,
      scheduledTime,
      distance,
    });

    // Validate required fields
    if (!pickupLocation || !dropLocation || !cabType) {
      console.error('❌ Validation failed:', {
        pickupLocation: Boolean(pickupLocation),
        dropLocation: Boolean(dropLocation),
        cabType: Boolean(cabType),
      });
      return res.status(400).json({
        success: false,
        message: 'pickupLocation, dropLocation, and cabType are required',
        received: { pickupLocation, dropLocation, cabType },
      });
    }

    let distanceData = { distance: distance || 0, duration: 0 };

    // Only calculate distance if coordinates are available
    if (pickupLocation.coordinates && dropLocation.coordinates) {
      try {
        distanceData = await calculateDistanceWithGoogleMaps(
          pickupLocation.coordinates,
          dropLocation.coordinates
        );
      } catch (error) {
        console.log('Distance calculation failed, using provided distance:', distance);
        distanceData.distance = distance || 0;
      }
    } else if (distance) {
      distanceData.distance = distance;
    }

    // Get pricing for cab type
    let pricing = await Pricing.findOne({ cabType, isActive: true });

    // If pricing not found, create default pricing based on cab type
    if (!pricing) {
      const defaultPricing = {
        mini: { baseFare: 50, perKmRate: 10, minimumFare: 100 },
        sedan: { baseFare: 75, perKmRate: 14, minimumFare: 150 },
        suv: { baseFare: 100, perKmRate: 18, minimumFare: 200 },
        hatchback: { baseFare: 60, perKmRate: 12, minimumFare: 120 },
        luxury: { baseFare: 150, perKmRate: 25, minimumFare: 300 },
      };
      
      const priceData = defaultPricing[cabType] || defaultPricing.sedan;
      pricing = {
        cabType,
        baseFare: priceData.baseFare,
        perKmRate: priceData.perKmRate,
        minimumFare: priceData.minimumFare,
        perMinuteWaiting: 1,
        gstPercentage: 5,
        nightCharges: { enabled: false, multiplier: 1.25 },
        surgeCharges: { enabled: false, multiplier: 1.5 },
      };
    }

    // Calculate fare
    const fareBreakdown = calculateFare(
      pricing,
      distanceData.distance,
      `${scheduledDate} ${scheduledTime}`
    );

    // Create booking
    const booking = await Booking.create({
      bookingId: `BK${Date.now()}`,
      user: req.user._id,
      pickupLocation,
      dropLocation,
      distance: distanceData.distance,
      duration: distanceData.duration || 0,
      cabType,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      pricing: fareBreakdown,
      passengerDetails: passengerDetails || {
        name: req.user.name,
        phone: req.user.phone,
      },
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Populate user details
    await booking.populate('user', 'name email phone');

    // TODO: enable when email/WhatsApp needed
    // sendBookingConfirmationEmail(booking, req.user).catch(err => console.error('Email error:', err));
    // sendBookingConfirmationWhatsApp(booking, req.user).catch(err => console.error('WhatsApp error:', err));

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all bookings for logged in user
 * @route   GET /api/bookings
 * @access  Private
 */
export const getMyBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const bookings = await Booking.find(query)
      .populate('driver', 'name phone vehicleDetails rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('driver', 'name phone vehicleDetails rating');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user owns this booking (or is admin)
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
export const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id).populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    // Check if booking can be cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${booking.status} booking`,
      });
    }

    // Calculate cancellation charges and refund
    const { calculateCancellationCharges } = await import('../utils/fareCalculator.js');
    const cancellationInfo = calculateCancellationCharges(booking);

    // Update booking
    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: req.user.role === 'admin' ? 'admin' : 'user',
      reason: reason || 'No reason provided',
      cancelledAt: new Date(),
      refundAmount: cancellationInfo.refundAmount,
      refundStatus: cancellationInfo.refundAmount > 0 ? 'pending' : 'processed',
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        cancellationCharges: cancellationInfo.cancellationCharge,
        refundAmount: cancellationInfo.refundAmount,
      },
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Download invoice
 * @route   GET /api/bookings/:id/invoice
 * @access  Private
 */
export const downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Check if booking is completed or paid
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is only available for paid bookings',
      });
    }

    // Generate invoice if not exists
    if (!booking.invoice || !booking.invoice.invoiceUrl) {
      const invoiceData = await generateInvoicePDF(booking, booking.user);
      
      booking.invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceUrl: `/uploads/invoices/${invoiceData.filename}`,
        generatedAt: new Date(),
      };
      
      await booking.save();
    }

    res.status(200).json({
      success: true,
      data: {
        invoiceUrl: `${req.protocol}://${req.get('host')}${booking.invoice.invoiceUrl}`,
        invoiceNumber: booking.invoice.invoiceNumber,
      },
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message,
    });
  }
};

export default {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  downloadInvoice,
};