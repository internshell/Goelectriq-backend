import express from 'express';
import Pricing from '../models/Pricing.js';

const router = express.Router();

const defaultPricingByCabType = {
  economy: {
    cabType: 'economy',
    displayName: 'Economy',
    baseFare: 50,
    perKmRate: 10,
    minimumFare: 100,
    gstPercentage: 5,
    isActive: true,
  },
  premium: {
    cabType: 'premium',
    displayName: 'Premium',
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
  maxPassengers: priceDoc.capacity?.passengers || 4,
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
 * Returns: { id, name, baseRate, maxPassengers, description, fixedCharge, parkingCharge }
 */
router.get('/app/rates', async (req, res) => {
  try {
    // Only fetch Premium and Economy for airport rides
    const pricing = await Pricing.find({ 
      isActive: true,
      cabType: { $in: ['premium', 'economy'] }
    }).sort({ cabType: 1 });

    let rates;
    if (pricing.length > 0) {
      rates = pricing.map(p => ({
        id: p.cabType,
        name: p.displayName,
        baseRate: p.perKmRate,
        maxPassengers: p.capacity?.passengers || 4,
        description: `₹${p.perKmRate}/km`,
        fixedCharge: p.fixedCharge || 0,
        parkingCharge: p.parkingCharge || 0,
      }));
    } else {
      // Use defaults
      rates = [
        { id: 'economy', name: 'Economy', baseRate: 10, maxPassengers: 4, description: 'Compact and economical', fixedCharge: 0, parkingCharge: 0 },
        { id: 'premium', name: 'Premium', baseRate: 18, maxPassengers: 6, description: 'Premium and luxurious', fixedCharge: 0, parkingCharge: 0 },
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
          capacity: {
            passengers: rate.maxPassengers || 4,
            luggage: 2,
          },
          isActive: true,
          updatedAt: new Date(),
        },
        { upsert: true, new: true, returnDocument: 'after' }
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
        maxPassengers: u.capacity?.passengers || 4,
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

/**
 * PATCH /admin/pricing/airport/:cabType
 * Update airport ride charges (fixed charge & parking charge) for a specific car type
 */
router.patch('/admin/pricing/airport/:cabType', async (req, res) => {
  try {
    const { cabType } = req.params;
    const { fixedCharge, parkingCharge } = req.body;

    // Validate input
    if (fixedCharge === undefined || parkingCharge === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Fixed charge and parking charge are required',
      });
    }

    if (fixedCharge < 0 || parkingCharge < 0) {
      return res.status(400).json({
        success: false,
        message: 'Charges cannot be negative',
      });
    }

    // Update in database
    const updated = await Pricing.findOneAndUpdate(
      { cabType: cabType.toLowerCase() },
      {
        fixedCharge: parseFloat(fixedCharge),
        parkingCharge: parseFloat(parkingCharge),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Pricing not found for this car type',
      });
    }

    res.json({
      success: true,
      message: 'Airport charges updated successfully',
      data: {
        id: updated.cabType,
        name: updated.displayName,
        fixedCharge: updated.fixedCharge,
        parkingCharge: updated.parkingCharge,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating airport charges',
      error: error.message,
    });
  }
});

export default router;