import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    // Job Information (snapshot)
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    jobBudget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },

    // Client Information (snapshot)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientCompany: {
      type: String,
      default: '',
    },

    // Freelancer Information (snapshot)
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancerName: {
      type: String,
      required: true,
    },

    // Proposal Information
    proposal: {
      type: String,
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Contract Status
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },

    // Project Progress
    progress: {
      type: String,
      enum: ['not_started', 'in_progress', 'half_done', 'completed'],
      default: 'not_started',
    },

    // Payment Information
    paymentStatus: {
      type: String,
      enum: ['unfunded', 'funded', 'paid', 'refunded'],
      default: 'unfunded',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout',
      default: null,
    },
    fundedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Indexes for efficient queries
contractSchema.index({ clientId: 1, createdAt: -1 });
contractSchema.index({ freelancerId: 1, createdAt: -1 });

const Contract = mongoose.model('Contract', contractSchema);
export default Contract;
