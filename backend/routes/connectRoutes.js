import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getConnectBalance,
  getConnectPackages,
  createConnectsOrder,
  verifyAndCreditConnects,
  getPurchaseHistory,
} from '../controllers/connectController.js';

const router = express.Router();

// Get user's connect balance
router.get('/balance', requireAuth, getConnectBalance);

// Get available connect packages
router.get('/packages', getConnectPackages);

// Create order for connects purchase
router.post('/create-order', requireAuth, createConnectsOrder);

// Verify payment and credit connects
router.post('/verify', requireAuth, verifyAndCreditConnects);

// Get purchase history
router.get('/history', requireAuth, getPurchaseHistory);

export default router;
