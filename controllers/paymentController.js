import { createRazorpayOrder, verifyRazorpaySignature, fetchPaymentDetails } from '../config/razorpay.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import TourBooking from '../models/TourBooking.js';
import Driver from '../models/Driver.js';
import crypto from 'crypto';

export const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    const order = await createRazorpayOrder(
      booking.pricing.totalFare,
      bookingId
    );
    
    const payment = await Payment.create({
      booking: bookingId,
      user: req.user._id,
      amount: booking.pricing.totalFare,
      razorpayOrderId: order.id,
      paymentMethod: 'razorpay',
      status: 'pending',
    });
    
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create payment order for partner registration
export const createPartnerRegistrationPayment = async (req, res) => {
  try {
    const { partnerType, amount, driverData } = req.body;
    
    // Define registration fees based on partner type
    const registrationFees = {
      'driver': 2000,
      'car-owner': 5000,
      'ev-charger': 10000
    };
    
    const registrationAmount = amount || registrationFees[partnerType] || 2000;
    
    // Generate unique receipt ID
    const receiptId = `partner_reg_${Date.now()}`;
    
    const order = await createRazorpayOrder(registrationAmount, receiptId);
    
    // Create payment record
    const payment = await Payment.create({
      user: req.user?._id,
      amount: registrationAmount,
      razorpayOrderId: order.id,
      paymentMethod: 'razorpay',
      status: 'pending',
      paymentType: 'partner_registration',
      partnerType: partnerType,
      driverData: driverData // Store driver data temporarily
    });
    
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id
      },
    });
  } catch (error) {
    console.error('Partner registration payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Payment order creation failed'
    });
  }
};

// Verify partner registration payment
export const verifyPartnerRegistrationPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentId 
    } = req.body;
    
    // Verify signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    
    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    // Find payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    // Fetch payment details from Razorpay
    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);
    
    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = paymentDetails.status === 'captured' ? 'success' : 'failed';
    payment.paidAt = new Date();
    payment.paymentDetails = {
      method: paymentDetails.method,
      email: paymentDetails.email,
      contact: paymentDetails.contact,
      bank: paymentDetails.bank,
      wallet: paymentDetails.wallet,
      vpa: paymentDetails.vpa,
    };
    
    await payment.save();
    
    // If payment successful, create driver account
    if (payment.status === 'success' && payment.driverData) {
      try {
        // Hash password for driver
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(payment.driverData.password, 12);
        
        // Create driver account
        const driver = await Driver.create({
          ...payment.driverData,
          password: hashedPassword,
          isVerified: false,
          registrationPayment: payment._id,
          status: 'pending_verification'
        });
        
        // Clear sensitive data from payment record
        payment.driverData = undefined;
        await payment.save();
        
        res.status(200).json({
          success: true,
          message: 'Payment successful and partner registration initiated',
          data: {
            paymentId: payment._id,
            transactionId: payment.transactionId,
            driverId: driver._id,
            status: 'registration_pending'
          }
        });
        
      } catch (driverError) {
        console.error('Driver creation error:', driverError);
        res.status(200).json({
          success: true,
          message: 'Payment successful but driver registration failed. Please contact support.',
          data: {
            paymentId: payment._id,
            transactionId: payment.transactionId
          }
        });
      }
    } else {
      res.status(200).json({
        success: payment.status === 'success',
        message: payment.status === 'success' ? 'Payment successful' : 'Payment failed',
        data: {
          paymentId: payment._id,
          transactionId: payment.transactionId,
          status: payment.status
        }
      });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email phone')
      .populate('booking');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create payment order for ride booking
export const createRidePaymentOrder = async (req, res) => {
  try {
    const { bookingId, amount, rideType, pickupLocation, dropLocation } = req.body;
    
    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'bookingId and amount are required'
      });
    }
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Generate unique receipt ID
    const receiptId = `ride_${rideType}_${Date.now()}`;
    
    const order = await createRazorpayOrder(amount, receiptId);
    
    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      booking: bookingId,
      amount: amount,
      razorpayOrderId: order.id,
      paymentMethod: 'razorpay',
      status: 'pending',
      paymentType: 'ride_booking',
      rideType: rideType,
      rideDetails: {
        pickupLocation,
        dropLocation
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id
      },
    });
  } catch (error) {
    console.error('Ride payment order creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Payment order creation failed'
    });
  }
};

// Verify ride payment
export const verifyRidePayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentId 
    } = req.body;
    
    // Verify signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    
    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    // Find payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    // Fetch payment details from Razorpay
    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);
    
    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = paymentDetails.status === 'captured' ? 'success' : 'failed';
    payment.paidAt = new Date();
    payment.paymentDetails = {
      method: paymentDetails.method,
      email: paymentDetails.email,
      contact: paymentDetails.contact,
      bank: paymentDetails.bank,
      wallet: paymentDetails.wallet,
      vpa: paymentDetails.vpa,
    };
    
    await payment.save();
    
    // Update booking payment status
    if (payment.booking) {
      const booking = await Booking.findById(payment.booking);
      if (booking) {
        booking.paymentStatus = payment.status === 'success' ? 'paid' : 'failed';
        booking.status = payment.status === 'success' ? 'confirmed' : 'pending';
        await booking.save();
      }
    }
    
    res.status(200).json({
      success: payment.status === 'success',
      message: payment.status === 'success' ? 'Payment successful' : 'Payment failed',
      data: {
        paymentId: payment._id,
        bookingId: payment.booking,
        status: payment.status
      }
    });
    
  } catch (error) {
    console.error('Ride payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create payment order for tour
export const createTourPaymentOrder = async (req, res) => {
  try {
    const { tourBookingId, amount, paymentOption } = req.body;
    
    if (!tourBookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'tourBookingId and amount are required'
      });
    }
    
    const booking = await TourBooking.findById(tourBookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Tour Booking not found'
      });
    }
    
    const receiptId = `tour_${Date.now()}`;
    const order = await createRazorpayOrder(amount, receiptId);
    
    const payment = await Payment.create({
      user: req.user._id,
      tourBooking: tourBookingId,
      amount: amount,
      razorpayOrderId: order.id,
      paymentMethod: 'razorpay',
      status: 'pending',
      paymentType: 'tour_booking',
    });
    
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id
      },
    });
  } catch (error) {
    console.error('Tour payment order creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Payment order creation failed'
    });
  }
};

// Verify tour payment
export const verifyTourPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentId 
    } = req.body;
    
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    
    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);
    
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = paymentDetails.status === 'captured' ? 'success' : 'failed';
    payment.paidAt = new Date();
    payment.paymentDetails = {
      method: paymentDetails.method,
      email: paymentDetails.email,
      contact: paymentDetails.contact,
      bank: paymentDetails.bank,
      wallet: paymentDetails.wallet,
      vpa: paymentDetails.vpa,
    };
    
    await payment.save();
    
    if (payment.tourBooking) {
      const booking = await TourBooking.findById(payment.tourBooking);
      if (booking) {
        booking.paymentStatus = payment.status === 'success' ? 'paid' : 'failed';
        booking.status = payment.status === 'success' ? 'confirmed' : 'pending';
        await booking.save();
      }
    }
    
    res.status(200).json({
      success: payment.status === 'success',
      message: payment.status === 'success' ? 'Payment successful' : 'Payment failed',
      data: {
        paymentId: payment._id,
        tourBookingId: payment.tourBooking,
        status: payment.status
      }
    });
    
  } catch (error) {
    console.error('Tour payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('booking', 'bookingId pickupLocation dropLocation cabType pricing');

    const total = await Payment.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};