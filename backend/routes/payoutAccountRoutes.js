import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  addPayoutAccount,
  getPayoutAccounts,
  updatePayoutAccount,
  deletePayoutAccount,
  verifyBankAccount,
} from '../controllers/payoutAccountController.js';

const router = express.Router();

// Add payout account
router.post('/', requireAuth, addPayoutAccount);

// Get payout accounts
router.get('/', requireAuth, getPayoutAccounts);

// Update payout account
router.put('/:accountId', requireAuth, updatePayoutAccount);

// Delete payout account
router.delete('/:accountId', requireAuth, deletePayoutAccount);

// Verify bank account
router.post('/:accountId/verify', requireAuth, verifyBankAccount);

export default router;
