import mongoose from 'mongoose';

const chargingStationBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChargingStation',
      required: [true, 'Charging station is required'],
    },
    stationName: String,
    stationPhone: String,
    userName: {
      type: String,
      required: [true, 'User name is required'],
    },
    userPhone: {
      type: String,
      required: [true, 'User phone is required'],
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'hatchback', 'pickup'],
      required: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
    },
    estimatedCost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    scheduledDateTime: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

const ChargingStationBooking = mongoose.model('ChargingStationBooking', chargingStationBookingSchema);

export default ChargingStationBooking;
