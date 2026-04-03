import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a mobile number'],
      unique: true,
      trim: true,
      sparse: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
      required: function() {
        // Password required only if not using social login
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['user', 'driver', 'admin'],
      default: 'user',
    },
    profileImage: {
      type: String,
      default: '',
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    savedAddresses: [
      {
        _id: mongoose.Schema.Types.Mixed,
        label: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        type: {
          type: String,
          enum: ['home', 'work', 'other'],
          default: 'other',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: Date,
      },
    ],
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: true,
      },
      bookingUpdates: {
        type: Boolean,
        default: true,
      },
      promotionalEmails: {
        type: Boolean,
        default: false,
      },
      reviewRequests: {
        type: Boolean,
        default: true,
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    emailVerificationExpire: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Encrypt password before saving (skip for Google-only users)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method (Google users may not have password)
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual populate bookings
userSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'user',
  justOne: false,
});

const User = mongoose.model('User', userSchema);

export default User;
