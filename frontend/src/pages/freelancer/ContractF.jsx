import { useEffect, useState } from 'react';
import { getFreelancerContracts, updateContractProgress } from '../../api/contractApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Contracts() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getFreelancerContracts();
            setContracts(response.data.contracts || []);
        } catch (err) {
            console.error('Error fetching contracts:', err);
            setError('Failed to load contracts');
            toast.error('Failed to load contracts');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatBudget = (budget) => {
        if (!budget || (budget.min === 0 && budget.max === 0)) {
            return 'Budget not specified';
        }
        if (budget.min === budget.max) {
            return `$${budget.min.toLocaleString()}`;
        }
        return `$${budget.min.toLocaleString()} - $${budget.max.toLocaleString()}`;
    };

    const getProgressLabel = (progress) => {
        const labels = {
            not_started: 'Not Started',
            in_progress: 'In Progress',
            half_done: '50% Done',
            completed: 'Completed',
        };
        return labels[progress] || 'Not Started';
    };

    const getProgressColor = (progress) => {
        const colors = {
            not_started: '#6c757d',
            in_progress: '#0dcaf0',
            half_done: '#ffc107',
            completed: '#198754',
        };
        return colors[progress] || '#6c757d';
    };

    const handleProgressUpdate = async (contractId, newProgress) => {
        try {
            console.log('Updating progress:', contractId, newProgress);
            const response = await updateContractProgress(contractId, newProgress);
            console.log('Update response:', response);
            toast.success('Project progress updated successfully!');
            fetchContracts(); // Refresh contracts
        } catch (err) {
            console.error('Error updating progress:', err);
            console.error('Error details:', err.response?.data);
            toast.error(err.response?.data?.message || 'Failed to update progress');
        }
    };

    if (loading) {
        return (
            <div className="card p-3">
                <h2 style={{ marginBottom: '1.5rem' }}>My Contracts</h2>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p style={{ marginTop: '1rem', color: '#666' }}>Loading contracts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-3">
                <h2 style={{ marginBottom: '1.5rem' }}>My Contracts</h2>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</p>
                    <button className="btn btn-primary" onClick={fetchContracts}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (contracts.length === 0) {
        return (
            <div className="card p-3">
                <h2 style={{ marginBottom: '1.5rem' }}>My Contracts</h2>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                    <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>No contracts yet</h3>
                    <p style={{ color: '#999' }}>
                        Contracts will appear here when clients accept your proposals
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-3">
            <ToastContainer position="top-right" />
            <h2 style={{ marginBottom: '1.5rem' }}>My Contracts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {contracts.map((contract) => (
                    <div
                        key={contract._id}
                        style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            backgroundColor: '#fff',
                            transition: 'box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#333' }}>
                                    {contract.jobTitle}
                                </h3>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                    <span>
                                        🏢 {contract.clientName}
                                        {contract.clientCompany && ` (${contract.clientCompany})`}
                                    </span>
                                    <span>💰 {formatBudget(contract.jobBudget)}</span>
                                    <span>📅 {formatDate(contract.createdAt)}</span>
                                </div>
                            </div>
                            <span
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    backgroundColor: contract.status === 'active' ? '#d4edda' : '#f8d7da',
                                    color: contract.status === 'active' ? '#155724' : '#721c24',
                                }}
                            >
                                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                            </span>
                        </div>

                        <p
                            style={{
                                margin: '0 0 1rem 0',
                                color: '#555',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                            }}
                        >
                            {contract.jobDescription.length > 200
                                ? `${contract.jobDescription.substring(0, 200)}...`
                                : contract.jobDescription}
                        </p>

                        {contract.proposal && (
                            <div
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid #28a745',
                                    marginBottom: '1rem',
                                }}
                            >
                                <strong style={{ fontSize: '0.9rem', color: '#333' }}>Your Proposal:</strong>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#555' }}>
                                    {contract.proposal.length > 150
                                        ? `${contract.proposal.substring(0, 150)}...`
                                        : contract.proposal}
                                </p>
                            </div>
                        )}

                        {/* Project Progress Controls */}
                        <div
                            style={{
                                backgroundColor: '#fff',
                                padding: '1rem',
                                borderRadius: '6px',
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ fontSize: '0.9rem', color: '#333' }}>Project Progress:</strong>
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            marginLeft: '0.5rem',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            backgroundColor: getProgressColor(contract.progress || 'not_started') + '20',
                                            color: getProgressColor(contract.progress || 'not_started'),
                                        }}
                                    >
                                        {getProgressLabel(contract.progress || 'not_started')}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {contract.progress !== 'in_progress' && contract.progress !== 'completed' && (
                                        <button
                                            className="btn btn-sm btn-info"
                                            onClick={() => handleProgressUpdate(contract._id, 'in_progress')}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            Start Project
                                        </button>
                                    )}
                                    {contract.progress === 'in_progress' && (
                                        <button
                                            className="btn btn-sm btn-warning"
                                            onClick={() => handleProgressUpdate(contract._id, 'half_done')}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            Mark 50% Done
                                        </button>
                                    )}
                                    {(contract.progress === 'in_progress' || contract.progress === 'half_done') && (
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleProgressUpdate(contract._id, 'completed')}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            Mark Completed
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
