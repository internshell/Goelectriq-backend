import ChargingStationBooking from '../models/ChargingStationBooking.js';
import ChargingStation from '../models/ChargingStation.js';

/**
 * @desc    Create charging station booking
 * @route   POST /api/charging-bookings
 * @access  Public
 */
export const createChargingBooking = async (req, res) => {
  try {
    const { stationId, userName, userPhone, vehicleType, duration, estimatedCost } = req.body;
    const userId = req.user._id; // Get from authenticated user

    console.log('📝 Charging Station Booking Request:');
    console.log('  User ID:', userId);
    console.log('  Station ID:', stationId);
    console.log('  User Name:', userName);
    console.log('  User Phone:', userPhone);
    console.log('  Vehicle Type:', vehicleType);
    console.log('  Duration:', duration, 'hours');
    console.log('  Cost:', estimatedCost);

    // Validation
    if (!stationId || !userName || !userPhone || !vehicleType || !duration || !estimatedCost) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(userPhone)) {
      console.log('❌ Validation failed: Invalid phone format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    // Get station details
    const station = await ChargingStation.findById(stationId);
    if (!station) {
      console.log('❌ Station not found:', stationId);
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    // Create booking
    const booking = await ChargingStationBooking.create({
      userId,
      stationId,
      stationName: station.stationName,
      stationPhone: station.phone,
      userName,
      userPhone,
      vehicleType,
      duration: parseInt(duration),
      estimatedCost: parseFloat(estimatedCost),
      status: 'confirmed',
    });

    console.log('✅ Booking created successfully:', booking._id);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed! You will receive a confirmation SMS shortly.',
      data: {
        bookingId: booking._id,
        stationName: booking.stationName,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Error creating charging booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all charging station bookings (Admin)
 * @route   GET /api/charging-bookings
 * @access  Private (Admin)
 */
export const getAllChargingBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    const bookings = await ChargingStationBooking.find(query)
      .populate('stationId', 'stationName phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await ChargingStationBooking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings: bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
};

/**
 * @desc    Update charging booking status
 * @route   PUT /api/charging-bookings/:id
 * @access  Private (Admin)
 */
export const updateChargingBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const booking = await ChargingStationBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete charging booking
 * @route   DELETE /api/charging-bookings/:id
 * @access  Private (Admin)
 */
export const deleteChargingBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await ChargingStationBooking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message,
    });
  }
};
