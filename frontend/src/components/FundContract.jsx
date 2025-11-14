import { useState } from 'react';
import { toast } from 'react-toastify';
import useRazorpay from '../hooks/useRazorpay';
import { createPaymentOrder, verifyAndFundContract } from '../api/paymentAPI';

export default function FundContract({ contract, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const { isLoaded, openCheckout } = useRazorpay();

    const handleFundContract = async () => {
        if (!isLoaded) {
            toast.error('Payment system is loading. Please wait...');
            return;
        }

        setLoading(true);

        try {
            // Create order
            const orderResponse = await createPaymentOrder(contract._id);
            const { orderId, amount, currency, keyId, paymentId } = orderResponse.data;

            // Razorpay checkout options
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: 'GigConnect',
                description: `Payment for ${contract.jobTitle}`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        // Verify payment
                        const verifyResponse = await verifyAndFundContract({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            paymentId: paymentId,
                        });

                        if (verifyResponse.data.success) {
                            toast.success('Contract funded successfully!');
                            if (onSuccess) onSuccess();
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: localStorage.getItem('userName') || '',
                    email: localStorage.getItem('userEmail') || '',
                },
                theme: {
                    color: '#0f9d58',
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        toast.info('Payment cancelled');
                    },
                },
            };

            openCheckout(options);
        } catch (error) {
            console.error('Fund contract error:', error);
            toast.error('Failed to initiate payment');
            setLoading(false);
        }
    };

    return (
        <div className="card mb-3">
            <div className="card-body">
                <h5 className="card-title">Fund Contract</h5>
                <p className="text-muted">
                    Secure your contract by funding it through our escrow system.
                </p>

                <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                        <span>Contract Amount:</span>
                        <strong>₹{contract.jobBudget.max}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span>Platform Fee (10%):</span>
                        <span>₹{(contract.jobBudget.max * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span>Freelancer Receives:</span>
                        <strong className="text-success">₹{(contract.jobBudget.max * 0.9).toFixed(2)}</strong>
                    </div>
                </div>

                <button
                    className="btn btn-success w-100"
                    onClick={handleFundContract}
                    disabled={loading || !isLoaded}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Processing...
                        </>
                    ) : (
                        <>💳 Pay ₹{contract.jobBudget.max}</>
                    )}
                </button>

                <div className="mt-3 text-center">
                    <small className="text-muted">
                        🔒 Secure payment powered by Razorpay
                        <br />
                        Supports UPI, Cards, Net Banking, Wallets
                    </small>
                </div>
            </div>
        </div>
    );
}
