/**
 * WhatsApp Message Templates
 */

// Ride Booking Notification
export const rideBookingNotification = (booking, user, isAdmin = false) => {
  if (isAdmin) {
    return `
📱 *NEW RIDE BOOKING - ADMIN ALERT*

👤 *Customer Info:*
Name: ${user.name}
Phone: ${user.phone}

🚗 *Ride Details:*
Booking ID: ${booking.bookingId}
Car Type: ${booking.cabType?.toUpperCase() || 'N/A'}
Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
Time: ${booking.scheduledTime || 'N/A'}
Distance: ${booking.distance?.toFixed(2) || 'N/A'} km

📍 *Pickup:* ${booking.pickupLocation?.address || 'N/A'}
📍 *Drop:* ${booking.dropLocation?.address || 'N/A'}

💰 *Fare:* ₹${booking.pricing?.totalFare || 0}
Payment Status: ${booking.paymentStatus?.toUpperCase()}

⏰ Awaiting payment confirmation...

- GoElectriQ Admin
    `.trim();
  }
  
  return `
🚗 *Your Ride Booking Confirmed!*

Hello ${user.name},

Your ride booking has been created successfully.

📋 *Booking Details:*
Booking ID: ${booking.bookingId}
Car Type: ${booking.cabType?.toUpperCase() || 'N/A'}
Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
Time: ${booking.scheduledTime || 'N/A'}

📍 *Pickup:* ${booking.pickupLocation?.address || 'N/A'}
📍 *Drop:* ${booking.dropLocation?.address || 'N/A'}

Distance: ${booking.distance?.toFixed(2) || 'N/A'} km
💰 *Estimated Fare:* ₹${booking.pricing?.totalFare || 0}

Please complete your payment to confirm the ride.
Driver will be assigned after payment confirmation.

Thank you for choosing GoElectriQ! 🌿

For support: 📞 Contact us in app
    `.trim();
};

// Tour Booking Notification
export const tourBookingNotification = (booking, user, isAdmin = false) => {
  if (isAdmin) {
    return `
📱 *NEW TOUR BOOKING - ADMIN ALERT*

👤 *Customer Info:*
Name: ${user.name}
Phone: ${user.phone}

🚌 *Tour Details:*
Booking ID: ${booking._id}
Car Type: ${booking.carType?.toUpperCase() || 'N/A'}
Passengers: ${booking.passengers || 'N/A'}
Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
Time: ${booking.scheduledTime || 'N/A'}

📍 *Pickup Location:* ${booking.pickupLocation || 'N/A'}

💰 *Amount:* ₹${booking.pricing?.totalAmount || 0}
Payment Option: ${booking.paymentOption?.toUpperCase()}
Payment Status: ${booking.paymentStatus?.toUpperCase()}

⏰ Awaiting payment confirmation...

- GoElectriQ Admin
    `.trim();
  }
  
  return `
🚌 *Your Tour Booking Confirmed!*

Hello ${user.name},

Your tour booking has been created successfully.

📋 *Booking Details:*
Booking ID: ${booking._id}
Car Type: ${booking.carType?.toUpperCase() || 'N/A'}
Passengers: ${booking.passengers || 'N/A'}
Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
Time: ${booking.scheduledTime || 'N/A'}

📍 *Pickup Location:* ${booking.pickupLocation || 'N/A'}

💰 *Total Amount:* ₹${booking.pricing?.totalAmount || 0}
Discount: ₹${booking.pricing?.discount || 0}
Payment Option: ${booking.paymentOption?.toUpperCase()}

Please complete your payment to confirm the tour.
Our team will confirm your tour after payment.

Thank you for choosing GoElectriQ! 🌿

For support: 📞 Contact us in app
    `.trim();
};

// Ride Payment Success Message
export const ridePaymentSuccessMessage = (booking, user, paymentId, isAdmin = false) => {
  if (isAdmin) {
    return `
✅ *RIDE PAYMENT SUCCESSFUL - ADMIN NOTIFICATION*

📱 *Payment Details:*
Payment ID: ${paymentId}
Booking ID: ${booking.bookingId}
Customer: ${user.name} (${user.phone})

💰 *Amount:* ₹${booking.pricing?.totalFare || 0}
Status: PAID

🚗 *Ride Info:*
Car Type: ${booking.cabType?.toUpperCase() || 'N/A'}
Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
Time: ${booking.scheduledTime || 'N/A'}

📍 *Route:* ${booking.pickupLocation?.address?.substring(0, 30) || 'N/A'}... → ${booking.dropLocation?.address?.substring(0, 30) || 'N/A'}...

📲 *Next Step:* Assign driver to this booking

- GoElectriQ Admin
    `.trim();
  }
  
  return `
✅ *Payment Successful!*

Hello ${user.name},

Your payment has been received successfully.

📋 *Payment Confirmation:*
Payment ID: ${paymentId}
Booking ID: ${booking.bookingId}
Amount Paid: ₹${booking.pricing?.totalFare || 0}

🚗 *Your Ride:*
Car Type: ${booking.cabType?.toUpperCase() || 'N/A'}
Scheduled Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
Time: ${booking.scheduledTime || 'N/A'}
Distance: ${booking.distance?.toFixed(2) || 'N/A'} km

📍 *Pickup:* ${booking.pickupLocation?.address || 'N/A'}
📍 *Drop:* ${booking.dropLocation?.address || 'N/A'}

Your driver will be assigned shortly.
You'll receive driver details 30 minutes before pickup time.

Thank you for choosing GoElectriQ! 🌿

- GoElectriQ Team
    `.trim();
};

// Tour Payment Success Message
export const tourPaymentSuccessMessage = (booking, user, paymentId, isAdmin = false) => {
  if (isAdmin) {
    return `
✅ *TOUR PAYMENT SUCCESSFUL - ADMIN NOTIFICATION*

📱 *Payment Details:*
Payment ID: ${paymentId}
Booking ID: ${booking._id}
Customer: ${user.name} (${user.phone})

💰 *Amount:* ₹${booking.pricing?.totalAmount || 0}
Status: PAID

🚌 *Tour Info:*
Car Type: ${booking.carType?.toUpperCase() || 'N/A'}
Passengers: ${booking.passengers || 'N/A'}
Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
Time: ${booking.scheduledTime || 'N/A'}
Pickup: ${booking.pickupLocation || 'N/A'}

📲 *Next Step:* Send tour confirmation details to customer

- GoElectriQ Admin
    `.trim();
  }
  
  return `
✅ *Tour Payment Successful!*

Hello ${user.name},

Your tour payment has been received successfully.

📋 *Payment Confirmation:*
Payment ID: ${paymentId}
Booking ID: ${booking._id}
Amount Paid: ₹${booking.pricing?.totalAmount || 0}

🚌 *Your Tour:*
Car Type: ${booking.carType?.toUpperCase() || 'N/A'}
Passengers: ${booking.passengers || 'N/A'}
Scheduled Date: ${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
Time: ${booking.scheduledTime || 'N/A'}
Pickup Location: ${booking.pickupLocation || 'N/A'}

Your tour is now confirmed!
Our team will send you detailed itinerary and contact information shortly.

Thank you for choosing GoElectriQ! 🌿

- GoElectriQ Team
    `.trim();
};

// Booking Confirmation Message
export const bookingConfirmationMessage = (booking, user) => {
    return `
  🚗 *Booking Confirmed!*
  
  Hello ${user.name},
  
  Your cab booking is confirmed.
  
  📋 *Booking Details:*
  Booking ID: ${booking.bookingId}
  Cab Type: ${booking.cabType.toUpperCase()}
  Date: ${new Date(booking.scheduledDate).toLocaleDateString()}
  Time: ${booking.scheduledTime}
  
  📍 *Pickup:* ${booking.pickupLocation.address}
  📍 *Drop:* ${booking.dropLocation.address}
  
  💰 *Total Fare:* ₹${booking.pricing.totalFare}
  
  Driver details will be shared 30 minutes before pickup time.
  
  Thank you for choosing Electric Cab Jaipur! 🌿
  
  For support: 📞 +91-9876543210
    `.trim();
  };
  
  // Driver Assignment Message
  export const driverAssignmentMessage = (booking, driver, user) => {
    return `
  🚗 *Driver Assigned!*
  
  Hello ${user.name},
  
  Your driver is on the way!
  
  👨‍✈️ *Driver Details:*
  Name: ${driver.name}
  Phone: ${driver.phone}
  Rating: ⭐ ${driver.rating}/5
  
  🚙 *Vehicle:*
  ${driver.vehicleDetails.vehicleModel}
  ${driver.vehicleDetails.vehicleNumber}
  Color: ${driver.vehicleDetails.vehicleColor}
  
  📋 *Booking ID:* ${booking.bookingId}
  ⏰ *Pickup Time:* ${booking.scheduledTime}
  
  Please be ready at the pickup location!
  
  - Electric Cab Jaipur 🌿
    `.trim();
  };
  
  // Ride Started Message
  export const rideStartedMessage = (booking, user) => {
    return `
  ✅ *Ride Started!*
  
  Hello ${user.name},
  
  Your ride has started.
  
  📋 Booking ID: ${booking.bookingId}
  ⏰ Started at: ${new Date().toLocaleTimeString()}
  
  Have a safe journey! 🚗💨
  
  Track your ride in the app.
  
  - Electric Cab Jaipur
    `.trim();
  };
  
  // Ride Completed Message
  export const rideCompletedMessage = (booking, user) => {
    return `
  🎉 *Ride Completed!*
  
  Hello ${user.name},
  
  Thank you for riding with us!
  
  📋 Booking ID: ${booking.bookingId}
  💰 Total Fare: ₹${booking.pricing.totalFare}
  📊 Distance: ${booking.distance} km
  
  Please rate your experience in the app.
  
  We hope to serve you again soon! 🌿
  
  - Electric Cab Jaipur
    `.trim();
  };
  
  // Booking Cancelled Message
  export const bookingCancelledMessage = (booking, user, refundAmount) => {
    let message = `
  ❌ *Booking Cancelled*
  
  Hello ${user.name},
  
  Your booking has been cancelled.
  
  📋 Booking ID: ${booking.bookingId}
  ⏰ Cancelled at: ${new Date().toLocaleTimeString()}
    `;
  
    if (refundAmount > 0) {
      message += `\n💰 Refund Amount: ₹${refundAmount}\n\nRefund will be processed within 5-7 business days.`;
    }
  
    message += `\n\nWe hope to serve you again!\n\n- Electric Cab Jaipur 🌿`;
  
    return message.trim();
  };
  
  // OTP Message
  export const otpMessage = (otp, userName) => {
    return `
  Hello ${userName},
  
  Your OTP for Electric Cab Jaipur is: *${otp}*
  
  Valid for 10 minutes. Please do not share this OTP with anyone.
  
  - Electric Cab Jaipur 🌿
    `.trim();
  };
  
  // Driver Reaching Soon Message
  export const driverReachingSoonMessage = (booking, driver, user, eta) => {
    return `
  ⏰ *Driver Arriving Soon!*
  
  Hello ${user.name},
  
  Your driver ${driver.name} is ${eta} minutes away from pickup location.
  
  📋 Booking ID: ${booking.bookingId}
  📞 Driver: ${driver.phone}
  🚙 Vehicle: ${driver.vehicleDetails.vehicleNumber}
  
  Please be ready! 🚗
  
  - Electric Cab Jaipur
    `.trim();
  };
  
  // Payment Successful Message
  export const paymentSuccessMessage = (booking, user, transactionId) => {
    return `
  ✅ *Payment Successful!*
  
  Hello ${user.name},
  
  Your payment has been received.
  
  📋 Booking ID: ${booking.bookingId}
  💰 Amount Paid: ₹${booking.pricing.totalFare}
  🔖 Transaction ID: ${transactionId}
  
  Invoice will be sent to your email shortly.
  
  Thank you! 🌿
  
  - Electric Cab Jaipur
    `.trim();
  };
  
  // Refund Processed Message
  export const refundProcessedMessage = (booking, user, refundAmount) => {
    return `
  💰 *Refund Processed*
  
  Hello ${user.name},
  
  Your refund has been processed successfully.
  
  📋 Booking ID: ${booking.bookingId}
  💰 Refund Amount: ₹${refundAmount}
  
  The amount will reflect in your account within 5-7 business days.
  
  - Electric Cab Jaipur 🌿
    `.trim();
  };
  
  // Reminder Message (1 hour before ride)
  export const rideReminderMessage = (booking, user) => {
    return `
  ⏰ *Ride Reminder*
  
  Hello ${user.name},
  
  Your ride is scheduled in 1 hour!
  
  📋 Booking ID: ${booking.bookingId}
  ⏰ Time: ${booking.scheduledTime}
  📍 Pickup: ${booking.pickupLocation.address}
  
  Driver details will be shared 30 minutes before.
  
  - Electric Cab Jaipur 🌿
    `.trim();
  };
  
  // Driver Cancelled Message
  export const driverCancelledMessage = (booking, user) => {
    return `
  ⚠️ *Driver Cancelled*
  
  Hello ${user.name},
  
  Unfortunately, the assigned driver had to cancel. We're assigning a new driver immediately.
  
  📋 Booking ID: ${booking.bookingId}
  
  You'll receive new driver details shortly. Sorry for the inconvenience!
  
  - Electric Cab Jaipur
    `.trim();
  };
  
  // Welcome Message (for new users)
  export const welcomeMessage = (user) => {
    return `
  🎉 *Welcome to Electric Cab Jaipur!*
  
  Hello ${user.name},
  
  Thank you for joining us! 
  
  We're your trusted partner for eco-friendly transportation in the Pink City. 🌿
  
  ✅ 100% Electric Vehicles
  ✅ Professional Drivers
  ✅ Transparent Pricing
  ✅ 24/7 Service
  
  Book your first ride now and enjoy clean, green travel!
  
  📱 Download our app
  🌐 Visit: www.electriccabjaipur.com
  
  For support: 📞 +91-9876543210
  
  Happy Riding! 🚗💚
    `.trim();
  };