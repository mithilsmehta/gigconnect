import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { processPayout, getPayoutStatus } from '../controllers/payoutController.js';

const router = express.Router();

// Process payout
router.post('/process', requireAuth, processPayout);

// Get payout status
router.get('/:payoutId', requireAuth, getPayoutStatus);

export default router;
