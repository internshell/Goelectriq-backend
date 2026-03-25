/**
 * Email Templates for Different Scenarios
 */

// Booking Confirmation Email
export const bookingConfirmationEmail = (booking, user) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #667eea; }
          .total { font-size: 20px; color: #667eea; font-weight: bold; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Booking Confirmed!</h1>
            <p>Thank you for choosing Electric Cab Jaipur</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Your cab booking has been confirmed successfully!</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span>${booking.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Cab Type:</span>
                <span>${booking.cabType.toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup:</span>
                <span>${booking.pickupLocation.address}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Drop:</span>
                <span>${booking.dropLocation.address}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span>${new Date(booking.scheduledDate).toLocaleDateString()} at ${booking.scheduledTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Distance:</span>
                <span>${booking.distance} km</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Fare:</span>
                <span class="total">₹${booking.pricing.totalFare}</span>
              </div>
            </div>
            
            <p><strong>Important Information:</strong></p>
            <ul>
              <li>Driver will be assigned 30 minutes before pickup time</li>
              <li>You will receive driver details via SMS and WhatsApp</li>
              <li>Please be ready at pickup location on time</li>
              <li>Cancellation charges may apply as per policy</li>
            </ul>
            
            <center>
              <a href="${process.env.CLIENT_URL}/bookings/${booking._id}" class="button">View Booking Details</a>
            </center>
            
            <p>For any queries, contact us at:</p>
            <p>📞 +91-9876543210<br>
            📧 support@electriccab.com</p>
          </div>
          
          <div class="footer">
            <p>Electric Cab Jaipur - Eco-Friendly Transportation</p>
            <p>© ${new Date().getFullYear()} All Rights Reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Driver Assignment Email
  export const driverAssignmentEmail = (booking, driver, user) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .driver-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .driver-photo { width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 15px; }
          .rating { color: #ffa500; font-size: 20px; }
          .vehicle-info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Driver Assigned!</h1>
            <p>Your ride is confirmed</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Great news! A driver has been assigned for your booking.</p>
            
            <div class="driver-card">
              <h3>Your Driver Details</h3>
              <h2>${driver.name}</h2>
              <p class="rating">⭐ ${driver.rating}/5 (${driver.totalRides} rides)</p>
              <p>📞 ${driver.phone}</p>
              
              <div class="vehicle-info">
                <h4>Vehicle Details</h4>
                <p><strong>${driver.vehicleDetails.vehicleModel}</strong></p>
                <p>${driver.vehicleDetails.vehicleNumber}</p>
                <p>${driver.vehicleDetails.vehicleColor} ${driver.vehicleDetails.vehicleType.toUpperCase()}</p>
              </div>
            </div>
            
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Pickup Time:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()} at ${booking.scheduledTime}</p>
            
            <p>Your driver will arrive at the pickup location on time. Please be ready!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Booking Cancellation Email
  export const bookingCancellationEmail = (booking, user, refundAmount) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e53e3e; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .refund-info { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Your booking has been cancelled as requested.</p>
            
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Cancelled On:</strong> ${new Date().toLocaleString()}</p>
            
            ${refundAmount > 0 ? `
              <div class="refund-info">
                <h3>Refund Information</h3>
                <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
                <p>The refund will be processed within 5-7 business days to your original payment method.</p>
              </div>
            ` : ''}
            
            <p>We hope to serve you again soon!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Welcome Email
  export const welcomeEmail = (user) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .features { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .feature { background: white; padding: 15px; border-radius: 8px; text-align: center; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Electric Cab Jaipur!</h1>
            <p>Thank you for joining us</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>We're excited to have you onboard! Electric Cab Jaipur is your trusted partner for eco-friendly transportation in the Pink City.</p>
            
            <h3>Why Choose Us?</h3>
            <div class="features">
              <div class="feature">
                <h4>🔋 100% Electric</h4>
                <p>Zero emissions, clean rides</p>
              </div>
              <div class="feature">
                <h4>💰 Best Rates</h4>
                <p>Transparent pricing</p>
              </div>
              <div class="feature">
                <h4>👨‍✈️ Professional Drivers</h4>
                <p>Verified & trained</p>
              </div>
              <div class="feature">
                <h4>📱 Easy Booking</h4>
                <p>Book in seconds</p>
              </div>
            </div>
            
            <center>
              <a href="${process.env.CLIENT_URL}/booking" class="button">Book Your First Ride</a>
            </center>
            
            <p>Need help? We're here for you 24/7!</p>
            <p>📞 +91-9876543210<br>
            📧 support@electriccab.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Password Reset Email
  export const passwordResetEmail = (user, resetUrl) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <ul>
                <li>This link will expire in 30 minutes</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Invoice Email
  export const invoiceEmail = (booking, user, invoiceUrl) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Invoice - Booking #${booking.bookingId}</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Thank you for riding with Electric Cab Jaipur. Your invoice is ready.</p>
            
            <p><strong>Invoice Number:</strong> ${booking.invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Amount:</strong> ₹${booking.pricing.totalFare}</p>
            
            <center>
              <a href="${invoiceUrl}" class="button">Download Invoice</a>
            </center>
            
            <p>This invoice is also available in your account dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };