import Offer from '../models/Offer.js';
import Logger from '../utils/logger.js';

// Get active offer (public - no auth needed)
export const getActiveOffer = async (req, res) => {
  try {
    const activeOffer = await Offer.findOne({
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: new Date() } }
      ]
    }).select('-createdBy');

    if (!activeOffer) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active offer available'
      });
    }

    res.status(200).json({
      success: true,
      data: activeOffer
    });
  } catch (error) {
    Logger.error('Error fetching active offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offer'
    });
  }
};

// Admin: Create offer
export const createOffer = async (req, res) => {
  try {
    const { title, description, discountPercentage, discountAmount, endDate, applicableOn } = req.body;

    // Disable all other offers first
    await Offer.updateMany({}, { isActive: false });

    const offer = await Offer.create({
      title,
      description,
      discountPercentage,
      discountAmount: discountAmount || 0,
      endDate: endDate || null,
      applicableOn: applicableOn || ['both'],
      isActive: true,
      createdBy: req.user._id
    });

    Logger.info(`Offer created: ${offer._id}`);

    res.status(201).json({
      success: true,
      data: offer,
      message: 'Offer created successfully'
    });
  } catch (error) {
    Logger.error('Error creating offer:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating offer'
    });
  }
};

// Admin: Get all offers
export const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: offers,
      count: offers.length
    });
  } catch (error) {
    Logger.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offers'
    });
  }
};

// Admin: Update offer
export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, discountPercentage, discountAmount, endDate, applicableOn, isActive } = req.body;

    // If enabling this offer, disable all others
    if (isActive === true) {
      await Offer.updateMany(
        { _id: { $ne: id } },
        { isActive: false }
      );
    }

    const offer = await Offer.findByIdAndUpdate(
      id,
      {
        title,
        description,
        discountPercentage,
        discountAmount: discountAmount || 0,
        endDate: endDate || null,
        applicableOn: applicableOn || ['both'],
        isActive
      },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    Logger.info(`Offer updated: ${id}`);

    res.status(200).json({
      success: true,
      data: offer,
      message: 'Offer updated successfully'
    });
  } catch (error) {
    Logger.error('Error updating offer:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating offer'
    });
  }
};

// Admin: Delete offer
export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    Logger.info(`Offer deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    Logger.error('Error deleting offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting offer'
    });
  }
};

// Admin: Toggle offer status
export const toggleOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // If enabling, disable all others
    if (!offer.isActive) {
      await Offer.updateMany(
        { _id: { $ne: id } },
        { isActive: false }
      );
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    Logger.info(`Offer status toggled: ${id} - ${offer.isActive}`);

    res.status(200).json({
      success: true,
      data: offer,
      message: `Offer ${offer.isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    Logger.error('Error toggling offer status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling offer status'
    });
  }
};
