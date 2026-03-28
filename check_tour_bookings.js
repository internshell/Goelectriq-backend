import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TourBooking from './models/TourBooking.js';
import Package from './models/Package.js';

dotenv.config();

const checkTourBookings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get recent tour bookings
    const bookings = await TourBooking.find()
      .populate('package', 'title basePrice pricing')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('📋 RECENT TOUR BOOKINGS IN DATABASE:\n');
    
    bookings.forEach((booking, idx) => {
      console.log(`\n=== Tour ${idx + 1} ===`);
      console.log('Booking ID:', booking._id);
      console.log('Package Title:', booking.package?.title);
      console.log('Package Base Price:', booking.package?.basePrice);
      console.log('Package Pricing:', booking.package?.pricing);
      console.log('\nBooking Pricing Details:');
      console.log('  packagePrice:', booking.pricing?.packagePrice);
      console.log('  carUpgradeCharge:', booking.pricing?.carUpgradeCharge);
      console.log('  discount:', booking.pricing?.discount);
      console.log('  totalAmount:', booking.pricing?.totalAmount);
      console.log('  paidAmount:', booking.pricing?.paidAmount);
      console.log('\nOther Details:');
      console.log('  carType:', booking.carType);
      console.log('  paymentStatus:', booking.paymentStatus);
      console.log('  status:', booking.status);
    });

    console.log('\n\n✅ Database Check Complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkTourBookings();
