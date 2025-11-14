import razorpayInstance from '../config/razorpay.js';

// Create payout to freelancer
export const createPayout = async (amount, currency, accountDetails, mode, notes) => {
  try {
    const options = {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // Your Razorpay account number
      amount: amount, // amount in paise
      currency: currency || 'INR',
      mode: mode || 'IMPS', // IMPS, NEFT, RTGS, UPI
      purpose: 'payout',
      fund_account: {
        account_type: accountDetails.accountType, // 'bank_account' or 'vpa'
        bank_account:
          accountDetails.accountType === 'bank_account'
            ? {
                name: accountDetails.accountHolderName,
                ifsc: accountDetails.ifscCode,
                account_number: accountDetails.accountNumber,
              }
            : undefined,
        vpa:
          accountDetails.accountType === 'vpa'
            ? {
                address: accountDetails.vpa,
              }
            : undefined,
        contact: {
          name: accountDetails.name,
          email: accountDetails.email,
          contact: accountDetails.phone,
          type: 'vendor',
        },
      },
      queue_if_low_balance: true,
      reference_id: notes.referenceId || `payout_${Date.now()}`,
      narration: notes.narration || 'Freelancer payout',
      notes: notes || {},
    };

    const payout = await razorpayInstance.payouts.create(options);
    return { success: true, payout };
  } catch (error) {
    console.error('Create payout error:', error);
    return { success: false, error: error.message };
  }
};

// Get payout status
export const getPayoutStatus = async (payoutId) => {
  try {
    const payout = await razorpayInstance.payouts.fetch(payoutId);
    return { success: true, payout };
  } catch (error) {
    console.error('Get payout status error:', error);
    return { success: false, error: error.message };
  }
};

// Validate bank account (penny drop)
export const validateBankAccount = async (accountNumber, ifscCode, name) => {
  try {
    // Note: Razorpay's fund account validation API
    const options = {
      account_number: accountNumber,
      ifsc: ifscCode,
      name: name,
    };

    const validation = await razorpayInstance.fundAccount.validate(options);
    return { success: true, validation };
  } catch (error) {
    console.error('Validate bank account error:', error);
    return { success: false, error: error.message };
  }
};
