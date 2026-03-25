import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    transactionType: {
      type: String,
      enum: [
        'booking_payment',
        'refund',
        'driver_payout',
        'commission',
        'penalty',
        'bonus',
        'adjustment',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    description: String,
    metadata: {
      type: Map,
      of: String,
    },
    balanceBefore: Number,
    balanceAfter: Number,
    referenceId: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ driver: 1, createdAt: -1 });
transactionSchema.index({ booking: 1 });
transactionSchema.index({ transactionType: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;