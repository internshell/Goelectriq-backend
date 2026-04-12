import ChargingStation from '../models/ChargingStation.js';

/**
 * @desc    Register a new charging station partner
 * @route   POST /api/charging-stations
 * @access  Private (Admin)
 */
export const createChargingStation = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      numberOfChargers,
      stationType,
      operatingHours,
      parkingSpaces,
    } = req.body;

    console.log('📝 Registering Charging Station Partner:');
    console.log('  Partner Name:', name);
    console.log('  Phone:', phone);
    console.log('  Email:', email);
    console.log('  City:', city);

    // Validation
    if (!name || !phone || !email || !address || !city || !numberOfChargers) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, phone, email, address, city, and number of chargers are required',
      });
    }

    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      console.log('❌ Validation failed: Invalid phone format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email',
      });
    }

    // Check if email already exists
    const existingStation = await ChargingStation.findOne({ email: email.toLowerCase() });
    if (existingStation) {
      console.log('❌ Email already registered:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const station = await ChargingStation.create({
      stationName: name.trim(),
      ownerName: name.trim(), // Same as partner name for simplicity
      email: email.toLowerCase(),
      phone,
      location: {
        address: address.trim(),
        city: city.trim(),
        state: state ? state.trim() : '',
        pincode: zipCode,
      },
      chargingDetails: {
        numberOfPoints: parseInt(numberOfChargers),
        connectorTypes: stationType === 'Both' ? ['Type2', 'Bharat-DC'] : [stationType === 'AC' ? 'Type2' : 'Bharat-DC'],
        pricePerUnit: 0, // Will be updated later
        operationalHours: {
          is24Hours: operatingHours === '24/7',
          openTime: operatingHours !== '24/7' ? operatingHours.split('-')[0] : '00:00',
          closeTime: operatingHours !== '24/7' ? operatingHours.split('-')[1] : '23:59',
        },
      },
      documents: {
        businessDocument: 'pending',
      },
      status: 'pending',
    });

    // Store additional fields in a custom field
    station.parkingSpaces = parkingSpaces;
    station.stationType = stationType;
    await station.save();

    console.log('✅ Station registered successfully:', station._id);

    res.status(201).json({
      success: true,
      message: 'Charging station registered successfully. Pending admin approval.',
      data: {
        _id: station._id,
        name: station.stationName,
        phone: station.phone,
        email: station.email,
        city: station.location.city,
        numberOfChargers: station.chargingDetails.numberOfPoints,
        status: station.status,
      },
    });
  } catch (error) {
    console.error('❌ Error registering station:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to register charging station',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all charging stations with pagination
 * @route   GET /api/charging-stations?page=X&limit=10
 * @access  Private (Admin)
 */
export const getAllChargingStations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log(`📊 Fetching stations - Page: ${page}, Limit: ${limit}`);

    const stations = await ChargingStation.find()
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const totalStations = await ChargingStation.countDocuments();
    const totalPages = Math.ceil(totalStations / limit);

    // Format response to match frontend expectations
    const formattedStations = stations.map(s => ({
      _id: s._id,
      name: s.stationName,
      phone: s.phone,
      email: s.email,
      address: s.location.address,
      city: s.location.city,
      state: s.location.state,
      zipCode: s.location.pincode,
      numberOfChargers: s.chargingDetails.numberOfPoints,
      stationType: s.stationType || 'AC',
      operatingHours: s.chargingDetails.operationalHours?.is24Hours ? '24/7' : 
        `${s.chargingDetails.operationalHours?.openTime || '9AM'}-${s.chargingDetails.operationalHours?.closeTime || '6PM'}`,
      parkingSpaces: s.parkingSpaces || 0,
      status: s.status,
      createdAt: s.createdAt,
    }));

    console.log(`✅ Fetched ${formattedStations.length} stations, Total: ${totalStations}`);

    res.status(200).json({
      success: true,
      data: formattedStations,
      stations: formattedStations, // For frontend compatibility
      page: parseInt(page),
      limit: parseInt(limit),
      totalStations,
      totalPages,
    });
  } catch (error) {
    console.error('❌ Error fetching stations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charging stations',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single charging station
 * @route   GET /api/charging-stations/:id
 * @access  Private (Admin)
 */
export const getChargingStation = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📌 Fetching station:', id);

    const station = await ChargingStation.findById(id);

    if (!station) {
      console.log('❌ Station not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    const formattedStation = {
      _id: station._id,
      name: station.stationName,
      phone: station.phone,
      email: station.email,
      address: station.location.address,
      city: station.location.city,
      state: station.location.state,
      zipCode: station.location.pincode,
      numberOfChargers: station.chargingDetails.numberOfPoints,
      stationType: station.stationType || 'AC',
      operatingHours: station.chargingDetails.operationalHours?.is24Hours ? '24/7' :
        `${station.chargingDetails.operationalHours?.openTime || '9AM'}-${station.chargingDetails.operationalHours?.closeTime || '6PM'}`,
      parkingSpaces: station.parkingSpaces || 0,
      status: station.status,
      createdAt: station.createdAt,
    };

    console.log('✅ Station fetched successfully');

    res.status(200).json({
      success: true,
      data: formattedStation,
    });
  } catch (error) {
    console.error('❌ Error fetching station:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charging station',
      error: error.message,
    });
  }
};

/**
 * @desc    Update charging station
 * @route   PUT /api/charging-stations/:id
 * @access  Private (Admin)
 */
export const updateChargingStation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      numberOfChargers,
      stationType,
      operatingHours,
      parkingSpaces,
    } = req.body;

    console.log('✏️ Updating station:', id);

    let station = await ChargingStation.findById(id);

    if (!station) {
      console.log('❌ Station not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    // Update fields
    if (name) station.stationName = name.trim();
    if (phone) station.phone = phone;
    if (email) station.email = email.toLowerCase();
    if (address) station.location.address = address.trim();
    if (city) station.location.city = city.trim();
    if (state) station.location.state = state.trim();
    if (zipCode) station.location.pincode = zipCode;
    if (numberOfChargers) station.chargingDetails.numberOfPoints = parseInt(numberOfChargers);
    if (stationType) station.stationType = stationType;
    if (operatingHours) {
      station.chargingDetails.operationalHours.is24Hours = operatingHours === '24/7';
      if (operatingHours !== '24/7') {
        const [open, close] = operatingHours.split('-');
        station.chargingDetails.operationalHours.openTime = open.trim();
        station.chargingDetails.operationalHours.closeTime = close.trim();
      }
    }
    if (parkingSpaces !== undefined) station.parkingSpaces = parkingSpaces;

    station = await station.save();

    console.log('✅ Station updated successfully:', id);

    res.status(200).json({
      success: true,
      message: 'Charging station updated successfully',
      data: {
        _id: station._id,
        name: station.stationName,
        phone: station.phone,
        email: station.email,
        numberOfChargers: station.chargingDetails.numberOfPoints,
        status: station.status,
      },
    });
  } catch (error) {
    console.error('❌ Error updating station:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update charging station',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete charging station
 * @route   DELETE /api/charging-stations/:id
 * @access  Private (Admin)
 */
export const deleteChargingStation = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting station:', id);

    const station = await ChargingStation.findByIdAndDelete(id);

    if (!station) {
      console.log('❌ Station not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    console.log('✅ Station deleted successfully:', id);

    res.status(200).json({
      success: true,
      message: 'Charging station deleted successfully',
      data: station,
    });
  } catch (error) {
    console.error('❌ Error deleting station:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete charging station',
      error: error.message,
    });
  }
};
