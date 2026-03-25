// import { sendWhatsAppMessage } from '../config/whatsapp.js';
// import {
//   bookingConfirmationMessage,
//   driverAssignmentMessage,
//   rideStartedMessage,
//   rideCompletedMessage,
//   bookingCancelledMessage,
//   otpMessage,
//   driverReachingSoonMessage,
//   paymentSuccessMessage,
//   rideReminderMessage,
//   welcomeMessage,
// } from '../utils/whatsappTemplates.js';

// /**
//  * Send booking confirmation WhatsApp
//  */
// export const sendBookingConfirmationWhatsApp = async (booking, user) => {
//   try {
//     const message = bookingConfirmationMessage(booking, user);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Booking confirmation WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending booking confirmation WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send driver assignment WhatsApp
//  */
// export const sendDriverAssignmentWhatsApp = async (booking, driver, user) => {
//   try {
//     const message = driverAssignmentMessage(booking, driver, user);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Driver assignment WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending driver assignment WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send ride started WhatsApp
//  */
// export const sendRideStartedWhatsApp = async (booking, user) => {
//   try {
//     const message = rideStartedMessage(booking, user);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Ride started WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending ride started WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send ride completed WhatsApp
//  */
// export const sendRideCompletedWhatsApp = async (booking, user) => {
//   try {
//     const message = rideCompletedMessage(booking, user);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Ride completed WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending ride completed WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send booking cancelled WhatsApp
//  */
// export const sendCancellationWhatsApp = async (booking, user, refundAmount) => {
//   try {
//     const message = bookingCancelledMessage(booking, user, refundAmount);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Cancellation WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending cancellation WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send OTP WhatsApp
//  */
// export const sendOTPWhatsApp = async (phone, otp, userName) => {
//   try {
//     const message = otpMessage(otp, userName);
//     await sendWhatsAppMessage(phone, message);
    
//     console.log(`OTP WhatsApp sent to ${phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending OTP WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send driver reaching soon WhatsApp
//  */
// export const sendDriverReachingSoonWhatsApp = async (booking, driver, user, eta) => {
//   try {
//     const message = driverReachingSoonMessage(booking, driver, user, eta);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Driver reaching soon WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending driver reaching soon WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send payment success WhatsApp
//  */
// export const sendPaymentSuccessWhatsApp = async (booking, user, transactionId) => {
//   try {
//     const message = paymentSuccessMessage(booking, user, transactionId);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Payment success WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending payment success WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send ride reminder WhatsApp
//  */
// export const sendRideReminderWhatsApp = async (booking, user) => {
//   try {
//     const message = rideReminderMessage(booking, user);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Ride reminder WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending ride reminder WhatsApp:', error);
//     return false;
//   }
// };

// /**
//  * Send welcome WhatsApp
//  */
// export const sendWelcomeWhatsApp = async (user) => {
//   try {
//     const message = welcomeMessage(user);
//     await sendWhatsAppMessage(user.phone, message);
    
//     console.log(`Welcome WhatsApp sent to ${user.phone}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending welcome WhatsApp:', error);
//     return false;
//   }
// };

// export default {
//   sendBookingConfirmationWhatsApp,
//   sendDriverAssignmentWhatsApp,
//   sendRideStartedWhatsApp,
//   sendRideCompletedWhatsApp,
//   sendCancellationWhatsApp,
//   sendOTPWhatsApp,
//   sendDriverReachingSoonWhatsApp,
//   sendPaymentSuccessWhatsApp,
//   sendRideReminderWhatsApp,
//   sendWelcomeWhatsApp,
// };