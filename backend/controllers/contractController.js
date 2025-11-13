import Contract from '../models/Contract.js';

// Get all contracts for a client
export const getClientContracts = async (req, res) => {
  try {
    const Job = (await import('../models/Job.js')).default;

    const contracts = await Contract.find({ clientId: req.userId })
      .sort({ createdAt: -1 })
      .populate('freelancerId', 'firstName lastName email');

    // Filter out contracts whose jobs no longer exist
    const validContracts = [];
    for (const contract of contracts) {
      const jobExists = await Job.findById(contract.jobId);
      if (jobExists) {
        validContracts.push(contract);
      } else {
        // Delete orphaned contract
        await Contract.findByIdAndDelete(contract._id);
      }
    }

    res.json({
      success: true,
      contracts: validContracts,
    });
  } catch (error) {
    console.error('Get client contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contracts',
    });
  }
};

// Get all contracts for a freelancer
export const getFreelancerContracts = async (req, res) => {
  try {
    const Job = (await import('../models/Job.js')).default;

    const contracts = await Contract.find({ freelancerId: req.userId })
      .sort({ createdAt: -1 })
      .populate('clientId', 'firstName lastName companyName email');

    // Filter out contracts whose jobs no longer exist
    const validContracts = [];
    for (const contract of contracts) {
      const jobExists = await Job.findById(contract.jobId);
      if (jobExists) {
        validContracts.push(contract);
      } else {
        // Delete orphaned contract
        await Contract.findByIdAndDelete(contract._id);
      }
    }

    res.json({
      success: true,
      contracts: validContracts,
    });
  } catch (error) {
    console.error('Get freelancer contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contracts',
    });
  }
};

// Get a specific contract by ID (with authorization check)
export const getContractById = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId)
      .populate('clientId', 'firstName lastName companyName email')
      .populate('freelancerId', 'firstName lastName email');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found',
      });
    }

    // Verify user is a participant in this contract
    const isClient = contract.clientId._id.toString() === req.userId;
    const isFreelancer = contract.freelancerId._id.toString() === req.userId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this contract',
      });
    }

    res.json({
      success: true,
      contract,
    });
  } catch (error) {
    console.error('Get contract by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract',
    });
  }
};

// Update contract progress (freelancer only)
export const updateContractProgress = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { progress } = req.body;

    const contract = await Contract.findById(contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found',
      });
    }

    // Verify user is the freelancer for this contract
    if (contract.freelancerId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the freelancer can update project progress',
      });
    }

    // Validate progress value
    const validProgress = ['not_started', 'in_progress', 'half_done', 'completed'];
    if (!validProgress.includes(progress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid progress value',
      });
    }

    contract.progress = progress;

    // If project is completed, update contract status
    if (progress === 'completed') {
      contract.status = 'completed';
    }

    await contract.save();

    res.json({
      success: true,
      message: 'Project progress updated successfully',
      contract,
    });
  } catch (error) {
    console.error('Update contract progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
    });
  }
};

// Clean up orphaned contracts (contracts whose jobs no longer exist)
export const cleanupOrphanedContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({});
    const Job = (await import('../models/Job.js')).default;

    let deletedCount = 0;

    for (const contract of contracts) {
      const jobExists = await Job.findById(contract.jobId);
      if (!jobExists) {
        await Contract.findByIdAndDelete(contract._id);
        deletedCount++;
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} orphaned contracts`,
      deletedCount,
    });
  } catch (error) {
    console.error('Cleanup orphaned contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup orphaned contracts',
    });
  }
};
