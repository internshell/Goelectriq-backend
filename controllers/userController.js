import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'address', 'profileImage', 'dateOfBirth', 'gender'];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowed.includes(key)) updates[key] = req.body[key];
    });
    console.log('📝 Profile update - Allowed fields:', allowed);
    console.log('📝 Profile update - Updates to apply:', updates);
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log('✅ Profile updated successfully:', { firstName: user.firstName, lastName: user.lastName });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get saved addresses
export const getSavedAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Return saved addresses if they exist in user doc
    const addresses = user.savedAddresses || [];
    res.status(200).json({ 
      success: true, 
      data: addresses 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new address
export const addAddress = async (req, res) => {
  try {
    const { label, address, city, state, zipCode, type } = req.body;

    if (!address || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Address details are required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Initialize savedAddresses array if it doesn't exist
    if (!user.savedAddresses) {
      user.savedAddresses = [];
    }

    const newAddress = {
      _id: new Date().getTime(),
      label: label || 'Other',
      address,
      city,
      state,
      zipCode,
      type: type || 'other',
      createdAt: new Date(),
    };

    user.savedAddresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: newAddress,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update address
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, address, city, state, zipCode, type } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const addressIndex = user.savedAddresses?.findIndex(
      addr => String(addr._id) === String(addressId)
    );

    if (addressIndex === -1 || addressIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Update address fields
    if (label) user.savedAddresses[addressIndex].label = label;
    if (address) user.savedAddresses[addressIndex].address = address;
    if (city) user.savedAddresses[addressIndex].city = city;
    if (state) user.savedAddresses[addressIndex].state = state;
    if (zipCode) user.savedAddresses[addressIndex].zipCode = zipCode;
    if (type) user.savedAddresses[addressIndex].type = type;
    user.savedAddresses[addressIndex].updatedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: user.savedAddresses[addressIndex],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete address
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.savedAddresses = user.savedAddresses?.filter(
      addr => String(addr._id) !== String(addressId)
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get settings
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const settings = {
      language: 'en',
      theme: 'light',
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        bookingUpdates: true,
        promotionalEmails: false,
        reviewRequests: true,
      },
      privacy: {
        showProfile: true,
        shareLocation: true,
      },
    };

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings
export const updateSettings = async (req, res) => {
  try {
    const { language, theme } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Store settings in userSettings field or return confirmation
    const updatedSettings = {
      language: language || 'en',
      theme: theme || 'light',
    };

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const notifications = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Store notification preferences
    if (!user.notificationSettings) {
      user.notificationSettings = {};
    }

    Object.assign(user.notificationSettings, notifications);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: user.notificationSettings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
