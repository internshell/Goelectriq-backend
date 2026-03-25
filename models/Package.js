import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide package title'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide package description'],
    },
    shortDescription: String,
    packageType: {
      type: String,
      enum: ['local', 'outstation', 'airport', 'hourly', 'tour'],
      required: true,
    },
    tourCategory: {
      type: String,
      enum: ['travel_tour', 'temple_tour'],
      default: null,
    },
    location: {
      type: String,
      default: '',
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    duration: {
      days: {
        type: Number,
        default: 1,
      },
      hours: {
        type: Number,
        default: 0,
      },
    },
    distance: {
      type: Number, // in kilometers
    },
    destinations: [
      {
        name: String,
        description: String,
        duration: String, // e.g., "2 hours"
      },
    ],
    itinerary: [
      {
        day: Number,
        title: String,
        description: String,
        activities: [String],
      },
    ],
    pricing: {
      sedan: Number,
      suv: Number,
      hatchback: Number,
      luxury: Number,
    },
    inclusions: {
      type: [String],
      default: [],
    },
    exclusions: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    coverImage: String,
    features: {
      type: [String],
      default: [],
    },
    pickupLocations: {
      type: [String],
      default: [],
    },
    dropLocations: {
      type: [String],
      default: [],
    },
    termsAndConditions: {
      type: [String],
      default: [],
    },
    cancellationPolicy: String,
    bookingCount: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    discount: {
      percentage: {
        type: Number,
        default: 0,
      },
      validFrom: Date,
      validTill: Date,
    },
    seasonalPricing: [
      {
        season: String,
        startDate: Date,
        endDate: Date,
        multiplier: Number,
      },
    ],
    availability: {
      daysOfWeek: {
        type: [Number], // 0-6 (Sunday-Saturday)
        default: [0, 1, 2, 3, 4, 5, 6],
      },
      startDate: Date,
      endDate: Date,
    },
    minAdvanceBooking: {
      type: Number,
      default: 24, // in hours
    },
    maxAdvanceBooking: {
      type: Number,
      default: 90, // in days
    },
    tags: {
      type: [String],
      default: [],
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from title before saving (Mongoose 9: no next() callback)
packageSchema.pre('save', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// Calculate average rating
packageSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }

  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating.average = parseFloat((sum / this.reviews.length).toFixed(1));
  this.rating.count = this.reviews.length;
};

const Package = mongoose.model('Package', packageSchema);

export default Package;