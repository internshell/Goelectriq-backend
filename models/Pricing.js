import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema(
  {
    cabType: {
      type: String,
      enum: ['economy', 'premium'],
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: String,
    capacity: {
      passengers: {
        type: Number,
        required: true,
      },
      luggage: {
        type: Number,
        required: true,
      },
    },
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },
    perKmRate: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumFare: {
      type: Number,
      required: true,
      min: 0,
    },
    perMinuteWaiting: {
      type: Number,
      default: 0,
    },
    nightCharges: {
      enabled: {
        type: Boolean,
        default: true,
      },
      multiplier: {
        type: Number,
        default: 1.5,
      },
      startHour: {
        type: Number,
        default: 22, // 10 PM
      },
      endHour: {
        type: Number,
        default: 6, // 6 AM
      },
    },
    surgeCharges: {
      enabled: {
        type: Boolean,
        default: false,
      },
      multiplier: {
        type: Number,
        default: 1.3,
      },
      activeDays: {
        type: [String],
        default: [],
      },
      activeHours: {
        start: Number,
        end: Number,
      },
    },
    features: {
      type: [String],
      default: [],
    },
    vehicleImage: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    gstPercentage: {
      type: Number,
      default: 5,
    },
    // Airport ride pricing (fixed charges, not per km)
    fixedCharge: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Fixed charge for airport transfers (not distance-based)',
    },
    parkingCharge: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Parking fee for airport rides',
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate fare
pricingSchema.methods.calculateFare = function (distance, isNight = false, isSurge = false, waitingMinutes = 0) {
  let fare = this.baseFare;
  
  // Distance charge
  const distanceCharge = distance * this.perKmRate;
  fare += distanceCharge;
  
  // Waiting charge
  const waitingCharge = waitingMinutes * this.perMinuteWaiting;
  fare += waitingCharge;
  
  // Night charge
  let nightCharge = 0;
  if (isNight && this.nightCharges.enabled) {
    nightCharge = fare * (this.nightCharges.multiplier - 1);
    fare += nightCharge;
  }
  
  // Surge charge
  let surgeCharge = 0;
  if (isSurge && this.surgeCharges.enabled) {
    surgeCharge = fare * (this.surgeCharges.multiplier - 1);
    fare += surgeCharge;
  }
  
  // Ensure minimum fare
  if (fare < this.minimumFare) {
    fare = this.minimumFare; 
  }
  
  // GST
  const gst = fare * (this.gstPercentage / 100);
  const totalFare = fare + gst;
  
  return {
    baseFare: this.baseFare,
    perKmRate: this.perKmRate,
    distanceCharge: parseFloat(distanceCharge.toFixed(2)),
    waitingCharge: parseFloat(waitingCharge.toFixed(2)),
    nightCharge: parseFloat(nightCharge.toFixed(2)), 
    surgeCharge: parseFloat(surgeCharge.toFixed(2)),
    subtotal: parseFloat(fare.toFixed(2)),
    gst: parseFloat(gst.toFixed(2)),
    totalFare: parseFloat(totalFare.toFixed(2)),
  };
};

const Pricing = mongoose.model('Pricing', pricingSchema);

export default Pricing;