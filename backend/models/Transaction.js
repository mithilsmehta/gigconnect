import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRole: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true,
    },
    type: {
      type: String,
      enum: ['payment', 'payout', 'refund'],
      required: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    amount: {
      type: Number,
      required: true, // in paise/cents
    },
    fee: {
      type: Number,
      default: 0, // platform fee (for freelancers)
    },
    netAmount: {
      type: Number,
      required: true, // amount after fees
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      required: true,
    },
    razorpayId: {
      type: String,
      default: null, // PaymentId or PayoutId
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ contractId: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
