import express from 'express';
import Pricing from '../models/Pricing.js';

const router = express.Router();

const defaultPricingByCabType = {
  mini: {
    cabType: 'mini',
    displayName: 'Mini Car',
    baseFare: 50,
    perKmRate: 10,
    minimumFare: 100,
    gstPercentage: 5,
    isActive: true,
  },
  sedan: {
    cabType: 'sedan',
    displayName: 'Sedan',
    baseFare: 75,
    perKmRate: 14,
    minimumFare: 150,
    gstPercentage: 5,
    isActive: true,
  },
  suv: {
    cabType: 'suv',
    displayName: 'SUV',
    baseFare: 100,
    perKmRate: 18,
    minimumFare: 200,
    gstPercentage: 5,
    isActive: true,
  },
};

const normalizePricing = (priceDoc) => ({
  cabType: priceDoc.cabType,
  displayName: priceDoc.displayName,
  baseFare: priceDoc.baseFare,
  perKmRate: priceDoc.perKmRate,
  minimumFare: priceDoc.minimumFare,
  gstPercentage: priceDoc.gstPercentage,
  isActive: priceDoc.isActive,
  updatedAt: priceDoc.updatedAt,
});

router.get('/', async (req, res) => {
  try {
    const pricing = await Pricing.find({ isActive: true }).sort({ cabType: 1 });
    const normalized = pricing.map(normalizePricing);

    const responseData = normalized.length > 0
      ? normalized
      : Object.values(defaultPricingByCabType);

    res.json({
      success: true,
      data: responseData,
      source: normalized.length > 0 ? 'database' : 'default',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pricing data',
      error: error.message,
    });
  }
});

router.get('/:cabType', async (req, res) => {
  try {
    const cabType = (req.params.cabType || '').toLowerCase();
    const pricing = await Pricing.findOne({ cabType, isActive: true });

    if (pricing) {
      return res.json({
        success: true,
        data: normalizePricing(pricing),
        source: 'database',
      });
    }

    const fallback = defaultPricingByCabType[cabType];
    if (!fallback) {
      return res.status(404).json({
        success: false,
        message: 'Pricing not found for selected cab type',
      });
    }

    res.json({
      success: true,
      data: fallback,
      source: 'default',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cab pricing data',
      error: error.message,
    });
  }
});

export default router;