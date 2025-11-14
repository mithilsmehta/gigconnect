import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true, // in paise (INR) or cents (USD)
    },
    currency: {
      type: String,
      default: 'INR',
    },
    platformFee: {
      type: Number,
      required: true, // in paise/cents
    },
    netAmount: {
      type: Number,
      required: true, // amount - platformFee
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
      default: 'created',
    },
    paymentMethod: {
      type: String,
      default: null, // 'card', 'upi', 'netbanking', 'wallet'
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
paymentSchema.index({ contractId: 1 });
paymentSchema.index({ clientId: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
