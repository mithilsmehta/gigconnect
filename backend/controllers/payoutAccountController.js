import PayoutAccount from '../models/PayoutAccount.js';
import { validateBankAccount } from '../services/payoutService.js';

// Add payout account (bank or UPI)
export const addPayoutAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { accountType, accountNumber, ifscCode, accountHolderName, bankName, vpa } = req.body;

    // Validation
    if (accountType === 'bank_account') {
      if (!accountNumber || !ifscCode || !accountHolderName) {
        return res.status(400).json({ success: false, message: 'Missing required bank account fields' });
      }
    } else if (accountType === 'upi') {
      if (!vpa) {
        return res.status(400).json({ success: false, message: 'UPI ID is required' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid account type' });
    }

    // Check if this is the first account (make it default)
    const existingAccounts = await PayoutAccount.find({ freelancerId: userId });
    const isDefault = existingAccounts.length === 0;

    // Create payout account
    const payoutAccount = new PayoutAccount({
      freelancerId: userId,
      accountType,
      accountNumber: accountType === 'bank_account' ? accountNumber : null,
      ifscCode: accountType === 'bank_account' ? ifscCode : null,
      accountHolderName: accountType === 'bank_account' ? accountHolderName : null,
      bankName: accountType === 'bank_account' ? bankName : null,
      vpa: accountType === 'upi' ? vpa : null,
      isDefault,
      isVerified: false,
    });

    await payoutAccount.save();

    res.json({
      success: true,
      message: 'Payout account added successfully',
      account: {
        _id: payoutAccount._id,
        accountType: payoutAccount.accountType,
        accountHolderName: payoutAccount.accountHolderName,
        bankName: payoutAccount.bankName,
        ifscCode: payoutAccount.ifscCode,
        vpa: payoutAccount.vpa,
        isDefault: payoutAccount.isDefault,
        isVerified: payoutAccount.isVerified,
      },
    });
  } catch (error) {
    console.error('Add payout account error:', error);
    res.status(500).json({ success: false, message: 'Failed to add payout account' });
  }
};

// Get payout accounts
export const getPayoutAccounts = async (req, res) => {
  try {
    const userId = req.userId;

    const accounts = await PayoutAccount.find({ freelancerId: userId }).select('-accountNumber');

    // For bank accounts, show only last 4 digits
    const sanitizedAccounts = accounts.map((account) => {
      const accountObj = account.toObject();
      if (account.accountType === 'bank_account' && account.accountNumber) {
        const decrypted = account.getDecryptedAccountNumber();
        accountObj.accountNumberLast4 = decrypted ? decrypted.slice(-4) : '****';
      }
      delete accountObj.accountNumber;
      return accountObj;
    });

    res.json({
      success: true,
      accounts: sanitizedAccounts,
    });
  } catch (error) {
    console.error('Get payout accounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payout accounts' });
  }
};

// Update payout account
export const updatePayoutAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { accountId } = req.params;
    const { accountHolderName, bankName, isDefault } = req.body;

    const account = await PayoutAccount.findOne({ _id: accountId, freelancerId: userId });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Payout account not found' });
    }

    // Update fields
    if (accountHolderName) account.accountHolderName = accountHolderName;
    if (bankName) account.bankName = bankName;

    // Handle default account change
    if (isDefault === true) {
      // Remove default from other accounts
      await PayoutAccount.updateMany({ freelancerId: userId, _id: { $ne: accountId } }, { isDefault: false });
      account.isDefault = true;
    }

    await account.save();

    res.json({
      success: true,
      message: 'Payout account updated successfully',
      account,
    });
  } catch (error) {
    console.error('Update payout account error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payout account' });
  }
};

// Delete payout account
export const deletePayoutAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { accountId } = req.params;

    const account = await PayoutAccount.findOne({ _id: accountId, freelancerId: userId });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Payout account not found' });
    }

    // If this was the default account, make another one default
    if (account.isDefault) {
      const otherAccount = await PayoutAccount.findOne({
        freelancerId: userId,
        _id: { $ne: accountId },
      });
      if (otherAccount) {
        otherAccount.isDefault = true;
        await otherAccount.save();
      }
    }

    await PayoutAccount.findByIdAndDelete(accountId);

    res.json({
      success: true,
      message: 'Payout account deleted successfully',
    });
  } catch (error) {
    console.error('Delete payout account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payout account' });
  }
};

// Verify bank account (penny drop)
export const verifyBankAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { accountId } = req.params;

    const account = await PayoutAccount.findOne({ _id: accountId, freelancerId: userId });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Payout account not found' });
    }

    if (account.accountType !== 'bank_account') {
      return res.status(400).json({ success: false, message: 'Only bank accounts can be verified' });
    }

    // Get decrypted account number
    const accountNumber = account.getDecryptedAccountNumber();

    // Validate with Razorpay
    const validationResult = await validateBankAccount(accountNumber, account.ifscCode, account.accountHolderName);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Bank account verification failed',
        error: validationResult.error,
      });
    }

    // Mark as verified
    account.isVerified = true;
    await account.save();

    res.json({
      success: true,
      message: 'Bank account verified successfully',
      account,
    });
  } catch (error) {
    console.error('Verify bank account error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify bank account' });
  }
};
