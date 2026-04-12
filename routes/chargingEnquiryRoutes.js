import express from 'express';
import {
  createChargingEnquiry,
  getAllChargingEnquiries,
  getChargingEnquiry,
  updateChargingEnquiry,
  deleteChargingEnquiry,
} from '../controllers/chargingEnquiryController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

/**
 * @route   POST /api/charging-enquiries
 * @desc    Create charging enquiry (Public - Customers)
 * @access  Public (No auth required)
 */
router.post('/', createChargingEnquiry);

/**
 * @route   GET /api/charging-enquiries
 * @desc    Get all charging enquiries with pagination and filtering
 * @access  Private (Admin)
 */
router.get('/', protect, isAdmin, getAllChargingEnquiries);

/**
 * @route   GET /api/charging-enquiries/:id
 * @desc    Get single charging enquiry
 * @access  Private (Admin)
 */
router.get('/:id', protect, isAdmin, getChargingEnquiry);

/**
 * @route   PUT /api/charging-enquiries/:id
 * @desc    Update charging enquiry
 * @access  Private (Admin)
 */
router.put('/:id', protect, isAdmin, updateChargingEnquiry);

/**
 * @route   DELETE /api/charging-enquiries/:id
 * @desc    Delete charging enquiry
 * @access  Private (Admin)
 */
router.delete('/:id', protect, isAdmin, deleteChargingEnquiry);

export default router;
