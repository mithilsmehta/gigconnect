import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getClientContracts,
  getFreelancerContracts,
  getContractById,
  updateContractProgress,
  cleanupOrphanedContracts,
} from '../controllers/contractController.js';

const router = express.Router();

// Get all contracts for logged-in client
router.get('/client', requireAuth, getClientContracts);

// Get all contracts for logged-in freelancer
router.get('/freelancer', requireAuth, getFreelancerContracts);

// Get specific contract by ID (with authorization check)
router.get('/:contractId', requireAuth, getContractById);

// Update contract progress (freelancer only)
router.patch('/:contractId/progress', requireAuth, updateContractProgress);

// Cleanup orphaned contracts (admin/maintenance endpoint)
router.post('/cleanup-orphaned', requireAuth, cleanupOrphanedContracts);

export default router;
