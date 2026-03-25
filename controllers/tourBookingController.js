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

    const basePrice = pkg.basePrice || pkg.pricing?.sedan || 0;
    const carUpgradeMap = { mini: 0, sedan: 200, suv: 500 };
    const carUpgradeCharge = carUpgradeMap[carType || 'sedan'] || 0;
    const subtotal = basePrice + carUpgradeCharge;
    const discount = paymentOption === 'full' ? subtotal * 0.1 : 0;
    const totalAmount = subtotal - discount;
    const paidAmount = paymentOption === 'full' ? totalAmount : Math.round(totalAmount * 0.2);

    const booking = await TourBooking.create({
      user: userId,
      package: packageId,
      pickupLocation,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      carType: carType || 'sedan',
      passengers: passengers || 4,
      paymentOption: paymentOption || 'confirmation',
      pricing: {
        packagePrice: basePrice,
        carUpgradeCharge,
        discount,
        totalAmount,
        paidAmount,
      },
      status: 'pending',
      paymentStatus: paymentOption === 'full' ? 'paid' : 'partial',
    });

    const populated = await TourBooking.findById(booking._id).populate('package', 'title coverImage tourCategory');

    res.status(201).json({
      success: true,
      message: 'Tour booking created successfully',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user's tour bookings
 */
export const getMyTourBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await TourBooking.find(query)
      .populate('package', 'title coverImage tourCategory basePrice pricing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TourBooking.countDocuments(query);

    // Transform data to include tourName field for consistency with frontend
    const transformedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      bookingObj.tourName = booking.package?.title || 'Tour Booking';
      bookingObj.packageName = booking.package?.title;
      bookingObj.totalAmount = booking.pricing?.totalAmount;
      return bookingObj;
    });

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
