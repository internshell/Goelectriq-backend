import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import {
  getActiveOffer,
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
  toggleOfferStatus
} from '../controllers/offerController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/active', getActiveOffer);

// Admin routes (authentication + admin role required)
router.post('/', protect, isAdmin, createOffer);
router.get('/admin/all', protect, isAdmin, getAllOffers);
router.put('/:id', protect, isAdmin, updateOffer);
router.delete('/:id', protect, isAdmin, deleteOffer);
router.patch('/:id/toggle', protect, isAdmin, toggleOfferStatus);

export default router;
