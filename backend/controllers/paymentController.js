import Payment from '../models/Payment.js';
import Contract from '../models/Contract.js';
import Transaction from '../models/Transaction.js';
import { createOrder, verifyPaymentSignature, createRefund, getPaymentDetails } from '../services/paymentService.js';
import { holdFunds } from '../services/escrowService.js';
import { calculatePlatformFee, calculateNetPayout } from '../utils/feeCalculator.js';
import crypto from 'crypto';

// Create Razorpay order for contract funding
export const createPaymentOrder = async (req, res) => {
  try {
    const { contractId } = req.body;
    const userId = req.userId;

    // Get contract details
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    // Verify user is the client
    if (contract.clientId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already funded
    if (contract.paymentStatus !== 'unfunded') {
      return res.status(400).json({ success: false, message: 'Contract already funded' });
    }

    // Calculate amount (use max budget)
    const amount = contract.jobBudget.max * 100; // Convert to paise
    const platformFee = calculatePlatformFee(amount);
    const netAmount = calculateNetPayout(amount);

    // Create Razorpay order
    const orderResult = await createOrder(amount, 'INR', `contract_${contractId}`, {
      contractId: contractId.toString(),
      clientId: userId,
      freelancerId: contract.freelancerId.toString(),
    });

    if (!orderResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to create order', error: orderResult.error });
    }

    // Create payment record
    const payment = new Payment({
      contractId,
      clientId: userId,
      freelancerId: contract.freelancerId,
      razorpayOrderId: orderResult.order.id,
      amount,
      currency: 'INR',
      platformFee,
      netAmount,
      status: 'created',
    });

    await payment.save();

    res.json({
      success: true,
      orderId: orderResult.order.id,
      amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// Verify payment and fund contract
export const verifyAndFundContract = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;
    const userId = req.userId;

    // Verify signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Get payment details from Razorpay
    const paymentDetailsResult = await getPaymentDetails(razorpayPaymentId);

    if (!paymentDetailsResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
    }

    const paymentDetails = paymentDetailsResult.payment;

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.status = 'captured';
    payment.paymentMethod = paymentDetails.method;
    await payment.save();

    // Hold funds in escrow
    await holdFunds(payment.contractId, payment._id, razorpayOrderId, payment.amount);

    // Create transaction record for client
    const transaction = new Transaction({
      userId: payment.clientId,
      userRole: 'client',
      type: 'payment',
      contractId: payment.contractId,
      amount: payment.amount,
      fee: 0,
      netAmount: payment.amount,
      currency: 'INR',
      status: 'completed',
      razorpayId: razorpayPaymentId,
      description: 'Contract funding',
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Payment verified and contract funded successfully',
      payment,
    });
  } catch (error) {
    console.error('Verify and fund contract error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

// Process refund
export const processRefund = async (req, res) => {
  try {
    const { contractId, reason } = req.body;
    const userId = req.userId;

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

    const payment = contract.paymentId;

    // Create refund
    const refundResult = await createRefund(payment.razorpayPaymentId, payment.amount, { reason });

    if (!refundResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to process refund', error: refundResult.error });
    }

    // Update payment and contract status
    payment.status = 'refunded';
    await payment.save();

    contract.paymentStatus = 'refunded';
    await contract.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: payment.clientId,
      userRole: 'client',
      type: 'refund',
      contractId: contract._id,
      amount: payment.amount,
      fee: 0,
      netAmount: payment.amount,
      currency: 'INR',
      status: 'completed',
      razorpayId: refundResult.refund.id,
      description: `Refund: ${reason}`,
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: refundResult.refund,
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, startDate, endDate, status } = req.query;

    const query = { userId };

    // Add filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('contractId', 'jobTitle')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get transaction history' });
  }
};

// Webhook handler
export const handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(req.body)).digest('hex');

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Webhook event received:', event);

    // Handle different events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
      case 'payout.processed':
        await handlePayoutProcessed(payload.payout.entity);
        break;
      case 'payout.failed':
        await handlePayoutFailed(payload.payout.entity);
        break;
      case 'refund.processed':
        await handleRefundProcessed(payload.refund.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// Webhook event handlers
const handlePaymentCaptured = async (payment) => {
  console.log('Payment captured:', payment.id);
  // Additional processing if needed
};

const handlePaymentFailed = async (payment) => {
  console.log('Payment failed:', payment.id);
  const paymentRecord = await Payment.findOne({ razorpayPaymentId: payment.id });
  if (paymentRecord) {
    paymentRecord.status = 'failed';
    await paymentRecord.save();
  }
};

const handlePayoutProcessed = async (payout) => {
  console.log('Payout processed:', payout.id);
  // Update payout status in database
};

const handlePayoutFailed = async (payout) => {
  console.log('Payout failed:', payout.id);
  // Update payout status and notify
};

const handleRefundProcessed = async (refund) => {
  console.log('Refund processed:', refund.id);
  // Additional processing if needed
};
