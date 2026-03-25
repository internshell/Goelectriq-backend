import Package from '../models/Package.js';

/**
 * Get packages for home page (public) - filter by tourCategory: travel_tour | temple_tour
 */
export const getPackages = async (req, res) => {
  try {
    const { tourCategory } = req.query;
    const query = { isActive: true };
    if (tourCategory && ['travel_tour', 'temple_tour'].includes(tourCategory)) {
      query.tourCategory = tourCategory;
    }
    const packages = await Package.find(query)
      .select('title description shortDescription coverImage images duration location basePrice pricing tourCategory discount')
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
