import mongoose from 'mongoose';

const tourBookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    pickupLocation: {
      type: String,
      required: [true, 'Please provide pickup location'],
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    carType: {
      type: String,
      enum: ['mini', 'sedan', 'suv'],
      default: 'sedan',
    },
    passengers: {
      type: Number,
      default: 4,
    },
    paymentOption: {
      type: String,
      enum: ['confirmation', 'full'],
      default: 'confirmation',
    },
    pricing: {
      packagePrice: { type: Number, required: true },
      carUpgradeCharge: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
      paidAmount: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['online', 'cash', 'wallet'],
      default: 'online',
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
    },
    notes: String,
    adminNotes: String,
  },
  { timestamps: true }
);

tourBookingSchema.pre('save', async function () {
  if (!this.bookingId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingId = `TOUR${year}${month}${random}`;
  }
});

tourBookingSchema.index({ user: 1, createdAt: -1 });
tourBookingSchema.index({ status: 1 });
tourBookingSchema.index({ scheduledDate: 1 });

const TourBooking = mongoose.model('TourBooking', tourBookingSchema);
export default TourBooking;
