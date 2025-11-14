import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useRazorpay from '../hooks/useRazorpay';
import { getConnectPackages, createConnectsOrder, verifyAndCreditConnects, getConnectBalance } from '../api/connectAPI';

export default function BuyConnects() {
    const [packages, setPackages] = useState({});
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const { isLoaded, openCheckout } = useRazorpay();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [packagesRes, balanceRes] = await Promise.all([
                getConnectPackages(),
                getConnectBalance(),
            ]);
            setPackages(packagesRes.data.packages);
            setBalance(balanceRes.data.connects);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (packageType) => {
        if (!isLoaded) {
            toast.error('Payment system is loading. Please wait...');
            return;
        }

        setPurchasing(packageType);

        try {
            // Create order
            const orderResponse = await createConnectsOrder(packageType);
            const { orderId, amount, currency, keyId, purchaseId, package: pkg } = orderResponse.data;

            // Razorpay checkout options
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: 'GigConnect',
                description: `Purchase ${pkg.connects} Connects`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        // Verify payment
                        const verifyResponse = await verifyAndCreditConnects({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            purchaseId: purchaseId,
                        });

                        if (verifyResponse.data.success) {
                            toast.success(`${pkg.connects} connects added successfully!`);
                            fetchData(); // Refresh balance
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast.error('Payment verification failed');
                    } finally {
                        setPurchasing(null);
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
                        setPurchasing(null);
                        toast.info('Payment cancelled');
                    },
                },
            };

            openCheckout(options);
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error('Failed to initiate purchase');
            setPurchasing(null);
        }
    };

    const formatPrice = (priceInPaise) => {
        return `₹${(priceInPaise / 100).toFixed(0)}`;
    };

    const getOriginalPrice = (connects, priceInPaise) => {
        const pricePerConnect = 1000; // ₹10 per connect (original price)
        return connects * pricePerConnect;
    };

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status"></div>
                    <p className="mt-2">Loading connect packages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="text-center mb-5">
                <h2 className="mb-3">Buy Connects</h2>
                <p className="text-muted mb-4">
                    Connects are required to apply to jobs. Choose a package that suits your needs.
                </p>
                <div className="alert alert-info d-inline-block">
                    <strong>⚡ Current Balance: {balance} Connects</strong>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="row g-4 justify-content-center">
                {Object.entries(packages).map(([key, pkg]) => {
                    const originalPrice = getOriginalPrice(pkg.connects, pkg.price);
                    const savings = originalPrice - pkg.price;
                    const isPopular = key === 'popular';

                    return (
                        <div key={key} className="col-lg-3 col-md-6">
                            <div
                                className={`card h-100 ${isPopular ? 'border-success' : ''}`}
                                style={{
                                    borderRadius: 16,
                                    transform: isPopular ? 'scale(1.05)' : 'none',
                                    boxShadow: isPopular
                                        ? '0 8px 25px rgba(15, 157, 88, 0.3)'
                                        : '0 4px 15px rgba(0,0,0,0.1)',
                                }}
                            >
                                {isPopular && (
                                    <div className="position-absolute top-0 start-50 translate-middle">
                                        <span className="badge bg-success px-3 py-2" style={{ fontSize: '0.8rem' }}>
                                            🔥 Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="card-body text-center p-4">
                                    <div className="mb-3">
                                        <div style={{ fontSize: '3rem' }}>⚡</div>
                                    </div>

                                    <h4 className="card-title text-capitalize mb-3">{key}</h4>

                                    <div className="mb-3">
                                        <h2 className="text-success mb-0">{formatPrice(pkg.price)}</h2>
                                        {pkg.discount > 0 && (
                                            <div>
                                                <small className="text-muted text-decoration-line-through">
                                                    {formatPrice(originalPrice)}
                                                </small>
                                                <span className="badge bg-danger ms-2">{pkg.discount}% OFF</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-primary">{pkg.connects} Connects</h3>
                                        <small className="text-muted">
                                            {formatPrice(Math.round(pkg.price / pkg.connects))} per connect
                                        </small>
                                    </div>

                                    {savings > 0 && (
                                        <div className="mb-3">
                                            <small className="text-success fw-bold">💰 Save {formatPrice(savings)}</small>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <small className="text-muted">
                                            • Apply to {Math.floor(pkg.connects / 2)} jobs
                                            <br />
                                            • 2 connects per application
                                            <br />• Never expire
                                        </small>
                                    </div>

                                    <button
                                        className={`btn ${isPopular ? 'btn-success' : 'btn-outline-success'} w-100`}
                                        onClick={() => handlePurchase(key)}
                                        disabled={purchasing === key || !isLoaded}
                                        style={{ borderRadius: 25, padding: '0.75rem' }}
                                    >
                                        {purchasing === key ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            `Buy ${pkg.connects} Connects`
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info Section */}
            <div className="row mt-5">
                <div className="col-lg-8 mx-auto">
                    <div className="card" style={{ borderRadius: 16 }}>
                        <div className="card-body p-4">
                            <h5 className="card-title mb-3">💡 How Connects Work</h5>
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <div className="text-center">
                                        <div style={{ fontSize: '2rem' }}>🎯</div>
                                        <h6 className="mt-2">Apply to Jobs</h6>
                                        <small className="text-muted">Use 2 connects per job application</small>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="text-center">
                                        <div style={{ fontSize: '2rem' }}>💰</div>
                                        <h6 className="mt-2">Save More</h6>
                                        <small className="text-muted">Bigger packages = bigger discounts</small>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="text-center">
                                        <div style={{ fontSize: '2rem' }}>🔄</div>
                                        <h6 className="mt-2">Never Expire</h6>
                                        <small className="text-muted">Your connects stay with you forever</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="text-center mt-4">
                <p className="text-muted mb-2">🔒 Secure payments powered by Razorpay</p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                    <span className="badge bg-light text-dark p-2">💳 Cards</span>
                    <span className="badge bg-light text-dark p-2">📱 UPI</span>
                    <span className="badge bg-light text-dark p-2">🏦 Net Banking</span>
                    <span className="badge bg-light text-dark p-2">💰 Wallets</span>
                </div>
            </div>
        </div>
    );
}
