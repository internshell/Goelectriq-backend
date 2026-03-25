import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';

/**
 * Export bookings to CSV
 */
export const exportBookingsToCSV = async (bookings) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `bookings_export_${timestamp}.csv`;
    const filepath = path.join(uploadsDir, filename);

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'bookingId', title: 'Booking ID' },
        { id: 'userName', title: 'User Name' },
        { id: 'userPhone', title: 'User Phone' },
        { id: 'cabType', title: 'Cab Type' },
        { id: 'pickupAddress', title: 'Pickup Location' },
        { id: 'dropAddress', title: 'Drop Location' },
        { id: 'distance', title: 'Distance (km)' },
        { id: 'totalFare', title: 'Total Fare (₹)' },
        { id: 'status', title: 'Status' },
        { id: 'paymentStatus', title: 'Payment Status' },
        { id: 'scheduledDate', title: 'Scheduled Date' },
        { id: 'scheduledTime', title: 'Scheduled Time' },
        { id: 'createdAt', title: 'Booked On' },
      ],
    });

    const records = bookings.map(booking => ({
      bookingId: booking.bookingId,
      userName: booking.user?.name || 'N/A',
      userPhone: booking.user?.phone || 'N/A',
      cabType: booking.cabType.toUpperCase(),
      pickupAddress: booking.pickupLocation.address,
      dropAddress: booking.dropLocation.address,
      distance: booking.distance,
      totalFare: booking.pricing.totalFare,
      status: booking.status.toUpperCase(),
      paymentStatus: booking.paymentStatus.toUpperCase(),
      scheduledDate: new Date(booking.scheduledDate).toLocaleDateString('en-IN'),
      scheduledTime: booking.scheduledTime,
      createdAt: new Date(booking.createdAt).toLocaleString('en-IN'),
    }));

    await csvWriter.writeRecords(records);

    return {
      filepath,
      filename,
      downloadUrl: `/uploads/exports/${filename}`,
    };
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
};

/**
 * Export users to CSV
 */
export const exportUsersToCSV = async (users) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `users_export_${timestamp}.csv`;
    const filepath = path.join(uploadsDir, filename);

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'role', title: 'Role' },
        { id: 'isActive', title: 'Active' },
        { id: 'isEmailVerified', title: 'Email Verified' },
        { id: 'createdAt', title: 'Registered On' },
      ],
    });

    const records = users.map(user => ({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.toUpperCase(),
      isActive: user.isActive ? 'Yes' : 'No',
      isEmailVerified: user.isEmailVerified ? 'Yes' : 'No',
      createdAt: new Date(user.createdAt).toLocaleString('en-IN'),
    }));

    await csvWriter.writeRecords(records);

    return {
      filepath,
      filename,
      downloadUrl: `/uploads/exports/${filename}`,
    };
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
};

/**
 * Export revenue data to CSV
 */
export const exportRevenueToCSV = async (revenueData) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `revenue_export_${timestamp}.csv`;
    const filepath = path.join(uploadsDir, filename);

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'totalBookings', title: 'Total Bookings' },
        { id: 'completedBookings', title: 'Completed' },
        { id: 'cancelledBookings', title: 'Cancelled' },
        { id: 'totalRevenue', title: 'Total Revenue (₹)' },
      ],
    });

    await csvWriter.writeRecords(revenueData);

    return {
      filepath,
      filename,
      downloadUrl: `/uploads/exports/${filename}`,
    };
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
};

export default {
  exportBookingsToCSV,
  exportUsersToCSV,
  exportRevenueToCSV,
};