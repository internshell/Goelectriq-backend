import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide offer title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide offer description'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    discountPercentage: {
      type: Number,
      required: [true, 'Please provide discount percentage'],
      min: [0, 'Discount cannot be less than 0'],
      max: [100, 'Discount cannot be more than 100'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: false,
    },
    applicableOn: {
      type: [String],
      enum: ['rides', 'tours', 'both'],
      default: ['both'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Offer', offerSchema);
