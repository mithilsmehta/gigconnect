import Payment from '../models/Payment.js';
import Contract from '../models/Contract.js';

// Hold funds in escrow
export const holdFunds = async (contractId, paymentId, razorpayOrderId, amount) => {
  try {
    // Update payment status
    await Payment.findByIdAndUpdate(paymentId, {
      status: 'captured',
    });

    // Update contract
    await Contract.findByIdAndUpdate(contractId, {
      paymentStatus: 'funded',
      paymentId: paymentId,
      fundedAt: new Date(),
    });

    return { success: true, message: 'Funds held in escrow' };
  } catch (error) {
    console.error('Hold funds error:', error);
    return { success: false, error: error.message };
  }
};

// Release funds for payout
export const releaseFunds = async (contractId) => {
  try {
    const contract = await Contract.findById(contractId);

    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }

    if (contract.paymentStatus !== 'funded') {
      return { success: false, error: 'Contract not funded' };
    }

    // Mark as ready for payout (actual payout happens in payout controller)
    return { success: true, message: 'Funds ready for release' };
  } catch (error) {
    console.error('Release funds error:', error);
    return { success: false, error: error.message };
  }
};

// Refund escrowed funds
export const refundFunds = async (contractId, reason) => {
  try {
    const contract = await Contract.findById(contractId).populate('paymentId');

    if (!contract || !contract.paymentId) {
      return { success: false, error: 'Payment not found' };
    }

    // Update contract status
    await Contract.findByIdAndUpdate(contractId, {
      paymentStatus: 'refunded',
    });

    return { success: true, message: 'Refund initiated', payment: contract.paymentId };
  } catch (error) {
    console.error('Refund funds error:', error);
    return { success: false, error: error.message };
  }
};

// Get escrow status
export const getEscrowStatus = async (contractId) => {
  try {
    const contract = await Contract.findById(contractId).populate('paymentId');

    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }

    return {
      success: true,
      status: contract.paymentStatus,
      fundedAt: contract.fundedAt,
      payment: contract.paymentId,
    };
  } catch (error) {
    console.error('Get escrow status error:', error);
    return { success: false, error: error.message };
  }
};
