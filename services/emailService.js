// import { sendEmail } from '../config/nodemailer.js';
// import {
//   bookingConfirmationEmail,
//   driverAssignmentEmail,
//   bookingCancellationEmail,
//   welcomeEmail,
//   passwordResetEmail,
//   invoiceEmail,
// } from '../utils/emailTemplates.js';

// /**
//  * Send booking confirmation email
//  */
// export const sendBookingConfirmationEmail = async (booking, user) => {
//   try {
//     const emailHtml = bookingConfirmationEmail(booking, user);
    
//     await sendEmail({
//       to: user.email,
//       subject: `Booking Confirmed - ${booking.bookingId}`,
//       html: emailHtml,
//     });
    
//     console.log(`Booking confirmation email sent to ${user.email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending booking confirmation email:', error);
//     return false;
//   }
// };

// /**
//  * Send driver assignment email
//  */
// export const sendDriverAssignmentEmail = async (booking, driver, user) => {
//   try {
//     const emailHtml = driverAssignmentEmail(booking, driver, user);
    
//     await sendEmail({
//       to: user.email,
//       subject: `Driver Assigned - ${booking.bookingId}`,
//       html: emailHtml,
//     });
    
//     console.log(`Driver assignment email sent to ${user.email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending driver assignment email:', error);
//     return false;
//   }
// };

// /**
//  * Send booking cancellation email
//  */
// export const sendCancellationEmail = async (booking, user, refundAmount) => {
//   try {
//     const emailHtml = bookingCancellationEmail(booking, user, refundAmount);
    
//     await sendEmail({
//       to: user.email,
//       subject: `Booking Cancelled - ${booking.bookingId}`,
//       html: emailHtml,
//     });
    
//     console.log(`Cancellation email sent to ${user.email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending cancellation email:', error);
//     return false;
//   }
// };

// /**
//  * Send welcome email to new users
//  */
// export const sendWelcomeEmail = async (user) => {
//   try {
//     const emailHtml = welcomeEmail(user);
    
//     await sendEmail({
//       to: user.email,
//       subject: 'Welcome to Electric Cab Jaipur!',
//       html: emailHtml,
//     });
    
//     console.log(`Welcome email sent to ${user.email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending welcome email:', error);
//     return false;
//   }
// };

// /**
//  * Send password reset email
//  */
// export const sendPasswordResetEmail = async (user, resetUrl) => {
//   try {
//     const emailHtml = passwordResetEmail(user, resetUrl);
    
//     await sendEmail({
//       to: user.email,
//       subject: 'Password Reset Request - Electric Cab Jaipur',
//       html: emailHtml,
//     });
    
//     console.log(`Password reset email sent to ${user.email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending password reset email:', error);
//     return false;
//   }
// };

// /**
//  * Send invoice email
//  */
// export const sendInvoiceEmail = async (booking, user, invoiceUrl) => {
//   try {
//     const emailHtml = invoiceEmail(booking, user, invoiceUrl);
    
//     await sendEmail({
//       to: user.email,
//       subject: `Invoice - ${booking.bookingId}`,
//       html: emailHtml,
//     });
    
//     console.log(`Invoice email sent to ${user.email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending invoice email:', error);
//     return false;
//   }
// };

// /**
//  * Send OTP email
//  */
// export const sendOTPEmail = async (email, otp, userName) => {
//   try {
//     const emailHtml = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .otp { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h2>Hello ${userName},</h2>
//           <p>Your OTP for Electric Cab Jaipur is:</p>
//           <div class="otp">${otp}</div>
//           <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
//           <p>If you didn't request this OTP, please ignore this email.</p>
//         </div>
//       </body>
//       </html>
//     `;
    
//     await sendEmail({
//       to: email,
//       subject: 'Your OTP - Electric Cab Jaipur',
//       html: emailHtml,
//     });
    
//     console.log(`OTP email sent to ${email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending OTP email:', error);
//     return false;
//   }
// };

// export default {
//   sendBookingConfirmationEmail,
//   sendDriverAssignmentEmail,
//   sendCancellationEmail,
//   sendWelcomeEmail,
//   sendPasswordResetEmail,
//   sendInvoiceEmail,
//   sendOTPEmail,
// };