import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';

const payoutAccountSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountType: {
      type: String,
      enum: ['bank_account', 'upi'],
      required: true,
    },
    // For bank accounts
    accountNumber: {
      type: String,
      default: null,
    },
    ifscCode: {
      type: String,
      default: null,
    },
    accountHolderName: {
      type: String,
      default: null,
    },
    bankName: {
      type: String,
      default: null,
    },
    // For UPI
    vpa: {
      type: String,
      default: null, // Virtual Payment Address (UPI ID)
    },
    // Common fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Encrypt account number before saving
payoutAccountSchema.pre('save', function (next) {
  if (this.isModified('accountNumber') && this.accountNumber) {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    this.accountNumber = CryptoJS.AES.encrypt(this.accountNumber, encryptionKey).toString();
  }
  next();
});

// Method to decrypt account number
payoutAccountSchema.methods.getDecryptedAccountNumber = function () {
  if (!this.accountNumber) return null;
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const bytes = CryptoJS.AES.decrypt(this.accountNumber, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Index for efficient queries
payoutAccountSchema.index({ freelancerId: 1 });

const PayoutAccount = mongoose.model('PayoutAccount', payoutAccountSchema);

export default PayoutAccount;
