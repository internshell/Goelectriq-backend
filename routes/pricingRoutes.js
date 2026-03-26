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

/**
 * GET /rates
 * Get all rates formatted for frontend app (mobile/web client)
 * Returns: { id, name, baseRate, maxPassengers, description }
 */
router.get('/app/rates', async (req, res) => {
  try {
    const pricing = await Pricing.find({ isActive: true }).sort({ cabType: 1 });

    let rates;
    if (pricing.length > 0) {
      rates = pricing.map(p => ({
        id: p.cabType,
        name: p.displayName,
        baseRate: p.perKmRate,
        maxPassengers: p.maxPassengers || 4,
        description: `₹${p.perKmRate}/km`,
      }));
    } else {
      // Use defaults
      rates = [
        { id: 'mini', name: 'Mini Car', baseRate: 10, maxPassengers: 4, description: 'Compact and economical' },
        { id: 'sedan', name: 'Sedan', baseRate: 14, maxPassengers: 4, description: 'Comfortable and spacious' },
        { id: 'suv', name: 'SUV', baseRate: 18, maxPassengers: 6, description: 'Premium and luxurious' },
      ];
    }

    res.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rates',
      error: error.message,
    });
  }
});

/**
 * POST /rates
 * Update all rates in bulk (for admin)
 */
router.post('/app/rates', async (req, res) => {
  try {
    const { rates } = req.body;

    if (!rates || !Array.isArray(rates)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rates format',
      });
    }

    // Update each rate in database
    const updated = [];
    for (const rate of rates) {
      const result = await Pricing.findOneAndUpdate(
        { cabType: rate.id },
        {
          cabType: rate.id,
          displayName: rate.name,
          perKmRate: rate.baseRate,
          maxPassengers: rate.maxPassengers || 4,
          isActive: true,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      updated.push(result);
    }

    res.json({
      success: true,
      message: 'Rates updated successfully',
      data: updated.map(u => ({
        id: u.cabType,
        name: u.displayName,
        baseRate: u.perKmRate,
        maxPassengers: u.maxPassengers,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating rates',
      error: error.message,
    });
  }
});

export default router;