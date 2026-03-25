import express from 'express';
import { protect } from '../middleware/auth.js';
import { isDriver } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(protect);
router.use(isDriver);

router.get('/assigned-rides', (req, res) => {
  res.json({ success: true, message: 'Get assigned rides' });
});

export default router;