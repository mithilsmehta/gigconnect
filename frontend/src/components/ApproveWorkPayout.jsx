import { useState } from 'react';
import { toast } from 'react-toastify';
import { processPayout } from '../api/payoutAPI';

export default function ApproveWorkPayout({ contract, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleApprovePayout = async () => {
        setLoading(true);

        try {
            const response = await processPayout(contract._id);

            if (response.data.success) {
                toast.success('Payout processed successfully!');
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error('Payout error:', error);
            toast.error(error.response?.data?.message || 'Failed to process payout');
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    const platformFee = contract.jobBudget.max * 0.1;
    const freelancerAmount = contract.jobBudget.max * 0.9;

    return (
        <div className="card mb-3">
            <div className="card-body">
                <h5 className="card-title">Approve Work & Release Payment</h5>
                <p className="text-muted">
                    Review the completed work and release payment to the freelancer.
                </p>

                <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                        <span>Contract Amount:</span>
                        <strong>₹{contract.jobBudget.max}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span>Platform Fee (10%):</span>
                        <span className="text-muted">- ₹{platformFee.toFixed(2)}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-2">
                        <span><strong>Freelancer Receives:</strong></span>
                        <strong className="text-success">₹{freelancerAmount.toFixed(2)}</strong>
                    </div>
                </div>

                {!showConfirm ? (
                    <button
                        className="btn btn-success w-100"
                        onClick={() => setShowConfirm(true)}
                    >
                        ✅ Approve & Release Payment
                    </button>
                ) : (
                    <div>
                        <div className="alert alert-warning">
                            <strong>⚠️ Confirm Payment Release</strong>
                            <p className="mb-0 mt-2">
                                Are you sure you want to release ₹{freelancerAmount.toFixed(2)} to the freelancer?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-success flex-fill"
                                onClick={handleApprovePayout}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm Release'
                                )}
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-3 text-center">
                    <small className="text-muted">
                        💸 Payment will be transferred instantly via IMPS/UPI
                    </small>
                </div>
            </div>
        </div>
    );
}
