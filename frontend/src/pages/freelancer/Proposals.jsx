import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Proposals() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/jobs/my-applications", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setApplications(res.data.applications || []);
        } catch (err) {
            console.error("Failed to fetch applications:", err);
            toast.error("Failed to load your applications");
        } finally {
            setLoading(false);
        }
    };

    const formatBudget = (budget) => {
        if (budget.min && budget.max) {
            return `$${budget.min} - $${budget.max}`;
        } else if (budget.min) {
            return `$${budget.min}+`;
        } else if (budget.max) {
            return `Up to $${budget.max}`;
        }
        return "Budget not specified";
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const applied = new Date(date);
        const diffInHours = Math.floor((now - applied) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Just applied";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return 'bg-success';
            case 'rejected': return 'bg-danger';
            case 'pending': return 'bg-warning';
            default: return 'bg-secondary';
        }
    };

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your proposals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <ToastContainer position="top-right" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">My Proposals</h3>
                <span className="badge bg-info fs-6">{applications.length} total applications</span>
            </div>

            {applications.length === 0 ? (
                <div className="text-center py-5">
                    <span style={{ fontSize: "4rem" }}>📝</span>
                    <h4 className="mt-3">No proposals yet</h4>
                    <p className="text-muted">Start applying to jobs to see your proposals here!</p>
                </div>
            ) : (
                <div className="row g-4">
                    {applications.map(application => (
                        <div key={application._id} className="col-lg-6">
                            <div className="card shadow-sm h-100" style={{ borderRadius: 12 }}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="card-title mb-0">{application.jobTitle}</h5>
                                        <span className={`badge ${getStatusColor(application.status)}`}>
                                            {application.status}
                                        </span>
                                    </div>

                                    <p className="card-text text-muted mb-3" style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                    }}>
                                        {application.jobDescription}
                                    </p>

                                    <div className="mb-3">
                                        <div className="row">
                                            <div className="col-6">
                                                <small className="text-muted">Budget:</small>
                                                <div className="text-success fw-semibold">
                                                    {formatBudget(application.jobBudget)}
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <small className="text-muted">Client:</small>
                                                <div className="fw-semibold">
                                                    {application.clientName}
                                                    {application.clientCompany && (
                                                        <small className="text-muted d-block">
                                                            at {application.clientCompany}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <small className="text-muted">Your Proposal:</small>
                                        <p className="small mt-1" style={{
                                            maxHeight: "80px",
                                            overflowY: "auto",
                                            backgroundColor: "#f8f9fa",
                                            padding: "8px",
                                            borderRadius: "4px"
                                        }}>
                                            {application.proposal || "No proposal message"}
                                        </p>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            Applied {getTimeAgo(application.appliedAt)}
                                        </small>
                                        {application.status === 'accepted' && (
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => navigate('/freelancer/ContractF')}
                                            >
                                                Manage Project
                                            </button>
                                        )}
                                        {application.status === 'pending' && (
                                            <small className="text-warning">
                                                ⏳ Waiting for response
                                            </small>
                                        )}
                                        {application.status === 'rejected' && (
                                            <small className="text-danger">
                                                ❌ Not selected
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}