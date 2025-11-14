import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    razorpayPayoutId: {
      type: String,
      default: null,
    },
    payoutAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutAccount',
      required: true,
    },
    amount: {
      type: Number,
      required: true, // net amount in paise/cents
    },
    currency: {
      type: String,
      default: 'INR',
    },
    mode: {
      type: String,
      enum: ['IMPS', 'NEFT', 'RTGS', 'UPI'],
      default: 'IMPS',
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'processed', 'reversed', 'cancelled', 'failed'],
      default: 'queued',
    },
    failureReason: {
      type: String,
      default: null,
    },
    utr: {
      type: String,
      default: null, // Unique Transaction Reference
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
payoutSchema.index({ contractId: 1 });
payoutSchema.index({ freelancerId: 1, createdAt: -1 });
payoutSchema.index({ razorpayPayoutId: 1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;
