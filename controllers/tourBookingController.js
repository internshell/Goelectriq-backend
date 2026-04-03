import TourBooking from '../models/TourBooking.js';
import Package from '../models/Package.js';

/**
 * Create a tour package booking (user)
 */
export const createTourBooking = async (req, res) => {
  try {
    const { packageId, pickupLocation, scheduledDate, scheduledTime, carType, passengers, paymentOption } = req.body;
    const userId = req.user._id;

    if (!packageId || !pickupLocation || !scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'packageId, pickupLocation, scheduledDate and scheduledTime are required',
      });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Get car-specific pricing from package
    // Map car types to pricing fields in Package: economy→economy, premium→premium
    const selectedCarType = carType || 'premium';
    const pricingFieldMap = {
      economy: 'economy',
      premium: 'premium'
    };
    const pricingField = pricingFieldMap[selectedCarType] || 'premium';
    
    let packagePrice = 0;
    
    // First try to get car-specific price from pricing object
    if (pkg.pricing && pkg.pricing[pricingField]) {
      packagePrice = pkg.pricing[pricingField];
    } else if (pkg.pricing?.economy || pkg.pricing?.premium) {
      // Fallback to premium if selected type not available
      packagePrice = pkg.pricing.premium || pkg.pricing.economy || pkg.basePrice || 0;
    } else {
      // Final fallback to basePrice
      packagePrice = pkg.basePrice || 0;
    }

    const subtotal = packagePrice;
    const discount = paymentOption === 'full' ? Math.round(subtotal * 0.1) : 0;
    const totalAmount = subtotal - discount;
    
    // Payment calculation
    let paidAmount = 0;
    let paymentStatus = '';
    
    if (paymentOption === 'full') {
      paidAmount = totalAmount;
      paymentStatus = 'paid';
    } else {
      // Confirmation payment (20% of total)
      paidAmount = Math.round(totalAmount * 0.2);
      paymentStatus = paidAmount >= totalAmount ? 'paid' : 'partial';
    }

    // Detailed pricing calculation logging
    console.log('\n💰 TOUR BOOKING PRICING CALCULATION:');
    console.log('Package ID:', packageId);
    console.log('Package Title:', pkg.title);
    console.log('Package Base Price:', pkg.basePrice);
    console.log('Package Pricing Object:', pkg.pricing);
    console.log('\nCalculation:');
    console.log('  car type selected:', selectedCarType);
    console.log('  pricing field used:', pricingField);
    console.log('  car-specific price:', packagePrice);
    console.log('  subtotal:', subtotal);
    console.log('  payment option:', paymentOption);
    console.log('  discount (10% for full payment):', discount);
    console.log('  totalAmount:', totalAmount);
    console.log('  paidAmount:', paidAmount);
    console.log('  paymentStatus:', paymentStatus);

    const booking = await TourBooking.create({
      user: userId,
      package: packageId,
      pickupLocation,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      carType: selectedCarType,
      passengers: passengers || 4,
      paymentOption: paymentOption || 'confirmation',
      pricing: {
        packagePrice: packagePrice,
        carUpgradeCharge: 0,
        discount,
        totalAmount,
        paidAmount,
      },
      status: 'pending',
      paymentStatus: paymentStatus,
    });

    const populated = await TourBooking.findById(booking._id)
      .populate('package', 'title coverImage tourCategory basePrice pricing location')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Tour booking created successfully',
      data: populated,
    });
  } catch (error) {
    console.error('❌ Tour Booking Error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      userId: req.user?._id
    });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get user's tour bookings
 */
export const getMyTourBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { 
      user: userId
      // NOTE: Removed paymentStatus filter to show all bookings regardless of payment status
      // paymentStatus: { $in: ['paid', 'partial'] }  // Only show tour bookings with paid or partial payments
    };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await TourBooking.find(query)
      .populate('package', 'title coverImage tourCategory basePrice pricing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Detailed logging for debugging pricing issues
    console.log('📊 Fetching tour bookings:', { 
      userId: req.user._id, 
      query,
      count: bookings.length,
    });
    
    if (bookings.length > 0) {
      console.log('\n🔍 DETAILED TOUR BOOKING DATA:');
      bookings.forEach((booking, idx) => {
        console.log(`\n--- Tour ${idx + 1} ---`);
        console.log('Booking ID:', booking._id);
        console.log('Package Title:', booking.package?.title);
        console.log('Package Base Price:', booking.package?.basePrice);
        console.log('Package Pricing Object:', booking.package?.pricing);
        console.log('Booking Pricing:', {
          packagePrice: booking.pricing?.packagePrice,
          carUpgradeCharge: booking.pricing?.carUpgradeCharge,
          discount: booking.pricing?.discount,
          totalAmount: booking.pricing?.totalAmount,
          paidAmount: booking.pricing?.paidAmount,
        });
        console.log('Payment Status:', booking.paymentStatus);
        console.log('Car Type:', booking.carType);
      });
    }

    const total = await TourBooking.countDocuments(query);

    // Transform data to include tourName field for consistency with frontend
    const transformedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      bookingObj.tourName = booking.package?.title || 'Tour Booking';
      bookingObj.packageName = booking.package?.title;
      bookingObj.totalAmount = booking.pricing?.totalAmount;
      return bookingObj;
    });

    // Log exact response being sent to frontend
    console.log('\n✅ SENDING TO FRONTEND:');
    console.log('Response structure:', {
      success: true,
      dataArray: Array.isArray(transformedBookings),
      dataLength: transformedBookings.length,
      firstItemPricing: transformedBookings[0]?.pricing || null,
    });
    
    if (transformedBookings.length > 0) {
      console.log('\n📤 First tour booking EXACT data being sent:');
      const firstItem = transformedBookings[0];
      console.log(JSON.stringify({
        _id: firstItem._id,
        type: 'tour',
        package: {
          title: firstItem.package?.title,
          basePrice: firstItem.package?.basePrice,
        },
        carType: firstItem.carType,
        pricing: firstItem.pricing,
        paymentStatus: firstItem.paymentStatus,
        status: firstItem.status,
      }, null, 2));
    }

    res.json({
      success: true,
      data: transformedBookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a specific tour booking by ID
 */
export const getTourBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await TourBooking.findById(id)
      .populate('package', 'title coverImage tourCategory basePrice pricing')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Tour booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin confirms tour booking
 * @route   PUT /api/tour-bookings/:id/confirm
 * @access  Admin
 */
export const confirmTourBooking = async (req, res) => {
  try {
    const booking = await TourBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Tour booking not found',
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking with status: ${booking.status}`,
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    const populated = await TourBooking.findById(booking._id)
      .populate('package', 'title coverImage tourCategory')
      .populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Tour booking confirmed successfully',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error confirming tour booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin completes tour booking
 *          Collects remaining payment if partial payment was made
 * @route   PUT /api/tour-bookings/:id/complete
 * @access  Admin
 */
export const completeTourBooking = async (req, res) => {
  try {
    const booking = await TourBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Tour booking not found',
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete booking with status: ${booking.status}`,
      });
    }

    booking.status = 'completed';

    // If partial payment was made, collect remaining now
    if (booking.paymentStatus === 'partial') {
      const totalAmount = booking.pricing.totalAmount;
      const paidAmount = booking.pricing.paidAmount || 0;
      const remaining = totalAmount - paidAmount;

      if (remaining > 0) {
        booking.notes = `Remaining payment pending: ₹${remaining.toFixed(2)}`;
      }
    }

    await booking.save();

    const populated = await TourBooking.findById(booking._id)
      .populate('package', 'title coverImage tourCategory')
      .populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Tour booking completed. Payment collection initiated if needed.',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing tour booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Collect remaining payment for tour booking
 * @route   POST /api/tour-bookings/:id/collect-payment
 * @access  Admin
 */
export const collectTourPayment = async (req, res) => {
  try {
    const { amount, razorpayPaymentId } = req.body;
    const booking = await TourBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Tour booking not found',
      });
    }

    const totalAmount = booking.pricing.totalAmount;
    const paidAmount = booking.pricing.paidAmount || 0;
    const remaining = totalAmount - paidAmount;

    if (amount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance. Remaining: ₹${remaining.toFixed(2)}`,
      });
    }

    // Update payment
    booking.pricing.paidAmount = (booking.pricing.paidAmount || 0) + amount;

    if (razorpayPaymentId) {
      booking.paymentDetails.razorpayPaymentId = razorpayPaymentId;
      booking.paymentDetails.paidAt = new Date();
    }

    // Update payment status
    if (booking.pricing.paidAmount >= totalAmount) {
      booking.paymentStatus = 'paid';
    } else {
      booking.paymentStatus = 'partial';
    }

    await booking.save();

    const populated = await TourBooking.findById(booking._id)
      .populate('package', 'title coverImage tourCategory')
      .populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      message: `Payment of ₹${amount.toFixed(2)} collected successfully`,
      data: {
        bookingId: booking.bookingId,
        totalAmount: booking.pricing.totalAmount,
        paidAmount: booking.pricing.paidAmount,
        remainingAmount: Math.max(0, booking.pricing.totalAmount - booking.pricing.paidAmount),
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error collecting payment',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin gets all tour bookings
 * @route   GET /api/admin/tour-bookings
 * @access  Admin
 */
export const getAllTourBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, paymentStatus, searchTerm } = req.query;

    let query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (searchTerm) {
      query.$or = [
        { bookingId: { $regex: searchTerm, $options: 'i' } },
        { 'user.name': { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const bookings = await TourBooking.find(query)
      .populate('user', 'name email phone')
      .populate('package', 'title coverImage tourCategory pricing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TourBooking.countDocuments(query);

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
    res.status(500).json({
      success: false,
      message: 'Error fetching tour bookings',
      error: error.message,
    });
  }
};

/**
 * @desc    Get actual payment history for a tour booking (user/user-visible)
 * @route   GET /api/tour-bookings/:tourBookingId/payments
 * @access  Protected (User can view their own)
 */
export const getTourBookingPayments = async (req, res) => {
  try {
    const { tourBookingId } = req.params;
    
    // Get the tour booking
    const tourBooking = await TourBooking.findById(tourBookingId);
    if (!tourBooking) {
      return res.status(404).json({
        success: false,
        message: 'Tour booking not found'
      });
    }

    // Check if user owns this booking
    if (tourBooking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these payments'
      });
    }

    // Import Payment model dynamically to avoid circular dependencies
    const { default: Payment } = await import('../models/Payment.js');
    
    // Find all payments linked to this tour booking
    const payments = await Payment.find({ tourBooking: tourBookingId })
      .select('amount paymentMethod status paidAt transactionId razorpayPaymentId')
      .sort({ createdAt: -1 });
    
    // Calculate total paid from successful payments
    const totalActualPaid = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    console.log(`💳 Actual Payment History for Tour Booking ${tourBookingId}:`, {
      totalActualPaid,
      paymentCount: payments.length,
      bookingData: {
        _id: tourBooking._id,
        bookingAmount: tourBooking.pricing?.totalAmount,
        bookingPaidAmount: tourBooking.pricing?.paidAmount,
      },
      payments: payments.map(p => ({
        amount: p.amount,
        status: p.status,
        method: p.paymentMethod,
        paidAt: p.paidAt
      }))
    });
    
    res.status(200).json({
      success: true,
      data: {
        tourBookingId,
        totalAmount: tourBooking.pricing?.totalAmount || 0,
        totalActualPaid,
        remainingAmount: Math.max(0, (tourBooking.pricing?.totalAmount || 0) - totalActualPaid),
        payments,
        paymentCount: payments.length,
        paymentStatus: tourBooking.paymentStatus,
      }
    });
  } catch (error) {
    console.error('Error fetching tour booking payments:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
