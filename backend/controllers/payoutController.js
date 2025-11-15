import Payout from '../models/Payout.js';
import Payment from '../models/Payment.js';
import Contract from '../models/Contract.js';
import PayoutAccount from '../models/PayoutAccount.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { createPayout } from '../services/payoutServices.js';
import { releaseFunds } from '../services/escrowService.js';

// Process payout to freelancer
export const processPayout = async (req, res) => {
  try {
    const { contractId } = req.body;
    const userId = req.userId;

    // Get contract with payment details
    const contract = await Contract.findById(contractId).populate('paymentId');

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    // Verify user is the client
    if (contract.clientId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if contract is funded
    if (contract.paymentStatus !== 'funded') {
      return res.status(400).json({ success: false, message: 'Contract not funded' });
    }

    // Check if work is completed
    if (contract.progress !== 'completed') {
      return res.status(400).json({ success: false, message: 'Work not completed yet' });
    }

    // Release funds from escrow
    const releaseResult = await releaseFunds(contractId);
    if (!releaseResult.success) {
      return res.status(400).json({ success: false, message: releaseResult.error });
    }

    // Get freelancer's default payout account
    const payoutAccount = await PayoutAccount.findOne({
      freelancerId: contract.freelancerId,
      isDefault: true,
    });

    if (!payoutAccount) {
      return res.status(400).json({
        success: false,
        message: 'Freelancer has not set up a payout account',
      });
    }

    // Get freelancer details
    const freelancer = await User.findById(contract.freelancerId);

    const payment = contract.paymentId;

    // Prepare account details for payout
    const accountDetails = {
      accountType: payoutAccount.accountType === 'upi' ? 'vpa' : 'bank_account',
      accountNumber: payoutAccount.accountType === 'bank_account' ? payoutAccount.getDecryptedAccountNumber() : null,
      ifscCode: payoutAccount.ifscCode,
      accountHolderName: payoutAccount.accountHolderName,
      vpa: payoutAccount.vpa,
      name: freelancer.name,
      email: freelancer.email,
      phone: freelancer.phone || '9999999999',
    };

    // Determine payout mode
    const mode = payoutAccount.accountType === 'upi' ? 'UPI' : 'IMPS';

    // Create payout via Razorpay
    const payoutResult = await createPayout(payment.netAmount, 'INR', accountDetails, mode, {
      referenceId: `payout_${contractId}`,
      narration: `Payment for ${contract.jobTitle}`,
      contractId: contractId.toString(),
    });

    if (!payoutResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payout',
        error: payoutResult.error,
      });
    }

    // Create payout record
    const payout = new Payout({
      paymentId: payment._id,
      contractId: contract._id,
      freelancerId: contract.freelancerId,
      razorpayPayoutId: payoutResult.payout.id,
      payoutAccountId: payoutAccount._id,
      amount: payment.netAmount,
      currency: 'INR',
      mode,
      status: payoutResult.payout.status,
    });

    await payout.save();

    // Update contract
    contract.paymentStatus = 'paid';
    contract.payoutId = payout._id;
    contract.paidAt = new Date();
    await contract.save();

    // Create transaction record for freelancer
    const transaction = new Transaction({
      userId: contract.freelancerId,
      userRole: 'freelancer',
      type: 'payout',
      contractId: contract._id,
      amount: payment.amount,
      fee: payment.platformFee,
      netAmount: payment.netAmount,
      currency: 'INR',
      status: 'completed',
      razorpayId: payoutResult.payout.id,
      description: `Payout for ${contract.jobTitle}`,
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Payout processed successfully',
      payout,
      netAmount: payment.netAmount / 100, // Convert to rupees
      platformFee: payment.platformFee / 100,
    });
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payout' });
  }
};

// Get payout status
export const getPayoutStatus = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const userId = req.userId;

    const payout = await Payout.findById(payoutId).populate('contractId');

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    // Verify user is involved in the contract
    const contract = payout.contractId;
    if (contract.clientId.toString() !== userId && contract.freelancerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({
      success: true,
      payout,
    });
  } catch (error) {
    console.error('Get payout status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payout status' });
  }
};
