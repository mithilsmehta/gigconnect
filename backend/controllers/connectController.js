import User from '../models/User.js';
import ConnectPurchase from '../models/ConnectPurchase.js';
import { createOrder, verifyPaymentSignature, getPaymentDetails } from '../services/paymentService.js';

// Connect packages with pricing
const CONNECT_PACKAGES = {
  starter: {
    connects: 10,
    price: 10000, // ₹100 in paise
    discount: 0,
  },
  popular: {
    connects: 50,
    price: 45000, // ₹450 in paise (10% off)
    discount: 10,
  },
  professional: {
    connects: 100,
    price: 80000, // ₹800 in paise (20% off)
    discount: 20,
  },
  enterprise: {
    connects: 200,
    price: 140000, // ₹1400 in paise (30% off)
    discount: 30,
  },
};

// Get user's connect balance
export const getConnectBalance = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('connects totalConnectsPurchased');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      connects: user.connects || 0,
      totalPurchased: user.totalConnectsPurchased || 0,
    });
  } catch (error) {
    console.error('Get connect balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get connect balance' });
  }
};

// Get connect packages
export const getConnectPackages = async (req, res) => {
  try {
    res.json({
      success: true,
      packages: CONNECT_PACKAGES,
    });
  } catch (error) {
    console.error('Get connect packages error:', error);
    res.status(500).json({ success: false, message: 'Failed to get packages' });
  }
};

// Create order for connects purchase
export const createConnectsOrder = async (req, res) => {
  try {
    const { packageType } = req.body;
    const userId = req.userId;

    if (!CONNECT_PACKAGES[packageType]) {
      return res.status(400).json({ success: false, message: 'Invalid package type' });
    }

    const package_ = CONNECT_PACKAGES[packageType];

    // Create Razorpay order
    const orderResult = await createOrder(
      package_.price,
      'INR',
      `conn_${Date.now()}`, // Keep receipt under 40 chars
      {
        userId: userId,
        packageType,
        connectsQuantity: package_.connects.toString(),
      },
    );

    if (!orderResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to create order', error: orderResult.error });
    }

    // Create purchase record
    const purchase = new ConnectPurchase({
      userId,
      razorpayOrderId: orderResult.order.id,
      amount: package_.price,
      currency: 'INR',
      connectsQuantity: package_.connects,
      connectsPrice: Math.round(package_.price / package_.connects),
      status: 'pending',
    });

    await purchase.save();

    res.json({
      success: true,
      orderId: orderResult.order.id,
      amount: package_.price,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      purchaseId: purchase._id,
      package: package_,
    });
  } catch (error) {
    console.error('Create connects order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create connects order' });
  }
};

// Verify and credit connects
export const verifyAndCreditConnects = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, purchaseId } = req.body;
    const userId = req.userId;

    // Verify signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Get payment details
    const paymentDetailsResult = await getPaymentDetails(razorpayPaymentId);

    if (!paymentDetailsResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
    }

    const paymentDetails = paymentDetailsResult.payment;

    // Update purchase record
    const purchase = await ConnectPurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase record not found' });
    }

    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.status = 'completed';
    purchase.paymentMethod = paymentDetails.method;
    await purchase.save();

    // Credit connects to user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          connects: purchase.connectsQuantity,
          totalConnectsPurchased: purchase.connectsQuantity,
        },
      },
      { new: true },
    );

    res.json({
      success: true,
      message: `${purchase.connectsQuantity} connects added successfully!`,
      connects: user.connects,
      purchase,
    });
  } catch (error) {
    console.error('Verify and credit connects error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

// Get purchase history
export const getPurchaseHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const purchases = await ConnectPurchase.find({ userId }).sort({ createdAt: -1 }).limit(50);

    res.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error('Get purchase history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get purchase history' });
  }
};

// Deduct connects when applying to job
export const deductConnects = async (userId, connectsNeeded = 2) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.connects < connectsNeeded) {
      throw new Error(`Insufficient connects. You need ${connectsNeeded} connects but have ${user.connects}.`);
    }

    // Deduct connects
    await User.findByIdAndUpdate(userId, {
      $inc: { connects: -connectsNeeded },
    });

    return { success: true, connectsDeducted: connectsNeeded, remainingConnects: user.connects - connectsNeeded };
  } catch (error) {
    throw error;
  }
};
