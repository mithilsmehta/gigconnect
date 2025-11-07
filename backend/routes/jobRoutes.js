import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createJob,
  getActiveJobs,
  getClientJobs,
  applyToJob,
  acceptProposal,
  rejectProposal,
  getFreelancerApplications,
  deleteJob,
} from '../controllers/jobController.js';

const router = express.Router();

// Create job (clients only)
router.post('/', requireAuth, createJob);

// Get all active jobs (for freelancers)
router.get('/active', requireAuth, getActiveJobs);

// Get client's jobs
router.get('/my-jobs', requireAuth, getClientJobs);

// Apply to job (freelancers only)
router.post('/:jobId/apply', requireAuth, applyToJob);

// Accept/reject proposals (clients only)
router.patch('/:jobId/applications/:applicationId/accept', requireAuth, acceptProposal);
router.patch('/:jobId/applications/:applicationId/reject', requireAuth, rejectProposal);

// Get freelancer's applications
router.get('/my-applications', requireAuth, getFreelancerApplications);

// Delete job (clients only)
router.delete('/:jobId', requireAuth, deleteJob);

export default router;
