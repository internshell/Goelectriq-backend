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
    
    console.log('🔍 Verifying payment:', { paymentId, razorpay_payment_id });
    
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
      console.error('❌ Payment record not found:', paymentId);
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    console.log('✅ Payment found:', { paymentId, bookingId: payment.booking });
    
    // Fetch payment details from Razorpay
    const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);
    
    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = paymentDetails.status === 'captured' ? 'success' : 'failed';
    payment.paidAt = new Date();
    
    // Map Razorpay method to valid payment method enum
    const methodMap = {
      'upi': 'upi',
      'netbanking': 'razorpay',
      'card': 'razorpay',
      'wallet': 'wallet',
      'emandate': 'razorpay'
    };
    payment.paymentMethod = methodMap[paymentDetails.method] || 'razorpay';
    
    payment.paymentDetails = {
      method: paymentDetails.method,
      email: paymentDetails.email,
      contact: paymentDetails.contact,
      bank: paymentDetails.bank,
      wallet: paymentDetails.wallet,
      vpa: paymentDetails.vpa,
    };
    
    await payment.save();
    console.log('✅ Payment record saved:', { status: payment.status });
    
    // Update booking payment status with payment details
    if (payment.booking) {
      const booking = await Booking.findById(payment.booking);
      console.log('🔍 Found booking:', { bookingId: payment.booking, bookingExists: !!booking });
      
      if (booking) {
        // Check if this is a remaining payment (partial payment that completes the total)
        const totalFare = booking.pricing?.totalFare || 0;
        const previousPayments = await Payment.find({
          booking: booking._id,
          status: 'success',
          _id: { $ne: payment._id } // Exclude current payment
        });
        
        const previousPaidAmount = previousPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPaidNow = previousPaidAmount + payment.amount;
        const isRemainingPaymentComplete = totalPaidNow >= totalFare;
        
        console.log('💰 Payment Analysis:', {
          totalFare,
          previousPaidAmount,
          currentPayment: payment.amount,
          totalPaidNow,
          isRemainingPaymentComplete
        });

        booking.paymentStatus = payment.status === 'success' ? 'paid' : 'failed';
        
        // IMPORTANT: Status flow:
        // 1. Initial booking created = pending
        // 2. First payment (initial deposit) = confirmed
        // 3. Remaining payment completes total = completed
        // 4. Stay confirmed until remaining payment is done
        
        if (payment.status === 'success') {
          if (isRemainingPaymentComplete) {
            // All payments complete → Mark as COMPLETED
            booking.status = 'completed';
            console.log('✅ Booking marked as COMPLETED - Full payment received (₹' + totalPaidNow + '/' + totalFare + ')');
          } else {
            // Partial payment (initial or intermediate) → Keep/Mark as CONFIRMED
            // Only update to confirmed if not already completed
            if (booking.status !== 'completed') {
              booking.status = 'confirmed';
              console.log('⏳ Booking marked as CONFIRMED - Waiting for remaining payment (₹' + totalPaidNow + '/' + totalFare + ')');
            }
          }
        } else {
          // Payment failed
          booking.status = 'pending';
          console.log('❌ Booking status reset to PENDING - Payment failed');
        }
        
        // Map payment method to Booking enum (online, cash, wallet)
        const bookingMethodMap = {
          'upi': 'online',
          'card': 'online',
          'netbanking': 'online',
          'emandate': 'online',
          'cash': 'cash',
          'wallet': 'wallet'
        };
        booking.paymentMethod = bookingMethodMap[paymentDetails.method] || 'online';
        
        // Save payment details to booking
        booking.paymentDetails = {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date(),
          method: paymentDetails.method,
          amount: payment.amount,
          totalPaidAmount: totalPaidNow,
        };
        
        await booking.save();
        console.log('✅ Booking updated:', { 
          bookingId: booking._id, 
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalPaidAmount: totalPaidNow
        });
      } else {
        console.error('❌ Booking not found for payment:', payment.booking);
      }
    }
    
    res.status(200).json({
      success: payment.status === 'success',
      message: payment.status === 'success' ? 'Payment successful' : 'Payment failed',
      data: {
        paymentId: payment._id,
        bookingId: payment.booking,
        status: payment.status,
        paymentDetails: {
          method: paymentDetails.method,
          amount: payment.amount,
          email: paymentDetails.email,
          contact: paymentDetails.contact,
          paidAt: payment.paidAt
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Ride payment verification error:', error);
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
    
    console.log('🔍 Verifying tour payment:', { paymentId, razorpay_payment_id });
    
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
      console.error('❌ Tour payment record not found:', paymentId);
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    console.log('✅ Tour payment found:', { paymentId, tourBookingId: payment.tourBooking });
    
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
    console.log('✅ Tour payment record saved:', { status: payment.status });

    if (payment.tourBooking) {
      const booking = await TourBooking.findById(payment.tourBooking);
      console.log('🔍 Found tour booking:', { bookingId: payment.tourBooking, bookingExists: !!booking });
      
      if (booking) {
        booking.paymentStatus = payment.status === 'success' ? 'paid' : 'failed';
        booking.status = payment.status === 'success' ? 'confirmed' : 'pending';
        
        // Map payment method to TourBooking enum (online, cash, wallet)
        const tourMethodMap = {
          'upi': 'online',
          'card': 'online',
          'netbanking': 'online',
          'emandate': 'online',
          'cash': 'cash',
          'wallet': 'wallet'
        };
        booking.paymentMethod = tourMethodMap[paymentDetails.method] || 'online';
        
        // Save payment details to tour booking
        booking.paymentDetails = {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date(),
        };
        
        await booking.save();
        console.log('✅ Tour booking updated:', { 
          bookingId: booking._id, 
          paymentStatus: booking.paymentStatus,
          paymentDetails: booking.paymentDetails
        });
      } else {
        console.error('❌ Tour booking not found for payment:', payment.tourBooking);
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
    console.error('❌ Tour payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: req.user._id })
      .populate({
        path: 'booking',
        select: 'bookingId pickupLocation dropLocation cabType rideType pricing distance',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ user: req.user._id });

    console.log('📋 Payment History Fetched:', {
      userId: req.user._id,
      count: payments.length,
      hasBookingData: payments.map(p => ({ id: p._id, hasBooking: !!p.booking }))
    });

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
    console.error('❌ Error in getPaymentHistory:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};