import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProposalsReceived() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClientJobs();
    }, []);

    const fetchClientJobs = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/jobs/my-jobs", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setJobs(res.data.jobs || []);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
            toast.error("Failed to load your jobs");
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
        const posted = new Date(date);
        const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Just posted";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    const handleAcceptProposal = async (jobId, applicationId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`http://localhost:5000/api/jobs/${jobId}/applications/${applicationId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Proposal accepted!");
            fetchClientJobs(); // Refresh data
        } catch (err) {
            toast.error("Failed to accept proposal");
        }
    };

    const handleRejectProposal = async (jobId, applicationId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`http://localhost:5000/api/jobs/${jobId}/applications/${applicationId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Proposal rejected");
            fetchClientJobs(); // Refresh data
        } catch (err) {
            toast.error("Failed to reject proposal");
        }
    };

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your jobs and proposals...</p>
                </div>
            </div>
        );
    }

    const jobsWithApplications = jobs.filter(job => job.applications && job.applications.length > 0);

    return (
        <div className="container py-4">
            <ToastContainer position="top-right" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">Proposals Received</h3>
                <span className="badge bg-info fs-6">
                    {jobsWithApplications.reduce((total, job) => total + job.applications.length, 0)} total proposals
                </span>
            </div>

            {jobsWithApplications.length === 0 ? (
                <div className="text-center py-5">
                    <span style={{ fontSize: "4rem" }}>📨</span>
                    <h4 className="mt-3">No proposals yet</h4>
                    <p className="text-muted">
                        {jobs.length === 0
                            ? "Post your first job to start receiving proposals!"
                            : "Your posted jobs haven't received any proposals yet."
                        }
                    </p>
                </div>
            ) : (
                <div className="row g-4">
                    {jobsWithApplications.map(job => (
                        <div key={job._id} className="col-12">
                            <div className="card shadow-sm" style={{ borderRadius: 12 }}>
                                <div className="card-header bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-1">{job.title}</h5>
                                            <small className="text-muted">
                                                Posted {getTimeAgo(job.createdAt)} • {formatBudget(job.budget)} • {job.applications.length} proposals
                                            </small>
                                        </div>
                                        <span className={`badge ${job.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        {job.applications.map((application, idx) => (
                                            <div key={application._id || idx} className="col-lg-6">
                                                <div className={`card h-100 ${application.status === 'accepted' ? 'border-success' :
                                                        application.status === 'rejected' ? 'border-danger' :
                                                            'border-light'
                                                    }`}>
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h6 className="card-title mb-0">
                                                                Freelancer Application
                                                            </h6>
                                                            <span className={`badge ${application.status === 'accepted' ? 'bg-success' :
                                                                    application.status === 'rejected' ? 'bg-danger' :
                                                                        'bg-warning'
                                                                }`}>
                                                                {application.status}
                                                            </span>
                                                        </div>
                                                        <small className="text-muted">
                                                            Applied {getTimeAgo(application.appliedAt)}
                                                        </small>
                                                        <div className="mt-3">
                                                            <h6 className="small text-muted mb-2">Proposal:</h6>
                                                            <p className="card-text" style={{
                                                                fontSize: "0.9rem",
                                                                maxHeight: "120px",
                                                                overflowY: "auto"
                                                            }}>
                                                                {application.proposal || "No proposal message provided."}
                                                            </p>
                                                        </div>
                                                        {application.status === 'pending' && (
                                                            <div className="d-flex gap-2 mt-3">
                                                                <button
                                                                    className="btn btn-success btn-sm flex-fill"
                                                                    onClick={() => handleAcceptProposal(job._id, application._id)}
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm flex-fill"
                                                                    onClick={() => handleRejectProposal(job._id, application._id)}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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