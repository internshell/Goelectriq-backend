import express from 'express';
import { submitFeedback, getAllFeedback } from '../controllers/feedbackController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllFeedback);
router.post('/', optionalAuth, submitFeedback);

export default router;
