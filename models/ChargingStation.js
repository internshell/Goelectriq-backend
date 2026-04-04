import mongoose from 'mongoose';

const chargingStationSchema = new mongoose.Schema(
  {
    stationName: {
      type: String,
      required: [true, 'Please provide station name'],
      trim: true,
      maxlength: [100, 'Station name cannot be more than 100 characters'],
    },
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
    location: {
      address: {
        type: String,
        required: [true, 'Please provide address'],
      },
      city: String,
      state: String,
      pincode: String,
      latitude: Number,
      longitude: Number,
    },
    chargingDetails: {
      numberOfPoints: {
        type: Number,
        required: [true, 'Please provide number of charging points'],
        min: [1, 'Must have at least 1 charging point'],
      },
      connectorTypes: [
        {
          type: String,
          enum: ['CCS2', 'Type2', 'Bharat-DC', 'AC', 'Other'],
        },
      ],
      pricePerUnit: {
        type: Number,
        required: [true, 'Please provide price per kWh'],
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      operationalHours: {
        openTime: String,
        closeTime: String,
        is24Hours: {
          type: Boolean,
          default: false,
        },
      },
      averageChargeTime: String,
    },
    documents: {
      businessDocument: {
        type: String,
        required: [true, 'Business license/document is required'],
      },
      businessDocumentUrl: String,
      propertyOwnershipProof: String,
      propertyOwnershipProofUrl: String,
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
    totalCharges: {
      type: Number,
      default: 0,
    },
    monthlyRevenue: {
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

// Geospatial index for location-based search
// TODO: Enable this when coordinates are provided from frontend
// chargingStationSchema.index({ 'location.coordinates': '2dsphere' });

// Other indexes
chargingStationSchema.index({ phone: 1 });
chargingStationSchema.index({ status: 1 });
chargingStationSchema.index({ createdAt: -1 });
chargingStationSchema.index({ 'location.city': 1 });

const ChargingStation = mongoose.model('ChargingStation', chargingStationSchema);

export default ChargingStation;
