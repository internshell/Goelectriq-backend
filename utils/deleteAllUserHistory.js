/**
 * ⚠️ WARNING: DESTRUCTIVE OPERATION
 * This script deletes ALL bookings (rides + tours) and payment history from the database
 * This action is PERMANENT and CANNOT be undone!
 * 
 * Deletes:
 * - All Ride Bookings
 * - All Tour Bookings
 * - All Payments
 * - All Transactions
 * - Resets user booking statistics
 * 
 * Usage: node utils/deleteAllUserHistory.js
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
import TourBooking from '../models/TourBooking.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

async function deleteAllUserHistory() {
  try {
    // Connect to MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goelectriq');
      console.log('✅ Connected to MongoDB\n');
    }

    // Display warning
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              ⚠️  PERMANENT DELETION WARNING ⚠️              ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║ You are about to DELETE ALL user booking history!          ║');
    console.log('║ This includes:                                             ║');
    console.log('║  • All Ride Bookings                                       ║');
    console.log('║  • All Tour Bookings                                       ║');
    console.log('║  • All Payment Records                                     ║');
    console.log('║  • All Transaction Records                                 ║');
    console.log('║  • User statistics (totalRides, totalSpent)                ║');
    console.log('║                                                            ║');
    console.log('║ THIS ACTION CANNOT BE UNDONE!                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Delete all bookings
    const bookingResult = await Booking.deleteMany({});
    console.log(`✅ Deleted ${bookingResult.deletedCount} Ride Bookings`);

    // Delete all tour bookings
    const tourResult = await TourBooking.deleteMany({});
    console.log(`✅ Deleted ${tourResult.deletedCount} Tour Bookings`);

    // Delete all payments
    const paymentResult = await Payment.deleteMany({});
    console.log(`✅ Deleted ${paymentResult.deletedCount} Payment Records`);

    // Delete all transactions
    const transactionResult = await Transaction.deleteMany({});
    console.log(`✅ Deleted ${transactionResult.deletedCount} Transaction Records`);

    // Reset user booking statistics
    const userResult = await User.updateMany({}, {
      $set: {
        totalRides: 0,
        totalSpent: 0,
      }
    });
    console.log(`✅ Reset statistics for ${userResult.modifiedCount} Users\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          ✅ ALL USER HISTORY PERMANENTLY DELETED ✅          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('Summary:');
    console.log(`  • Ride Bookings deleted: ${bookingResult.deletedCount}`);
    console.log(`  • Tour Bookings deleted: ${tourResult.deletedCount}`);
    console.log(`  • Payment Records deleted: ${paymentResult.deletedCount}`);
    console.log(`  • Transaction Records deleted: ${transactionResult.deletedCount}`);
    console.log(`  • Users affected: ${userResult.modifiedCount}\n`);

  } catch (error) {
    console.error('❌ Error deleting user history:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the script
deleteAllUserHistory();
