import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit mobile number'],
    },
    feedback: {
      type: String,
      required: [true, 'Feedback is required'],
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
