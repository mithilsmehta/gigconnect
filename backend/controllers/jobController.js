import Job from '../models/Job.js';
import User from '../models/User.js';
import Contract from '../models/Contract.js';
import { deductConnects } from './connectController.js';

// Create a new job
export const createJob = async (req, res) => {
  try {
    const { title, description, budget, duration, skills, workType } = req.body;

    // Get client info
    const client = await User.findById(req.userId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Process skills - convert string to array if needed
    const processedSkills = Array.isArray(skills)
      ? skills
      : skills
      ? skills
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s)
      : [];

    const job = new Job({
      title,
      description,
      budget: {
        type: budget?.type || 'fixed',
        amount: budget?.amount || 0,
        min: budget?.min || 0, // Backward compatibility
        max: budget?.max || 0, // Backward compatibility
      },
      duration: duration || 0,
      skills: processedSkills,
      workType: workType || 'remote',
      clientId: req.userId,
      clientName: `${client.firstName} ${client.lastName}`,
      clientCompany: client.companyName || '',
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job,
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message,
    });
  }
};

// Get all active jobs (for freelancers)
export const getActiveJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 }).limit(50);

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
    });
  }
};

// Get jobs posted by client
export const getClientJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Get client jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your jobs',
    });
  }
};

// Apply to a job
export const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { proposal } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = job.applications.find((app) => app.freelancerId.toString() === req.userId);

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    // Deduct connects before applying (2 connects per application)
    try {
      const result = await deductConnects(req.userId, 2);

      // Add application
      job.applications.push({
        freelancerId: req.userId,
        proposal: proposal || '',
        appliedAt: new Date(),
      });

      await job.save();

      res.json({
        success: true,
        message: `Application submitted successfully! ${result.connectsDeducted} connects deducted.`,
        connectsDeducted: result.connectsDeducted,
        remainingConnects: result.remainingConnects,
      });
    } catch (connectError) {
      return res.status(400).json({
        success: false,
        message: connectError.message,
        needsConnects: true,
      });
    }
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply to job',
    });
  }
};

// Accept a proposal
export const acceptProposal = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user owns this job
    if (job.clientId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Find and update application
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = 'accepted';
    await job.save();

    // Create contract after accepting proposal
    try {
      const freelancer = await User.findById(application.freelancerId);

      const contract = new Contract({
        jobId: job._id,
        jobTitle: job.title,
        jobDescription: job.description,
        jobBudget: {
          min: job.budget.min,
          max: job.budget.max,
        },
        clientId: job.clientId,
        clientName: job.clientName,
        clientCompany: job.clientCompany,
        freelancerId: application.freelancerId,
        freelancerName: freelancer ? `${freelancer.firstName} ${freelancer.lastName}` : 'Unknown',
        proposal: application.proposal,
        applicationId: application._id,
        status: 'active',
      });

      await contract.save();

      res.json({
        success: true,
        message: 'Proposal accepted successfully',
        contractId: contract._id,
      });
    } catch (contractError) {
      console.error('Contract creation error:', contractError);
      // Proposal is still accepted even if contract creation fails
      res.json({
        success: true,
        message: 'Proposal accepted successfully',
        warning: 'Contract creation failed',
      });
    }
  } catch (error) {
    console.error('Accept proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept proposal',
    });
  }
};

// Reject a proposal
export const rejectProposal = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user owns this job
    if (job.clientId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Find and update application
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = 'rejected';
    await job.save();

    res.json({
      success: true,
      message: 'Proposal rejected',
    });
  } catch (error) {
    console.error('Reject proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject proposal',
    });
  }
};

// Get freelancer's applications
export const getFreelancerApplications = async (req, res) => {
  try {
    const jobs = await Job.find({
      'applications.freelancerId': req.userId,
    }).sort({ createdAt: -1 });

    // Extract applications for this freelancer
    const applications = jobs.map((job) => {
      const application = job.applications.find((app) => app.freelancerId.toString() === req.userId);
      return {
        _id: application._id,
        jobId: job._id,
        jobTitle: job.title,
        jobDescription: job.description,
        jobBudget: job.budget,
        clientName: job.clientName,
        clientCompany: job.clientCompany,
        proposal: application.proposal,
        status: application.status,
        appliedAt: application.appliedAt,
        jobCreatedAt: job.createdAt,
      };
    });

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error('Get freelancer applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your applications',
    });
  }
};

// Delete a job (and cascade delete related contracts)
export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user owns this job
    if (job.clientId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete all contracts related to this job
    await Contract.deleteMany({ jobId: jobId });

    // Delete the job
    await Job.findByIdAndDelete(jobId);

    res.json({
      success: true,
      message: 'Job and related contracts deleted successfully',
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
    });
  }
};
