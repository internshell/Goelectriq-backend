import mongoose from 'mongoose';

const chargingEnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    enquiryType: {
      type: String,
      enum: ['general', 'installation', 'maintenance', 'pricing', 'other'],
      default: 'general',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'resolved', 'cancelled'],
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChargingEnquiry', chargingEnquirySchema);
