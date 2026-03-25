import TourBooking from '../models/TourBooking.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration to recalculate paid amounts for all tour bookings
 * Changes hardcoded ₹500 to 20% of total amount
 */
export const migrateTourPayments = async () => {
  try {
    console.log('🔄 Starting tour payment migration...');
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Find all tour bookings where paidAmount is 500 and paymentOption is "confirmation"
    const bookingsToUpdate = await TourBooking.find({
      'pricing.paidAmount': 500,
      paymentOption: 'confirmation'
    });

    console.log(`📊 Found ${bookingsToUpdate.length} bookings with ₹500 payment amount`);

    if (bookingsToUpdate.length === 0) {
      console.log('✅ No bookings need updating');
      return;
    }

    // Update each booking
    let updated = 0;
    for (const booking of bookingsToUpdate) {
      const totalAmount = booking.pricing?.totalAmount || 0;
      const correctPaidAmount = Math.round(totalAmount * 0.2);

      await TourBooking.findByIdAndUpdate(
        booking._id,
        {
          'pricing.paidAmount': correctPaidAmount
        },
        { new: true }
      );

      updated++;
      console.log(`✓ Updated booking ${booking._id}: ₹500 → ₹${correctPaidAmount} (20% of ₹${totalAmount})`);
    }

    console.log(`\n✅ Migration complete! Updated ${updated} bookings`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateTourPayments();
