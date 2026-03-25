import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    tourBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourBooking',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cash', 'wallet', 'upi'],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['booking', 'partner_registration', 'subscription', 'deposit', 'ride_booking', 'tour_booking'],
      default: 'booking',
    },
    partnerType: {
      type: String,
      enum: ['driver', 'car-owner', 'ev-charger'],
    },
    driverData: {
      type: mongoose.Schema.Types.Mixed, // Temporarily store driver registration data
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentDetails: {
      method: String,
      email: String,
      contact: String,
      bank: String,
      wallet: String,
      vpa: String,
      cardId: String,
      cardNetwork: String,
      cardType: String,
    },
    refund: {
      refundId: String,
      amount: Number,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'processed', 'failed'],
      },
      processedAt: Date,
    },
    paidAt: Date,
    failureReason: String,
    attempts: {
      type: Number,
      default: 1,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Generate transaction ID before saving (Mongoose 9: no next() callback)
paymentSchema.pre('save', async function () {
  if (!this.transactionId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.transactionId = `TXN${year}${month}${day}${random}`;
  }
});

// Index for faster queries
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;