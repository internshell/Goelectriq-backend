import Booking from '../models/Booking.js';
import Driver from '../models/Driver.js';

/**
 * @desc    Get all bookings assigned to logged-in driver
 * @route   GET /api/drivers/my-bookings
 * @access  Private (Driver only)
 */
export const getMyBookings = async (req, res) => {
  try {
    const driverId = req.user._id;

    // Get all bookings assigned to this driver
    const bookings = await Booking.find({ driver: driverId })
      .populate('user', 'name email phone')
      .populate('driver', 'name phone vehicleDetails')
      .sort({ createdAt: -1 });

    console.log(`✅ Retrieved ${bookings.length} bookings for driver ${driverId}`);

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings: bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching driver bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
};

/**
 * @desc    Get driver statistics
 * @route   GET /api/drivers/stats
 * @access  Private (Driver only)
 */
export const getDriverStats = async (req, res) => {
  try {
    const driverId = req.user._id;

    // Get bookings statistics
    const totalBookings = await Booking.countDocuments({ driver: driverId });
    const completedBookings = await Booking.countDocuments({
      driver: driverId,
      status: 'completed',
    });
    const pendingPayment = await Booking.countDocuments({
      driver: driverId,
      paymentStatus: 'pending',
    });

    // Calculate total earnings
    const earnings = await Booking.aggregate([
      { $match: { driver: driverId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$pricing.totalFare' },
          totalPaid: { $sum: '$paidAmount' },
        },
      },
    ]);

    const stats = {
      totalBookings,
      completedBookings,
      pendingPayment,
      totalEarnings: earnings[0]?.totalEarnings || 0,
      totalPaid: earnings[0]?.totalPaid || 0,
      pendingEarnings: (earnings[0]?.totalEarnings || 0) - (earnings[0]?.totalPaid || 0),
    };

    res.status(200).json({
      success: true,
      message: 'Driver statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('❌ Error fetching driver stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};
