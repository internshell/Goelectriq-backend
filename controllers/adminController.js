import Booking from '../models/Booking.js';
import TourBooking from '../models/TourBooking.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import CabPartner from '../models/CabPartner.js';
import Package from '../models/Package.js';
import Feedback from '../models/Feedback.js';
import Payment from '../models/Payment.js';
import Pricing from '../models/Pricing.js';

const defaultPricingConfig = {
  economy: {
    displayName: 'Economy',
    description: 'Compact and economical',
    passengers: 4,
    luggage: 2,
    baseFare: 50,
    perKmRate: 10,
    minimumFare: 100,
  },
  premium: {
    displayName: 'Premium',
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
      pricing,
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
    
    // Handle pricing - map form fields to schema fields
    // Form sends: economy, premium
    // Schema expects: economy, premium
    const pricingData = pricing && (pricing.economy || pricing.premium)
      ? {
          economy: pricing.economy ? Number(pricing.economy) : price,
          premium: pricing.premium ? Number(pricing.premium) : price,
        }
      : { 
          economy: price, 
          premium: price + 500,
        };
    
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
      pricing: pricingData,
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
      .populate('package', 'title coverImage tourCategory location basePrice pricing')
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
 * Get actual payment history for a tour booking (admin)
 */
export const getTourBookingPayments = async (req, res) => {
  try {
    const { tourBookingId } = req.params;
    
    // Find all payments linked to this tour booking
    const payments = await Payment.find({ tourBooking: tourBookingId })
      .select('amount paymentMethod status paidAt transactionId razorpayPaymentId')
      .sort({ createdAt: -1 });
    
    // Calculate total paid
    const totalPaid = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    console.log(`💳 Payment History for Tour Booking ${tourBookingId}:`, {
      totalPaid,
      paymentCount: payments.length,
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
        totalActualPaid: totalPaid,
        payments,
        paymentCount: payments.length,
      }
    });
  } catch (error) {
    console.error('Error fetching tour booking payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update package (admin)
 */
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['title', 'description', 'shortDescription', 'tourCategory', 'location', 'basePrice', 'coverImage', 'isActive', 'pricing'];
    
    // Fetch existing package first to preserve data during merge
    const existingPackage = await Package.findById(id);
    if (!existingPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if (k === 'basePrice') {
          updates[k] = Number(req.body[k]);
        } else if (k === 'pricing') {
          // Handle pricing object - map form fields to schema fields
          // Form sends: economy, premium
          // Schema expects: economy, premium
          const updates_pricing = {
            economy: undefined,
            premium: undefined,
          };
          
          // Keep existing values
          if (existingPackage.pricing) {
            updates_pricing.economy = existingPackage.pricing.economy;
            updates_pricing.premium = existingPackage.pricing.premium;
          }
          
          // Update with new values from form
          if (req.body[k].economy !== undefined && req.body[k].economy !== null && req.body[k].economy !== '') {
            updates_pricing.economy = Number(req.body[k].economy);
          }
          if (req.body[k].premium !== undefined && req.body[k].premium !== null && req.body[k].premium !== '') {
            updates_pricing.premium = Number(req.body[k].premium);
          }
          
          // Remove undefined fields
          Object.keys(updates_pricing).forEach(key => {
            if (updates_pricing[key] === undefined) {
              delete updates_pricing[key];
            }
          });
          
          updates[k] = updates_pricing;
        } else {
          updates[k] = req.body[k];
        }
      }
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

    const order = ['economy', 'premium'];
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

    if (!['economy', 'premium'].includes(rateId)) {
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
      if (!['economy', 'premium'].includes(rateId)) {
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

export const updateAirportRidePricing = async (req, res) => {
  try {
    const { cabType } = req.params;
    const { rideType, fixedCharge, parkingCharge } = req.body;

    // Validate car type
    if (!['economy', 'premium'].includes(cabType)) {
      return res.status(400).json({ success: false, message: 'Invalid car type' });
    }

    // Validate ride type (pickup or drop)
    if (!rideType || !['pickup', 'drop'].includes(rideType)) {
      return res.status(400).json({ success: false, message: 'Invalid ride type. Must be "pickup" or "drop"' });
    }

    // Validate input
    if (fixedCharge === undefined || parkingCharge === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Fixed charge and parking charge are required',
      });
    }

    const parsedFixed = Number(fixedCharge);
    const parsedParking = Number(parkingCharge);

    if (!Number.isFinite(parsedFixed) || parsedFixed < 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed charge must be a valid non-negative number',
      });
    }

    if (!Number.isFinite(parsedParking) || parsedParking < 0) {
      return res.status(400).json({
        success: false,
        message: 'Parking charge must be a valid non-negative number',
      });
    }

    // Ensure default pricing exists for this cab type
    await ensureDefaultPricingExists();

    // Build update object based on ride type
    const updateObject = {
      [`airportCharges.${rideType}.fixedCharge`]: parsedFixed,
      [`airportCharges.${rideType}.parkingCharge`]: parsedParking,
      updatedAt: new Date(),
    };

    // Update in database
    const updated = await Pricing.findOneAndUpdate(
      { cabType },
      updateObject,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Pricing not found for this car type',
      });
    }

    res.status(200).json({
      success: true,
      message: `Airport ${rideType} charges updated successfully`,
      data: {
        id: updated.cabType,
        name: updated.displayName,
        rideType: rideType,
        fixedCharge: updated.airportCharges[rideType].fixedCharge,
        parkingCharge: updated.airportCharges[rideType].parkingCharge,
      },
    });
  } catch (error) {
    console.error('Error in updateAirportRidePricing:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all pending ride bookings for admin approval
 * @route   GET /api/admin/ride-bookings/pending
 * @access  Private/Admin
 */
export const getPendingRideBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ 'adminApproval.status': 'pending' })
      .populate('user', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments({ 'adminApproval.status': 'pending' });

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
    console.error('Error in getPendingRideBookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Approve a ride booking by admin
 * @route   PATCH /api/admin/ride-bookings/:id/approve
 * @access  Private/Admin
 */
export const approveRideBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id; // Admin user ID from auth middleware

    const booking = await Booking.findById(id).populate('user');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update the booking approval status
    booking.adminApproval.status = 'approved';
    booking.adminApproval.approvedBy = adminId;
    booking.adminApproval.approvedAt = new Date();
    booking.status = 'confirmed'; // Set booking status to confirmed when admin approves

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error in approveRideBooking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reject a ride booking by admin
 * @route   PATCH /api/admin/ride-bookings/:id/reject
 * @access  Private/Admin
 */
export const rejectRideBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const booking = await Booking.findById(id).populate('user');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update the booking rejection status
    booking.adminApproval.status = 'rejected';
    booking.adminApproval.approvedBy = adminId;
    booking.adminApproval.approvedAt = new Date();
    booking.adminApproval.rejectionReason = rejectionReason;
    booking.status = 'cancelled'; // Set booking status to cancelled when admin rejects

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error in rejectRideBooking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark a ride as completed by admin (after payment received)
 * @route   PATCH /api/admin/ride-bookings/:id/complete
 * @access  Private/Admin
 */
export const completeRideBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { completionNotes } = req.body;
    const adminId = req.user.id;

    const booking = await Booking.findById(id)
      .populate('user')
      .populate('pricing');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update the ride completion details
    booking.rideCompletion.completedAt = new Date();
    booking.rideCompletion.completedBy = adminId;
    booking.rideCompletion.completionNotes = completionNotes || '';
    booking.status = 'completed';
    
    // Mark payment as paid when ride is completed (handles manual payments too)
    booking.paymentStatus = 'paid';

    await booking.save();

    // Detect payment method from completion notes
    const notesLower = (completionNotes || '').toLowerCase();
    let paymentMethod = 'cash'; // Default to cash for manual payments
    
    if (notesLower.includes('upi') || notesLower.includes('online') || notesLower.includes('razorpay')) {
      paymentMethod = 'razorpay';
    } else if (notesLower.includes('wallet')) {
      paymentMethod = 'wallet';
    }

    // Check if payment already exists for this booking
    let existingPayment = await Payment.findOne({ booking: booking._id });
    
    if (!existingPayment) {
      // Create payment record for manual completion
      const payment = new Payment({
        booking: booking._id,
        user: booking.user._id,
        amount: booking.totalFare || 0,
        currency: 'INR',
        paymentMethod: paymentMethod,
        paymentType: 'ride_booking',
        status: 'success',
        transactionId: `MANUAL_${booking.bookingId}_${Date.now()}`,
      });

      await payment.save();

      console.log('💳 Payment record created for manual completion:', {
        paymentId: payment._id,
        bookingId: booking.bookingId,
        method: paymentMethod,
        amount: booking.totalFare,
      });
    } else {
      // Update existing payment record
      existingPayment.paymentMethod = paymentMethod;
      existingPayment.status = 'success';
      await existingPayment.save();

      console.log('💳 Payment record updated for manual completion:', {
        paymentId: existingPayment._id,
        bookingId: booking.bookingId,
        method: paymentMethod,
      });
    }

    console.log('✅ Ride completed:', {
      bookingId: booking.bookingId,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: paymentMethod,
      notes: completionNotes
    });

    res.status(200).json({
      success: true,
      message: 'Ride marked as completed successfully',
      data: booking,
    });
  } catch (error) {
    console.error('❌ Error in completeRideBooking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin collect remaining 80% payment after ride completion
 * @route   POST /api/admin/bookings/:id/collect-payment
 * @access  Private (Admin only)
 * 
 * Called when admin receives payment (cash/online) for remaining balance
 */
export const collectRemainingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'cash', notes = '', paidAmount } = req.body;
    const adminId = req.user.id;

    const booking = await Booking.findById(id)
      .populate('user')
      .populate('pricing');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const totalFare = booking.pricing?.totalFare || 0;
    const alreadyPaid = booking.paidAmount || 0;
    const remainingAmount = totalFare - alreadyPaid;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Full payment already received for this booking'
      });
    }

    // Accept the payment amount provided
    const collectAmount = paidAmount ? Math.min(paidAmount, remainingAmount) : remainingAmount;

    // Update booking with payment info
    booking.paidAmount = alreadyPaid + collectAmount;
    booking.paymentMethod = paymentMethod;
    
    // Mark as paid if full amount is collected
    if (booking.paidAmount >= totalFare) {
      booking.paymentStatus = 'paid';
      booking.status = 'completed';
      console.log('✅ PAYMENT COMPLETE - Booking fully paid');
    } else {
      booking.paymentStatus = 'partial';
      console.log('💳 PARTIAL PAYMENT - Still awaiting balance');
    }

    // Store payment collection details
    booking.paymentDetails = {
      ...booking.paymentDetails,
      lastPaymentAt: new Date(),
      lastPaymentMethod: paymentMethod,
      lastPaymentAmount: collectAmount,
      collectedBy: adminId,
      collectionNotes: notes,
    };

    await booking.save();

    // Create payment record
    const payment = new Payment({
      booking: booking._id,
      user: booking.user._id,
      amount: collectAmount,
      currency: 'INR',
      paymentMethod: paymentMethod,
      paymentType: 'ride_booking',
      status: 'success',
      transactionId: `MANUAL_${booking.bookingId}_${Date.now()}`,
      paidAt: new Date(),
      paymentDetails: {
        method: paymentMethod,
        notes: notes,
        collectedBy: adminId,
      }
    });

    await payment.save();

    console.log('✅ Payment collected successfully:', {
      bookingId: booking.bookingId,
      collectedAmount: collectAmount,
      totalPaid: booking.paidAmount,
      totalFare: totalFare,
      paymentMethod: paymentMethod,
      status: booking.paymentStatus,
    });

    res.status(200).json({
      success: true,
      message: `Payment of ₹${collectAmount} collected successfully`,
      data: {
        bookingId: booking.bookingId,
        totalFare: totalFare,
        paidAmount: booking.paidAmount,
        remainingAmount: totalFare - booking.paidAmount,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        paymentMethod: paymentMethod,
      }
    });
  } catch (error) {
    console.error('❌ Error collecting payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get pending payments (rides with incomplete payment)
 * @route   GET /api/admin/pending-payments
 * @access  Private (Admin only)
 */
export const getPendingPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const pendingPayments = await Booking.find({
      paymentStatus: { $in: ['pending', 'partial'] }
    })
      .populate('user', 'name email phone')
      .populate('driver', 'name phone')
      .populate('pricing')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Booking.countDocuments({
      paymentStatus: { $in: ['pending', 'partial'] }
    });

    // Calculate payment details for each booking
    const paymentsSummary = pendingPayments.map(booking => {
      // Calculate fare same way as ride page: distance × perKmRate (no GST, no extra charges)
      const perKmRate = booking.pricing?.perKmRate || 0;
      const distance = booking.distance || 0;
      const calculatedFare = distance * perKmRate;
      
      const paidAmount = booking.paidAmount || 0;
      const remainingAmount = calculatedFare - paidAmount;
      const advanceAmount = Math.round(calculatedFare * 0.2);
      
      return {
        _id: booking._id,
        bookingId: booking.bookingId,
        user: booking.user,
        rideType: booking.rideType,
        cabType: booking.cabType || booking.carType || 'Standard',
        perKmRate: perKmRate,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        distance: distance,
        totalFare: calculatedFare,  // Same as ride page: distance × perKmRate
        advanceAmount: advanceAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        createdAt: booking.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: paymentsSummary,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        limit: limit,
      }
    });
  } catch (error) {
    console.error('❌ Error getting pending payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all cab partners (Admin)
 * @route   GET /api/admin/cab-partners
 * @access  Private (Admin only)
 */
export const getAdminCabPartners = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    const cabPartners = await CabPartner.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await CabPartner.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      partners: cabPartners,
      totalPages,
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error('❌ Error fetching cab partners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cab partners',
      error: error.message,
    });
  }
};

/**
 * @desc    Update cab partner status
 * @route   PUT /api/admin/cab-partners/:id
 * @access  Private (Admin only)
 */
export const updateAdminCabPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const cabPartner = await CabPartner.findByIdAndUpdate(
      id,
      {
        status,
        ...(comments && { 'verificationDetails.comments': comments }),
        ...(status === 'approved' && { 'verificationDetails.verificationDate': new Date() }),
      },
      { new: true }
    );

    if (!cabPartner) {
      return res.status(404).json({
        success: false,
        message: 'Cab partner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cab partner updated successfully',
      data: cabPartner,
    });
  } catch (error) {
    console.error('❌ Error updating cab partner:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cab partner',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete cab partner
 * @route   DELETE /api/admin/cab-partners/:id
 * @access  Private (Admin only)
 */
export const deleteAdminCabPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const cabPartner = await CabPartner.findByIdAndDelete(id);

    if (!cabPartner) {
      return res.status(404).json({
        success: false,
        message: 'Cab partner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cab partner deleted successfully',
      data: cabPartner,
    });
  } catch (error) {
    console.error('❌ Error deleting cab partner:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting cab partner',
      error: error.message,
    });
  }
};