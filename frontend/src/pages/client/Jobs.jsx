import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Jobs() {
    const navigate = useNavigate();
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

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your jobs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <ToastContainer position="top-right" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">My Jobs</h3>
                <button
                    className="btn btn-success"
                    onClick={() => navigate("/client/post-job")}
                >
                    + Post New Job
                </button>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-5">
                    <span style={{ fontSize: "4rem" }}>📋</span>
                    <h4 className="mt-3">No jobs posted yet</h4>
                    <p className="text-muted">Start by posting your first job to find talented freelancers!</p>
                    <button
                        className="btn btn-success"
                        onClick={() => navigate("/client/post-job")}
                    >
                        Post Your First Job
                    </button>
                </div>
            ) : (
                <div className="row g-4">
                    {jobs.map(job => (
                        <div key={job._id} className="col-lg-6">
                            <div className="card shadow-sm h-100" style={{ borderRadius: 12 }}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="card-title mb-0">{job.title}</h5>
                                        <span className={`badge ${job.status === 'active' ? 'bg-success' :
                                                job.status === 'closed' ? 'bg-secondary' :
                                                    'bg-warning'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>

                                    <p className="card-text text-muted mb-3" style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                    }}>
                                        {job.description}
                                    </p>

                                    <div className="mb-3">
                                        <div className="row text-center">
                                            <div className="col-4">
                                                <div className="text-success fw-bold">{job.applications?.length || 0}</div>
                                                <small className="text-muted">Proposals</small>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-primary fw-bold">{job.roles?.length || 0}</div>
                                                <small className="text-muted">Roles</small>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-info fw-bold">{formatBudget(job.budget)}</div>
                                                <small className="text-muted">Budget</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <small className="text-muted">
                                            Posted {getTimeAgo(job.createdAt)}
                                        </small>
                                    </div>

                                    {job.roles && job.roles.length > 0 && (
                                        <div className="mb-3">
                                            <div className="d-flex flex-wrap gap-1">
                                                {job.roles.slice(0, 3).map((role, idx) => (
                                                    <span key={idx} className="badge bg-light text-dark border">
                                                        {role.title}
                                                    </span>
                                                ))}
                                                {job.roles.length > 3 && (
                                                    <span className="badge bg-light text-dark border">
                                                        +{job.roles.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-outline-primary btn-sm flex-fill"
                                            onClick={() => navigate("/client/proposals")}
                                        >
                                            View Proposals ({job.applications?.length || 0})
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            disabled
                                        >
                                            Edit
                                        </button>
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