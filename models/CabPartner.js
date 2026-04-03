import mongoose from 'mongoose';

const cabPartnerSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: [true, 'Please provide owner name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    vehicleDetails: {
      evType: {
        type: String,
        required: [true, 'Please provide EV type'],
        enum: [
          'tesla',
          'tata_nexon_ev',
          'hyundai_kona',
          'mg_zs_ev',
          'byd',
          'other',
        ],
      },
      model: {
        type: String,
        required: [true, 'Please provide vehicle model'],
        trim: true,
      },
      registrationNumber: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
      },
      manufacturingYear: Number,
      batteryCapacity: String,
      manufacturer: String,
    },
    documents: {
      rcDocument: {
        type: String,
        required: [true, 'RC document is required'],
      },
      rcDocumentUrl: String,
      insuranceDocument: {
        type: String,
        required: [true, 'Insurance document is required'],
      },
      insuranceDocumentUrl: String,
      insuranceExpiry: Date,
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
      default: 'pending',
    },
    verificationDetails: {
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      verificationDate: Date,
      comments: String,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRides: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reasonForRejection: String,
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
cabPartnerSchema.index({ phone: 1 });
cabPartnerSchema.index({ status: 1 });
cabPartnerSchema.index({ createdAt: -1 });

const CabPartner = mongoose.model('CabPartner', cabPartnerSchema);

export default CabPartner;
