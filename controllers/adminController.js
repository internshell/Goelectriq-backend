import Booking from '../models/Booking.js';
import TourBooking from '../models/TourBooking.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Package from '../models/Package.js';
import Feedback from '../models/Feedback.js';
import Payment from '../models/Payment.js';
import Pricing from '../models/Pricing.js';

const defaultPricingConfig = {
  mini: {
    displayName: 'Mini Car',
    description: 'Compact and economical',
    passengers: 4,
    luggage: 2,
    baseFare: 50,
    perKmRate: 10,
    minimumFare: 100,
  },
  sedan: {
    displayName: 'Sedan',
    description: 'Comfortable and spacious',
    passengers: 4,
    luggage: 3,
    baseFare: 75,
    perKmRate: 14,
    minimumFare: 150,
  },
  suv: {
    displayName: 'SUV',
    description: 'Premium and luxurious',
    passengers: 6,
    luggage: 4,
    baseFare: 100,
    perKmRate: 18,
    minimumFare: 200,
  },
};

const normalizePricingResponse = (pricing) => ({
  id: pricing.cabType,
  name: pricing.displayName || pricing.cabType.toUpperCase(),
  baseRate: Number.isFinite(pricing.perKmRate) ? pricing.perKmRate : 0,
  maxPassengers: Number.isFinite(pricing?.capacity?.passengers) ? pricing.capacity.passengers : 0,
  description: pricing.description || '',
});

const ensureDefaultPricingExists = async () => {
  const cabTypes = Object.keys(defaultPricingConfig);

  await Promise.all(
    cabTypes.map(async (cabType) => {
      const existing = await Pricing.findOne({ cabType });
      if (existing) return;

      const config = defaultPricingConfig[cabType];
      await Pricing.create({
        cabType,
        displayName: config.displayName,
        description: config.description,
        capacity: {
          passengers: config.passengers,
          luggage: config.luggage,
        },
        baseFare: config.baseFare,
        perKmRate: config.perKmRate,
        minimumFare: config.minimumFare,
        perMinuteWaiting: 1,
        nightCharges: {
          enabled: false,
          multiplier: 1.25,
          startHour: 22,
          endHour: 6,
        },
        surgeCharges: {
          enabled: false,
          multiplier: 1.3,
          activeDays: [],
          activeHours: {
            start: 0,
            end: 0,
          },
        },
        gstPercentage: 5,
        isActive: true,
      });
    })
  );
};

export const getAllBookings = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      const query = {};
      if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
      
      console.log('Admin Bookings Query:', query);
      
      const bookings = await Booking.find(query)
        .populate('user', 'name email phone')
        .populate('driver', 'name phone vehicleDetails')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      console.log('Bookings found:', bookings.length);
      
      const total = await Booking.countDocuments(query);
      
      res.status(200).json({
        success: true,
        data: {
          bookings,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Error in getAllBookings:', error);
      res.status(500).json({ success: false, message: error.message });
    }
};

export const getAnalytics = async (req, res) => {
  try {
    const rideBookings = await Booking.countDocuments();
    const tourBookings = await TourBooking.countDocuments();
    const totalBookings = rideBookings + tourBookings;
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const completedTourBookings = await TourBooking.countDocuments({ status: 'completed' });
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const activeDrivers = await Driver.countDocuments({ status: 'active' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayRideBookings = await Booking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } });
    const todayTourBookings = await TourBooking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } });
    const todayBookings = todayRideBookings + todayTourBookings;

    const rideRevenuePipeline = [
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalFare' } } },
    ];
    const tourRevenuePipeline = [
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
    ];
    const rideRevenue = await Booking.aggregate(rideRevenuePipeline);
    const tourRevenue = await TourBooking.aggregate(tourRevenuePipeline);
    const totalRevenue = (rideRevenue[0]?.total || 0) + (tourRevenue[0]?.total || 0);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        todayBookings,
        rideBookings,
        tourBookings,
        completedBookings: completedBookings + completedTourBookings,
        activeUsers,
        activeDrivers,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create tour package (Travel Tour or Temple Tour)
 */
export const createPackage = async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      tourCategory,
      location,
      basePrice,
      durationDays,
      durationHours,
      coverImage,
    } = req.body;
    if (!title || !description || !tourCategory) {
      return res.status(400).json({
        success: false,
        message: 'Title, description and tour category are required',
      });
    }
    if (!['travel_tour', 'temple_tour'].includes(tourCategory)) {
      return res.status(400).json({
        success: false,
        message: 'tourCategory must be travel_tour or temple_tour',
      });
    }
    const price = basePrice ? Number(basePrice) : 0;
    const pkg = await Package.create({
      title,
      description,
      shortDescription: shortDescription || description.slice(0, 120),
      packageType: 'tour',
      tourCategory,
      location: location || '',
      basePrice: price,
      duration: {
        days: durationDays ? Number(durationDays) : 1,
        hours: durationHours ? Number(durationHours) : 0,
      },
      coverImage: coverImage || '',
      pricing: { sedan: price, suv: price + 500, hatchback: price + 200, luxury: price + 1000 },
      discount: req.body.discountPercent ? { percentage: Number(req.body.discountPercent), validFrom: new Date(), validTill: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } : undefined,
      isActive: true,
    });
    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: pkg,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all packages (admin list)
 */
export const getAdminPackages = async (req, res) => {
  try {
    const { tourCategory } = req.query;
    const query = {};
    if (tourCategory) query.tourCategory = tourCategory;
    const packages = await Package.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all tour bookings (admin)
 */
export const getAdminTourBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const query = {};
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;

    console.log('Admin Tour Bookings Query:', query);

    const tourBookings = await TourBooking.find(query)
      .populate('user', 'name email phone')
      .populate('package', 'title coverImage tourCategory location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Tour bookings found:', tourBookings.length);

    const total = await TourBooking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { tourBookings, pagination: { total, page, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Error in getAdminTourBookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update tour booking status (admin)
 */
export const updateTourBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const booking = await TourBooking.findByIdAndUpdate(
      id,
      { status, ...(adminNotes != null && { adminNotes }) },
      { new: true }
    )
      .populate('user', 'name email phone')
      .populate('package', 'title tourCategory');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Tour booking not found' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update package (admin)
 */
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['title', 'description', 'shortDescription', 'tourCategory', 'location', 'basePrice', 'coverImage', 'isActive'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = k === 'basePrice' ? Number(req.body[k]) : req.body[k];
    }
    
    // Handle duration fields
    if (req.body.durationDays !== undefined || req.body.durationHours !== undefined) {
      updates.duration = {
        days: req.body.durationDays ? Number(req.body.durationDays) : 1,
        hours: req.body.durationHours ? Number(req.body.durationHours) : 0,
      };
    }
    
    if (req.body.discountPercent !== undefined) {
      updates.discount = {
        percentage: Number(req.body.discountPercent),
        validFrom: new Date(),
        validTill: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
    }
    const pkg = await Package.findByIdAndUpdate(id, updates, { new: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all feedback (admin)
 */
export const getAdminFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Feedback.countDocuments();

    res.status(200).json({
      success: true,
      data: { feedback, pagination: { total, page, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete package (admin)
 */
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await Package.findByIdAndDelete(id);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.status(200).json({ success: true, message: 'Package deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ USERS MANAGEMENT ============
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (req.query.role && req.query.role !== 'all') query.role = req.query.role;
    if (req.query.status && req.query.status !== 'all') query.isActive = req.query.status === 'active';
    
    console.log('Admin Users Query:', query);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Users found:', users.length);
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ DRIVERS MANAGEMENT ============
export const getAllDriversAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (req.query.status) query.status = req.query.status;
    
    const drivers = await Driver.find(query)
      .select('-bankDetails -password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Driver.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        drivers,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDriverAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByIdAndDelete(id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.status(200).json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDriverStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'pending', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const driver = await Driver.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-bankDetails -password');
    
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.status(200).json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ BOOKINGS MANAGEMENT ============
export const deleteBookingAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('user', 'name email phone')
      .populate('driver', 'name phone vehicleDetails');
    
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ TOUR BOOKINGS MANAGEMENT ============
export const deleteTourBookingAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await TourBooking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Tour booking not found' });
    res.status(200).json({ success: true, message: 'Tour booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ FEEDBACK MANAGEMENT ============
export const deleteFeedbackAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PAYMENTS MANAGEMENT ============
export const getAllPaymentsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    
    console.log('Admin Payments Query:', query);
    
    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('booking', 'bookingId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Payments found:', payments.length);
    
    const total = await Payment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllPaymentsAdmin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ ADMIN PROFILE ============
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Error in getAdminProfile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PRICING MANAGEMENT ============
export const getAdminPricingRates = async (req, res) => {
  try {
    await ensureDefaultPricingExists();

    const pricingRates = await Pricing.find({ cabType: { $in: Object.keys(defaultPricingConfig) } })
      .sort({ cabType: 1 });

    const order = ['mini', 'sedan', 'suv'];
    const orderedRates = order
      .map((cabType) => pricingRates.find((item) => item.cabType === cabType))
      .filter(Boolean);

    res.status(200).json({
      success: true,
      data: orderedRates.map(normalizePricingResponse),
    });
  } catch (error) {
    console.error('Error in getAdminPricingRates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminPricingRate = async (req, res) => {
  try {
    const { rateId } = req.params;
    const { name, baseRate, maxPassengers, description } = req.body;

    if (!['mini', 'sedan', 'suv'].includes(rateId)) {
      return res.status(400).json({ success: false, message: 'Invalid rate id' });
    }

    const parsedRate = Number(baseRate);
    const parsedPassengers = Number(maxPassengers);

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      return res.status(400).json({ success: false, message: 'baseRate must be a valid positive number' });
    }

    if (!Number.isFinite(parsedPassengers) || parsedPassengers <= 0) {
      return res.status(400).json({ success: false, message: 'maxPassengers must be a valid positive number' });
    }

    const fallback = defaultPricingConfig[rateId];

    const updated = await Pricing.findOneAndUpdate(
      { cabType: rateId },
      {
        cabType: rateId,
        displayName: name || fallback.displayName,
        description: description || fallback.description,
        capacity: {
          passengers: parsedPassengers,
          luggage: fallback.luggage,
        },
        perKmRate: parsedRate,
        baseFare: fallback.baseFare,
        minimumFare: fallback.minimumFare,
        perMinuteWaiting: 1,
        isActive: true,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Rate updated successfully',
      data: normalizePricingResponse(updated),
    });
  } catch (error) {
    console.error('Error in updateAdminPricingRate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkUpdateAdminPricingRates = async (req, res) => {
  try {
    const { rates } = req.body;

    if (!Array.isArray(rates) || rates.length === 0) {
      return res.status(400).json({ success: false, message: 'rates array is required' });
    }

    const updatedItems = [];

    for (const rateData of rates) {
      const rateId = rateData.id;
      if (!['mini', 'sedan', 'suv'].includes(rateId)) {
        continue;
      }

      const parsedRate = Number(rateData.baseRate);
      const parsedPassengers = Number(rateData.maxPassengers);
      const fallback = defaultPricingConfig[rateId];

      if (!Number.isFinite(parsedRate) || parsedRate <= 0 || !Number.isFinite(parsedPassengers) || parsedPassengers <= 0) {
        continue;
      }

      const updated = await Pricing.findOneAndUpdate(
        { cabType: rateId },
        {
          cabType: rateId,
          displayName: rateData.name || fallback.displayName,
          description: rateData.description || fallback.description,
          capacity: {
            passengers: parsedPassengers,
            luggage: fallback.luggage,
          },
          perKmRate: parsedRate,
          baseFare: fallback.baseFare,
          minimumFare: fallback.minimumFare,
          perMinuteWaiting: 1,
          isActive: true,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      updatedItems.push(normalizePricingResponse(updated));
    }

    res.status(200).json({
      success: true,
      message: 'Rates updated successfully',
      data: updatedItems,
    });
  } catch (error) {
    console.error('Error in bulkUpdateAdminPricingRates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};