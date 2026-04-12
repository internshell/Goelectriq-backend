import Booking from '../models/Booking.js';
import Pricing from '../models/Pricing.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import { calculateDistanceWithGoogleMaps } from '../utils/distanceCalculator.js';
import { calculateFare } from '../utils/fareCalculator.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { sendRideBookingNotification } from '../services/whatsappService.js';

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
      rideType,
      airportType, // 'pickup' or 'drop' for airport rides
    } = req.body;

    console.log('📥 Creating booking with payload:', {
      pickupLocation,
      dropLocation,
      cabType,
      scheduledDate,
      scheduledTime,
      distance,
      rideType,
    });

    // ===== STAGE 1: VALIDATE REQUIRED FIELDS =====
    if (!pickupLocation || !dropLocation || !cabType) {
      console.error('❌ Validation failed - Missing required fields:', {
        pickupLocation: Boolean(pickupLocation),
        dropLocation: Boolean(dropLocation),
        cabType: Boolean(cabType),
      });
      return res.status(400).json({
        success: false,
        message: 'Pickup location, drop location, and car type are required',
        received: { pickupLocation, dropLocation, cabType },
      });
    }

    // ===== STAGE 2: VALIDATE COORDINATES (Optional if distance already calculated) =====
    // If distance > 0, coordinates were already validated during distance calculation
    const hasDistance = distance && parseFloat(distance) > 0;
    
    const pickupHasCoords = pickupLocation.coordinates &&
      (pickupLocation.coordinates.latitude || pickupLocation.coordinates.latitude) &&
      (pickupLocation.coordinates.longitude || pickupLocation.coordinates.longitude);

    const dropHasCoords = dropLocation.coordinates &&
      (dropLocation.coordinates.latitude || dropLocation.coordinates.latitude) &&
      (dropLocation.coordinates.longitude || dropLocation.coordinates.longitude);

    // Only require coordinates if distance wasn't pre-calculated
    if (!hasDistance && (!pickupHasCoords || !dropHasCoords)) {
      console.error('❌ Validation failed - Missing coordinates:', {
        hasDistance,
        pickupCoords: Boolean(pickupHasCoords),
        dropCoords: Boolean(dropHasCoords),
      });
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates required for both pickup and drop locations',
        details: {
          pickupCoordinates: pickupHasCoords ? 'valid' : 'missing',
          dropCoordinates: dropHasCoords ? 'valid' : 'missing',
          suggestion: 'Ensure distance calculation was successful before booking'
        },
      });
    }

    console.log('✅ Location validation passed - coordinates valid or distance pre-calculated');

    // ===== STAGE 3: VALIDATE DISTANCE =====
    const parsedDistance = parseFloat(distance);
    if (isNaN(parsedDistance) || parsedDistance <= 0) {
      console.error('❌ Validation failed - Invalid distance:', {
        received: distance,
        parsed: parsedDistance,
      });
      return res.status(400).json({
        success: false,
        message: 'Distance must be greater than 0 km. Please ensure distance calculation succeeded.',
        details: {
          distanceReceived: distance,
          distanceParsed: parsedDistance,
          isValid: !isNaN(parsedDistance) && parsedDistance > 0,
        },
      });
    }

    console.log('✅ All validations passed - proceeding with booking creation');

    let distanceData = { distance: parsedDistance || 0, duration: 0 };

    // Option: Re-calculate distance if coordinates available (optional verification)
    if (pickupLocation.coordinates && dropLocation.coordinates) {
      try {
        const recalulatedDistance = await calculateDistanceWithGoogleMaps(
          pickupLocation.coordinates,
          dropLocation.coordinates
        );
        console.log('✅ Distance recalculated via Google Maps (verification):', recalulatedDistance);
        
        // Only use recalculated if significantly different (more than 10%)
        if (recalulatedDistance.distance && 
            Math.abs(recalulatedDistance.distance - parsedDistance) > parsedDistance * 0.1) {
          console.warn('⚠️ Recalculated distance differs by >10% from provided:', {
            provided: parsedDistance,
            recalculated: recalulatedDistance.distance,
          });
          // Log warning but use provided distance (frontend was already validated)
        }
        distanceData = recalulatedDistance;
      } catch (error) {
        console.log('⚠️ Distance recalculation failed, using provided distance:', parsedDistance);
        distanceData.distance = parsedDistance;
      }
    } else {
      distanceData.distance = parsedDistance;
    }

    console.log('📊 Final distance data:', { distance: distanceData.distance, duration: distanceData.duration });

    // Get pricing for cab type
    let pricing = await Pricing.findOne({ cabType, isActive: true });

    // If pricing not found, create default pricing based on cab type
    if (!pricing) {
      const defaultPricing = {
        economy: { baseFare: 50, perKmRate: 10, minimumFare: 100 },
        premium: { baseFare: 100, perKmRate: 18, minimumFare: 200 },
      };
      
      const priceData = defaultPricing[cabType] || defaultPricing.economy;
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

    // ===== STAGE 5: CALCULATE FARE =====
    let fareBreakdown;
    
    if (rideType === 'airport') {
      // Airport rides use FLAT RATE (fixed charge + parking), NOT distance-based
      console.log('✈️  Airport ride detected - Using FLAT RATE pricing');
      console.log('📍 Airport Type:', airportType || 'not specified');
      console.log('💵 Pricing object structure:', JSON.stringify(pricing, null, 2));
      
      // Get airport charges for specific ride type (pickup or drop)
      const airportTypeKey = airportType || 'pickup'; // Default to pickup if not specified
      
      // Try to get airport charges from different possible locations in pricing object
      let fixedCharge = 0;
      let parkingCharge = 0;
      
      // Try airportCharges nested structure first
      if (pricing.airportCharges && pricing.airportCharges[airportTypeKey]) {
        fixedCharge = pricing.airportCharges[airportTypeKey].fixedCharge || 0;
        parkingCharge = pricing.airportCharges[airportTypeKey].parkingCharge || 0;
      }
      // Try top-level fixedCharge/parkingCharge (only if explicitly set, not defaults)
      else if (pricing.fixedCharge && pricing.fixedCharge > 0) {
        fixedCharge = pricing.fixedCharge;
        parkingCharge = pricing.parkingCharge || 0; // Only use if fixedCharge exists
      }
      // Last resort: use reasonable defaults if no pricing found
      else {
        console.warn('⚠️ No airport pricing found in database, using defaults');
        fixedCharge = cabType === 'premium' ? 600 : 500;
        parkingCharge = 0; // No parking charge for defaults (only fixed charge)
      }
      
      console.log(`💰 Airport charges extracted - Fixed: ₹${fixedCharge}, Parking: ₹${parkingCharge}`);
      
      // Ensure no rounding issues - convert to numbers and calculate total
      const cleanFixedCharge = Math.round(parseFloat(fixedCharge) * 100) / 100;
      const cleanParkingCharge = Math.round(parseFloat(parkingCharge) * 100) / 100;
      const subTotal = cleanFixedCharge + cleanParkingCharge;
      const totalFare = subTotal; // No GST added - total is just the base amount
      
      console.log(`✅ Final calculation - Fixed: ₹${cleanFixedCharge}, Parking: ₹${cleanParkingCharge}, Total: ₹${totalFare}`);
      
      fareBreakdown = {
        fixedCharge: cleanFixedCharge,       // FLAT RATE (not per-km)
        parkingCharge: cleanParkingCharge,
        distanceCharge: 0, // NO distance multiplier for flat-rate airport rides - REQUIRED field
        nightCharge: 0,
        waitingCharge: 0,
        surgeCharge: 0,
        subTotal,
        gst: 0, // No GST for airport rides
        totalFare,
        breakdownDetails: {
          formula: `Fixed Charge (₹${cleanFixedCharge}) + Parking (₹${cleanParkingCharge}) = ₹${totalFare}`,
          airportType: airportTypeKey,
          components: {
            'Fixed Charge': fixedCharge,
            'Parking Charge': parkingCharge,
          }
        }
      };
      
      console.log('💰 Airport fare calculated (FLAT RATE):', fareBreakdown);
    } else {
      // Regular rides use normal per-km fare calculation
      fareBreakdown = calculateFare(
        pricing,
        distanceData.distance,
        `${scheduledDate} ${scheduledTime}`
      );
    }

    // ===== STAGE 4A: VALIDATE FARE BREAKDOWN =====
    console.log('🔍 Validating fare breakdown:', {
      totalFare: fareBreakdown?.totalFare,
      subTotal: fareBreakdown?.subTotal,
      isNaN: isNaN(fareBreakdown?.totalFare),
      lessOrEqual0: fareBreakdown?.totalFare <= 0,
    });

    if (!fareBreakdown || isNaN(fareBreakdown.totalFare) || fareBreakdown.totalFare <= 0) {
      console.error('❌ Invalid fare breakdown calculated:', fareBreakdown);
      console.error('📊 Pricing data available:', {
        hasPricing: !!pricing,
        pricingData: pricing,
        rideType,
        cabType,
        distance: distanceData?.distance,
      });
      return res.status(400).json({
        success: false,
        message: `Failed to calculate valid fare. Total fare: ${fareBreakdown?.totalFare}`,
        details: {
          fareBreakdown,
          suggestion: 'Please check pricing configuration for ' + cabType + ' vehicles'
        }
      });
    }

    console.log('✅ Fare breakdown validated - Total: ₹' + fareBreakdown.totalFare);

    // ===== STAGE 4B: CREATE BOOKING WITH ALL VALIDATED DATA =====
    const booking = await Booking.create({
      bookingId: `BK${Date.now()}`,
      user: req.user._id,
      pickupLocation,
      dropLocation,
      distance: distanceData.distance,
      duration: distanceData.duration || 0,
      cabType,
      rideType: rideType || 'local', // local, airport, intercity
      airportType: rideType === 'airport' ? airportType : null, // 'pickup' or 'drop' for airport rides
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      pricing: fareBreakdown,
      passengerDetails: passengerDetails || {
        name: req.user.name,
        phone: req.user.phone,
      },
      // 20% advance payment required on all rides
      status: 'pending',
      paymentStatus: 'pending', // Will become 'partial' after 20% advance payment
      paidAmount: 0, // Will be updated after payment
      paymentSchedule: 'advance_20_on_booking', // 20% advance payment on booking
      paymentMethod: 'online',
    });

    // ===== LOGGING: FINAL BOOKING DATA =====
    console.log('✅ Booking created successfully:', {
      bookingId: booking.bookingId,
      _id: booking._id,
      distance: booking.distance,
      duration: booking.duration,
      cabType: booking.cabType,
      totalFare: booking.pricing?.totalFare,
      pickupAddr: booking.pickupLocation.address.substring(0, 30) + '...',
      dropAddr: booking.dropLocation.address.substring(0, 30) + '...',
    });

    // Populate user details
    await booking.populate('user', 'name email phone');

    // Send WhatsApp notification to user and admin
    try {
      await sendRideBookingNotification(booking, booking.user);
    } catch (whatsappError) {
      console.error('⚠️ WhatsApp notification failed:', whatsappError.message);
      // Don't fail the booking if WhatsApp fails - just log it
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    console.error('❌ Create booking error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...(error.errors && { validationErrors: error.errors })
    });
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
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

    const query = { 
      user: req.user._id,
      // 🔑 IMPORTANT: Only show bookings where 20% advance payment is made
      // Exclude bookings with paymentStatus='pending' (no payment made yet)
      // This ensures bookings only appear after payment is initiated
      paymentStatus: { $ne: 'pending' }
    };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const bookings = await Booking.find(query)
      .populate('driver', 'name phone vehicleDetails rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for faster queries and complete data return

    console.log('📊 Fetching user bookings (20% Advance Payment System):', { 
      userId: req.user._id, 
      query, 
      count: bookings.length,
      note: 'Only bookings with 20% advance payment appear here (paymentStatus != pending)',
      sampleBooking: bookings[0] ? {
        _id: bookings[0]._id,
        type: bookings[0].cabType || bookings[0].type,
        paymentStatus: bookings[0].paymentStatus,
        paymentMethod: bookings[0].paymentMethod,
        paymentDetails: bookings[0].paymentDetails,
        pricing: bookings[0].pricing ? {
          baseFare: bookings[0].pricing.baseFare,
          totalFare: bookings[0].pricing.totalFare,
        } : null
      } : null
    });

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

/**
 * @desc    Admin confirms booking (Pending → Confirmed)
 * @route   PUT /api/bookings/:id/confirm
 * @access  Admin
 */
export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Can only confirm pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking with status: ${booking.status}`,
      });
    }

    booking.status = 'confirmed';
    booking.adminNotes = req.body.notes || '';
    await booking.save();

    await booking.populate('user', 'name email phone');
    await booking.populate('driver', 'name phone vehicleDetails');

    console.log(`✅ Booking ${booking.bookingId} confirmed by admin`);

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin completes booking (Confirmed → Completed)
 *          Triggers payment collection for regular rides
 * @route   PUT /api/bookings/:id/complete
 * @access  Admin
 */
export const completeBooking = async (req, res) => {
  try {
    const { actualDistance, isdAdminOverride } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Can only complete confirmed bookings
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete booking with status: ${booking.status}`,
      });
    }

    // Update ride details
    if (actualDistance && actualDistance > 0) {
      booking.rideDetails.actualDistance = actualDistance;
      
      // Recalculate fare if distance changed significantly
      const distanceDifference = Math.abs(actualDistance - booking.distance);
      const percentageDifference = (distanceDifference / booking.distance) * 100;
      
      if (percentageDifference > 5 && !isdAdminOverride) {
        booking.rideDetails.actualDistance = actualDistance;
        booking.adminNotes = `Distance variance: estimated ${booking.distance}km, actual ${actualDistance}km (${percentageDifference.toFixed(2)}%)`;
      }
    }

    booking.status = 'completed';
    booking.rideDetails.endTime = new Date();
    
    // For regular rides: payment should be collected NOW
    // For tours: payment may already be collected
    if (booking.rideType === 'local' || booking.rideType === 'airport' || booking.rideType === 'intercity') {
      // Mark that payment should now be collected
      booking.notes = 'Payment pending - to be collected from user';
    }

    await booking.save();
    await booking.populate('user', 'name email phone');

    console.log(`✅ Booking ${booking.bookingId} completed by admin - Payment collection triggered`);

    res.status(200).json({
      success: true,
      message: 'Booking completed. Payment collection initiated.',
      data: booking,
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Collect payment for completed booking
 * @route   POST /api/bookings/:id/collect-payment
 * @access  Admin / System
 */
export const collectPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, razorpayPaymentId, razorpayOrderId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Can only collect payment for completed bookings
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be collected for completed bookings',
      });
    }

    const totalFare = booking.pricing.totalFare;
    const remainingAmount = totalFare - (booking.paidAmount || 0);

    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance. Remaining: ₹${remainingAmount.toFixed(2)}`,
      });
    }

    // Update payment info
    booking.paidAmount = (booking.paidAmount || 0) + amount;
    booking.paymentMethod = paymentMethod || booking.paymentMethod;
    
    if (razorpayPaymentId) {
      booking.paymentDetails.razorpayPaymentId = razorpayPaymentId;
      booking.paymentDetails.razorpayOrderId = razorpayOrderId;
      booking.paymentDetails.paidAt = new Date();
    }

    // Update payment status
    if (booking.paidAmount >= totalFare) {
      booking.paymentStatus = 'paid';
    } else {
      booking.paymentStatus = 'partial';
    }

    await booking.save();
    await booking.populate('user', 'name email phone');

    console.log(`✅ Payment collected for booking ${booking.bookingId}: ₹${amount}, Status: ${booking.paymentStatus}`);

    res.status(200).json({
      success: true,
      message: `Payment of ₹${amount.toFixed(2)} collected successfully`,
      data: {
        bookingId: booking.bookingId,
        totalFare: booking.pricing.totalFare,
        paidAmount: booking.paidAmount,
        remainingAmount: Math.max(0, booking.pricing.totalFare - booking.paidAmount),
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Collect payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error collecting payment',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all bookings (Admin)
 * @route   GET /api/admin/bookings
 * @access  Admin
 */
export const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, paymentStatus, rideType, searchTerm } = req.query;

    let query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (rideType) query.rideType = rideType;

    if (searchTerm) {
      query.$or = [
        { bookingId: { $regex: searchTerm, $options: 'i' } },
        { 'user.name': { $regex: searchTerm, $options: 'i' } },
        { 'user.email': { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('driver', 'name phone vehicleDetails')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
};

// GET AIRPORT BOOKINGS
export const getAirportBookings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.page) ? (parseInt(req.query.page) - 1) * limit : 0;

    // Fetch only airport bookings, sorted by date (newest first)
    const bookings = await Booking.find({ rideType: 'airport' })
      .populate('user', 'name phone email')
      .select('user carType rideType airportType totalFare paidAmount paymentStatus createdAt pickupLocation dropLocation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments({ rideType: 'airport' });

    // Format bookings for frontend
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      userId: booking.user,
      userName: booking.user?.name || 'Unknown',
      userPhone: booking.user?.phone || 'N/A',
      carType: booking.carType || 'N/A',
      rideType: booking.rideType,
      airportType: booking.airportType || 'pickup',
      totalFare: booking.totalFare || 0,
      paidAmount: booking.paidAmount || 0,
      paymentStatus: booking.paymentStatus || 'pending',
      createdAt: booking.createdAt,
      pickupLocation: booking.pickupLocation?.address || 'N/A',
      dropLocation: booking.dropLocation?.address || 'N/A',
    }));

    res.status(200).json({
      success: true,
      bookings: formattedBookings,
      total,
      page: parseInt(req.query.page) || 1,
    });
  } catch (error) {
    console.error('Error fetching airport bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching airport bookings',
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
  confirmBooking,
  completeBooking,
  collectPayment,
  getAllBookings,
  getAirportBookings,
};