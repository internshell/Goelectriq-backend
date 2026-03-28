/**
 * ⚠️ WARNING: DESTRUCTIVE OPERATION
 * This script deletes ALL bookings from the database
 * Use with extreme caution! This action cannot be undone.
 * 
 * Usage: node utils/clearAllBookings.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

async function clearAllBookings() {
  try {
    // Connect to MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goelectriq');
      console.log('✅ Connected to MongoDB');
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: You are about to delete ALL bookings from the database!');
    console.log('This action CANNOT be undone.\n');

    // Delete all bookings
    const deleteResult = await Booking.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} bookings`);

    // Delete associated payments
    const paymentResult = await Payment.deleteMany({ bookingId: { $exists: true } });
    console.log(`✅ Deleted ${paymentResult.deletedCount} payments`);

    // Delete associated transactions
    const transactionResult = await Transaction.deleteMany({ bookingId: { $exists: true } });
    console.log(`✅ Deleted ${transactionResult.deletedCount} transactions`);

    // Reset user booking counts
    await User.updateMany({}, {
      $set: {
        totalRides: 0,
        totalSpent: 0,
      }
    });
    console.log('✅ Reset user booking statistics');

    console.log('\n✅ All bookings and related data have been successfully deleted!\n');

  } catch (error) {
    console.error('❌ Error deleting bookings:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);
  }
}

// Run the script
clearAllBookings();
