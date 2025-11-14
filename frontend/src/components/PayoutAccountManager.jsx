import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    addPayoutAccount,
    getPayoutAccounts,
    deletePayoutAccount,
    updatePayoutAccount,
} from '../api/payoutAccountAPI';

export default function PayoutAccountManager() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [accountType, setAccountType] = useState('bank_account');
    const [formData, setFormData] = useState({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
        vpa: '',
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await getPayoutAccounts();
            setAccounts(response.data.accounts);
        } catch (error) {
            console.error('Fetch accounts error:', error);
            toast.error('Failed to load payout accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addPayoutAccount({
                accountType,
                ...formData,
            });

            toast.success('Payout account added successfully!');
            setShowAddForm(false);
            setFormData({
                accountNumber: '',
                ifscCode: '',
                accountHolderName: '',
                bankName: '',
                vpa: '',
            });
            fetchAccounts();
        } catch (error) {
            console.error('Add account error:', error);
            toast.error(error.response?.data?.message || 'Failed to add payout account');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (!window.confirm('Are you sure you want to delete this payout account?')) return;

        try {
            await deletePayoutAccount(accountId);
            toast.success('Payout account deleted');
            fetchAccounts();
        } catch (error) {
            console.error('Delete account error:', error);
            toast.error('Failed to delete account');
        }
    };

    const handleSetDefault = async (accountId) => {
        try {
            await updatePayoutAccount(accountId, { isDefault: true });
            toast.success('Default account updated');
            fetchAccounts();
        } catch (error) {
            console.error('Set default error:', error);
            toast.error('Failed to set default account');
        }
    };

    if (loading && accounts.length === 0) {
        return (
            <div className="text-center py-4">
                <div className="spinner-border text-success"></div>
                <p className="mt-2">Loading payout accounts...</p>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Payout Accounts</h3>
                <button
                    className="btn btn-success"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? 'Cancel' : '+ Add Account'}
                </button>
            </div>

            {showAddForm && (
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="card-title">Add Payout Account</h5>

                        <div className="mb-3">
                            <label className="form-label">Account Type</label>
                            <select
                                className="form-select"
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value)}
                            >
                                <option value="bank_account">Bank Account</option>
                                <option value="upi">UPI</option>
                            </select>
                        </div>

                        <form onSubmit={handleAddAccount}>
                            {accountType === 'bank_account' ? (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label">Account Holder Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.accountHolderName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, accountHolderName: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Account Number</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.accountNumber}
                                            onChange={(e) =>
                                                setFormData({ ...formData, accountNumber: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">IFSC Code</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.ifscCode}
                                            onChange={(e) =>
                                                setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Bank Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.bankName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, bankName: e.target.value })
                                            }
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="mb-3">
                                    <label className="form-label">UPI ID</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="yourname@upi"
                                        value={formData.vpa}
                                        onChange={(e) => setFormData({ ...formData, vpa: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <button type="submit" className="btn btn-success" disabled={loading}>
                                {loading ? 'Adding...' : 'Add Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="row">
                {accounts.length === 0 ? (
                    <div className="col-12">
                        <div className="alert alert-info">
                            No payout accounts added yet. Add one to receive payments.
                        </div>
                    </div>
                ) : (
                    accounts.map((account) => (
                        <div key={account._id} className="col-md-6 mb-3">
                            <div className={`card ${account.isDefault ? 'border-success' : ''}`}>
                                <div className="card-body">
                                    {account.isDefault && (
                                        <span className="badge bg-success mb-2">Default</span>
                                    )}

                                    <h6 className="card-title">
                                        {account.accountType === 'bank_account' ? '🏦 Bank Account' : '📱 UPI'}
                                    </h6>

                                    {account.accountType === 'bank_account' ? (
                                        <>
                                            <p className="mb-1">
                                                <strong>{account.accountHolderName}</strong>
                                            </p>
                                            <p className="mb-1">
                                                Account: ****{account.accountNumberLast4}
                                            </p>
                                            <p className="mb-1">IFSC: {account.ifscCode}</p>
                                            {account.bankName && <p className="mb-1">{account.bankName}</p>}
                                        </>
                                    ) : (
                                        <p className="mb-1">{account.vpa}</p>
                                    )}

                                    <div className="mt-3">
                                        {!account.isDefault && (
                                            <button
                                                className="btn btn-sm btn-outline-success me-2"
                                                onClick={() => handleSetDefault(account._id)}
                                            >
                                                Set as Default
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDeleteAccount(account._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
