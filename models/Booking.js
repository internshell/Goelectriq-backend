import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    pickupLocation: {
      address: {
        type: String,
        required: [true, 'Please provide pickup address'],
      },
      coordinates: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
      },
      placeId: String,
    },
    dropLocation: {
      address: {
        type: String,
        required: [true, 'Please provide drop address'],
      },
      coordinates: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
      },
      placeId: String,
    },
    distance: {
      type: Number,
      required: true, // in kilometers
    },
    duration: {
      type: Number,
      default: 0, // in minutes
    },
    cabType: {
      type: String,
      enum: ['mini', 'sedan', 'suv', 'hatchback', 'luxury'],
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    pricing: {
      baseFare: {
        type: Number,
        required: true,
      },
      perKmRate: {
        type: Number,
        required: true,
      },
      distanceCharge: {
        type: Number,
        required: true,
      },
      nightCharge: {
        type: Number,
        default: 0,
      },
      waitingCharge: {
        type: Number,
        default: 0,
      },
      surgeCharge: {
        type: Number,
        default: 0,
      },
      gst: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      totalFare: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'driver_assigned',
        'driver_arrived',
        'ongoing',
        'completed',
        'cancelled',
        'no_show',
      ],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
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
    rideDetails: {
      startTime: Date,
      endTime: Date,
      actualDistance: Number,
      actualDuration: Number,
      startOTP: String,
      endOTP: String,
      route: [
        {
          latitude: Number,
          longitude: Number,
          timestamp: Date,
        },
      ],
    },
    passengerDetails: {
      name: String,
      phone: String,
      alternatePhone: String,
      specialRequests: String,
    },
    ratings: {
      userRating: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        ratedAt: Date,
      },
      driverRating: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        ratedAt: Date,
      },
    },
    cancellation: {
      cancelledBy: {
        type: String,
        enum: ['user', 'driver', 'admin'],
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
      refundStatus: {
        type: String,
        enum: ['pending', 'processed', 'failed'],
      },
    },
    notifications: {
      emailSent: {
        type: Boolean,
        default: false,
      },
      whatsappSent: {
        type: Boolean,
        default: false,
      },
      smsSent: {
        type: Boolean,
        default: false,
      },
    },
    invoice: {
      invoiceNumber: String,
      invoiceUrl: String,
      generatedAt: Date,
    },
    notes: String,
    adminNotes: String,
  },
  {
    timestamps: true,
  }
);

// Generate unique booking ID before saving (Mongoose 9: no next() callback)
bookingSchema.pre('save', async function () {
  if (!this.bookingId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingId = `ECB${year}${month}${random}`;
  }
});

// Index for faster queries (bookingId already has unique: true in schema)
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ driver: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;