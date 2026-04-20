import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import { validateObjectId } from '../middleware/validation.js';
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
router.put('/:id', protect, isAdmin, validateObjectId('id'), updateOffer);
router.delete('/:id', protect, isAdmin, validateObjectId('id'), deleteOffer);
router.patch('/:id/toggle', protect, isAdmin, validateObjectId('id'), toggleOfferStatus);

export default router;
