import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createPaymentOrder,
  verifyAndFundContract,
  processRefund,
  getTransactionHistory,
  handleWebhook,
} from '../controllers/paymentController.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', requireAuth, createPaymentOrder);

// Verify payment and fund contract
router.post('/verify', requireAuth, verifyAndFundContract);

// Process refund
router.post('/refund', requireAuth, processRefund);

// Get transaction history
router.get('/transactions', requireAuth, getTransactionHistory);

// Webhook (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
