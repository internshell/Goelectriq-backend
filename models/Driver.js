import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide driver name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide driver email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide driver phone number'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Please provide license number'],
      unique: true,
      uppercase: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'Please provide license expiry date'],
    },
    vehicleDetails: {
      vehicleNumber: {
        type: String,
        required: true,
        uppercase: true,
      },
      vehicleModel: {
        type: String,
        required: true,
      },
      vehicleType: {
        type: String,
        enum: ['sedan', 'suv', 'hatchback', 'luxury'],
        required: true,
      },
      vehicleColor: String,
      registrationYear: Number,
      insuranceExpiry: Date,
    },
    documents: {
      licensePhoto: String,
      vehicleRC: String,
      insurance: String,
      aadharCard: String,
      panCard: String,
      profilePhoto: String,
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    totalRides: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked', 'pending'],
      default: 'pending',
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [75.7873, 26.9124], // Jaipur coordinates
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    earnings: {
      total: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      withdrawn: {
        type: Number,
        default: 0,
      },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    registrationPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });

// Encrypt password before saving (Mongoose 9: no next() callback)
driverSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
driverSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;