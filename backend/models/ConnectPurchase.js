import mongoose from 'mongoose';

const connectPurchaseSchema = new mongoose.Schema(
  {
    userId: {
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
      required: true, // Amount in paise
    },
    currency: {
      type: String,
      default: 'INR',
    },
    connectsQuantity: {
      type: Number,
      required: true,
    },
    connectsPrice: {
      type: Number,
      required: true, // Price per connect in paise
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
connectPurchaseSchema.index({ userId: 1, createdAt: -1 });
connectPurchaseSchema.index({ razorpayOrderId: 1 });

const ConnectPurchase = mongoose.model('ConnectPurchase', connectPurchaseSchema);

export default ConnectPurchase;
