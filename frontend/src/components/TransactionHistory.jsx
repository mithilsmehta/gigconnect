import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getTransactionHistory } from '../api/paymentAPI';

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        startDate: '',
        endDate: '',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, filters]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await getTransactionHistory({
                page: currentPage,
                ...filters,
            });

            setTransactions(response.data.transactions);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Fetch transactions error:', error);
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatAmount = (amount) => {
        return `₹${(amount / 100).toFixed(2)}`;
    };

    const getStatusBadge = (status) => {
        const badges = {
            completed: 'success',
            pending: 'warning',
            failed: 'danger',
            refunded: 'info',
        };
        return badges[status] || 'secondary';
    };

    const getTypeIcon = (type) => {
        const icons = {
            payment: '💳',
            payout: '💸',
            refund: '↩️',
        };
        return icons[type] || '📄';
    };

    if (loading && transactions.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-success"></div>
                <p className="mt-2">Loading transactions...</p>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h3 className="mb-4">Transaction History</h3>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">All</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3 d-flex align-items-end">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={() => {
                                    setFilters({ status: '', startDate: '', endDate: '' });
                                    setCurrentPage(1);
                                }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            {transactions.length === 0 ? (
                <div className="alert alert-info">No transactions found.</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Contract</th>
                                    <th>Amount</th>
                                    <th>Fee</th>
                                    <th>Net Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction._id}>
                                        <td>{formatDate(transaction.createdAt)}</td>
                                        <td>
                                            {getTypeIcon(transaction.type)} {transaction.type}
                                        </td>
                                        <td>
                                            {transaction.contractId?.jobTitle || 'N/A'}
                                        </td>
                                        <td>{formatAmount(transaction.amount)}</td>
                                        <td className="text-muted">
                                            {transaction.fee > 0 ? `- ${formatAmount(transaction.fee)}` : '-'}
                                        </td>
                                        <td>
                                            <strong>{formatAmount(transaction.netAmount)}</strong>
                                        </td>
                                        <td>
                                            <span className={`badge bg-${getStatusBadge(transaction.status)}`}>
                                                {transaction.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {[...Array(totalPages)].map((_, i) => (
                                    <li
                                        key={i + 1}
                                        className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                                    >
                                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                            {i + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
}
