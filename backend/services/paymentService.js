import razorpayInstance from '../config/razorpay.js';
import crypto from 'crypto';

// Create Razorpay order for contract funding
export const createOrder = async (amount, currency, receipt, notes) => {
  try {
    const options = {
      amount: amount, // amount in paise
      currency: currency || 'INR',
      receipt: receipt,
      notes: notes || {},
    };

    const order = await razorpayInstance.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error('Create order error:', error);
    return { success: false, error: error.message };
  }
};

// Verify payment signature
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(text).digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Verify signature error:', error);
    return false;
  }
};

// Get payment details
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error('Get payment details error:', error);
    return { success: false, error: error.message };
  }
};

// Create refund
export const createRefund = async (paymentId, amount, notes) => {
  try {
    const options = {
      amount: amount, // amount in paise (optional, full refund if not provided)
      notes: notes || {},
    };

    const refund = await razorpayInstance.payments.refund(paymentId, options);
    return { success: true, refund };
  } catch (error) {
    console.error('Create refund error:', error);
    return { success: false, error: error.message };
  }
};

// List payments (for transaction history)
export const listPayments = async (options) => {
  try {
    const payments = await razorpayInstance.payments.all(options);
    return { success: true, payments };
  } catch (error) {
    console.error('List payments error:', error);
    return { success: false, error: error.message };
  }
};
