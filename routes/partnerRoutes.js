import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  registerDriverPartner,
  registerCabPartner,
  registerChargingStation,
  getAllCabPartners,
  getAllChargingStations,
  getApprovedChargingStations,
  approveCabPartner,
  rejectCabPartner,
  approveChargingStation,
  rejectChargingStation,
} from '../controllers/partnerController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// Configure multer for partner documents
const storage = multer.memoryStorage();
const fileFilter = (_req, file, cb) => {
  const allowed = /pdf|jpeg|jpg|png/i;
  const ext = path.extname(file.originalname).slice(1) || file.mimetype?.split('/')[1];
  if (allowed.test(ext) || allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, PNG files allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// =================== PUBLIC ROUTES ===================

/**
 * @route   POST /api/partners/driver/register
 * @desc    Register as a driver partner
 * @access  Public
 */
router.post('/driver/register', upload.single('licenseDocument'), registerDriverPartner);

/**
 * @route   POST /api/partners/cab/register
 * @desc    Register as a cab partner
 * @access  Public
 */
router.post('/cab/register', upload.fields([
  { name: 'rcDocument', maxCount: 1 },
  { name: 'insuranceDocument', maxCount: 1 }
]), registerCabPartner);

/**
 * @route   POST /api/partners/charging-station/register
 * @desc    Register a charging station
 * @access  Public
 */
router.post('/charging-station/register', upload.single('businessDocument'), registerChargingStation);

/**
 * @route   GET /api/partners/charging-stations
 * @desc    Get all approved charging stations (public)
 * @access  Public
 */
router.get('/charging-stations', getApprovedChargingStations);

// =================== ADMIN ROUTES ===================

// Protect all admin routes
router.use(protect);
router.use(isAdmin);

/**
 * @route   GET /api/partners/cab
 * @desc    Get all cab partners
 * @access  Private (Admin)
 */
router.get('/cab', getAllCabPartners);

/**
 * @route   GET /api/partners/admin/charging-stations
 * @desc    Get all charging stations (admin view)
 * @access  Private (Admin)
 */
router.get('/admin/charging-stations', getAllChargingStations);

/**
 * @route   PUT /api/partners/cab/:id/approve
 * @desc    Approve cab partner registration
 * @access  Private (Admin)
 */
router.put('/cab/:id/approve', approveCabPartner);

/**
 * @route   PUT /api/partners/cab/:id/reject
 * @desc    Reject cab partner registration
 * @access  Private (Admin)
 */
router.put('/cab/:id/reject', rejectCabPartner);

/**
 * @route   PUT /api/partners/charging-stations/:id/approve
 * @desc    Approve charging station registration
 * @access  Private (Admin)
 */
router.put('/charging-stations/:id/approve', approveChargingStation);

/**
 * @route   PUT /api/partners/charging-stations/:id/reject
 * @desc    Reject charging station registration
 * @access  Private (Admin)
 */
router.put('/charging-stations/:id/reject', rejectChargingStation);

export default router;
