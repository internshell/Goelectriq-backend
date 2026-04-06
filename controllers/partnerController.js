import CabPartner from '../models/CabPartner.js';
import ChargingStation from '../models/ChargingStation.js';
import Driver from '../models/Driver.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads/documents');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * @desc    Register as a Driver Partner
 * @route   POST /api/partners/driver/register
 * @access  Public
 */
export const registerDriverPartner = async (req, res) => {
  try {
    const { name, email, phone, experience } = req.body;

    // Validation
    if (!name || !email || !phone || !experience) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and experience are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    // Check if driver already exists by phone
    const existingDriver = await Driver.findOne({ phone });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: 'A driver with this phone number already exists',
      });
    }

    // Check if email already exists
    const existingEmail = await Driver.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'A driver with this email already exists',
      });
    }

    // Handle document upload
    let licenseDocPath = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const filename = `license-${Date.now()}${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filepath, req.file.buffer);
      licenseDocPath = `/uploads/documents/${filename}`;
    }

    // Create basic driver registration (waiting for approval)
    const driverRegistration = {
      name,
      email,
      phone,
      licenseNumber: `TEMP-${Date.now()}`, // Temporary, will be updated
      licenseExpiry: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // Default 10 years
      vehicleDetails: {
        vehicleNumber: 'PENDING',
        vehicleModel: 'PENDING',
        vehicleType: 'economy',
      },
      documents: {
        licensePhoto: licenseDocPath,
      },
      status: 'pending', // Waiting for admin verification
      password: 'temporary_password_' + Date.now(), // Will be set after verification
    };

    const newDriver = await Driver.create(driverRegistration);

    // Send email/SMS notification to admin
    // TODO: Implement notification service

    res.status(201).json({
      success: true,
      message: 'Driver registration submitted successfully. We will verify your details and contact you soon.',
      data: {
        driverId: newDriver._id,
        phone: newDriver.phone,
        email: newDriver.email,
        status: newDriver.status,
      },
    });
  } catch (error) {
    console.error('Error registering driver partner:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering driver partner',
      error: error.message,
    });
  }
};

/**
 * @desc    Register as a Cab Partner
 * @route   POST /api/partners/cab/register
 * @access  Public
 */
export const registerCabPartner = async (req, res) => {
  try {
    const { ownerName, phone, evType, vehicleModel } = req.body;

    // Validation
    if (!ownerName || !phone || !evType || !vehicleModel) {
      return res.status(400).json({
        success: false,
        message: 'Owner name, phone, EV type, and vehicle model are required',
      });
    }

    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    // Check if cab partner already exists
    const existingPartner = await CabPartner.findOne({ phone });
    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message: 'A cab partner with this phone number already exists',
      });
    }

    // Handle file uploads
    let rcDocPath = null;
    let insuranceDocPath = null;

    if (req.files) {
      if (req.files.rcDocument) {
        const ext = path.extname(req.files.rcDocument[0].originalname);
        const filename = `rc-${Date.now()}${ext}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, req.files.rcDocument[0].buffer);
        rcDocPath = `/uploads/documents/${filename}`;
      }

      if (req.files.insuranceDocument) {
        const ext = path.extname(req.files.insuranceDocument[0].originalname);
        const filename = `insurance-${Date.now()}${ext}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, req.files.insuranceDocument[0].buffer);
        insuranceDocPath = `/uploads/documents/${filename}`;
      }
    }

    const cabPartnerData = {
      ownerName,
      phone,
      vehicleDetails: {
        evType,
        model: vehicleModel,
      },
      documents: {
        rcDocument: rcDocPath,
        insuranceDocument: insuranceDocPath,
      },
      status: 'pending',
    };

    const newCabPartner = await CabPartner.create(cabPartnerData);

    res.status(201).json({
      success: true,
      message: 'Cab registration submitted successfully. We will verify your vehicle and contact you soon.',
      data: {
        partnerId: newCabPartner._id,
        phone: newCabPartner.phone,
        status: newCabPartner.status,
      },
    });
  } catch (error) {
    console.error('Error registering cab partner:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering cab partner',
      error: error.message,
    });
  }
};

/**
 * @desc    Register as a Charging Station Partner
 * @route   POST /api/partners/charging-station/register
 * @access  Public
 */
export const registerChargingStation = async (req, res) => {
  try {
    const {
      stationName,
      ownerName,
      phone,
      location,
      chargePoints,
      pricePerUnit,
    } = req.body;

    console.log('📝 Charging Station Registration Request:');
    console.log('  Station:', stationName);
    console.log('  Owner:', ownerName);
    console.log('  Phone:', phone);
    console.log('  Location:', location);
    console.log('  Charge Points:', chargePoints);
    console.log('  Price/Unit:', pricePerUnit);
    console.log('  File:', req.file ? req.file.originalname : 'No file');

    // Validation
    if (!stationName || !ownerName || !phone || !location || !chargePoints || !pricePerUnit) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
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

    // Validate chargePoints
    if (isNaN(chargePoints) || chargePoints <= 0) {
      console.log('❌ Validation failed: Invalid chargePoints:', chargePoints);
      return res.status(400).json({
        success: false,
        message: 'Number of charging points must be greater than 0',
      });
    }

    // Validate price
    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      console.log('❌ Validation failed: Invalid pricePerUnit:', pricePerUnit);
      return res.status(400).json({
        success: false,
        message: 'Price per unit must be greater than 0',
      });
    }

    // Check if station already exists
    const existingStation = await ChargingStation.findOne({ phone });
    if (existingStation) {
      console.log('❌ Validation failed: Phone already exists:', phone);
      return res.status(400).json({
        success: false,
        message: 'A charging station with this phone number already exists',
      });
    }

    // Handle file upload
    let businessDocPath = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const filename = `business-doc-${Date.now()}${ext}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      businessDocPath = `/uploads/documents/${filename}`;
    }

    const stationData = {
      stationName,
      ownerName,
      phone,
      location: {
        address: location,
        city: location.split(',')[0].trim() || location, // Extract first part as city, or use full location
      },
      chargingDetails: {
        numberOfPoints: parseInt(chargePoints),
        pricePerUnit: parseFloat(pricePerUnit),
      },
      documents: {
        businessDocument: businessDocPath,
      },
      status: process.env.NODE_ENV === 'development' ? 'approved' : 'pending',
    };

    const newStation = await ChargingStation.create(stationData);

    res.status(201).json({
      success: true,
      message: 'Charging station registration submitted successfully. We will verify your details and contact you soon.',
      data: {
        stationId: newStation._id,
        phone: newStation.phone,
        status: newStation.status,
      },
    });
  } catch (error) {
    console.error('Error registering charging station:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering charging station',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all cab partners (Admin)
 * @route   GET /api/partners/cab
 * @access  Private (Admin only)
 */
export const getAllCabPartners = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    const cabPartners = await CabPartner.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await CabPartner.countDocuments(query);

    res.status(200).json({
      success: true,
      data: cabPartners,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cab partners',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all charging stations (Admin)
 * @route   GET /api/partners/charging-stations
 * @access  Private (Admin only)
 */
export const getAllChargingStations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    const stations = await ChargingStation.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await ChargingStation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: stations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching charging stations',
      error: error.message,
    });
  }
};

/**
 * @desc    Get approved charging stations (Public)
 * @route   GET /api/partners/charging-stations
 * @access  Public
 */
export const getApprovedChargingStations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { status: 'approved' };

    const stations = await ChargingStation.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await ChargingStation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: stations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching charging stations',
      error: error.message,
    });
  }
};

/**
 * @desc    Approve cab partner registration
 * @route   PUT /api/partners/cab/:id/approve
 * @access  Private (Admin only)
 */
export const approveCabPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const cabPartner = await CabPartner.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        'verificationDetails.verifiedBy': req.user._id,
        'verificationDetails.verificationDate': new Date(),
      },
      { new: true }
    );

    if (!cabPartner) {
      return res.status(404).json({
        success: false,
        message: 'Cab partner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cab partner approved successfully',
      data: cabPartner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving cab partner',
      error: error.message,
    });
  }
};

/**
 * @desc    Reject cab partner registration
 * @route   PUT /api/partners/cab/:id/reject
 * @access  Private (Admin only)
 */
export const rejectCabPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const cabPartner = await CabPartner.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        reasonForRejection: reason,
        'verificationDetails.verifiedBy': req.user._id,
        'verificationDetails.verificationDate': new Date(),
      },
      { new: true }
    );

    if (!cabPartner) {
      return res.status(404).json({
        success: false,
        message: 'Cab partner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cab partner rejected',
      data: cabPartner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting cab partner',
      error: error.message,
    });
  }
};

/**
 * @desc    Approve charging station registration
 * @route   PUT /api/partners/charging-stations/:id/approve
 * @access  Private (Admin only)
 */
export const approveChargingStation = async (req, res) => {
  try {
    const { id } = req.params;

    const station = await ChargingStation.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        'verificationDetails.verifiedBy': req.user._id,
        'verificationDetails.verificationDate': new Date(),
      },
      { new: true }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Charging station approved successfully',
      data: station,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving charging station',
      error: error.message,
    });
  }
};

/**
 * @desc    Reject charging station registration
 * @route   PUT /api/partners/charging-stations/:id/reject
 * @access  Private (Admin only)
 */
export const rejectChargingStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const station = await ChargingStation.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        reasonForRejection: reason,
        'verificationDetails.verifiedBy': req.user._id,
        'verificationDetails.verificationDate': new Date(),
      },
      { new: true }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Charging station not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Charging station rejected',
      data: station,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting charging station',
      error: error.message,
    });
  }
};
