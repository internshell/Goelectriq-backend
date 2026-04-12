import ChargingEnquiry from '../models/ChargingEnquiry.js';

/**
 * @desc    Create a new charging enquiry
 * @route   POST /api/charging-enquiries
 * @access  Private (Admin)
 */
export const createChargingEnquiry = async (req, res) => {
  try {
    const { name, phone, email, city, enquiryType, message, status } = req.body;

    console.log('📝 Creating Charging Enquiry:');
    console.log('  Name:', name);
    console.log('  Phone:', phone);
    console.log('  Email:', email);
    console.log('  City:', city);
    console.log('  Type:', enquiryType);

    // Validation
    if (!name || !phone || !email || !city || !message) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, phone, email, city, and message are required',
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

    const enquiry = await ChargingEnquiry.create({
      name: name.trim(),
      phone,
      email: email.toLowerCase(),
      city: city.trim(),
      enquiryType: enquiryType || 'general',
      message,
      status: status || 'pending',
    });

    console.log('✅ Enquiry created successfully:', enquiry._id);

    res.status(201).json({
      success: true,
      message: 'Enquiry created successfully',
      data: enquiry,
    });
  } catch (error) {
    console.error('❌ Error creating enquiry:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create enquiry',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all charging enquiries with pagination and filtering
 * @route   GET /api/charging-enquiries?page=X&limit=10&status=X
 * @access  Private (Admin)
 */
export const getAllChargingEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    console.log(`📊 Fetching enquiries - Page: ${page}, Limit: ${limit}, Status: ${status}`);

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const enquiries = await ChargingEnquiry.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const totalEnquiries = await ChargingEnquiry.countDocuments(filter);
    const totalPages = Math.ceil(totalEnquiries / limit);

    console.log(`✅ Fetched ${enquiries.length} enquiries, Total: ${totalEnquiries}`);

    res.status(200).json({
      success: true,
      data: enquiries,
      enquiries, // For frontend compatibility
      page: parseInt(page),
      limit: parseInt(limit),
      totalEnquiries,
      totalPages,
    });
  } catch (error) {
    console.error('❌ Error fetching enquiries:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enquiries',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single charging enquiry
 * @route   GET /api/charging-enquiries/:id
 * @access  Private (Admin)
 */
export const getChargingEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📌 Fetching enquiry:', id);

    const enquiry = await ChargingEnquiry.findById(id);

    if (!enquiry) {
      console.log('❌ Enquiry not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    console.log('✅ Enquiry fetched successfully');

    res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    console.error('❌ Error fetching enquiry:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enquiry',
      error: error.message,
    });
  }
};

/**
 * @desc    Update charging enquiry
 * @route   PUT /api/charging-enquiries/:id
 * @access  Private (Admin)
 */
export const updateChargingEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, city, enquiryType, message, status } = req.body;

    console.log('✏️ Updating enquiry:', id);

    let enquiry = await ChargingEnquiry.findById(id);

    if (!enquiry) {
      console.log('❌ Enquiry not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    // Update fields if provided
    if (name) enquiry.name = name.trim();
    if (phone) enquiry.phone = phone;
    if (email) enquiry.email = email.toLowerCase();
    if (city) enquiry.city = city.trim();
    if (enquiryType) enquiry.enquiryType = enquiryType;
    if (message) enquiry.message = message;
    if (status) enquiry.status = status;

    enquiry = await enquiry.save();

    console.log('✅ Enquiry updated successfully:', id);

    res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully',
      data: enquiry,
    });
  } catch (error) {
    console.error('❌ Error updating enquiry:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update enquiry',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete charging enquiry
 * @route   DELETE /api/charging-enquiries/:id
 * @access  Private (Admin)
 */
export const deleteChargingEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting enquiry:', id);

    const enquiry = await ChargingEnquiry.findByIdAndDelete(id);

    if (!enquiry) {
      console.log('❌ Enquiry not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    console.log('✅ Enquiry deleted successfully:', id);

    res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully',
      data: enquiry,
    });
  } catch (error) {
    console.error('❌ Error deleting enquiry:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete enquiry',
      error: error.message,
    });
  }
};
