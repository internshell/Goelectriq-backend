import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Lazily initialized Razorpay instance.
 * env vars are not available at import time in ES modules
 * (dotenv.config runs after all imports are hoisted),
 * so we create the instance on the first API call.
 */
let _razorpayInstance = null;

function getRazorpay() {
  if (_razorpayInstance) return _razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }

  _razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  console.log('✅ Razorpay initialized successfully');
  return _razorpayInstance;
}

/**
 * Create Razorpay order
 */
export const createRazorpayOrder = async (amount, receiptId) => {
  try {
    const instance = getRazorpay();
    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${String(receiptId).slice(0, 36)}`,
      notes: { receiptId: String(receiptId) },
    };
    const order = await instance.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error(error.message || 'Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error('RAZORPAY_KEY_SECRET not set');
    const text = `${orderId}|${paymentId}`;
    const generated = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');
    return generated === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 */
export const fetchPaymentDetails = async (paymentId) => {
  try {
    const payment = await getRazorpay().payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw new Error(error.message || 'Failed to fetch payment details');
  }
};

/**
 * Process refund
 */
export const processRefund = async (paymentId, amount) => {
  try {
    const refund = await getRazorpay().payments.refund(paymentId, {
      amount: Math.round(amount * 100),
      speed: 'normal',
    });
    return refund;
  } catch (error) {
    console.error('Refund processing error:', error);
    throw new Error(error.message || 'Failed to process refund');
  }
};

export default getRazorpay;
